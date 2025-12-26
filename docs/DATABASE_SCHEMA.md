# SmartStay - Database Schema

## Database Technology

**Primary Database**: PostgreSQL 15+
**Extensions**: PostGIS (geospatial), pgcrypto (encryption), uuid-ossp (UUIDs)
**Cache Layer**: Redis 7+ (room locks, sessions)

---

## Schema Overview

```
Core Entities:
├─ users              (All platform users)
├─ hotels             (Hotel properties)
├─ rooms              (Physical rooms)
├─ room_types         (Room categories)
├─ bookings           (Reservation records)
├─ payments           (Payment transactions)
├─ reviews            (Guest reviews)
├─ staff              (Hotel staff members)
├─ audit_logs         (Security audit trail)
└─ room_locks         (Redis - temporary locks)
```

---

## 1. Users Table

```sql
CREATE TYPE user_role AS ENUM (
  'guest',
  'hotel_admin',
  'hotel_staff',
  'platform_admin'
);

CREATE TYPE user_status AS ENUM (
  'active',
  'suspended',
  'deleted'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,

  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,

  role user_role NOT NULL DEFAULT 'guest',
  status user_status NOT NULL DEFAULT 'active',

  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,

  profile_image_url TEXT,

  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT email_lowercase CHECK (email = LOWER(email))
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Purpose**: Central user registry for all platform actors

**Key Features**:
- Single table for all roles (simplified auth)
- Email uniqueness enforced at DB level
- Soft delete via status (preserves booking history)
- Password hash only (never store plaintext)

---

## 2. Hotels Table

```sql
CREATE TYPE hotel_status AS ENUM (
  'pending_approval',
  'active',
  'suspended',
  'inactive'
);

CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,

  -- Address
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
  postal_code VARCHAR(20),

  -- Geolocation (PostGIS)
  location GEOGRAPHY(POINT, 4326) NOT NULL,

  -- Contact
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  website VARCHAR(255),

  -- Business Details
  cac_number VARCHAR(50), -- Corporate Affairs Commission (Nigeria)
  tax_id VARCHAR(50),
  license_number VARCHAR(50),

  -- Platform Management
  status hotel_status NOT NULL DEFAULT 'pending_approval',
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00, -- Percentage

  -- Metadata
  total_rooms INTEGER DEFAULT 0,
  star_rating DECIMAL(2,1) CHECK (star_rating >= 0 AND star_rating <= 5),
  average_review_score DECIMAL(3,2),
  total_reviews INTEGER DEFAULT 0,

  -- Images
  logo_url TEXT,
  cover_image_url TEXT,

  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_commission CHECK (commission_rate >= 0 AND commission_rate <= 50)
);

-- Indexes
CREATE INDEX idx_hotels_owner ON hotels(owner_id);
CREATE INDEX idx_hotels_status ON hotels(status);
CREATE INDEX idx_hotels_slug ON hotels(slug);
CREATE INDEX idx_hotels_city ON hotels(city);

-- PostGIS Spatial Index (CRITICAL for location queries)
CREATE INDEX idx_hotels_location ON hotels USING GIST(location);

-- Full-text search
CREATE INDEX idx_hotels_search ON hotels USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);
```

**Purpose**: Hotel property registry with geospatial capabilities

**Key Features**:
- PostGIS geography type for accurate distance calculations
- Spatial index (GIST) for fast proximity queries
- Approval workflow (pending → active)
- Commission rate per hotel (flexible pricing)
- Full-text search on name/description

**Location Query Example**:
```sql
-- Find hotels within 5km of user location
SELECT
  id,
  name,
  ST_Distance(location, ST_MakePoint(3.3792, 6.5244)::geography) / 1000 AS distance_km
