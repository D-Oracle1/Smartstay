# SmartStay - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Mobile App Deployment](#mobile-app-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Accounts & Services
- [ ] AWS Account (or GCP/Azure)
- [ ] Domain name (e.g., smartstay.ng)
- [ ] Paystack Account (payment processing)
- [ ] Google Maps API Key
- [ ] Docker Hub Account
- [ ] GitHub Account
- [ ] Apple Developer Account (iOS deployment)
- [ ] Google Play Console Account (Android deployment)

### Required Tools
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+ with PostGIS
- Redis 7+
- Git
- AWS CLI (for AWS deployment)

---

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/smartstay.git
cd smartstay
```

### 2. Environment Configuration

Create `.env` files:

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set:
- `JWT_SECRET` (generate with `openssl rand -base64 32`)
- `PAYSTACK_SECRET_KEY` (from Paystack dashboard)
- `GOOGLE_MAPS_API_KEY` (from Google Cloud Console)

### 3. Start Services with Docker Compose

```bash
docker-compose up -d
```

This starts:
- PostgreSQL with PostGIS (port 5432)
- Redis (port 6379)
- Backend API (port 3000)

### 4. Run Database Migrations

```bash
cd backend
npm run migration:run
```

### 5. Seed Database (Optional)

```bash
npm run seed
```

### 6. Access Application

- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs
- **Web App**: http://localhost:3001 (if running)

---

## Production Deployment

### Option 1: AWS Deployment (Recommended)

#### Architecture
```
Route 53 (DNS)
    ↓
CloudFront (CDN)
    ↓
Application Load Balancer
    ↓
ECS Fargate (Backend Containers)
    ↓
RDS PostgreSQL + ElastiCache Redis
```

#### Step 1: Infrastructure Setup

**1. Create VPC & Subnets**
```bash
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=smartstay-vpc}]'
```

**2. Create RDS PostgreSQL Instance**
```bash
aws rds create-db-instance \
  --db-instance-identifier smartstay-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username postgres \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --multi-az \
  --backup-retention-period 7
```

**3. Create ElastiCache Redis**
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id smartstay-redis \
  --cache-node-type cache.t3.small \
  --engine redis \
  --num-cache-nodes 1
```

**4. Create S3 Bucket for Images**
```bash
aws s3 mb s3://smartstay-images
aws s3api put-bucket-cors --bucket smartstay-images --cors-configuration file://cors.json
```

#### Step 2: Container Deployment

**1. Build and Push Docker Image**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t smartstay-backend ./backend

