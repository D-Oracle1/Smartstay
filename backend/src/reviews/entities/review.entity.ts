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
import { Booking } from '../../bookings/entities/booking.entity';
import { Hotel } from '../../hotels/entities/hotel.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', unique: true })
  bookingId: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'hotel_id' })
  hotelId: string;

  @ManyToOne(() => Hotel)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ name: 'guest_id', nullable: true })
  guestId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'guest_id' })
  guest: User;

  // Ratings (1-5)
  @Column({ name: 'overall_rating' })
  @Index()
  overallRating: number;

  @Column({ name: 'cleanliness_rating', nullable: true })
  cleanlinessRating: number;

  @Column({ name: 'location_rating', nullable: true })
  locationRating: number;

  @Column({ name: 'service_rating', nullable: true })
  serviceRating: number;

  @Column({ name: 'value_rating', nullable: true })
  valueRating: number;

  // Review Content
  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  // Images
  @Column({ type: 'jsonb', default: [] })
  images: string[];

  // Hotel Response
  @Column({ name: 'hotel_response', type: 'text', nullable: true })
  hotelResponse: string;

  @Column({ name: 'hotel_responded_at', type: 'timestamp', nullable: true })
  hotelRespondedAt: Date;

  @Column({ name: 'hotel_responded_by', nullable: true })
  hotelRespondedBy: string;

  // Moderation
  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_flagged', default: false })
  isFlagged: boolean;

  @Column({ name: 'flag_reason', type: 'text', nullable: true })
  flagReason: string;

  @Column({ name: 'is_visible', default: true })
  @Index()
  isVisible: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
