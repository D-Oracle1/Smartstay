# SmartStay - System Architecture

## Architecture Overview

**Pattern**: Microservices-lite (Modular Monolith for MVP, ready for microservices)
**Deployment**: Containerized (Docker) on Cloud Platform (AWS/GCP)
**Communication**: REST APIs + WebSocket (Socket.io) for real-time

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
├──────────────────────┬──────────────────────────────────────┤
│   Web App (Next.js)  │  Mobile App (React Native)           │
│   - Guest Portal     │  - iOS (TestFlight → App Store)      │
│   - Hotel Dashboard  │  - Android (Internal → Play Store)   │
│   - Admin Panel      │                                       │
└──────────────────────┴──────────────────────────────────────┘
                            ↓ HTTPS / WSS
┌──────────────────────────────────────────────────────────────┐
│                    API GATEWAY / LOAD BALANCER               │
│                    (Nginx / AWS ALB)                         │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                   BACKEND SERVICE (NestJS)                   │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┬──────────┬───────────┐  │
│  │   Auth   │  Hotels  │  Rooms   │ Bookings │ Payments  │  │
│  │  Module  │  Module  │  Module  │  Module  │  Module   │  │
│  └──────────┴──────────┴──────────┴──────────┴───────────┘  │
│  ┌──────────┬──────────┬──────────┬──────────┬───────────┐  │
│  │ Location │ Real-time│  Search  │ Reviews  │   Admin   │  │
│  │  Module  │  Module  │  Module  │  Module  │  Module   │  │
│  └──────────┴──────────┴──────────┴──────────┴───────────┘  │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA & SERVICES LAYER                     │
├────────────────┬──────────────┬──────────────┬──────────────┤
│  PostgreSQL    │    Redis     │  Socket.io   │   Paystack   │
│  + PostGIS     │  (Cache +    │  (WebSocket) │  (Payment)   │
│  (Primary DB)  │   Locks)     │              │              │
└────────────────┴──────────────┴──────────────┴──────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                        │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   AWS S3     │  CloudWatch  │  CloudFront  │  GitHub Actions│
│   (Storage)  │  (Monitoring)│  (CDN)       │  (CI/CD)       │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

---

## Tech Stack Decision & Justification

### Backend: NestJS (Node.js)

**✅ CHOSEN**

**Why**:
1. **Enterprise-Ready**: Built-in dependency injection, modular architecture
2. **TypeScript-First**: Type safety across the stack
3. **Extensive Ecosystem**: Database ORMs (TypeORM/Prisma), validation, authentication
4. **Scalability**: Microservices-ready (can split modules later)
5. **Developer Productivity**: Decorators, CLI tools, auto-generated OpenAPI docs
6. **Performance**: Non-blocking I/O, handles concurrent requests well

**Alternatives Considered**:
- **Express**: Too bare-bones, requires manual architecture setup
- **Django (Python)**: Slower, not ideal for real-time features
- **Spring Boot (Java)**: Overkill for MVP, steeper learning curve

---

### Database: PostgreSQL 15 + PostGIS

**✅ CHOSEN**

**Why**:
1. **Geospatial Support**: PostGIS extension for location-based queries
2. **ACID Compliance**: Critical for booking transactions
3. **JSON Support**: JSONB for flexible amenities/images
4. **Performance**: Excellent indexing, mature query optimizer
5. **Reliability**: Battle-tested, proven at scale
6. **Extensions**: uuid-ossp, pgcrypto for security

**Alternatives Considered**:
- **MySQL**: Weaker geospatial support (MySQL Spatial vs PostGIS)
- **MongoDB**: NoSQL not ideal for transactional bookings
- **DynamoDB**: Vendor lock-in, limited query flexibility

---

### Cache & Locks: Redis 7

**✅ CHOSEN**

**Why**:
1. **Anti-Double Booking**: TTL-based room locks (expires automatically)
2. **Session Storage**: Fast user sessions
3. **Rate Limiting**: Prevent API abuse
4. **Caching**: Search results, hotel data
5. **Pub/Sub**: Real-time notifications (alternative to Socket.io for some cases)

