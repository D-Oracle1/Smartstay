# 🏨 SmartStay - Hotel Management & Booking Platform

[![Build Status](https://github.com/smartstay/smartstay/workflows/CI/badge.svg)](https://github.com/smartstay/smartstay/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](package.json)

> Production-ready hotel booking platform with real-time availability, automated inventory management, and location-based discovery. Built for the Nigerian market with global expansion in mind.

---

## 🌟 Features

### Core Functionality
- ✅ **Real-Time Room Availability** - Zero manual updates, automatic sync across all platforms
- ✅ **Anti-Double Booking** - Redis-based room locking with 15-minute TTL
- ✅ **Location-Based Discovery** - PostGIS-powered geospatial search with travel time estimates
- ✅ **Automated Booking Lifecycle** - From search to check-out, fully automated
- ✅ **Secure Payments** - Paystack integration with webhook verification
- ✅ **Multi-Role Dashboards** - Guest, Hotel Admin, Staff, Platform Admin
- ✅ **Cross-Platform** - Web (Next.js) + Mobile (iOS & Android via React Native)

### Technical Highlights
- 🚀 **Production-Ready**: Containerized, scalable, monitored
- 🔒 **Secure**: JWT authentication, RBAC, encrypted data, audit logs
- ⚡ **Fast**: < 200ms API response time (p95), SSR for SEO
- 📱 **Native Performance**: React Native with Expo for mobile
- 🗺️ **PostGIS Integration**: Accurate distance calculations and proximity search
- 🔄 **Real-Time Sync**: WebSocket (Socket.io) for live updates

---

## 📁 Project Structure

```
smartstay/
├── backend/                # NestJS Backend API
│   ├── src/
│   │   ├── auth/          # Authentication module (JWT)
│   │   ├── hotels/        # Hotel management (PostGIS)
│   │   ├── rooms/         # Room inventory engine
│   │   ├── bookings/      # Booking service (anti-double booking)
│   │   ├── payments/      # Paystack integration
│   │   ├── reviews/       # Review system
│   │   ├── location/      # Google Maps integration
│   │   ├── realtime/      # Socket.io gateway
│   │   └── common/        # Shared utilities (Redis, guards, decorators)
│   ├── Dockerfile
│   └── package.json
│
├── web/                   # Next.js Frontend (Web App)
│   ├── app/
│   │   ├── (guest)/       # Guest-facing pages
│   │   ├── (hotel-admin)/ # Hotel admin dashboard
│   │   └── (platform-admin)/ # Platform admin panel
│   ├── components/
│   ├── lib/
│   └── package.json
│
├── mobile/                # React Native Mobile App
│   ├── app/
│   │   ├── (tabs)/        # Tab navigation
│   │   ├── hotels/        # Hotel screens
│   │   └── bookings/      # Booking screens
│   ├── components/
│   ├── services/
│   └── app.json
│
├── docs/                  # Documentation
│   ├── PRD.md            # Product Requirements Document
│   ├── DATABASE_SCHEMA.md # Database design
│   ├── API_DOCUMENTATION.md # API reference
│   ├── SYSTEM_ARCHITECTURE.md # Architecture design
│   ├── UI_UX_SPECIFICATION.md # Design system
│   ├── deployment/
│   │   ├── DEPLOYMENT_GUIDE.md
│   │   └── APP_STORE_GUIDE.md
│   └── architecture/
│
├── docker-compose.yml     # Local development stack
├── .github/
│   └── workflows/
│       └── ci-cd.yml      # CI/CD pipeline
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **Docker** & Docker Compose
- **PostgreSQL** 15+ with PostGIS
- **Redis** 7+
- **Paystack Account** (payment processing)
- **Google Maps API Key**

### 1. Clone Repository
```bash
git clone https://github.com/smartstay/smartstay.git
cd smartstay
```

### 2. Environment Setup

Create environment files:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set:
```env
# Required
JWT_SECRET=<generate-with-openssl-rand-base64-32>
PAYSTACK_SECRET_KEY=<from-paystack-dashboard>
GOOGLE_MAPS_API_KEY=<from-google-cloud-console>

# Database (Docker defaults)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=smartstay

# Redis (Docker defaults)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Start Services
```bash
# Start PostgreSQL, Redis, and Backend
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

### 4. Run Migrations
```bash
cd backend
npm install
npm run migration:run
```

### 5. Access Application

- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Web App**: http://localhost:3001 (if running)

---

## 📚 Documentation

### 1. [Product Requirements Document (PRD)](docs/PRD.md)
Complete product specification with user stories, acceptance criteria, and success metrics.

### 2. [UI/UX Specification](docs/UI_UX_SPECIFICATION.md)
Design system, component library, screen specifications, and user flows.

### 3. [Database Schema](docs/DATABASE_SCHEMA.md)
Complete schema with PostGIS integration, indexes, triggers, and complex queries.

### 4. [System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
Tech stack justification, module breakdown, infrastructure design, and scaling strategy.

### 5. [API Documentation](docs/api/API_DOCUMENTATION.md)
Full API reference with request/response examples, authentication, and WebSocket events.

### 6. [Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md)
Step-by-step deployment instructions for AWS, mobile app stores, and monitoring setup.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL 15 + PostGIS
- **Cache**: Redis 7
- **Real-Time**: Socket.io
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **ORM**: TypeORM

### Frontend (Web)
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **State Management**: React Context + SWR
- **Forms**: React Hook Form
- **UI Components**: Headless UI / Radix UI

### Mobile
- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **Maps**: react-native-maps (Google Maps)
- **State**: React Context + TanStack Query
- **Payments**: Paystack React Native SDK

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: AWS ECS Fargate
- **Load Balancer**: AWS ALB
- **CDN**: CloudFront
- **Storage**: AWS S3
- **Monitoring**: CloudWatch + Sentry
- **CI/CD**: GitHub Actions

### Third-Party Services
- **Payments**: Paystack (Nigeria-first)
- **Maps**: Google Maps API
- **Geocoding**: Google Maps Geocoding API
- **Distance Matrix**: Google Distance Matrix API

---

## 🔑 Key Features Explained

### 1. Anti-Double Booking System

**How it works**:
```typescript
// 1. User selects room → System locks room in Redis (15-min TTL)
await redisService.lockRoom(roomId, bookingId, userId, 900);

// 2. User completes payment → Booking confirmed, room status updated
await bookingsService.confirmBooking(bookingId);

// 3. Lock expires → Room auto-released if payment not completed
// Redis TTL handles this automatically
```

**Benefits**:
- Zero double bookings (guaranteed by Redis atomic operations)
- Automatic cleanup (TTL-based expiration)
- Scalable (Redis cluster-ready)

### 2. Location-Based Search

**PostGIS Query**:
```sql
SELECT
  hotel.*,
  ST_Distance(
    hotel.location,
    ST_MakePoint(:longitude, :latitude)::geography
  ) / 1000 AS distance_km
FROM hotels
WHERE ST_DWithin(
  hotel.location,
  ST_MakePoint(:longitude, :latitude)::geography,
  :radius_meters
)
AND status = 'active'
ORDER BY distance_km;
```

**Features**:
- Accurate distance calculations (PostGIS geography type)
- Fast queries (GIST spatial index)
- Travel time estimation (Google Distance Matrix API)

### 3. Real-Time Updates

**WebSocket Events**:
```typescript
// Room status changed
socket.emit('room_status_changed', {
  roomId: '123',
  status: 'cleaning',
  timestamp: new Date()
});

// New booking notification (to hotel staff)
socket.to(`hotel:${hotelId}`).emit('new_booking', booking);

// Lock expiring warning (to guest)
socket.to(`user:${userId}`).emit('lock_expiring', { seconds: 60 });
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                 # Unit tests
npm run test:e2e        # End-to-end tests
npm run test:cov        # Coverage report
```

### Frontend Tests
```bash
cd web
npm test                # Jest + React Testing Library
npm run test:e2e       # Playwright E2E tests
```

---

## 📦 Deployment

### Local Development
```bash
docker-compose up -d
```

### Production Deployment

**Option 1: AWS (Recommended)**
```bash
# See detailed guide: docs/deployment/DEPLOYMENT_GUIDE.md

# Build and push Docker image
docker build -t smartstay-backend ./backend
docker push <your-registry>/smartstay-backend:latest

# Deploy to ECS
aws ecs update-service --cluster smartstay --service backend --force-new-deployment
```

**Option 2: GCP / Azure**
See [Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md) for GCP/Azure instructions.

### Mobile App Deployment

**iOS**:
```bash
cd mobile
eas build --platform ios --profile production
eas submit --platform ios
```

**Android**:
```bash
cd mobile
eas build --platform android --profile production
eas submit --platform android
```

See [App Store Guide](docs/deployment/APP_STORE_GUIDE.md) for detailed submission instructions.

---

## 🔐 Security

### Implemented
- ✅ JWT authentication with short-lived tokens (15 min)
- ✅ Refresh tokens (7 days)
- ✅ Role-based access control (RBAC)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (input sanitization)
- ✅ CSRF protection
- ✅ Rate limiting (100 req/min per IP)
- ✅ Password hashing (bcrypt)
- ✅ Encrypted sensitive data (PII)
- ✅ Audit logs (all sensitive operations)
- ✅ Webhook signature verification (Paystack)

### Security Checklist (Pre-Prod)
- [ ] Change all default passwords
- [ ] Rotate JWT secrets
- [ ] Enable HTTPS everywhere
- [ ] Configure WAF rules
- [ ] Enable database encryption at rest
- [ ] Setup DDoS protection
- [ ] Configure security groups (AWS)
- [ ] Enable MFA for admin accounts
- [ ] Run security audit (OWASP ZAP)
- [ ] Setup vulnerability scanning

---

## 📊 Performance

### Targets (Production)
- API Response Time: < 200ms (p95)
- Page Load Time: < 2s (web)
- App Launch Time: < 3s (mobile)
- Uptime: 99.9%
- Concurrent Users: 10,000+

### Optimizations
- Database indexes (including spatial indexes)
- Redis caching (search results, hotel data)
- CDN for static assets
- Image optimization (WebP + lazy loading)
- Code splitting (route-based)
- Connection pooling (database)
- Horizontal scaling (stateless backend)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint + Prettier
- **Testing**: Jest + Testing Library
- **Commits**: Conventional Commits

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Product Manager**: [@pm-handle]
- **Tech Lead**: [@tech-lead]
- **Backend Engineer**: [@backend-dev]
- **Frontend Engineer**: [@frontend-dev]
- **Mobile Engineer**: [@mobile-dev]
- **DevOps Engineer**: [@devops]

---

## 📧 Support

- **Email**: support@smartstay.ng
- **Documentation**: https://docs.smartstay.ng
- **Status Page**: https://status.smartstay.ng
- **Discord**: https://discord.gg/smartstay

---

## 🗺️ Roadmap

### MVP (Current)
- [x] Real-time booking system
- [x] Payment integration (Paystack)
- [x] Location-based search
- [x] Mobile apps (iOS + Android)
- [x] Admin dashboards

### v1.1 (Q2 2025)
- [ ] Guest reviews and ratings
- [ ] In-app chat (guest ↔ hotel)
- [ ] Loyalty program
- [ ] Email marketing integration

### v1.2 (Q3 2025)
- [ ] Multi-currency support
- [ ] Multi-language (Yoruba, Hausa, Igbo)
- [ ] AI-powered recommendations
- [ ] Airport transfer booking

### v2.0 (Q4 2025)
- [ ] Expansion to Ghana, Kenya
- [ ] Corporate booking platform
- [ ] Hotel PMS integration
- [ ] Mobile check-in (QR codes)

---

## 🎯 Success Metrics

### Launch Targets (Month 1)
- 1,000+ Daily Active Users
- 500+ Bookings
- ₦10M+ Gross Booking Value
- 3+ Hotels onboarded

### Growth Targets (Year 1)
- 50,000+ Users
- 10,000+ Bookings/month
- ₦100M+ Monthly GBV
- 100+ Hotels across Nigeria

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [React Native](https://reactnative.dev/) - Mobile framework
- [Expo](https://expo.dev/) - Mobile development platform
- [Paystack](https://paystack.com/) - Payment processing
- [PostGIS](https://postgis.net/) - Geospatial capabilities
- [Redis](https://redis.io/) - Caching and locking

---

**Built with ❤️ for the Nigerian hospitality industry**

🚀 **Ready to launch? See [Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md)**
