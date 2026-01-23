# RGA Dashboard (เอกสารส่งมอบงาน)

## 1. บทนำ (Introduction)
**RGA Dashboard** คือแพลตฟอร์มศูนย์กลางข้อมูลการตลาดที่ออกแบบมาเพื่อรวบรวม จัดการ และวิเคราะห์ประสิทธิภาพการโฆษณาจากหลายช่องทาง (Google, Facebook, TikTok, Line) โดยทำหน้าที่เป็นแหล่งข้อมูลเดียว (Single Source of Truth) สำหรับแคมเปญการตลาด กลุ่มโฆษณา และตัวชี้วัดประสิทธิภาพ

**ฟีเจอร์หลัก:**
*   **สถาปัตยกรรม Multi-Tenant:** รองรับหลายองค์กร/ลูกค้า โดยมีการแยกข้อมูลออกจากกันอย่างชัดเจน
*   **ระบบยืนยันตัวตนแบบรวมศูนย์ (Unified Authentication):** การเข้าสู่ระบบที่ปลอดภัยด้วย Role-Based Access Control (RBAC)
*   **การจัดการแคมเปญ:** ระบบ CRUD สำหรับจัดการแคมเปญและกลุ่มโฆษณา
*   **การเชื่อมต่อข้อมูล:** ตัวเชื่อมต่อสำหรับแพลตฟอร์มโฆษณาหลัก (เตรียมโครงสร้างไว้/Draft)

## 2. คู่มือการติดตั้ง (สำหรับนักพัฒนาใหม่)

### สิ่งที่ต้องเตรียม (Prerequisites)
*   **Node.js:** v18+ (แนะนำ LTS)
*   **Docker:** สำหรับฐานข้อมูล PostgreSQL
*   **pnpm:** โปรแกรมจัดการแพ็คเกจที่แนะนำ (`npm install -g pnpm`)

### เริ่มต้นใช้งาน (Quick Start)

รันเซิฟเวอร์   
ฺBackend
    ```bash
    cd backend
    npm run start:dev
    ``` 

รันแอพพลิเคชัน
Frontend
    ```bash
    cd frontend
    npm run dev
    ```

#### A. การติดตั้งฐานข้อมูล (Database)
1.  ไปที่โฟลเดอร์ root และเริ่มระบบ infrastructure:
    ```bash
    docker-compose up -d
    ```
2.  ไปที่โฟลเดอร์ `backend/` และตั้งค่า Prisma:
    ```bash
    cd backend
    cp .env.example .env
    npx prisma generate
    แบนห้ามใช้ npx prisma migrate dev (หรือใช้ npx prisma migrate dev --name init)
    npm run seed # (ทางเลือก: สร้างข้อมูลจำลองสำหรับทดสอบ)
    ```

#### B. การติดตั้ง Backend (NestJS)
1.  ติดตั้ง dependencies:
    ```bash
    cd backend
npm install
    ```
2.  รันเซิร์ฟเวอร์สำหรับการพัฒนา (Dev Server):
    ```bash
    npm start:dev
    # เซิร์ฟเวอร์จะรันที่ http://localhost:3000
    # เอกสาร Swagger: http://localhost:3000/api
    ```

#### C. การติดตั้ง Frontend (React + Vite)
1.  ติดตั้ง dependencies:
    ```bash
    cd frontend
    pnpm install
    ```
2.  รันเซิร์ฟเวอร์สำหรับการพัฒนา (Dev Server):
    ```bash
    pnpm dev
    # แอพพลิเคชันจะรันที่ http://localhost:5173
    ```

## 3. ภาพรวมสถาปัตยกรรม (Architecture Overview)

### แผนภาพระดับสูง (High-Level Diagram)
```mermaid
graph TD
    Client[Client Browser (React)] <-->|REST API| API[Backend API (NestJS)]
    API <-->|Prisma ORM| DB[(PostgreSQL)]
    API <-->|Axios| AdPlatforms[External APIs (Google, FB, TikTok)]
```

### องค์ประกอบ (Components)
1.  **Frontend (`/frontend`)**:
    *   **Framework:** React 18 + Vite
    *   **Styling:** TailwindCSS + Shadcn UI
    *   **State:** Zustand + TanStack Query
    *   **Routing:** Wouter

2.  **Backend (`/backend`)**:
    *   **Framework:** NestJS
    *   **Persistence:** Prisma ORM
    *   **Validation:** class-validator & class-transformer

3.  **Database (`/backend/prisma/schema.prisma`)**:
    *   **Engine:** PostgreSQL
    *   **Management:** Prisma Migrate