**Use Cases**:
```redis
# Room lock during booking
SET room_lock:uuid "booking_id" EX 900 NX

# Session cache
SETEX session:user_id "jwt_data" 7200

# Search result cache
SETEX search:3.4_6.5_5km "[hotel_ids]" 300
```

---

### Frontend (Web): Next.js 14 (React)

**✅ CHOSEN**

**Why**:
1. **Server-Side Rendering (SSR)**: Better SEO for hotel listings
2. **Static Site Generation (SSG)**: Fast marketing pages
3. **API Routes**: Can host lightweight endpoints
4. **Image Optimization**: Automatic with `next/image`
5. **File-Based Routing**: Intuitive structure
6. **React Ecosystem**: Massive component library (Chakra UI, Tailwind)
7. **Performance**: Automatic code splitting, prefetching

**Folder Structure**:
```
/web
├── /app (Next.js 14 app directory)
│   ├── /(guest)
│   │   ├── page.tsx (Home/Search)
│   │   ├── hotels/[id]/page.tsx
│   │   └── bookings/page.tsx
│   ├── /(hotel-admin)
│   │   ├── dashboard/page.tsx
│   │   ├── rooms/page.tsx
│   │   └── bookings/page.tsx
│   └── /(platform-admin)
│       └── dashboard/page.tsx
├── /components
│   ├── /shared (Button, Card, Input)
│   ├── /hotel (HotelCard, RoomCard)
│   └── /booking (BookingForm, PaymentModal)
├── /lib
│   ├── api.ts (API client)
│   ├── auth.ts
│   └── socket.ts
└── /styles
```

**Alternatives Considered**:
- **Vite + React**: No SSR out-of-box
- **Remix**: Newer, smaller ecosystem
- **Vue.js/Nuxt**: Smaller community in Nigeria

---

### Mobile: React Native + Expo

**✅ CHOSEN**

**Why**:
1. **Cross-Platform**: Single codebase → iOS + Android
2. **Code Sharing**: Share logic with Next.js (both React)
3. **Native Performance**: Near-native with Hermes engine
4. **Expo Ecosystem**:
   - Managed workflow (easier deployment)
   - Over-the-air updates (EAS Update)
   - Location API, Maps, Notifications built-in
5. **Fast Iteration**: Hot reload, easy debugging
6. **App Store Ready**: EAS Build for production apps

**vs Flutter**:
| Criteria | React Native | Flutter |
|----------|--------------|---------|
| Language | JavaScript/TypeScript | Dart |
| Code Sharing with Web | ✅ High (same React) | ❌ Low |
| Community | ✅ Larger | ✅ Growing |
| Performance | ✅ Excellent | ✅ Excellent |
| Learning Curve | ✅ Lower (if know React) | Higher |
| **Decision** | **✅ WINNER** | Good alternative |

**React Native Wins**: Code sharing with web, existing React knowledge, faster team ramp-up.

**Folder Structure**:
```
/mobile
├── /app
│   ├── (tabs)
│   │   ├── index.tsx (Home)
│   │   ├── search.tsx
│   │   ├── map.tsx
│   │   ├── bookings.tsx
│   │   └── profile.tsx
│   ├── hotels/[id].tsx
│   └── booking/[id].tsx
├── /components
├── /hooks
│   ├── useLocation.ts
│   └── useSocket.ts
├── /services
│   └── api.ts
└── app.json (Expo config)
```

---

### Maps: Google Maps API

**✅ CHOSEN**

**Why**:
1. **Accuracy**: Best for Nigeria (Lagos, Abuja well-mapped)
2. **Features**: Geocoding, Distance Matrix, Places API
3. **Reliability**: 99.9% uptime SLA
4. **Ecosystem**: React Native Maps support

**vs Mapbox**:
| Criteria | Google Maps | Mapbox |
|----------|-------------|--------|
| Nigeria Coverage | ✅ Excellent | Good |
| Pricing | $$$ | $$ |
| Customization | Limited | ✅ High |
| Ease of Use | ✅ Simple | Moderate |
| **Decision** | **✅ WINNER** | Good for custom styling |

