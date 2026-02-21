# RGA Dashboard - Development Guide

## 1. การตั้งค่าสภาพแวดล้อมการพัฒนา

### 1.1 Prerequisites
```bash
# ตรวจสอบ Node.js version
node --version  # ต้องเป็น 18.x ขึ้นไป
npm --version   # ต้องเป็น 9.x ขึ้นไป

# ตรวจสอบ Git
git --version

# ตรวจสอบ PostgreSQL (ถ้าใช้ local)
psql --version
```

### 1.2 Clone Repository
```bash
git clone https://github.com/apecgta191285/rga-dashboard-main.git
cd rga-dashboard-main
```

### 1.3 Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install

# กลับไปที่ root
cd ..
```

### 1.4 Environment Setup
```bash
# สร้างไฟล์ environment
cd backend
cp .env.example .env

# แก้ไข .env ด้วยค่าจริง
nano .env  # หรือใช้ editor ที่คุณชอบ
```

---

## 2. Database Setup

### 2.1 ใช้ Supabase (แนะนำ)
1. สร้าง project ใน [Supabase](https://supabase.com)
2. ไปที่ Settings > Database
3. คัดลอก Connection string
4. ใส่ใน `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
   ```

### 2.2 ใช้ Local PostgreSQL
```bash
# สร้าง database
createdb rga_dashboard

# ใส่ใน .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/rga_dashboard"
DIRECT_URL="postgresql://postgres:password@localhost:5432/rga_dashboard"
```

### 2.3 Database Migration
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run seed
```

---

## 3. การรัน Application

### 3.1 Development Mode
```bash
# Terminal 1: Start backend
cd backend
npm run start:dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### 3.2 URLs หลังจากรัน
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Database Studio**: http://localhost:3000/api/studio

---

## 4. การพัฒนา Backend

### 4.1 Project Structure
```
backend/src/
├── modules/           # Feature modules
│   ├── auth/           # Authentication
│   ├── users/          # User management
│   ├── campaigns/      # Campaign data
│   ├── seo/            # SEO & GSC integration
│   ├── ai/             # AI insights
│   ├── chat/           # Chat system
│   ├── alerts/         # Alert system
│   └── integrations/   # Third-party integrations
├── common/             # Shared utilities
│   ├── decorators/     # Custom decorators
│   ├── exceptions/     # Custom exceptions
│   ├── guards/         # Auth guards
│   ├── utils/          # Utility functions
│   └── constants/      # App constants
├── config/             # Configuration
├── main.ts             # Application entry
└── app.module.ts       # Root module
```

### 4.2 การสร้าง Module ใหม่
```bash
# Generate module
nest generate module modules/new-feature
nest generate controller modules/new-feature
nest generate service modules/new-feature

# Generate DTOs
nest generate dto modules/new-feature/create-new-feature.dto
nest generate dto modules/new-feature/update-new-feature.dto
```

### 4.3 การเพิ่ม API Endpoint
```typescript
// modules/new-feature/new-feature.controller.ts
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NewFeatureService } from './new-feature.service';

@Controller('new-feature')
@UseGuards(JwtAuthGuard)
export class NewFeatureController {
  constructor(private readonly newFeatureService: NewFeatureService) {}

  @Get()
  async findAll() {
    return this.newFeatureService.findAll();
  }

  @Post()
  async create(@Body() createDto: CreateNewFeatureDto) {
    return this.newFeatureService.create(createDto);
  }
}
```

### 4.4 Database Schema
```typescript
// prisma/schema.prisma
model NewFeature {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  name      String   @map("name") @db.VarChar(255)
  data      Json?    @map("data") @db.JsonB
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId], name: "idx_new_feature_tenant")
  @@map("new_features")
}
```

### 4.5 Service Layer
```typescript
// modules/new-feature/new-feature.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewFeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.newFeature.findMany();
  }

  async create(createDto: CreateNewFeatureDto) {
    return this.prisma.newFeature.create({
      data: createDto,
    });
  }
}
```

---

## 5. การพัฒนา Frontend

### 5.1 Project Structure
```
frontend/src/
├── features/           # Feature-based architecture
│   ├── ai-insights/    # AI Assistant & Analytics
│   ├── chat/           # Chat interface
│   ├── dashboard/      # Main dashboard
│   ├── campaigns/      # Campaign management
│   ├── seo/            # SEO analytics
│   └── auth/           # Authentication
├── services/           # API services
├── hooks/              # React Query hooks
├── components/         # Shared components
│   ├── ui/             # UI components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── utils/              # Utility functions
├── types/              # TypeScript types
└── lib/                # External libraries
```

### 5.2 การสร้าง Feature ใหม่
```bash
# สร้าง folder สำหรับ feature
mkdir -p src/features/new-feature
cd src/features/new-feature

