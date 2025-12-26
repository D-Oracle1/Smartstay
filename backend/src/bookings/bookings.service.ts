import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';

import { Booking, BookingStatus } from './entities/booking.entity';
import { Room, RoomStatus } from '../rooms/entities/room.entity';
import { RoomType } from '../room-types/entities/room-type.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { RedisService } from '../common/redis/redis.service';
import { RoomsService } from '../rooms/rooms.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    @InjectRepository(RoomType)
    private roomTypesRepository: Repository<RoomType>,
    @InjectRepository(Hotel)
    private hotelsRepository: Repository<Hotel>,
    private redisService: RedisService,
    private roomsService: RoomsService,
    private configService: ConfigService,
  ) {}

  /**
   * Create a new booking with anti-double booking logic
   * 1. Check room availability
   * 2. Lock room in Redis (TTL: 15 minutes)
   * 3. Create pending booking
   * 4. Update room status to 'locked'
   */
  async create(userId: string, createBookingDto: CreateBookingDto) {
    const {
      hotelId,
      roomTypeId,
      checkInDate,
      checkOutDate,
      numGuests,
      guestDetails,
      specialRequests,
    } = createBookingDto;

    // Validate dates
    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    // Get hotel and room type
    const hotel = await this.hotelsRepository.findOne({ where: { id: hotelId } });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const roomType = await this.roomTypesRepository.findOne({
      where: { id: roomTypeId, hotelId },
    });
    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }

    // Find available room
    const availableRoom = await this.findAvailableRoom(
      hotelId,
      roomTypeId,
      checkInDate,
      checkOutDate,
    );

    if (!availableRoom) {
      throw new ConflictException('No rooms available for selected dates');
    }

    // Try to lock room in Redis (15-minute TTL)
    const lockTtl = this.configService.get('ROOM_LOCK_TTL', 900);
    const locked = await this.redisService.lockRoom(
      availableRoom.id,
      'temp', // Will update with booking ID
      userId,
      lockTtl,
    );

    if (!locked) {
      throw new ConflictException('Room is being booked by another user. Please try again.');
    }

    try {
      // Calculate pricing
      const numNights = this.calculateNights(checkInDate, checkOutDate);
      const roomRate = roomType.basePriceNgn;
      const subtotal = roomRate * numNights;
      const serviceFee = this.calculateServiceFee(subtotal);
      const total = subtotal + serviceFee;
      const commissionAmount = (total * hotel.commissionRate) / 100;

      // Generate booking reference
      const bookingReference = this.generateBookingReference();

      // Create booking
      const booking = this.bookingsRepository.create({
        bookingReference,
        guestId: userId,
        hotelId,
        roomId: availableRoom.id,
        roomTypeId,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        numNights,
        numGuests,
        guestName: guestDetails.name,
        guestEmail: guestDetails.email,
        guestPhone: guestDetails.phone,
        specialRequests,
        roomRateNgn: roomRate,
        numNightsPaid: numNights,
        subtotalNgn: subtotal,
        serviceFeeNgn: serviceFee,
        totalAmountNgn: total,
        commissionRate: hotel.commissionRate,
        commissionAmountNgn: commissionAmount,
        status: BookingStatus.PENDING_PAYMENT,
      });

      await this.bookingsRepository.save(booking);

      // Update Redis lock with actual booking ID
      await this.redisService.unlockRoom(availableRoom.id);
      await this.redisService.lockRoom(availableRoom.id, booking.id, userId, lockTtl);

      // Update room status to 'locked'
      await this.roomsService.updateStatus(availableRoom.id, RoomStatus.LOCKED);

      // Get lock expiration time
      const ttl = await this.redisService.getRoomLockTTL(availableRoom.id);
      const lockExpiresAt = new Date(Date.now() + ttl * 1000);

      return {
        booking: {
          ...booking,
          hotel: { id: hotel.id, name: hotel.name },
          room: {
            id: availableRoom.id,
            type: roomType.name,
            roomNumber: availableRoom.roomNumber,
          },
        },
        lockExpiresAt,
      };
    } catch (error) {
      // Release lock on error
      await this.redisService.unlockRoom(availableRoom.id);
      throw error;
    }
  }

  /**
   * Find an available room for the given criteria
   */
  async findAvailableRoom(
    hotelId: string,
    roomTypeId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<Room | null> {
    // Get all rooms of this type
    const rooms = await this.roomsRepository.find({
      where: {
        hotelId,
        roomTypeId,
        isActive: true,
        status: RoomStatus.AVAILABLE,
      },
    });

    // Check each room for conflicts
    for (const room of rooms) {
      const hasConflict = await this.hasBookingConflict(room.id, checkIn, checkOut);
      const isLocked = await this.redisService.getRoomLock(room.id);

      if (!hasConflict && !isLocked) {
        return room;
      }
    }

    return null;
  }

  /**
   * Check if a room has booking conflicts for the given dates
   */
  async hasBookingConflict(roomId: string, checkIn: Date, checkOut: Date): Promise<boolean> {
    const conflictingBooking = await this.bookingsRepository
      .createQueryBuilder('booking')
      .where('booking.roomId = :roomId', { roomId })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
      })
      .andWhere(
        `(booking.checkInDate, booking.checkOutDate) OVERLAPS (:checkIn::date, :checkOut::date)`,
        { checkIn, checkOut },
      )
      .getOne();

    return !!conflictingBooking;
  }

  /**
   * Confirm booking after payment
   */
  async confirmBooking(bookingId: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      relations: ['room'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Booking is not pending payment');
    }

    // Update booking status
    booking.status = BookingStatus.CONFIRMED;
    await this.bookingsRepository.save(booking);

    // Release Redis lock
    await this.redisService.unlockRoom(booking.roomId);

    // Update room status to 'booked'
    await this.roomsService.updateStatus(booking.roomId, RoomStatus.BOOKED);

    return booking;
  }

  /**
   * Cancel booking and release room
   */
  async cancelBooking(bookingId: string, userId: string, reason: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId, guestId: userId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking already cancelled');
    }

    // Update booking
    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    booking.refundAmountNgn = booking.totalAmountNgn; // Full refund (policy can be adjusted)

    await this.bookingsRepository.save(booking);

    // Release lock and update room status
    await this.redisService.unlockRoom(booking.roomId);
    await this.roomsService.updateStatus(booking.roomId, RoomStatus.AVAILABLE);

    return booking;
  }

  /**
   * Check-in a guest
   */
  async checkIn(bookingId: string, staffId: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Booking must be confirmed to check in');
    }

    booking.status = BookingStatus.CHECKED_IN;
    booking.checkedInAt = new Date();
    booking.checkedInBy = staffId;

    await this.bookingsRepository.save(booking);

    // Update room status
    await this.roomsService.updateStatus(booking.roomId, RoomStatus.OCCUPIED);

    return booking;
  }

  /**
   * Check-out a guest
   */
  async checkOut(bookingId: string, staffId: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new BadRequestException('Booking must be checked-in to check out');
    }

    booking.status = BookingStatus.CHECKED_OUT;
    booking.checkedOutAt = new Date();
    booking.checkedOutBy = staffId;

    await this.bookingsRepository.save(booking);

    // Update room status to cleaning
    await this.roomsService.updateStatus(booking.roomId, RoomStatus.CLEANING);

    return booking;
  }

  /**
   * Get user's bookings
   */
  async findByUser(userId: string, status?: 'upcoming' | 'past' | 'cancelled') {
    const query = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.hotel', 'hotel')
      .leftJoinAndSelect('booking.roomType', 'roomType')
      .where('booking.guestId = :userId', { userId });

    if (status === 'upcoming') {
      query.andWhere('booking.checkInDate >= :now', { now: new Date() });
      query.andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT],
      });
    } else if (status === 'past') {
      query.andWhere('booking.status = :status', { status: BookingStatus.CHECKED_OUT });
    } else if (status === 'cancelled') {
      query.andWhere('booking.status = :status', { status: BookingStatus.CANCELLED });
    }

    query.orderBy('booking.createdAt', 'DESC');

    return await query.getMany();
  }

  /**
   * Get booking by reference
   */
  async findByReference(reference: string) {
    return await this.bookingsRepository.findOne({
      where: { bookingReference: reference },
      relations: ['hotel', 'room', 'roomType'],
    });
  }

  // Helper methods
  private calculateNights(checkIn: Date, checkOut: Date): number {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private calculateServiceFee(subtotal: number): number {
    // 1% service fee, minimum ₦500
    return Math.max(subtotal * 0.01, 500);
  }

  private generateBookingReference(): string {
    const year = new Date().getFullYear();
    const id = nanoid(5).toUpperCase();
    return `BS-${year}-${id}`;
  }
}