FROM hotels
WHERE ST_DWithin(
  location,
  ST_MakePoint(3.3792, 6.5244)::geography,
  5000 -- 5km in meters
)
AND status = 'active'
ORDER BY distance_km;
```

---

## 3. Room Types Table

```sql
CREATE TABLE room_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL, -- e.g., "Deluxe King Room"
  slug VARCHAR(100) NOT NULL,
  description TEXT,

  -- Capacity
  max_guests INTEGER NOT NULL DEFAULT 2,
  num_beds INTEGER NOT NULL DEFAULT 1,
  bed_type VARCHAR(50), -- King, Queen, Twin, etc.

  -- Size
  room_size_sqm DECIMAL(6,2), -- Square meters

  -- Pricing
  base_price_ngn DECIMAL(10,2) NOT NULL,
  weekend_price_ngn DECIMAL(10,2),

  -- Amenities (JSON for flexibility)
  amenities JSONB DEFAULT '[]'::jsonb,
  -- Example: ["WiFi", "TV", "Mini Bar", "Balcony"]

  -- Images
  images JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"url": "...", "alt": "..."}, ...]

  -- Inventory
  total_rooms INTEGER NOT NULL DEFAULT 1,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(hotel_id, slug),
  CONSTRAINT positive_price CHECK (base_price_ngn > 0)
);

-- Indexes
CREATE INDEX idx_room_types_hotel ON room_types(hotel_id);
CREATE INDEX idx_room_types_active ON room_types(is_active);
CREATE INDEX idx_room_types_amenities ON room_types USING GIN(amenities);
```

**Purpose**: Define room categories (not individual rooms)

**Key Design**:
- One room type can have multiple physical rooms
- JSONB for flexible amenity storage
- Separate weekend pricing
- Image array for gallery

---

## 4. Rooms Table

```sql
CREATE TYPE room_status AS ENUM (
  'available',
  'locked',      -- Temporarily reserved during booking
  'booked',      -- Confirmed reservation
  'occupied',    -- Guest checked in
  'cleaning',    -- Housekeeping in progress
  'maintenance'  -- Out of service
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,

  room_number VARCHAR(20) NOT NULL, -- e.g., "101", "A-205"
  floor INTEGER,

  status room_status NOT NULL DEFAULT 'available',

  -- Current booking (if any)
  current_booking_id UUID,

  -- Maintenance
  maintenance_notes TEXT,
  last_cleaned_at TIMESTAMP WITH TIME ZONE,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(hotel_id, room_number)
);

-- Indexes
CREATE INDEX idx_rooms_hotel ON rooms(hotel_id);
CREATE INDEX idx_rooms_type ON rooms(room_type_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_booking ON rooms(current_booking_id);

-- Critical for availability queries
CREATE INDEX idx_rooms_availability ON rooms(hotel_id, room_type_id, status)
WHERE is_active = TRUE;
```

**Purpose**: Individual physical room instances

**Key Features**:
- Each room has a unique number within hotel
- Status-driven lifecycle (available → locked → booked → occupied → cleaning → available)
- Foreign key to current booking (fast lookup)
- Maintenance tracking

---

## 5. Bookings Table

```sql
CREATE TYPE booking_status AS ENUM (
  'pending_payment',
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled',
  'no_show'
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_reference VARCHAR(20) UNIQUE NOT NULL, -- e.g., "BS-2025-12345"

  -- Relationships
  guest_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE RESTRICT,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,

  -- Dates
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_nights INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,

  -- Guests
  num_guests INTEGER NOT NULL DEFAULT 1,

  -- Guest Details
  guest_name VARCHAR(200) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(20) NOT NULL,
  special_requests TEXT,

  -- Pricing
  room_rate_ngn DECIMAL(10,2) NOT NULL, -- Per night
  num_nights_paid INTEGER NOT NULL,
  subtotal_ngn DECIMAL(10,2) NOT NULL,
  service_fee_ngn DECIMAL(10,2) DEFAULT 0,
  total_amount_ngn DECIMAL(10,2) NOT NULL,

  -- Platform Commission
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount_ngn DECIMAL(10,2) NOT NULL,

  -- Status
  status booking_status NOT NULL DEFAULT 'pending_payment',

  -- Check-in/out tracking
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by UUID REFERENCES users(id),
  checked_out_at TIMESTAMP WITH TIME ZONE,
  checked_out_by UUID REFERENCES users(id),

  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  refund_amount_ngn DECIMAL(10,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
  CONSTRAINT positive_amounts CHECK (total_amount_ngn > 0)
);

-- Indexes
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);
CREATE INDEX idx_bookings_hotel ON bookings(hotel_id);
CREATE INDEX idx_bookings_room ON bookings(room_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_created ON bookings(created_at);

-- Composite for dashboard queries
CREATE INDEX idx_bookings_hotel_status_dates ON bookings(hotel_id, status, check_in_date);
```

**Purpose**: Central booking records

**Key Features**:
- Human-readable reference (BS-2025-XXXXX)
- Computed column for nights (automatic)
- Stores pricing snapshot (immutable)
- Commission calculated at booking time
- Full audit trail (check-in/out actors)

**Booking Reference Generation**:
```sql
-- Function to generate unique booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS VARCHAR(20) AS $$
DECLARE
  new_reference VARCHAR(20);
  ref_exists BOOLEAN;
BEGIN
  LOOP
    new_reference := 'BS-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                     LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');

    SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_reference = new_reference)
    INTO ref_exists;

    EXIT WHEN NOT ref_exists;
  END LOOP;

  RETURN new_reference;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Payments Table