**Usage**:
```javascript
// Distance calculation
const distance = google.maps.geometry.spherical.computeDistanceBetween(
  userLocation,
  hotelLocation
);

// Travel time
const response = await distanceMatrixService.getDistanceMatrix({
  origins: [userLocation],
  destinations: [hotelLocation],
  travelMode: 'DRIVING'
});
```

---

### Payments: Paystack

**✅ CHOSEN**

**Why**:
1. **Nigeria-First**: Built for Nigerian market
2. **Naira Support**: Native NGN processing
3. **Mobile Money**: Support for USSD, bank transfer, card
4. **Developer-Friendly**: Clean API, excellent docs, test mode
5. **Security**: PCI-DSS compliant
6. **Webhooks**: Real-time payment notifications
7. **Settlement**: Fast (T+1 to Nigerian banks)

**vs Flutterwave**:
| Criteria | Paystack | Flutterwave |
|----------|----------|-------------|
| Nigeria Focus | ✅ Primary | Multi-country |
| Developer Experience | ✅ Excellent | Good |
| Fees | ~1.5% + ₦100 | ~1.4% |
| Documentation | ✅ Best-in-class | Good |
| **Decision** | **✅ WINNER** | Close second |

**Integration Flow**:
```
1. Frontend → Initialize transaction (API)
2. Backend → Create Paystack transaction → Return access_code
3. Frontend → Open Paystack modal (access_code)
4. User → Completes payment
5. Paystack → Sends webhook to backend
6. Backend → Verifies transaction → Confirms booking
```

---

### Real-Time: Socket.io

**✅ CHOSEN**

**Why**:
1. **Bidirectional**: Server can push updates to clients
2. **Fallback**: Auto-fallback to long-polling if WebSocket fails
3. **Room Support**: Broadcast to specific users/hotels
4. **NestJS Integration**: Official `@nestjs/websockets` adapter
5. **Reconnection**: Automatic reconnect on disconnect

**Use Cases**:
```javascript
// Room availability updates
socket.on('room_status_changed', (data) => {
  // Update UI immediately
});

// Booking notifications
socket.to(`hotel:${hotelId}`).emit('new_booking', booking);

// Lock expiration warning
socket.to(`user:${userId}`).emit('lock_expiring', { seconds: 60 });
```

**Alternatives Considered**:
- **Server-Sent Events (SSE)**: Unidirectional only
- **Firebase Realtime DB**: Vendor lock-in, overkill
- **Polling**: Inefficient, high latency

---

## Module Breakdown (NestJS)

### 1. Auth Module
**Responsibilities**:
- User registration/login
- JWT token generation/validation
- Password reset
- Role-based guards

**Key Files**:
```
/src/auth
├── auth.module.ts
├── auth.service.ts
├── auth.controller.ts
├── strategies
│   ├── jwt.strategy.ts
│   └── local.strategy.ts
├── guards
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
└── dto
    ├── login.dto.ts
    └── register.dto.ts
```

---

### 2. Hotels Module
**Responsibilities**:
- Hotel CRUD
- Geospatial search (PostGIS)
- Hotel approval workflow
- Amenities management

**Key Files**:
```
/src/hotels
├── hotels.module.ts
├── hotels.service.ts
├── hotels.controller.ts
├── entities
│   ├── hotel.entity.ts
│   └── hotel-amenity.entity.ts
└── dto
    ├── create-hotel.dto.ts
    └── search-hotels.dto.ts
```

**Critical Query** (PostGIS):
```typescript
async findNearby(lat: number, lon: number, radius: number) {
  return this.hotelRepository.createQueryBuilder('hotel')
    .select([
      'hotel.*',
      `ST_Distance(
        hotel.location,
        ST_MakePoint(${lon}, ${lat})::geography
      ) / 1000 AS distance_km`
    ])
    .where(`ST_DWithin(
      hotel.location,
      ST_MakePoint(${lon}, ${lat})::geography,
      ${radius * 1000}
    )`)
    .andWhere('hotel.status = :status', { status: 'active' })
    .orderBy('distance_km', 'ASC')
    .getRawMany();
}
```

