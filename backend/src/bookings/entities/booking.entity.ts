import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Generated,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Hotel } from '../../hotels/entities/hotel.entity';
import { Room } from '../../rooms/entities/room.entity';
import { RoomType } from '../../room-types/entities/room-type.entity';

export enum BookingStatus {
  PENDING_PAYMENT = 'pending_payment',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('bookings')
@Index(['hotelId', 'status', 'checkInDate'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_reference', unique: true })
  @Index()
  bookingReference: string;

  // Relationships
  @Column({ name: 'guest_id' })
  guestId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'guest_id' })
  guest: User;

  @Column({ name: 'hotel_id' })
  hotelId: string;

  @ManyToOne(() => Hotel)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ name: 'room_id' })
  roomId: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'room_type_id' })
  roomTypeId: string;

  @ManyToOne(() => RoomType)
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType;

  // Dates
  @Column({ name: 'check_in_date', type: 'date' })
  checkInDate: Date;

  @Column({ name: 'check_out_date', type: 'date' })
  checkOutDate: Date;

  @Column({ name: 'num_nights', type: 'integer', readonly: true })
  numNights: number;

  // Guests
  @Column({ name: 'num_guests', default: 1 })
  numGuests: number;

  // Guest Details (snapshot at booking time)
  @Column({ name: 'guest_name' })
  guestName: string;

  @Column({ name: 'guest_email' })
  guestEmail: string;

  @Column({ name: 'guest_phone' })
  guestPhone: string;

  @Column({ name: 'special_requests', type: 'text', nullable: true })
  specialRequests: string;

  // Pricing (snapshot at booking time)
  @Column({ name: 'room_rate_ngn', type: 'decimal', precision: 10, scale: 2 })
  roomRateNgn: number;

  @Column({ name: 'num_nights_paid' })
  numNightsPaid: number;

  @Column({ name: 'subtotal_ngn', type: 'decimal', precision: 10, scale: 2 })
  subtotalNgn: number;

  @Column({ name: 'service_fee_ngn', type: 'decimal', precision: 10, scale: 2, default: 0 })
  serviceFeeNgn: number;

  @Column({ name: 'total_amount_ngn', type: 'decimal', precision: 10, scale: 2 })
  totalAmountNgn: number;

  // Commission
  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2 })
  commissionRate: number;

  @Column({ name: 'commission_amount_ngn', type: 'decimal', precision: 10, scale: 2 })
  commissionAmountNgn: number;

  // Status
  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING_PAYMENT,
  })
  @Index()
  status: BookingStatus;

  // Check-in/out tracking
  @Column({ name: 'checked_in_at', type: 'timestamp', nullable: true })
  checkedInAt: Date;

  @Column({ name: 'checked_in_by', nullable: true })
  checkedInBy: string;

  @Column({ name: 'checked_out_at', type: 'timestamp', nullable: true })
  checkedOutAt: Date;

  @Column({ name: 'checked_out_by', nullable: true })
  checkedOutBy: string;

  // Cancellation
  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'refund_amount_ngn', type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmountNgn: number;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