```sql
CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded'
);

CREATE TYPE payment_method AS ENUM (
  'card',
  'bank_transfer',
  'cash' -- Pay at hotel
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,

  amount_ngn DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',

  payment_method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',

  -- Paystack Integration
  paystack_reference VARCHAR(255) UNIQUE,
  paystack_access_code VARCHAR(255),
  paystack_transaction_id VARCHAR(255),

  -- Metadata
  gateway_response JSONB, -- Full response from Paystack
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),

  -- Timestamps
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,

  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_reason TEXT,
  refund_amount_ngn DECIMAL(10,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT positive_amount CHECK (amount_ngn > 0)
);

-- Indexes
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paystack_ref ON payments(paystack_reference);
CREATE INDEX idx_payments_created ON payments(created_at);
```

**Purpose**: Payment transaction records

**Key Features**:
- Idempotent (paystack_reference is unique)
- Stores full gateway response (debugging)
- Supports refunds
- Decoupled from bookings (allows retries)

---

## 7. Reviews Table

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Ratings (1-5)
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
  location_rating INTEGER CHECK (location_rating BETWEEN 1 AND 5),
  service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),

  -- Review Content
  title VARCHAR(200),
  comment TEXT,

  -- Images
  images JSONB DEFAULT '[]'::jsonb,

  -- Hotel Response
  hotel_response TEXT,
  hotel_responded_at TIMESTAMP WITH TIME ZONE,
  hotel_responded_by UUID REFERENCES users(id),

  -- Moderation
  is_verified BOOLEAN DEFAULT FALSE, -- Verified stay
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,

  is_visible BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reviews_hotel ON reviews(hotel_id);
CREATE INDEX idx_reviews_guest ON reviews(guest_id);
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_visible ON reviews(is_visible);
CREATE INDEX idx_reviews_rating ON reviews(overall_rating);
```

**Purpose**: Guest feedback system

**Key Features**:
- One review per booking (enforced)
- Multi-dimensional ratings
- Hotel can respond
- Verified badge (from actual booking)
- Moderation support

---

## 8. Staff Table

```sql
CREATE TYPE staff_role AS ENUM (
  'front_desk',
  'housekeeping',
  'maintenance',
  'manager'
);

CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,

  role staff_role NOT NULL,

  -- Permissions
  can_check_in BOOLEAN DEFAULT FALSE,
  can_check_out BOOLEAN DEFAULT FALSE,
  can_manage_rooms BOOLEAN DEFAULT FALSE,
  can_view_reports BOOLEAN DEFAULT FALSE,

  is_active BOOLEAN DEFAULT TRUE,

  hired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  terminated_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_staff_user ON staff(user_id);
CREATE INDEX idx_staff_hotel ON staff(hotel_id);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_active ON staff(is_active);
```

**Purpose**: Hotel staff management

**Key Features**:
- Links to users table (single sign-on)
- Granular permissions
- Soft termination (preserves history)

---

## 9. Audit Logs Table

```sql
CREATE TYPE audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'payment',
  'refund',
  'check_in',
  'check_out',
  'cancel_booking'
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(50) NOT NULL, -- e.g., 'booking', 'payment'
  entity_id UUID NOT NULL,
  action audit_action NOT NULL,

  -- Changes
  old_values JSONB,
  new_values JSONB,

  -- Context
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- Partition by month for performance
CREATE INDEX idx_audit_created_month ON audit_logs(DATE_TRUNC('month', created_at));
```

**Purpose**: Security and compliance audit trail

**Key Features**:
- Immutable (no updates/deletes)
- Captures before/after state
- IP and user agent tracking
- Partitionable by time

---

## 10. Hotel Amenities Table

```sql
CREATE TABLE hotel_amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL, -- WiFi, Pool, Gym, Restaurant, etc.
  icon VARCHAR(50), -- Icon identifier
  is_free BOOLEAN DEFAULT TRUE,

  UNIQUE(hotel_id, name)
);