# สร้างไฟล์ต่าง ๆ
touch index.ts
touch components/new-feature.component.tsx
touch services/new-feature.service.ts
touch hooks/use-new-feature.ts
touch types/new-feature.types.ts
```

### 5.3 Component Structure
```typescript
// features/new-feature/components/new-feature.component.tsx
import React from 'react';
import { useNewFeature } from '../hooks/use-new-feature';

export function NewFeatureComponent() {
  const { data, isLoading, error } = useNewFeature();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>New Feature</h1>
      {/* Component content */}
    </div>
  );
}
```

### 5.4 API Service
```typescript
// features/new-feature/services/new-feature.service.ts
import { apiClient } from '../../../services/api-client';
import { NewFeature, CreateNewFeatureDto } from '../types/new-feature.types';

export const newFeatureService = {
  getAll: async () => {
    const response = await apiClient.get<NewFeature[]>('/new-feature');
    return response.data;
  },

  create: async (data: CreateNewFeatureDto) => {
    const response = await apiClient.post<NewFeature>('/new-feature', data);
    return response.data;
  },
};
```

### 5.5 React Query Hook
```typescript
// features/new-feature/hooks/use-new-feature.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { newFeatureService } from '../services/new-feature.service';

export function useNewFeature() {
  return useQuery({
    queryKey: ['new-feature'],
    queryFn: newFeatureService.getAll,
  });
}

export function useCreateNewFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: newFeatureService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-feature'] });
    },
  });
}
```

---

## 6. การทำงานกับ Database

### 6.1 Prisma Commands
```bash
# Generate client
npx prisma generate

# Create migration
npx prisma migrate dev --name add-new-feature

# Reset database
npx prisma migrate reset

# View database
npx prisma studio

# Deploy migrations
npx prisma migrate deploy
```

### 6.2 การเขียน Query
```typescript
// Basic query
const users = await this.prisma.user.findMany();

// With relations
const usersWithProfile = await this.prisma.user.findMany({
  include: {
    tenant: true,
  },
});

// With filtering
const activeUsers = await this.prisma.user.findMany({
  where: {
    isActive: true,
    tenantId: user.tenantId,
  },
});

// With pagination
const paginatedUsers = await this.prisma.user.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: {
    createdAt: 'desc',
  },
});
```

### 6.3 การใช้ Transactions
```typescript
await this.prisma.$transaction(async (tx) => {
  await tx.user.create({
    data: userData,
  });

  await tx.profile.create({
    data: profileData,
  });
});
```

---

## 7. การทำงานกับ Authentication

### 7.1 JWT Authentication
```typescript
// ใช้ใน controller
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@CurrentUser() user: any) {
  return this.userService.getProfile(user.id);
}

// ใช้ใน service
async getProfile(userId: string) {
  return this.prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: true },
  });
}
```

### 7.2 การ Login
```typescript
// auth.service.ts
async login(loginDto: LoginDto) {
  const user = await this.validateUser(loginDto.email, loginDto.password);
  const tokens = await this.generateTokens(user);
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: this.sanitizeUser(user),
  };
}
```

---

## 8. การทำงานกับ Third-party APIs

### 8.1 Google Ads API
```typescript
// google-ads.service.ts
import { GoogleAdsApi } from 'google-ads-api';

@Injectable()
export class GoogleAdsService {
  private client: GoogleAdsApi;

  constructor() {
    this.client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    });
  }

  async getCampaigns(customerId: string) {
    const customer = this.client.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
    });

    return customer.campaigns.list();
  }
}
```

### 8.2 Facebook Ads API
```typescript
// facebook-ads.service.ts
import axios from 'axios';

@Injectable()
export class FacebookAdsService {
  private baseUrl = 'https://graph.facebook.com/v18.0';

  async getCampaigns(adAccountId: string, accessToken: string) {
    const response = await axios.get(
      `${this.baseUrl}/${adAccountId}/campaigns`,
      {
        params: {
          access_token: accessToken,
          fields: 'name,status,objective,budget_remaining',
        },
      }
    );
    return response.data;
  }
}
```

---

## 9. การทดสอบ

### 9.1 Unit Tests (Backend)
```typescript
// tests/new-feature.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NewFeatureService } from '../new-feature.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NewFeatureService', () => {
  let service: NewFeatureService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewFeatureService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NewFeatureService>(NewFeatureService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create new feature', async () => {
    const result = await service.create(createDto);
    expect(result).toEqual(expectedResult);
  });
});
```

### 9.2 Integration Tests
```typescript
// tests/new-feature.e2e.spec.ts
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('NewFeature (e2e)', () => {
  let app;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/new-feature (GET)', () => {
    return request(app.getHttpServer())
      .get('/new-feature')
      .expect(200)
      .expect([]);
  });
});
```

### 9.3 Frontend Tests
```typescript
// components/new-feature.component.test.tsx
import { render, screen } from '@testing-library/react';
import { NewFeatureComponent } from './new-feature.component';

