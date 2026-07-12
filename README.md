# AssetFlow – Enterprise Asset & Resource Management System

AssetFlow is a polished, production-ready full-stack Enterprise Resource Planning (ERP) platform built from the ground up for the hackathon. It manages hardware inventories, physical resources, and allocation logistics with robust business logic, role-based workflows, and real-time database CRUD operations.

---

## Key Features

1. **Sleek SaaS Dashboard**: Includes glassmorphic operational KPI summaries, Recharts status pie charts, upkeep cost area trends, active resource reservation lists, and recent activity logs.
2. **Role-Based Access Control (RBAC)**: Custom JWT session management in secure HTTP-only cookies, intercepted by routing middleware, separating views for **Admins**, **Managers**, and **Employees**.
3. **Assets Catalog & QR Generation**: Full grid search, filter, and sorting features with side drawers displaying asset details, historical timelines, and client-side QR labels ready to print.
4. **Allocations & Return Logistics**: Assign available hardware assets to custodians (preventing double allocations) and accept return check-ins.
5. **Conflict-Free Bookings**: Book shared resources (like Conference Rooms or AV suites) with automatic overlap conflict checks executed in SQLite before reservation confirmation.
6. **Maintenance Kanban**: Move repair tickets from Pending ➡ Approved ➡ In Progress ➡ Resolved. Transitioning tickets changes the underlying asset status to `MAINTENANCE` and locks it.
7. **Detailed Analytics**: Reports center aggregating utilization rates, department allocations, and resource reservation frequency.
8. **Quick-Login Console**: Special role buttons on the login screen to allow quick navigation during evaluations.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router, Tailwind CSS v4, TypeScript)
- **Backend APIs**: Next.js API Routes (Server runtime)
- **Database**: SQLite
- **ORM**: Prisma 7 (using `@prisma/adapter-better-sqlite3` driver adapter)
- **Visuals & Charts**: Recharts, Lucide Icons, and custom CSS glassmorphic templates

---

## Installation & Running

Follow these steps to run the application locally:

1. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Run database migrations and push schema**:
   ```bash
   npx prisma db push
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Seed database with mock data**:
   ```bash
   npx tsx prisma/seed.ts
   ```

5. **Start the local dev server**:
   ```bash
   npm run dev
   ```

---

## Folder Structure

```
├── prisma/
│   ├── dev.db               # SQLite database file (gitignored)
│   ├── schema.prisma        # Relational schema definition
│   └── seed.ts              # Seed script populating records
├── src/
│   ├── app/
│   │   ├── api/             # API routes (Auth, Assets, Bookings, Maintenance, Stats, Reports)
│   │   ├── allocation/      # Allocations page view
│   │   ├── assets/          # Assets catalog page view
│   │   ├── booking/         # Resource booking page view
│   │   ├── dashboard/       # Operations dashboard
│   │   ├── login/           # Auth login screen
│   │   ├── maintenance/     # Maintenance Kanban hub
│   │   ├── notifications/   # System alerts logger
│   │   ├── reports/         # Analytics graphs
│   │   └── signup/          # Employee registration
│   ├── components/          # Scaffolds (Sidebar, Topbar, ClientLayout, CommandPalette)
│   ├── context/             # Global AppContext (Auth, notifications, theme, toasts)
│   ├── lib/                 # Utilities (Prisma Client, JWT auth signatures)
│   └── middleware.ts        # Routing protection middleware
└── package.json
```

---

## Seed Credentials (For Evaluation)

Seeded accounts have the password: **`123`** appended to their role name (e.g. `admin123`).

| **Admin** | `admin@assetflow.com` | `admin123` | Priya Sharma |
| **Manager** | `manager@assetflow.com` | `manager123` | Rajesh Kumar |
| **Employee** | `employee@assetflow.com` | `employee123` | Amit Patel |