CREATE INDEX idx_hotel_amenities_hotel ON hotel_amenities(hotel_id);
```

---

## 11. Hotel Images Table

```sql
CREATE TABLE hotel_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,

  is_cover BOOLEAN DEFAULT FALSE,

  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_hotel_images_hotel ON hotel_images(hotel_id);
CREATE INDEX idx_hotel_images_order ON hotel_images(hotel_id, display_order);
```

---

## Redis Schema (Room Locks)

```redis
# Room Lock
KEY: room_lock:{room_id}
VALUE: {
  "booking_id": "uuid",
  "user_id": "uuid",
  "locked_at": "2025-12-20T10:30:00Z"
}
TTL: 900 seconds (15 minutes)

# User Session
KEY: session:{user_id}
VALUE: {
  "token": "jwt",
  "refresh_token": "jwt",
  "expires_at": "2025-12-20T12:00:00Z"
}
TTL: 7200 seconds (2 hours)

# Rate Limiting (Per IP)
KEY: rate_limit:{ip_address}:{endpoint}
VALUE: request_count
TTL: 60 seconds

# Cache: Hotel Search Results
KEY: search:{lat}:{lon}:{radius}
VALUE: [hotel_ids]
TTL: 300 seconds (5 minutes)
```

---

## Database Functions & Triggers

### 1. Auto-Update Timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Repeat for hotels, bookings, etc.
```

### 2. Update Hotel Room Count

```sql
CREATE OR REPLACE FUNCTION update_hotel_room_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hotels
  SET total_rooms = (
    SELECT COUNT(*) FROM rooms
    WHERE hotel_id = NEW.hotel_id AND is_active = TRUE
  )
  WHERE id = NEW.hotel_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_room_count_on_insert
  AFTER INSERT ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_hotel_room_count();
```

### 3. Update Hotel Average Rating

```sql
CREATE OR REPLACE FUNCTION update_hotel_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hotels
  SET
    average_review_score = (
      SELECT AVG(overall_rating)::DECIMAL(3,2)
      FROM reviews
      WHERE hotel_id = NEW.hotel_id AND is_visible = TRUE
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE hotel_id = NEW.hotel_id AND is_visible = TRUE
    )
  WHERE id = NEW.hotel_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_hotel_rating();
```

### 4. Prevent Double Booking

```sql
CREATE OR REPLACE FUNCTION check_room_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if room is already booked for overlapping dates
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE room_id = NEW.room_id
    AND status IN ('confirmed', 'checked_in')
    AND (
      (NEW.check_in_date, NEW.check_out_date) OVERLAPS
      (check_in_date, check_out_date)
    )
  ) THEN
    RAISE EXCEPTION 'Room is not available for selected dates';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_double_booking
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION check_room_availability();
```

---

## Complex Queries

### 1. Find Available Rooms for Date Range

```sql
SELECT
  rt.id AS room_type_id,
  rt.name,
  rt.base_price_ngn,
  COUNT(r.id) AS available_count
FROM room_types rt
JOIN rooms r ON r.room_type_id = rt.id
LEFT JOIN bookings b ON (
  b.room_id = r.id
  AND b.status IN ('confirmed', 'checked_in')
  AND (
    (:check_in, :check_out) OVERLAPS (b.check_in_date, b.check_out_date)
  )
)
WHERE
  rt.hotel_id = :hotel_id
  AND rt.is_active = TRUE
  AND r.is_active = TRUE
  AND r.status IN ('available', 'cleaning')
  AND b.id IS NULL -- No overlapping bookings
GROUP BY rt.id
HAVING COUNT(r.id) > 0;
```

