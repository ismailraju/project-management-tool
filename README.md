# ProjectFlow — Multi-tenant Project Management Portal

A full-featured project management application built with **Next.js 16**, **shadcn/ui** (Base UI), and **PostgreSQL**. Features role-based access control, a Gantt chart with drag-to-reschedule and dependency arrows, and comprehensive test coverage.

---

## Features

### Core
- **Multi-tenant architecture** — each organization gets isolated data
- **Role-based access** — Owner, Admin, Manager, Member with granular permissions
- **JWT session auth** — HTTP-only cookies, 7-day expiry

### Project Management
- **CRUD projects** with status tracking, progress bars, and color labels
- **Kanban-style task boards** — drag tasks through To Do → In Progress → Review → Done
- **Gantt chart** with:
  - Zoom slider (50%–300%)
  - Employee filter + group-by-employee toggle
  - Drag bars left/right to reschedule
  - SVG dependency arrows between linked tasks
  - Dependency violation detection (red pulse + dashed arrow)
  - Click-to-edit dialog for dates, status, priority, assignee, dependencies
  - Tooltip on hover with full task summary
  - Drag-to-pan horizontal scrolling

### Team & Settings
- **Team member management** with invite-style creation
- **Plan limits** (max users/projects per tier)
- **Organization settings** (owner/admin only)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | shadcn/ui (Base UI, NOT Radix) + Tailwind CSS v4 |
| Database | PostgreSQL via `pg` (JSON file at `data/db.json` for dev) |
| Auth | JWT (HMAC-SHA256) stored in HTTP-only cookies |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL running on `localhost:5432`

### Installation

```bash
npm install
cp .env.example .env    # configure DATABASE_URL and JWT_SECRET
npm run dev              # starts on http://localhost:3000
```

On first request, the DB schema and seed data are auto-created. **Delete `data/db.json` if you change the schema** — it won't regenerate automatically.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Owner | `admin@demo.com` | `admin123` |
| Manager | `manager@demo.com` | `manager123` |
| Member | `member@demo.com` | `member123` |

---

## Test Coverage

### 96 Vitest Tests (11 files)

#### API Integration Tests — 56 tests
Mocked `@/lib/db` — no database required.

| Module | Tests | Coverage |
|--------|-------|----------|
| Auth (login, me, logout) | 9 | 85% |
| Projects (CRUD + RBAC) | 18 | 95% |
| Tasks (CRUD + dependencies) | 18 | 95% |
| Members (tenant scoping) | 2 | — |
| Team (CRUD + plan limits) | 7 | 83% |

#### Component Tests — 40 tests
Rendered in jsdom with mocked `next/navigation`.

| Component | Tests | What's tested |
|-----------|-------|---------------|
| AuthContext | 6 | Login flow, permission helpers, role checks |
| Sidebar | 8 | Navigation items, user info, plan/role badges |
| LoginPage | 9 | Form rendering, validation, loading states |  
| DashboardPage | 4 | Stats cards, welcome message, New Project button |
| ProjectDetailPage | 6 | Project info, stat cards, task tabs, Gantt tab |
| ProjectsPage | 7 | Project list, search, status filter, progress |

Full coverage report across all `src/`:
```
Statements: 28.86%   Branches: 29.04%   Functions: 23%   Lines: 29.84%
```

| Area | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| **API routes** | 85–95% | 82–97% | 100% | 85–95% |
| **Login page** | 100% | 83% | 100% | 100% |
| **Dashboard** | 93% | 78% | 100% | 93% |
| **Projects page** | 76% | 47% | 60% | 78% |
| **Project detail** | 47% | 51% | 38% | 50% |
| **Sidebar** | 89% | 83% | 67% | 88% |
| **Auth context** | 76% | 64% | 83% | 73% |

### 12 E2E Tests (Playwright)
Full browser tests covering login, dashboard, project CRUD, and Gantt tab. Requires dev server running on port 3000.

