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
import { User } from '../../users/entities/user.entity';

export enum HotelStatus {
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

@Entity('hotels')
export class Hotel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column()
  name: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Address
  @Column({ name: 'address_line1' })
  addressLine1: string;

  @Column({ name: 'address_line2', nullable: true })
  addressLine2: string;

  @Column()
  @Index()
  city: string;

  @Column()
  state: string;

  @Column({ default: 'Nigeria' })
  country: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode: string;

  // Geolocation (PostGIS POINT)
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  location: string; // Stored as "POINT(lon lat)"

  // Helper fields for lat/lon (computed)
  latitude: number;
  longitude: number;

  // Contact
  @Column()
  phone: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  website: string;

  // Business Details
  @Column({ name: 'cac_number', nullable: true })
  cacNumber: string;

  @Column({ name: 'tax_id', nullable: true })
  taxId: string;

  @Column({ name: 'license_number', nullable: true })
  licenseNumber: string;

  // Platform Management
  @Column({
    type: 'enum',
    enum: HotelStatus,
    default: HotelStatus.PENDING_APPROVAL,
  })
  @Index()
  status: HotelStatus;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2, default: 10.0 })
  commissionRate: number;

  // Metadata
  @Column({ name: 'total_rooms', default: 0 })
  totalRooms: number;

  @Column({ name: 'star_rating', type: 'decimal', precision: 2, scale: 1, nullable: true })
  starRating: number;

  @Column({ name: 'average_review_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
  averageReviewScore: number;

  @Column({ name: 'total_reviews', default: 0 })
  totalReviews: number;

  // Images
  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ name: 'cover_image_url', nullable: true })
  coverImageUrl: string;

  // Approval
  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approver: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
