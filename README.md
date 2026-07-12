# AssetFlow – Enterprise Asset & Resource Management System

AssetFlow is a polished, production-ready full-stack Enterprise Resource Planning (ERP) platform built for enterprise-scale hardware inventory and resource lifecycle management. It combines robust business logic, role-based access control, real-time database operations, and AI-powered insights into a seamless operator experience.

---

## 🚀 Recent Enhancements

### 🎨 Coded Brand Identity (SVG & CSS Animations)
- **Modern Animated Logo** — Replaced the static text boxes with a premium, self-contained SVG logo component (`Logo.tsx`) featuring:
  - An outer rotating dashed hexagon representing system flow and diagnostics.
  - A 3D isometric core cube representing asset inventory.
  - A glowing horizontal overlay ribbon with custom CSS keyframes.
  - Integrated across the sidebar navigation, login page, and signup page.

### 📄 Publication-Quality Executive PDF Reports
- Overhauled the **AI Weekly Reports** generator into a high-fidelity, A4 corporate briefing document featuring:
  - **Vector Logo Header**: Renders the brand logo at the top right using `jsPDF` vector primitives.
  - **KPI Scorecard Grid**: A 2x2 grid of styled scorecard boxes for key metrics (Fleet Utilization, Active Deployments, Maintenance Upkeep, Room Bookings) with soft backgrounds, borders, and large bold values.
  - **Structured Data Tables**: Organizes department allocation statistics into structured tables instead of plain text bullets.
  - **Stylized Callout Boxes**: Highlights the "AI Diagnostics Summary" sections inside clean, well-padded accent boxes with left vertical borders.
  - **Status Progress Bars**: Displays the visual distribution of assets (Available, Allocated, Maintenance, Retired) using proportional colored progress bars.
  - **Recommendation Panels**: Renders recommendations inside distinct cards with colored left border indicators (Amber, Indigo, Emerald).
  - **Executive Page Formatting**: Incorporates page numbering ("Page X of Y"), thin top header lines, and a confidentiality footer.

### 🛡️ Enterprise-Grade State Validation & Bug Fixes
- **Cascading Asset Retirement**: Retiring an asset (status `RETIRED`) now triggers an automated cascading database cleanup to prevent database inconsistencies:
  - Rejects/cancels all future pending or approved bookings for the retired asset.
  - Rejects any pending custodian transfer requests involving the asset.
  - Automatically closes and resolves any open maintenance tickets for the asset.
- **Transfer Approval Safeguards**:
  - Prevents approving custodian transfers for retired assets.
  - Automatically preserves the `MAINTENANCE` status of assets currently in repair (updates custodian details without forcing the status back to `ALLOCATED`).
- **Resurrection Prevention**:
  - Prevents resolving maintenance tickets from resurrecting retired assets back to `ALLOCATED` or `AVAILABLE` status.

---

## Features

### Core ERP Modules
1. **SaaS Operations Dashboard** — Glassmorphic KPI cards, Recharts status pie charts, area trend graphs, active bookings, and recent activity logs. Includes an **AI Operational Summary** card that auto-generates an executive briefing from live database metrics.
2. **Role-Based Access Control (RBAC)** — JWT sessions stored in secure HTTP-only cookies, enforced by Next.js routing middleware, with separate views and permissions for **Admins**, **Managers**, and **Employees**.
3. **Assets Catalog** — Full grid with search, category filter, and status filter. Side drawers show historical timeline, QR labels, maintenance logs, and quick edit/retire controls.
4. **Allocations & Return Logistics** — Issue hardware to custodians with double-allocation prevention. Accept return check-ins and transfer requests.
5. **Conflict-Free Resource Bookings** — Reserve shared spaces (Boardrooms, AV suites, labs) with automatic overlap conflict detection executed at the database level before confirmation.
6. **Maintenance Kanban** — Track repair tickets across Pending → Approved → In Progress → Resolved stages. Transitioning locks the underlying asset to `MAINTENANCE` status automatically.
7. **Analytics & Reports** — Department allocation breakdowns, utilization rates, cost tracking, and booking frequency charts.
8. **Notifications Center** — System-generated alerts for allocation changes, maintenance updates, and booking approvals with real-time unread badge counts.

### AI & Intelligence Features
9. **AI Asset Copilot** — A floating chat assistant accessible from every page. Answers natural-language questions using live Prisma queries (e.g. *"Which laptops are in HR?", "Who holds AST-0005?", "Show overdue assets"*). Works without an API key via a built-in regex NLP fallback engine.
10. **AI Dashboard Summary** — Generates an executive operational briefing with recommended action items directly on the dashboard. Supports manual refresh and shows generation timestamp.
11. **AI Weekly Reports** — Generates a comprehensive weekly executive summary report containing detailed paragraphs for Operations, Maintenance, Bookings, Assets, and strategic recommendations, formatted into a publication-quality multi-page A4 PDF report with one click.