# Tag image
docker tag smartstay-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/smartstay-backend:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/smartstay-backend:latest
```

**2. Create ECS Task Definition**

Save as `task-definition.json`:
```json
{
  "family": "smartstay-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "smartstay-backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/smartstay-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_HOST",
          "value": "<rds-endpoint>"
        },
        {
          "name": "REDIS_HOST",
          "value": "<elasticache-endpoint>"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account-id:secret:smartstay/jwt-secret"
        },
        {
          "name": "PAYSTACK_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account-id:secret:smartstay/paystack"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/smartstay-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register task:
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

**3. Create ECS Service**
```bash
aws ecs create-service \
  --cluster smartstay-cluster \
  --service-name smartstay-backend \
  --task-definition smartstay-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:region:account-id:targetgroup/smartstay-backend/xxx,containerName=smartstay-backend,containerPort=3000"
```

#### Step 3: Configure Load Balancer & SSL

**1. Create Application Load Balancer**
```bash
aws elbv2 create-load-balancer \
  --name smartstay-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx
```

**2. Create Target Group**
```bash
aws elbv2 create-target-group \
  --name smartstay-backend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /health
```

**3. Request SSL Certificate**
```bash
aws acm request-certificate \
  --domain-name api.smartstay.ng \
  --validation-method DNS
```

**4. Create HTTPS Listener**
```bash
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<acm-cert-arn> \
  --default-actions Type=forward,TargetGroupArn=<tg-arn>
```

#### Step 4: Setup Auto-Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/smartstay-cluster/smartstay-backend \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy (CPU-based)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/smartstay-cluster/smartstay-backend \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

---

## Mobile App Deployment

### iOS Deployment

#### 1. Prepare App

**Prerequisites**:
- Xcode 14+
- Apple Developer Account ($99/year)
- iOS device for testing

**Steps**:

1. **Configure App Identifiers**
```bash
cd mobile
# Update app.json with production values
```

2. **Build iOS App**
```bash
# Using EAS Build (Expo)
npm install -g eas-cli
eas login
eas build --platform ios --profile production
```

3. **Submit to TestFlight**
```bash
eas submit --platform ios
```

4. **App Store Review Checklist**
- [ ] App icon (1024×1024px)
- [ ] Screenshots (all required device sizes)
- [ ] Privacy policy URL
- [ ] App description
- [ ] Keywords
- [ ] Support URL
- [ ] Marketing URL (optional)

5. **Submit for Review**
- Go to App Store Connect
- Navigate to "Prepare for Submission"
- Fill all required information
- Submit for review (typically 24-48 hours)

#### 2. App Store Assets

**Required Screenshots**:
- iPhone 6.7" (1290 × 2796)
- iPhone 6.5" (1284 × 2778)
- iPad Pro 12.9" (2048 × 2732)

**App Preview Video** (optional but recommended):
- 15-30 seconds
- Show key features
- Portrait and landscape

---

### Android Deployment

#### 1. Prepare App

**Prerequisites**:
- Google Play Console Account ($25 one-time)

**Steps**:

1. **Generate Signing Key**
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore smartstay.keystore -alias smartstay -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure app.json**
```json
{
  "expo": {
    "android": {
      "package": "ng.smartstay.app",
      "versionCode": 1
    }
  }
}
```

3. **Build Android App**
```bash
eas build --platform android --profile production
```

4. **Generate App Bundle (AAB)**
```bash
# Download .aab file from EAS Build
```

#### 2. Upload to Google Play

1. **Create App in Play Console**
- Go to Google Play Console
- Click "Create App"
- Fill app details

2. **Complete Store Listing**
- [ ] App icon (512×512px)
- [ ] Feature graphic (1024×500px)
- [ ] Screenshots (min 2, max 8 per device type)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Privacy policy URL
- [ ] Category

3. **Upload App Bundle**
- Go to "Production" > "Create new release"
- Upload .aab file
- Add release notes
- Submit for review (typically 1-3 days)

---

## Monitoring & Maintenance

### 1. Setup Monitoring

**CloudWatch Alarms**:
```bash
# CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name smartstay-high-cpu \
  --alarm-description "CPU usage above 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions <sns-topic-arn>

# Error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name smartstay-high-errors \
  --alarm-description "Error rate above 1%" \
  --metric-name ErrorRate \
  --namespace SmartStay \
  --statistic Average \
  --period 60 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions <sns-topic-arn>
```

**Sentry Integration** (Error Tracking):
```typescript
// In main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 2. Backup Strategy

**Automated RDS Backups**:
- Enabled by default with 7-day retention
- Snapshots taken daily during maintenance window

**Manual Backup**:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier smartstay-db \
  --db-snapshot-identifier smartstay-manual-backup-$(date +%Y%m%d)
```

### 3. Database Migrations in Production

```bash
# SSH into ECS container or run as ECS task
aws ecs run-task \
  --cluster smartstay-cluster \
  --task-definition smartstay-migration \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"
```

### 4. Rollback Procedure

**ECS Rollback**:
```bash
# Revert to previous task definition
aws ecs update-service \
  --cluster smartstay-cluster \
  --service smartstay-backend \
  --task-definition smartstay-backend:123  # Previous version
```

**Database Rollback**:
```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier smartstay-db-restored \
  --db-snapshot-identifier smartstay-manual-backup-20250101
```

---

## Post-Deployment Checklist

### Backend
- [ ] API is accessible via HTTPS
- [ ] Health check endpoint returns 200
- [ ] Database migrations completed
- [ ] Environment variables set correctly
- [ ] Monitoring and alerting configured
- [ ] SSL certificate valid
- [ ] CORS configured for frontend domain
- [ ] Rate limiting active

### Frontend (Web)
- [ ] Deployed to CDN (CloudFront)
- [ ] API calls use production endpoint
- [ ] Google Analytics configured
- [ ] SEO meta tags present
- [ ] Sitemap.xml generated

### Mobile Apps
- [ ] iOS app approved and live on App Store
- [ ] Android app approved and live on Play Store
- [ ] Push notifications configured
- [ ] Analytics tracking enabled
- [ ] Deep linking configured

### Integrations
- [ ] Paystack webhook verified
- [ ] Google Maps API quota sufficient
- [ ] Email service configured
- [ ] SMS service configured (for OTP)

---

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check security group allows backend access
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-backend
```

**2. Redis Connection Timeout**
```bash
# Verify ElastiCache endpoint
redis-cli -h <elasticache-endpoint> ping
```

**3. High Latency**
```bash
# Check ECS service metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=smartstay-backend \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

---

## Support & Resources

- **Documentation**: https://docs.smartstay.ng
- **Status Page**: https://status.smartstay.ng
- **Support Email**: support@smartstay.ng
- **Developer Slack**: https://smartstay.slack.com

---

**Next**: [Mobile App Store Submission Guide](./APP_STORE_GUIDE.md)
