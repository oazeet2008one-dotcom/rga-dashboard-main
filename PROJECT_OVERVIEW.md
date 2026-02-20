# RGA Dashboard - Project Overview

## 1. ภาพรวมโปรเจคต์

### วัตถุประสงค์หลัก
- **RGA Marketing Dashboard** - แพลตฟอร์มรวมข้อมูลการตลาดแบบ multi-channel
- **Multi-Tenancy** - รองรับลูกค้าหลายรายบนระบบเดียว
- **Real-time Analytics** - ข้อมูลเชิงลึกจากหลายแพลตฟอร์ม
- **AI Integration** - Google Assistant สำหรับการวิเคราะห์และแนะนำ

### แพลตฟอร์มที่รองรับ
- **Google Ads** - โฆษณา Google
- **Google Analytics 4** - วิเคราะห์เว็บไซต์
- **Facebook Ads** - โฆษณา Facebook
- **TikTok Ads** - โฆษณา TikTok
- **LINE Ads** - โฆษณา LINE
- **Google Search Console** - ข้อมูล SEO
- **Email Marketing** - ระบบส่งอีเมล

---

## 2. สถาปัตยกรรมระบบ

### 2.1 Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── features/           # Feature-based architecture
│   │   ├── ai-insights/    # AI Assistant & Analytics
│   │   ├── chat/           # Chat interface
│   │   ├── dashboard/      # Main dashboard
│   │   ├── campaigns/      # Campaign management
│   │   ├── seo/            # SEO analytics
│   │   └── auth/           # Authentication
│   ├── services/           # API services
│   ├── hooks/              # React Query hooks
│   ├── components/         # Shared components
│   └── utils/              # Utility functions
├── public/
└── package.json
```

### 2.2 Backend (NestJS + TypeScript)
```
backend/
├── src/
│   ├── modules/           # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── users/          # User management
│   │   ├── campaigns/      # Campaign data
│   │   ├── seo/            # SEO & GSC integration
│   │   ├── ai/             # AI insights
│   │   ├── chat/           # Chat system
│   │   ├── alerts/         # Alert system
│   │   └── integrations/   # Third-party integrations
│   ├── common/             # Shared utilities
│   ├── config/             # Configuration
│   └── main.ts             # Application entry
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeding
└── package.json
```

### 2.3 Database (PostgreSQL + Supabase)
- **Multi-tenant Architecture** - แยกข้อมูลตาม tenantId
- **Real-time Subscriptions** - Supabase realtime
- **Row Level Security** - ความปลอดภัยระดับแถว
- **Backup & Recovery** - ระบบ backup อัตโนมัติ

---

## 3. ฟีเจอร์หลัก

### 3.1 Dashboard & Analytics
- **Real-time Metrics** - ข้อมูลสดแบบ real-time
- **Custom Reports** - รายงานที่ปรับแต่งได้
- **Data Visualization** - กราฟและแผนภูมิ
- **Export Functionality** - ส่งออกข้อมูล (PDF, Excel, CSV)

### 3.2 Campaign Management
- **Multi-platform Integration** - เชื่อมต่อกับหลายแพลตฟอร์ม
- **Campaign Creation** - สร้างและจัดการแคมเปญ
- **Performance Tracking** - ติดตามประสิทธิภาพ
- **Budget Management** - จัดการงบประมาณ

### 3.3 SEO & Content
- **Google Search Console Integration** - ดึงข้อมูล SEO จริง
- **Keyword Analysis** - วิเคราะห์คีย์เวิร์ด
- **Traffic Analytics** - วิเคราะห์ traffic ตาม location
- **AI-powered Insights** - ข้อมูลเชิงลึกจาก AI

### 3.4 AI Assistant
- **Natural Language Queries** - ถามข้อมูลด้วยภาษาธรรมดา
- **Smart Recommendations** - คำแนะนำอัจฉริยะ
- **Anomaly Detection** - ตรวจจับข้อมูลผิดปกติ
- **Predictive Analytics** - ทำนายแนวโน้ม

### 3.5 Communication
- **Chat System** - ระบบแชทภายใน
- **Email Notifications** - แจ้งเตือนทางอีเมล
- **Alert Management** - จัดการการแจ้งเตือน
- **Audit Logs** - บันทึกการใช้งาน

---

## 4. การจัดการผู้ใช้ (Multi-Tenancy)

### 4.1 Tenant Structure
```prisma
model Tenant {
  id   String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name String @map("name") @db.VarChar(255)
  
  // Branding & Configuration
  slug           String? @unique @map("slug") @db.VarChar(100)
  domain         String? @map("domain") @db.VarChar(255)
  logoUrl        String? @map("logo_url") @db.Text
  primaryColor   String? @default("#3B82F6") @map("primary_color") @db.VarChar(7)
  secondaryColor String? @default("#10B981") @map("secondary_color") @db.VarChar(7)
  
  // Subscription
  subscriptionPlan   SubscriptionPlan?   @default(BASIC) @map("subscription_plan")
  subscriptionStatus SubscriptionStatus? @default(ACTIVE) @map("subscription_status")
  
  // Settings (JSONB for flexibility)
  settings Json? @map("settings") @db.JsonB
  
  // Relations
  users                     User[]
  campaigns                 Campaign[]
  metrics                   Metric[]
  alerts                    Alert[]
  aiInsights                AiInsight[]
  userBehaviorEvents        UserBehavior[]
  aiRecommendations         AiRecommendation[]
  googleAdsAccounts         GoogleAdsAccount[]
  googleAnalyticsAccounts   GoogleAnalyticsAccount[]
  facebookAdsAccounts       FacebookAdsAccount[]
  tiktokAdsAccounts         TikTokAdsAccount[]
  lineAdsAccounts           LineAdsAccount[]
  webAnalyticsDaily         WebAnalyticsDaily[]
  SeoTopKeywords            SeoTopKeywords[]
  SeoTrafficByLocation      SeoTrafficByLocation[]
}
```

### 4.2 User Management
```prisma
model User {
  id       String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId String  @map("tenant_id") @db.Uuid
  email    String  @map("email") @db.VarChar(255)
  username String? @unique @map("username") @db.VarChar(30)
  password String  @map("password_hash") @db.VarChar(255)
  
  // Profile
  firstName String? @map("first_name") @db.VarChar(100)
  lastName  String? @map("last_name") @db.VarChar(100)
  phone     String? @map("phone") @db.VarChar(20)
  avatarUrl String? @map("avatar_url") @db.Text
  
  // Role & Access
  role      UserRole @default(CLIENT) @map("role")
  adminType String?  @map("admin_type") @db.VarChar(50)
  isActive  Boolean  @default(true) @map("is_active")
  
  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userBehaviorEvents UserBehavior[]
  chatSessions ChatSession[]
  chatMessages ChatMessage[]
}
```

---

## 5. การเชื่อมต่อกับ Third-party Services

### 5.1 Google Services
- **Google Ads API** - ข้อมูลโฆษณา
- **Google Analytics 4** - ข้อมูลเว็บไซต์
- **Google Search Console** - ข้อมูล SEO
- **Google OAuth** - การยืนยันตัวตน

### 5.2 Social Media Platforms
- **Facebook Graph API** - ข้อมูล Facebook Ads
- **TikTok Ads API** - ข้อมูล TikTok Ads
- **LINE Messaging API** - ข้อมูล LINE Ads

### 5.3 Email & Communication
- **SMTP (Gmail)** - ส่งอีเมล
- **Email Templates** - เทมเพลตอีเมล
- **Email Verification** - ยืนยันอีเมลผู้ใช้

---

## 6. ระบบ AI และ Analytics

### 6.1 AI Insights
```prisma
model AiInsight {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId   String   @map("tenant_id") @db.Uuid
  type       String   @map("type") @db.VarChar(50)
  source     String   @default("n8n") @map("source") @db.VarChar(50)
  title      String?  @map("title") @db.VarChar(255)
  message    String?  @map("message") @db.Text
  payload    Json?    @map("payload") @db.JsonB
  status     String   @default("ACTIVE") @map("status") @db.VarChar(20)
  occurredAt DateTime @default(now()) @map("occurred_at")
  
  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}