---

### 3. Rooms Module
**Responsibilities**:
- Room inventory management
- Room status lifecycle (available → locked → booked → occupied → cleaning → available)
- Availability checks

**State Machine**:
```typescript
enum RoomStatus {
  AVAILABLE = 'available',
  LOCKED = 'locked',
  BOOKED = 'booked',
  OCCUPIED = 'occupied',
  CLEANING = 'cleaning',
  MAINTENANCE = 'maintenance'
}

// State transitions
const allowedTransitions = {
  available: ['locked', 'maintenance'],
  locked: ['booked', 'available'], // Lock expires
  booked: ['occupied', 'available'], // No-show
  occupied: ['cleaning'],
  cleaning: ['available', 'maintenance'],
  maintenance: ['cleaning']
};
```

---

### 4. Bookings Module
**Responsibilities**:
- Booking creation (with room locking)
- Booking lifecycle management
- Check-in/check-out
- Cancellations

**Booking Flow**:
```typescript
async createBooking(dto: CreateBookingDto) {
  // 1. Check availability
  const available = await this.checkAvailability(dto);
  if (!available) throw new ConflictException('Room not available');

  // 2. Lock room in Redis (15 min TTL)
  const lockKey = `room_lock:${dto.roomId}`;
  const locked = await this.redis.set(lockKey, dto.userId, 'EX', 900, 'NX');
  if (!locked) throw new ConflictException('Room is being booked');

  // 3. Create pending booking
  const booking = await this.bookingRepository.save({
    ...dto,
    status: 'pending_payment',
    reference: generateReference()
  });

  // 4. Update room status
  await this.roomsService.updateStatus(dto.roomId, 'locked', booking.id);

  // 5. Return booking (payment happens next)
  return booking;
}
```

---

### 5. Payments Module
**Responsibilities**:
- Paystack integration
- Payment initialization
- Webhook handling
- Payment verification

**Payment Flow**:
```typescript
async initializePayment(bookingId: string) {
  const booking = await this.bookingsService.findOne(bookingId);

  // Call Paystack
  const response = await this.paystack.transaction.initialize({
    email: booking.guestEmail,
    amount: booking.totalAmount * 100, // Kobo
    reference: `PAY-${booking.reference}`,
    callback_url: `${process.env.FRONTEND_URL}/bookings/${bookingId}/confirm`,
    metadata: { booking_id: bookingId }
  });

  // Store payment record
  await this.paymentRepository.save({
    bookingId,
    paystackReference: response.data.reference,
    paystackAccessCode: response.data.access_code,
    amount: booking.totalAmount,
    status: 'pending'
  });

  return response.data;
}

@Post('webhooks/paystack')
async handleWebhook(@Body() payload, @Headers('x-paystack-signature') signature) {
  // Verify signature
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  if (hash !== signature) throw new UnauthorizedException('Invalid signature');

  const { event, data } = payload;

  if (event === 'charge.success') {
    await this.confirmPayment(data.reference);
  }
}

async confirmPayment(reference: string) {
  const payment = await this.paymentRepository.findOne({
    where: { paystackReference: reference }
  });

  // Verify with Paystack (prevent fake webhooks)
  const verification = await this.paystack.transaction.verify(reference);

  if (verification.data.status === 'success') {
    // Update payment
    await this.paymentRepository.update(payment.id, {
      status: 'completed',
      paidAt: new Date()
    });

    // Confirm booking
    await this.bookingsService.confirm(payment.bookingId);

    // Release lock, update room to 'booked'
    await this.redis.del(`room_lock:${booking.roomId}`);
    await this.roomsService.updateStatus(booking.roomId, 'booked', booking.id);

    // Send confirmation email
    await this.emailService.sendBookingConfirmation(booking);

    // Emit real-time event
    this.socket.to(`hotel:${booking.hotelId}`).emit('new_booking', booking);
  }
}
```

