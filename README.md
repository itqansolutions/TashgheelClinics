# Tashgheel Clinics — Clinic Management System

Cosmetic Center CRM + Booking + Medical Tracking.

## Stack
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + Zustand + React Query
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: Microsoft SQL Server

## Project Structure

```
clinic-system/
├── clinic-api/          # Node.js Express API
│   ├── src/
│   │   ├── config/      # env, db (Prisma client)
│   │   ├── middleware/  # auth, rbac, validate, errorHandler
│   │   ├── modules/     # auth, patients, doctors, ...
│   │   ├── prisma/      # schema.prisma, seed.ts
│   │   ├── utils/       # jwt, pagination, response, patientCode
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── clinic-web/          # React Vite SPA
    ├── src/
    │   ├── api/         # axios client + per-module API calls
    │   ├── components/  # layout (Sidebar, Topbar, AppLayout) + ui primitives
    │   ├── hooks/       # useAuth, usePatients, ...
    │   ├── pages/       # Auth, Dashboard, Patients, Doctors, ...
    │   ├── routes/      # AppRouter, ProtectedRoute
    │   ├── store/       # authStore (Zustand)
    │   ├── types/       # shared TypeScript interfaces
    │   └── utils/       # format helpers
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

## Setup

### Prerequisites
- Node.js 18+
- Microsoft SQL Server (local or Azure)
- npm or yarn

### 1. Backend

```bash
cd clinic-api

# Install dependencies
npm install

# Copy environment file and fill in values
cp .env.example .env

# Generate Prisma client
npx prisma generate --schema=src/prisma/schema.prisma

# Run migrations (creates all tables)
npx prisma migrate dev --schema=src/prisma/schema.prisma --name init

# Seed database (body areas, countries, lead sources, admin user)
npm run prisma:seed

# Start dev server
npm run dev
# → http://localhost:4000
# → Health check: http://localhost:4000/health
```

### 2. Frontend

```bash
cd clinic-web

# Install dependencies
npm install

# Start dev server (proxies /api to localhost:4000)
npm run dev
# → http://localhost:5173
```

### Default Admin Login
- **Email**: admin@clinic.com
- **Password**: Admin@123
- ⚠️ Change the password immediately after first login.

## Sprint Status

| Sprint | Status | Description |
|--------|--------|-------------|
| Sprint 0 | ✅ Done | Foundation & Setup |
| Sprint 1 | 🔜 Next | Auth & Core Backend |
| Sprint 2 | ⏳ | Core Frontend |
| Sprint 3 | ⏳ | Patient Profile |
| Sprint 4 | ⏳ | Appointments & Calendar |
| Sprint 5 | ⏳ | Public Booking & Advanced |
| Sprint 6 | ⏳ | Reports & Analytics |
| Sprint 7 | ⏳ | Polish & Deployment |