```

### 6.2 User Behavior Tracking
```prisma
model UserBehavior {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  action    String   @map("action") @db.VarChar(100)
  data      Json?    @map("data") @db.JsonB
  timestamp DateTime @default(now()) @map("timestamp")
  
  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 6.3 AI Recommendations
```prisma
model AiRecommendation {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId    String    @map("tenant_id") @db.Uuid
  type        String    @map("type") @db.VarChar(50)
  title       String    @map("title") @db.VarChar(255)
  description String    @map("description") @db.Text
  priority    String    @default("MEDIUM") @map("priority") @db.VarChar(20)
  confidence  Decimal   @default(0) @map("confidence") @db.Decimal(3, 2)
  status      String    @default("PENDING") @map("status") @db.VarChar(20)
  payload     Json?     @map("payload") @db.JsonB
  executedAt  DateTime? @map("executed_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  
  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}
```

---

## 7. ระบบ Alert และ Notifications

### 7.1 Alert System
```prisma
model Alert {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  name        String   @map("name") @db.VarChar(255)
  description String?  @map("description") @db.Text
  type        String   @map("type") @db.VarChar(50)
  severity    String   @default("MEDIUM") @map("severity") @db.VarChar(20)
  isActive    Boolean  @default(true) @map("is_active")
  conditions  Json     @map("conditions") @db.JsonB
  actions     Json     @map("actions") @db.JsonB
  
  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  alertHistories AlertHistory[]
}
```

### 7.2 Alert History
```prisma
model AlertHistory {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  alertId     String   @map("alert_id") @db.Uuid
  triggeredAt DateTime @default(now()) @map("triggered_at")
  resolvedAt  DateTime? @map("resolved_at")
  status      String   @default("ACTIVE") @map("status") @db.VarChar(20)
  message     String?  @map("message") @db.Text
  metadata    Json?    @map("metadata") @db.JsonB
  
  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  alert  Alert  @relation(fields: [alertId], references: [id], onDelete: Cascade)
}
```

---

## 8. ระบบ Campaign Management

### 8.1 Campaign Structure
```prisma
model Campaign {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  name        String   @map("name") @db.VarChar(255)
  description String?  @map("description") @db.Text
  platform    String   @map("platform") @db.VarChar(50)
  status      String   @default("ACTIVE") @map("status") @db.VarChar(20)
  budget      Decimal  @map("budget") @db.Decimal(12, 2)
  startDate   DateTime @map("start_date")
  endDate     DateTime? @map("end_date")
  
  // Relations
  tenant      Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  adGroups    AdGroup[]
  metrics     Metric[]
}
```

### 8.2 Ad Groups
```prisma
model AdGroup {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId   String   @map("tenant_id") @db.Uuid
  campaignId String   @map("campaign_id") @db.Uuid
  name       String   @map("name") @db.VarChar(255)
  status     String   @default("ACTIVE") @map("status") @db.VarChar(20)
  budget     Decimal  @map("budget") @db.Decimal(12, 2)
  
  // Relations
  tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
}
```

---

## 9. ระบบ SEO & Search Console

### 9.1 SEO Top Keywords
```prisma
model SeoTopKeywords {
  id       String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId String   @map("tenant_id") @db.Uuid
  date     DateTime @map("date") @db.Date
  
  keyword           String @map("keyword") @db.VarChar(255)
  position          Float  @map("position")
  volume            Int    @map("volume")
  traffic           Int    @map("traffic")
  trafficPercentage Float  @map("traffic_percentage")
  url               String @map("url") @db.Text
  change            Int    @map("change")
  
  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId], name: "idx_seo_keywords_tenant")
  @@index([date], name: "idx_seo_keywords_date")
  @@map("seo_top_keywords")
}
```

### 9.2 SEO Traffic by Location
```prisma
model SeoTrafficByLocation {
  id       String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId String   @map("tenant_id") @db.Uuid
  date     DateTime @map("date") @db.Date
  
  location          String @map("location") @db.VarChar(100)
  traffic           Int    @map("traffic")
  trafficPercentage Float  @map("traffic_percentage")
  keywords          Int    @map("keywords")
  
  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@unique([tenantId, date, location], name: "seo_location_unique")
  @@index([tenantId], name: "idx_seo_location_tenant")
  @@index([date], name: "idx_seo_location_date")
  @@map("seo_traffic_by_location")
}
```

---

## 10. ระบบ Chat & Communication

### 10.1 Chat Sessions
```prisma
model ChatSession {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  title     String?  @map("title") @db.VarChar(255)
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages ChatMessage[]
}
```

### 10.2 Chat Messages
```prisma
model ChatMessage {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId   String   @map("tenant_id") @db.Uuid
  sessionId  String   @map("session_id") @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  content    String   @map("content") @db.Text
  role       String   @map("role") @db.VarChar(20)
  createdAt  DateTime @default(now()) @map("created_at")
  
  // Relations
  tenant   Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  session  ChatSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user     User         @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 11. Environment Variables

### 11.1 Database
```env
DATABASE_URL="YOUR_DATABASE_URL"
DIRECT_URL="YOUR_DIRECT_URL"
```

### 11.2 Security
```env
ENCRYPTION_KEY="YOUR_ENCRYPTION_KEY"
JWT_SECRET="YOUR_JWT_SECRET"
JWT_REFRESH_SECRET="YOUR_JWT_REFRESH_SECRET"
```

### 11.3 Third-party Integrations
```env
# Google Services
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_ADS_DEVELOPER_TOKEN="YOUR_GOOGLE_ADS_DEVELOPER_TOKEN"
GA4_PROPERTY_ID="YOUR_GA4_PROPERTY_ID"

# Facebook Ads
FACEBOOK_APP_ID="YOUR_FACEBOOK_APP_ID"
FACEBOOK_APP_SECRET="YOUR_FACEBOOK_APP_SECRET"

# TikTok Ads
TIKTOK_APP_ID="YOUR_TIKTOK_APP_ID"
TIKTOK_APP_SECRET="YOUR_TIKTOK_APP_SECRET"

# LINE Ads
LINE_CHANNEL_ID="YOUR_LINE_CHANNEL_ID"
LINE_CHANNEL_SECRET="YOUR_LINE_CHANNEL_SECRET"

# Google Search Console (NEW)
GSC_SERVICE_ACCOUNT_KEY_FILE="C:\\Users\\Admin\\Desktop\\service-account.json"
GSC_SITE_URL="http://localhost:5173"
```

### 11.4 Email
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE="tls"
SMTP_USER="YOUR_SMTP_USER"
SMTP_PASSWORD="YOUR_SMTP_PASSWORD"
EMAIL_FROM="noreply@rga.dashboard.com"
```

---

## 12. การติดตั้งและรันระบบ

### 12.1 Prerequisites
- Node.js 18+
- PostgreSQL (หรือใช้ Supabase)
- Redis (สำหรับ cache)
- Docker (optional)

### 12.2 Installation
```bash
# Clone repository
git clone https://github.com/apecgta191285/rga-dashboard-main.git
cd rga-dashboard-main

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup database
cd ../backend && npx prisma migrate dev
npx prisma generate
npm run seed

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials
```

### 12.3 Running the Application
```bash
# Start backend
cd backend
npm run start:dev

# Start frontend (new terminal)
cd frontend
npm run dev
```

### 12.4 URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Database Studio**: http://localhost:3000/api/studio

---

## 13. การทดสอบและ Quality Assurance

### 13.1 Testing Strategy
- **Unit Tests** - Jest สำหรับ backend
- **Integration Tests** - Supertest สำหรับ API
- **E2E Tests** - Playwright สำหรับ frontend
- **Manual Testing** - Test cases สำหรับ user flows

### 13.2 Code Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type safety
- **Husky** - Git hooks
- **Commitlint** - Commit message standards

### 13.3 Documentation
- **API Documentation** - Swagger/OpenAPI
- **Code Comments** - JSDoc comments
- **README Files** - Project documentation
- **Architecture Docs** - System design documents

---

## 14. การ Deploy และ Production

### 14.1 Deployment Architecture
- **Frontend** - Vercel/Netlify (Static hosting)
- **Backend** - Railway/Heroku/DigitalOcean
- **Database** - Supabase PostgreSQL
- **Cache** - Redis (Upstash/Redis Labs)
- **Monitoring** - Sentry (Error tracking)
- **Analytics** - Google Analytics

### 14.2 CI/CD Pipeline
- **GitHub Actions** - Automated testing and deployment
- **Environment Variables** - Separate configs for dev/staging/prod
- **Database Migrations** - Automated schema updates
- **Health Checks** - Application health monitoring

### 14.3 Security
- **Environment Variables** - Secure secrets management
- **HTTPS** - SSL certificates
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API rate limiting
- **Authentication** - JWT tokens with refresh
- **Authorization** - Role-based access control

---

## 15. สถานะปัจจุบันและ Roadmap

### 15.1 Completed Features ✅
- **Multi-tenancy Architecture** - สมบูรณ์
- **Authentication System** - JWT + refresh tokens
- **Dashboard UI** - React + Tailwind CSS
- **Google Ads Integration** - API integration
- **Google Analytics 4** - Data fetching
- **Facebook Ads Integration** - Basic integration
- **AI Insights System** - Data collection
- **Chat System** - Basic functionality
- **Alert System** - Rule-based alerts
- **SEO Integration** - GSC sync (90% complete)

### 15.2 In Progress 🔄
- **Google Search Console Integration** - Runtime verification pending
- **TikTok Ads Integration** - API setup
- **LINE Ads Integration** - Mock data only
- **Email System** - SMTP configuration
- **Advanced AI Features** - Machine learning models

### 15.3 Planned Features 📋
- **Advanced Analytics** - Custom dashboards
- **Predictive Analytics** - ML-based predictions
- **Mobile App** - React Native
- **White-label Solution** - Custom branding
- **API Marketplace** - Third-party integrations
- **Advanced Reporting** - Automated reports
- **Real-time Collaboration** - Multi-user features

---

## 16. ข้อมูลติดต่อและ Support

### 16.1 Team Structure
- **Backend Developers** - NestJS/TypeScript
- **Frontend Developers** - React/TypeScript
- **DevOps Engineers** - Deployment/Infrastructure
- **QA Engineers** - Testing/Quality assurance
- **Product Managers** - Feature planning
- **UI/UX Designers** - Design system

### 16.2 Support Channels
- **Documentation** - README files and docs/
- **Issue Tracking** - GitHub Issues
- **Communication** - Slack/Discord
- **Code Reviews** - Pull requests
- **Knowledge Base** - Confluence/Notion

---

## 17. สรุป

**RGA Dashboard** เป็นแพลตฟอร์มการตลาดแบบ multi-channel ที่มี:
- **Multi-tenancy** - รองรับลูกค้าหลายราย
- **Real-time Analytics** - ข้อมูลสดจากหลายแพลตฟอร์ม
- **AI Integration** - การวิเคราะห์และแนะนำอัจฉริยะ
- **Modern Tech Stack** - React, NestJS, PostgreSQL
- **Scalable Architecture** - รองรับการเติบโต
- **Security First** - ความปลอดภัยระดับ enterprise

**สถานะปัจจุบัน**: 90% complete, พร้อมสำหรับ production deployment

---

**เอกสารนี้ครอบคลุมทุกแงมมุมของ RGA Dashboard พร้อมคำอธิบายรายละเอียดสำหรับทีมพัฒนาและผู้ดูแลระบบ**