---

### 6. Location Module
**Responsibilities**:
- IP-based geolocation (fallback)
- Distance calculations
- Travel time estimation (Google Maps API)

**Implementation**:
```typescript
async getDistanceAndDuration(origin: LatLng, destination: LatLng) {
  const response = await this.googleMaps.distancematrix.get({
    params: {
      origins: [`${origin.lat},${origin.lng}`],
      destinations: [`${destination.lat},${destination.lng}`],
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  });

  const result = response.data.rows[0].elements[0];

  return {
    distance_km: result.distance.value / 1000,
    duration_min: result.duration.value / 60
  };
}
```

---

### 7. Real-Time Module (Socket.io Gateway)
**Responsibilities**:
- WebSocket connections
- Room status broadcasts
- Booking notifications
- Lock expiration warnings

**Implementation**:
```typescript
@WebSocketGateway({ cors: true })
export class RealTimeGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join_hotel')
  handleJoinHotel(@ConnectedSocket() client: Socket, @MessageBody() hotelId: string) {
    client.join(`hotel:${hotelId}`);
  }

  broadcastRoomStatusChange(hotelId: string, roomId: string, status: string) {
    this.server.to(`hotel:${hotelId}`).emit('room_status_changed', {
      roomId,
      status,
      timestamp: new Date()
    });
  }

  notifyLockExpiring(userId: string, seconds: number) {
    this.server.to(`user:${userId}`).emit('lock_expiring', { seconds });
  }
}
```

---

## Infrastructure Architecture

### Cloud Platform: AWS (Recommended)

**Services Used**:

1. **Compute**: AWS ECS Fargate (Serverless containers)
2. **Database**: AWS RDS PostgreSQL (Multi-AZ)
3. **Cache**: AWS ElastiCache Redis
4. **Storage**: AWS S3 (Hotel images)
5. **CDN**: CloudFront (Static assets, images)
6. **Load Balancer**: AWS ALB
7. **Monitoring**: CloudWatch + Sentry
8. **Secrets**: AWS Secrets Manager
9. **CI/CD**: GitHub Actions → ECR → ECS

**Architecture Diagram**:
```
┌─────────────┐
│  Route 53   │ (DNS)
└──────┬──────┘
       ↓
┌─────────────┐
│ CloudFront  │ (CDN)
└──────┬──────┘
       ↓
┌─────────────┐
│     ALB     │ (Load Balancer)
└──────┬──────┘
       ↓
┌─────────────────────────┐
│   ECS Fargate Cluster   │
│  ┌─────────────────┐    │
│  │ Backend (NestJS)│    │
│  │ Auto-scaling    │    │
│  └─────────────────┘    │
└─────────────────────────┘
       ↓
┌────────────┬────────────┬────────────┐
│ RDS        │ ElastiCache│    S3      │
│ PostgreSQL │ Redis      │ (Images)   │
└────────────┴────────────┴────────────┘
```

---

### Docker Configuration

**Backend Dockerfile**:
```dockerfile
# /backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main"]
```

**Frontend Dockerfile**:
```dockerfile
# /web/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["npm", "start"]
```

**docker-compose.yml** (Development):
```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: smartstay
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/smartstay
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  web:
    build: ./web
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000
    volumes:
      - ./web:/app
      - /app/node_modules

volumes:
  postgres_data:
```

---

## Security Architecture

### 1. Authentication Flow (JWT)

```
┌──────────┐                 ┌──────────┐
│  Client  │                 │  Server  │
└────┬─────┘                 └────┬─────┘
     │ POST /auth/login          │
     │ {email, password}         │
     ├──────────────────────────>│
     │                            │ Validate credentials
     │                            │ Generate JWT (15min)
     │                            │ Generate Refresh (7d)
     │  {accessToken, refresh}    │
     │<───────────────────────────┤
     │                            │
     │ GET /bookings              │
     │ Authorization: Bearer JWT  │
     ├──────────────────────────>│
     │                            │ Verify JWT
     │  [bookings]                │ Check role
     │<───────────────────────────┤
```

