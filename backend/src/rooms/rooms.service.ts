import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from './entities/room.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
  ) {}

  async updateStatus(roomId: string, status: RoomStatus): Promise<Room> {
    await this.roomsRepository.update(roomId, { status });
    return this.roomsRepository.findOne({ where: { id: roomId } });
  }

  async findByHotel(hotelId: string) {
    return this.roomsRepository.find({
      where: { hotelId },
      relations: ['roomType'],
      order: { roomNumber: 'ASC' },
    });
  }
}