### Utility Features
12. **High-Fidelity PDF Labels** — Generates printable asset tag labels in PDF format (`80mm x 50mm`) with details (Tag ID, Asset Name, Category, Serial, Cost, Purchase Date) and a scan-ready QR code that routes directly back to the check-in view.
13. **QR Code Scanner** (`/scan`) — Webcam-based barcode scanner using `html5-qrcode`. Includes a **Judge Simulation Deck** with preset scan buttons for instant demos. Scanning loads a full asset detail card with quick action controls (Return, Allocate, Log Issue).
14. **Command Palette** — `Ctrl+K` global search overlay for instant navigation to any asset, page, or action.
15. **Guided Demo Mode** — Press the green **Run Demo** button in the topbar to start a fully automated 11-step walkthrough of every major workflow. Controls include Play/Pause, Skip, Speed (1x/2x), and Restart. Ends with a confetti celebration.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, TypeScript) |
| **Styling** | Tailwind CSS v4 |
| **Database** | SQLite / PostgreSQL (via Prisma Adapter) |
| **ORM** | Prisma 7 |
| **Auth** | Custom JWT with HTTP-only cookies |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **AI** | Google Gemini API (optional) with regex NLP fallback |
| **QR Scanning** | `html5-qrcode` |
| **Confetti** | `canvas-confetti` |

---

## Getting Started

### 1. Install dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Set up environment variables
Create or edit the `.env` file in the root directory:
```env
DATABASE_URL="postgresql://neondb_owner:npg_d5gV4Anchvry@ep-bold-base-atlme0zr.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Optional: Enables Gemini-powered AI responses
# Get your key at: https://aistudio.google.com/apikey
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
```
> ⚠️ The AI Copilot and Dashboard Summary work **without** a Gemini key using the built-in NLP fallback. Adding a key upgrades responses to conversational Gemini-powered summaries.

### 3. Push database schema
```bash
npx prisma db push
```

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. Seed the database
```bash
npx tsx prisma/seed.ts
```

### 6. Start the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Folder Structure

```
├── prisma/
│   ├── schema.prisma        # Relational schema
│   └── seed.ts              # Demo data seeder
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/          # AI Copilot & Dashboard Summary routes
│   │   │   ├── assets/      # Asset CRUD + detail endpoints
│   │   │   ├── allocation/  # Issue, return, transfer endpoints
│   │   │   ├── bookings/    # Booking CRUD + approve/reject
│   │   │   ├── maintenance/ # Ticket lifecycle endpoints
│   │   │   ├── reports/     # Analytics data aggregation
│   │   │   ├── notifications/
│   │   │   ├── users/
│   │   │   ├── categories/
│   │   │   ├── departments/
│   │   │   └── auth/        # Login, logout, signup, session
│   │   ├── allocation/      # Allocations & Transfers page
│   │   ├── assets/          # Asset catalog page
│   │   ├── booking/         # Resource booking page
│   │   ├── dashboard/       # Main operations dashboard
│   │   ├── login/           # Auth login screen
│   │   ├── maintenance/     # Maintenance Kanban board
│   │   ├── notifications/   # Alerts center
│   │   ├── reports/         # Analytics & charts
│   │   ├── scan/            # QR Code Scanner page
│   │   └── signup/          # Employee registration
│   ├── components/
│   │   ├── Logo.tsx         # Animated premium SVG brand logo
│   │   ├── AiCopilot.tsx    # Floating AI chat assistant widget
│   │   ├── ClientLayout.tsx # Root layout scaffolding
│   │   ├── CommandPalette.tsx
│   │   ├── DemoController.tsx # Demo Mode HUD overlay
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── context/
│   │   ├── AppContext.tsx   # Auth, theme, notifications, toasts
│   │   └── DemoContext.tsx  # Demo Mode automation state
│   ├── lib/
│   │   ├── auth.ts          # JWT signing & verification
│   │   └── prisma.ts        # Prisma client with PostgreSQL adapter
│   └── middleware.ts        # Route protection proxy
└── package.json
```

---

## Demo Credentials

Use these accounts to log in and explore all role-based workflows:

| Role | Email | Password | Name |
|---|---|---|---|
| **Admin** | `admin@assetflow.com` | `admin123` | Priya Sharma |
| **Manager** | `manager@assetflow.com` | `manager123` | Rajesh Kumar |
| **Employee** | `employee@assetflow.com` | `employee123` | Amit Patel |

> **Quick Tip**: Use the **Quick Login** buttons on the login page for instant role switching during demos.

---

## Demo Mode

Click the green **▶ Run Demo** button in the top navigation bar to start the automated 11-step walkthrough:

1. Admin Login
2. Dashboard Inspection (AI Summary)
3. Register Asset `AST-DEMO` (₹85,000)
4. View Asset Details & QR Label
5. Allocate to Employee (status → `ALLOCATED`)
6. Block Duplicate Allocation (validation error)
7. Book Boardroom Alpha (tomorrow 14:00–16:00)
8. Block Overlapping Booking (conflict check)
9. Approve & Schedule Maintenance (status → `MAINTENANCE`)
10. Resolve Maintenance (status → `AVAILABLE`)
11. 🎉 Confetti Celebration!

Speed controls: **1x** (5 second steps) / **2x** (2.5 second steps)

---

## QR Code Scanner

Navigate to `/scan` in the sidebar. Two modes are available:

- **Camera Mode**: Click "Start Camera" to use your webcam or mobile camera to scan physical QR labels.
- **Simulation Mode**: Use the preset buttons (e.g. `AST-0001`, `AST-0004`) to simulate a scan instantly — great for screen-share demos.