**JWT Payload**:
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "guest",
  "iat": 1640000000,
  "exp": 1640000900
}
```

### 2. Role-Based Access Control (RBAC)

```typescript
@Controller('hotels')
export class HotelsController {
  @Get()
  @Public() // No auth required
  async findAll() {}

  @Post()
  @Roles('platform_admin') // Only platform admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create() {}

  @Patch(':id/rooms')
  @Roles('hotel_admin', 'hotel_staff')
  @UseGuards(JwtAuthGuard, RolesGuard, HotelOwnershipGuard) // Must own hotel
  async updateRooms() {}
}
```

### 3. Rate Limiting

```typescript
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redis: RedisService) {}

  async canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const key = `rate_limit:${ip}:${request.path}`;

    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, 60); // 1 minute window
    }

    if (count > 100) { // 100 requests per minute
      throw new ThrottlerException('Too many requests');
    }

    return true;
  }
}
```

---

## Scalability Considerations

### Horizontal Scaling
- **Stateless Backend**: All state in DB/Redis (no in-memory sessions)
- **Load Balancer**: Distribute traffic across instances
- **Database Read Replicas**: Offload read queries

### Caching Strategy
```typescript
// Cache hotel search results
async searchHotels(lat, lon, radius) {
  const cacheKey = `search:${lat}:${lon}:${radius}`;

  // Try cache first
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Query database
  const results = await this.hotelRepository.findNearby(lat, lon, radius);

  // Cache for 5 minutes
  await this.redis.setex(cacheKey, 300, JSON.stringify(results));

  return results;
}
```

### CDN for Static Assets
- Hotel images → S3 → CloudFront
- Reduces server load
- Faster global delivery

---

## Monitoring & Observability

### Metrics to Track
```yaml
Application Metrics:
  - Request rate (req/s)
  - Error rate (%)
  - Response time (p50, p95, p99)
  - Active WebSocket connections

Business Metrics:
  - Bookings created (per hour)
  - Payment success rate (%)
  - Average booking value
  - Search → Booking conversion (%)

Infrastructure Metrics:
  - CPU/Memory usage
  - Database connections
  - Redis memory usage
  - Disk I/O
```

### Logging Strategy
```typescript
// Structured logging (Winston + CloudWatch)
logger.info('Booking created', {
  bookingId: booking.id,
  hotelId: booking.hotelId,
  amount: booking.totalAmount,
  userId: booking.guestId,
  timestamp: new Date()
});

logger.error('Payment failed', {
  bookingId,
  error: error.message,
  paystackResponse: response
});
```

### Alerting Rules
```yaml
Critical Alerts (PagerDuty):
  - Error rate > 1% for 5 minutes
  - Payment success rate < 95%
  - Database connection pool exhausted
  - API latency p95 > 2s

Warning Alerts (Slack):
  - Error rate > 0.5%
  - CPU usage > 70%
  - Redis memory > 80%
```

---

## Disaster Recovery

### Backup Strategy
- **Database**: Automated daily backups (30-day retention)
- **Point-in-Time Recovery**: Up to 7 days
- **Redis**: AOF persistence (for critical locks)
- **S3**: Versioning enabled

### Failover Plan
1. **Database Failure**: Auto-failover to standby (Multi-AZ)
2. **Backend Crash**: ECS auto-restart (health checks)
3. **Payment Gateway Down**: Queue payments, retry later
4. **Region Outage**: Multi-region deployment (future)

---

## Conclusion

This architecture provides:
✅ **Production-Ready**: Containerized, scalable, monitored
✅ **Real-Time Capable**: WebSocket for live updates
✅ **Secure**: JWT auth, RBAC, rate limiting, encrypted data
✅ **Cost-Effective**: Start small (1 instance), scale on demand
✅ **Developer-Friendly**: TypeScript everywhere, modern tooling

**Next Steps**: API Documentation
