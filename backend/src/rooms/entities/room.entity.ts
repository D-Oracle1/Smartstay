import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Hotel } from '../../hotels/entities/hotel.entity';
import { RoomType } from '../../room-types/entities/room-type.entity';

export enum RoomStatus {
  AVAILABLE = 'available',
  LOCKED = 'locked',
  BOOKED = 'booked',
  OCCUPIED = 'occupied',
  CLEANING = 'cleaning',
  MAINTENANCE = 'maintenance',
}

@Entity('rooms')
@Index(['hotelId', 'roomTypeId', 'status'])
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hotel_id' })
  hotelId: string;

  @ManyToOne(() => Hotel)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ name: 'room_type_id' })
  roomTypeId: string;

  @ManyToOne(() => RoomType)
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType;

  @Column({ name: 'room_number' })
  roomNumber: string;

  @Column({ nullable: true })
  floor: number;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
  })
  @Index()
  status: RoomStatus;

  @Column({ name: 'current_booking_id', nullable: true })
  currentBookingId: string;

  @Column({ name: 'maintenance_notes', type: 'text', nullable: true })
  maintenanceNotes: string;

  @Column({ name: 'last_cleaned_at', type: 'timestamp', nullable: true })
  lastCleanedAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
