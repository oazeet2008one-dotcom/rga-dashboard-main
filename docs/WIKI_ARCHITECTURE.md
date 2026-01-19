# สถาปัตยกรรมและข้อตกลง (Wiki)

## 1. รายละเอียด Tech Stack

| Layer | Technology | Version | หมายเหตุ |
| :--- | :--- | :--- | :--- |
| **Frontend** | React | 18.x | Functional Components + Hooks |
| | Vite | 7.x | Build Tool & Dev Server |
| | TypeScript | 5.x | เปิดใช้ Strict Mode |
| | TailwindCSS | 4.x | Utility-first styling |
| | Zustand | 5.x | Global State Management |
| **Backend** | NestJS | 10.x | Modular Architecture |
| | Node.js | >=18 | Runtime Environment |
| | Prisma | 5.7 | ORM & Schema Management |
| | PostgreSQL | 14+ | Relational Database |
| **Infra** | Docker | Compose | Local Development DB |

## 2. ข้อตกลงการเขียนโค้ด (Conventions)

### การตั้งชื่อ (Naming Conventions)
*   **ตัวแปร/ฟังก์ชัน:** `camelCase` (เช่น `getUserProfile`, `isActive`)
*   **ไฟล์:** `kebab-case` (เช่น `user.controller.ts`, `campaign-card.tsx`)
*   **ตารางในฐานข้อมูล:** `snake_case` (เช่น `ad_groups`, `campaign_status` - *Mapped in Prisma*)
*   **คลาส/Interfaces:** `PascalCase` (เช่น `CreateUserDto`, `ICampaign`)
*   **React Components:** `PascalCase` (เช่น `UserProfile.tsx`)

### Git Flow & Branching
**รูปแบบชื่อ Branch:** `type/description-slug`
*   `feat/add-campaign-wizard`: ฟีเจอร์ใหม่
*   `fix/login-error-500`: แก้ไขบั๊ก
*   `refactor/auth-guard`: ปรับปรุงโครงสร้างโค้ดโดยไม่เปลี่ยน logic
*   `docs/update-readme`: อัปเดตเอกสาร

### โครงสร้างโฟลเดอร์ (Folder Structure)

#### Frontend (`/frontend/src/`)
*   `features/`: **[แนะนำ]** Logic แยกตาม Domain (เช่น `auth/`, `campaigns/`, `dashboard/`) ประกอบด้วย `components`, `hooks`, `services` ที่เกี่ยวข้อง
*   `components/`: UI components ที่ใช้ร่วมกัน (Buttons, Inputs, Layouts)
*   `stores/`: การนิยาม Global state (Zustand)
*   `lib/`: ฟังก์ชัน Utility และ Helper ต่างๆ
*   `types/`: การนิยาม Type ที่ใช้ทั้งระบบ

#### Backend (`/backend/src/`)
*   `modules/`: **[Core]** โมดูลหลักตามฟีเจอร์ (เช่น `AuthModule`, `CampaignsModule`)
    *   `dto/`: Data Transfer Objects (Validation)
    *   `entities/`: Domain entities
    *   `*.controller.ts`: API Endpoints
    *   `*.service.ts`: Business Logic
*   `common/`: Shared decorators, guards, filters, และ interceptors
*   `config/`: Namespace ของการตั้งค่า (Env validation)
*   `prisma/`: Database schema และ seeds (อยู่ที่ root ของ `backend`)
