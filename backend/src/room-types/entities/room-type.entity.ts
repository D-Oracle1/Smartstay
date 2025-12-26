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

@Entity('room_types')
@Index(['hotelId', 'slug'], { unique: true })
export class RoomType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hotel_id' })
  hotelId: string;

  @ManyToOne(() => Hotel)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'max_guests', default: 2 })
  maxGuests: number;

  @Column({ name: 'num_beds', default: 1 })
  numBeds: number;

  @Column({ name: 'bed_type', nullable: true })
  bedType: string;

  @Column({ name: 'room_size_sqm', type: 'decimal', precision: 6, scale: 2, nullable: true })
  roomSizeSqm: number;

  @Column({ name: 'base_price_ngn', type: 'decimal', precision: 10, scale: 2 })
  basePriceNgn: number;

  @Column({ name: 'weekend_price_ngn', type: 'decimal', precision: 10, scale: 2, nullable: true })
  weekendPriceNgn: number;

  @Column({ type: 'jsonb', default: [] })
  amenities: string[];

  @Column({ type: 'jsonb', default: [] })
  images: { url: string; alt: string }[];

  @Column({ name: 'total_rooms', default: 1 })
  totalRooms: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