describe('NewFeatureComponent', () => {
  it('renders correctly', () => {
    render(<NewFeatureComponent />);
    expect(screen.getByText('New Feature')).toBeInTheDocument();
  });
});
```

---

## 10. การ Debug และ Troubleshooting

### 10.1 Backend Debug
```typescript
// ใช้ logger
import { Logger } from '@nestjs/common';

@Injectable()
export class NewFeatureService {
  private readonly logger = new Logger(NewFeatureService.name);

  async create(data: CreateNewFeatureDto) {
    this.logger.log('Creating new feature', data);
    try {
      const result = await this.prisma.newFeature.create({ data });
      this.logger.log('New feature created successfully', result.id);
      return result;
    } catch (error) {
      this.logger.error('Failed to create new feature', error);
      throw error;
    }
  }
}
```

### 10.2 Frontend Debug
```typescript
// ใช้ console.log หรือ React DevTools
export function NewFeatureComponent() {
  const { data, isLoading, error } = useNewFeature();

  console.log('Data:', data);
  console.log('Loading:', isLoading);
  console.log('Error:', error);

  if (error) {
    console.error('Component error:', error);
  }

  return <div>{/* Component content */}</div>;
}
```

---

## 11. การ Deploy

### 11.1 Environment Variables สำหรับ Production
```env
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Security
JWT_SECRET="production-secret"
JWT_REFRESH_SECRET="production-refresh-secret"
ENCRYPTION_KEY="production-encryption-key"

# Third-party APIs
GOOGLE_CLIENT_ID="production-client-id"
GOOGLE_CLIENT_SECRET="production-client-secret"
```

### 11.2 Build Commands
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### 11.3 Docker Setup
```dockerfile
# Dockerfile (Backend)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start:prod"]
```

---

## 12. Best Practices

### 12.1 Code Organization
- ใช้ feature-based architecture
- แยก business logic จาก presentation logic
- ใช้ dependency injection
- เขียน tests ครบถ้วน

### 12.2 Security
- ใช้ environment variables สำหรับ secrets
- validate input data
- ใช้ HTTPS ใน production
- implement rate limiting

### 12.3 Performance
- ใช้ database indexes
- implement caching
- ใช้ pagination
- optimize database queries

### 12.4 Error Handling
- ใช้ try-catch อย่างเหมาะสม
- log errors อย่างละเอียด
- return meaningful error messages
- implement graceful degradation

---

## 13. Git Workflow

### 13.1 Branch Strategy
```bash
# Main branches
main                    # Production
develop                 # Development
feature/feature-name    # Feature branches
hotfix/fix-name         # Hotfix branches
```

### 13.2 Commit Messages
```bash
# Format
type(scope): description

# Examples
feat(auth): add JWT refresh tokens
fix(api): resolve user creation bug
docs(readme): update installation guide
```

### 13.3 Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

---

## 14. การแก้ปัญหาที่พบบ่อย

### 14.1 Database Connection Issues
```bash
# ตรวจสอบ connection string
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Reset database
npx prisma migrate reset
```

### 14.2 Port Conflicts
```bash
# ตรวจสอบ port ที่ใช้งาน
netstat -tulpn | grep :3000

# Kill process
kill -9 <PID>

# ใช้ port อื่น
PORT=3001 npm run start:dev
```

### 14.3 Module Not Found
```bash
# Clear cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

---

## 15. Resources และ Documentation

### 15.1 Official Documentation
- [NestJS Documentation](https://docs.nestjs.com)
- [React Documentation](https://react.dev)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### 15.2 Tools ที่ใช้
- **API Testing**: Postman, Insomnia
- **Database Management**: Prisma Studio, pgAdmin
- **Code Quality**: ESLint, Prettier, SonarQube
- **Monitoring**: Sentry, New Relic
- **Documentation**: Swagger, Postman Docs

---

**เอกสารนี้คือคู่มือการพัฒนา RGA Dashboard ครอบคลุมทุกแงมมุมของการพัฒนา ตั้งแต่การติดตั้งไปจนถึงการ deploy**