### 2. Nearby Hotels with Availability

```sql
SELECT
  h.id,
  h.name,
  h.star_rating,
  h.average_review_score,
  ST_Distance(
    h.location,
    ST_MakePoint(:longitude, :latitude)::geography
  ) / 1000 AS distance_km,
  MIN(rt.base_price_ngn) AS starting_price,
  COUNT(DISTINCT rt.id) AS room_types_count
FROM hotels h
JOIN room_types rt ON rt.hotel_id = h.id AND rt.is_active = TRUE
WHERE
  h.status = 'active'
  AND ST_DWithin(
    h.location,
    ST_MakePoint(:longitude, :latitude)::geography,
    :radius_meters
  )
GROUP BY h.id
ORDER BY distance_km;
```

### 3. Hotel Dashboard Stats

```sql
SELECT
  h.name,
  COUNT(DISTINCT r.id) AS total_rooms,
  COUNT(DISTINCT CASE WHEN r.status = 'occupied' THEN r.id END) AS occupied_rooms,
  COUNT(DISTINCT CASE WHEN b.check_in_date = CURRENT_DATE THEN b.id END) AS checkins_today,
  COUNT(DISTINCT CASE WHEN b.check_out_date = CURRENT_DATE THEN b.id END) AS checkouts_today,
  SUM(CASE
    WHEN b.status = 'confirmed'
    AND b.check_in_date >= CURRENT_DATE
    AND b.check_in_date < CURRENT_DATE + INTERVAL '30 days'
    THEN b.total_amount_ngn
    ELSE 0
  END) AS revenue_next_30_days
FROM hotels h
LEFT JOIN rooms r ON r.hotel_id = h.id
LEFT JOIN bookings b ON b.hotel_id = h.id
WHERE h.id = :hotel_id
GROUP BY h.id;
```

---

## Indexes Summary

### Critical Indexes

1. **Geospatial**: `idx_hotels_location` (GIST)
2. **Availability**: `idx_rooms_availability`
3. **Booking Lookups**: `idx_bookings_reference`, `idx_bookings_hotel_status_dates`
4. **Payments**: `idx_payments_paystack_ref` (idempotency)

### Performance Tuning

```sql
-- Analyze tables after bulk inserts
ANALYZE hotels;
ANALYZE rooms;
ANALYZE bookings;

-- Vacuum regularly
VACUUM ANALYZE;

-- Monitor slow queries
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

---

## Data Retention & Archival

```sql
-- Archive old audit logs (> 1 year)
CREATE TABLE audit_logs_archive (
  LIKE audit_logs INCLUDING ALL
);

INSERT INTO audit_logs_archive
SELECT * FROM audit_logs
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '1 year';

-- Partition bookings by year
CREATE TABLE bookings_2025 PARTITION OF bookings
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

---

## Security Considerations

1. **Row-Level Security (RLS)**:
   ```sql
   ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

   CREATE POLICY guest_bookings ON bookings
   FOR SELECT
   USING (guest_id = current_user_id());
   ```

2. **Encryption**:
   - Password hashes: bcrypt (in application layer)
   - Sensitive PII: pgcrypto extension

3. **SQL Injection Prevention**:
   - Parameterized queries only (enforced by ORM)

4. **Audit Trail**:
   - All sensitive operations logged

---

## Backup Strategy

```bash
# Daily automated backups
pg_dump -Fc smartstay > smartstay_$(date +%Y%m%d).dump

# Point-in-time recovery enabled
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'

# Retention: 30 days
```

---

## Migration Strategy

```sql
-- Use migration tools (e.g., TypeORM, Prisma, or Flyway)
-- Example migration: V001__initial_schema.sql

BEGIN;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create types
CREATE TYPE user_role AS ENUM (...);
-- ... (all CREATE statements)

COMMIT;
```

---

## Conclusion

This database schema provides:
- ✅ Real-time room availability tracking
- ✅ Geospatial hotel discovery (PostGIS)
- ✅ Anti-double booking (triggers + Redis locks)
- ✅ Comprehensive audit trail
- ✅ Scalable architecture (indexed, partitioned)
- ✅ Payment idempotency
- ✅ RBAC support

**Next**: System Architecture & Tech Stack