### Commands
```bash
npm test              # Run all unit/integration tests
npm run test:watch    # Watch mode
npm run test:e2e      # Playwright E2E tests (start dev server first)
npm run test:e2e:ui   # Playwright UI mode
npm test -- --coverage # Report coverage
```

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                 # Protected routes (require auth)
│   │   ├── page.tsx           # Dashboard
│   │   ├── projects/          # Project list, detail, create
│   │   ├── tasks/             # Task list
│   │   ├── members/           # Team member directory
│   │   ├── team/              # Team management (admin+)
│   │   ├── settings/          # Organization settings
│   │   └── layout.tsx         # Auth guard + sidebar wrapper
│   ├── api/                   # REST API routes
│   │   ├── auth/              # login, logout, me, register
│   │   ├── projects/          # CRUD with RBAC
│   │   ├── tasks/             # CRUD with dependency support
│   │   ├── members/           # Tenant-scoped member list
│   │   └── team/              # Team CRUD with plan limits
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Tailwind v4 styles
├── components/
│   ├── gantt-chart.tsx        # Full Gantt chart (881 lines)
│   ├── sidebar.tsx            # Role-filtered navigation
│   ├── app-layout.tsx         # Public/auth routing shell
│   └── ui/                    # shadcn/ui primitives (Base UI)
├── contexts/
│   └── auth-context.tsx       # Auth state + permission helpers
├── lib/
│   ├── db.ts                  # Postgres pool, schema, CRUD
│   └── utils.ts               # cn() helper
├── types/
│   └── index.ts               # All TypeScript interfaces
└── __tests__/                 # Test files + mocks
    ├── setup.ts               # DB mock + seed data
    ├── component-setup.ts     # jsdom setup + Next.js mocks
    ├── helpers.ts             # Test request builders
    ├── *.test.ts              # API integration tests
    └── *.test.tsx             # Component tests
e2e/
└── app.spec.ts                # Playwright E2E tests
```

---

## Architecture

### Route Groups
- `(app)/` — Protected routes (auth check in layout redirects to `/login`)
- `login/` and `register/` — Public pages

### Authentication
- Session stored in HTTP-only cookie named `session`
- JWT tokens with HMAC-SHA256, 7-day expiry
- Auto-redirect to `/login` if no valid session

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| Owner | Full access + organization settings |
| Admin | Manage team, projects, tasks |
| Manager | Manage projects, tasks |
| Member | View/edit assigned tasks |

**Permission helpers** (from `useAuth()`):
```ts
canManageUsers()    // owner, admin
canManageProjects() // owner, admin, manager
canEditTasks()      // all roles
canDeleteProject()  // owner, admin
canManageSettings() // owner, admin
```

### Database
- PostgreSQL with schema auto-created via `CREATE TABLE IF NOT EXISTS`
- Migrations run on every query (hot-reload safe)
- Seed data creates demo accounts, 2 projects, and 2 tasks with dependency chain

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login, returns session cookie |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/logout` | Yes | Clear session |
| GET | `/api/auth/me` | Yes | Current user info |
| GET | `/api/projects` | Yes | List projects |
| POST | `/api/projects` | Yes | Create project (manager+) |
| GET | `/api/projects/[id]` | Yes | Get project |
| PUT | `/api/projects/[id]` | Yes | Update project (manager+) |
| DELETE | `/api/projects/[id]` | Yes | Delete project (owner/admin) |
| GET | `/api/tasks` | Yes | List tasks (optional `?projectId=` filter) |
| POST | `/api/tasks` | Yes | Create task |
| GET | `/api/tasks/[id]` | Yes | Get task |
| PUT | `/api/tasks/[id]` | Yes | Update task |
| DELETE | `/api/tasks/[id]` | Yes | Delete task |
| GET | `/api/members` | Yes | Active team members |
| GET | `/api/team` | Yes | List team (admin+) |
| POST | `/api/team` | Yes | Invite member (admin+) |
| GET/PUT/DELETE | `/api/team/[id]` | Yes | Manage member |
| GET | `/api/team/info` | Yes | Tenant info |

---

## SonarQube

Quality analysis is configured at `sonar-project.properties`:

```bash
npx sonarqube-scanner
```

Results are sent to `http://192.168.11.200:9002/dashboard?id=opencodetest`.
