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

### Registration & Onboarding
- **New organization sign-up** with company name and slug
- **Join existing org** via invite code
- **Plan limit enforcement** during registration

### Team & Settings
- **Team member management** with role assignment (PATCH) and removal (DELETE)
- **Plan limits** (max users/projects per tier)
- **Organization settings** (owner/admin only) with name updates

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
npm run db:start        # start PostgreSQL via Docker (see below)
npm run dev              # starts on http://localhost:3000
```

### PostgreSQL via Docker

```bash
npm run db:start       # Pull + run PostgreSQL 16 container (port 5432)
npm run db:stop        # Stop and remove the container
npm run dev:db         # db:start + dev (one-shot)
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

### 147 Vitest Tests (15 files)

#### API Integration Tests — 85 tests
Mocked `@/lib/db` — no database required.

| Module | Tests | Coverage |
|--------|-------|----------|
| Auth (login, me) | 10 | 85% |
| Register (new org + invite code) | 11 | 94% |
| Projects (CRUD + RBAC) | 17 | 95% |
| Tasks (CRUD + dependencies) | 16 | 95% |
| Members (tenant scoping) | 2 | — |
| Team (CRUD + plan limits) | 8 | 83% |
| Team-info (GET/PUT + RBAC) | 7 | 85% |
| Team-member (PATCH/DELETE + RBAC) | 14 | 89% |

#### Component Tests — 62 tests
Rendered in jsdom with mocked `next/navigation`.

| Component | Tests | What's tested |
|-----------|-------|---------------|
| AuthContext | 9 | Login flow, register, permission helpers, error handling |
| Sidebar | 13 | Navigation items, collapse toggle, plan/role badges, role filtering |
| LoginPage | 9 | Form rendering, validation, loading states, error display |
| RegisterPage | 9 | New org / join tabs, form validation, loading states |
| DashboardPage | 3 | Stats cards, welcome message, New Project button |
| ProjectDetailPage | 6 | Project info, stat cards, task tabs, Gantt tab |
| ProjectsPage | 8 | Project list, search, status filter, progress |

Full coverage report across all `src/`:
```
Statements: 40.27%   Branches: 39.73%   Functions: 29.53%   Lines: 41.84%
```

| Area | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| **API routes** | 83–95% | 82–100% | 100% | 82–95% |
| **Login page** | 100% | 83% | 100% | 100% |
| **Register page** | 96% | 81% | 89% | 96% |
| **Dashboard** | 93% | 78% | 100% | 93% |
| **Projects page** | 89% | 54% | 75% | 89% |
| **Project detail** | 47% | 51% | 38% | 50% |
| **Sidebar** | 100% | 92% | 100% | 100% |
| **Auth context** | 98% | 82% | 100% | 98% |

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
│   │   └── team/              # Team CRUD, info, member mgmt
│   ├── login/                 # Login page
│   ├── register/              # Registration page (new org + invite)
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
└── __tests__/                 # Test files + mocks (15 files, 147 tests)
    ├── setup.ts               # DB mock + seed data
    ├── component-setup.ts     # jsdom setup + Next.js mocks
    ├── helpers.ts             # Test request builders
    ├── auth.test.ts           # Login/me/logout API (10 tests)
    ├── register.test.ts       # Register API (11 tests)
    ├── projects.test.ts       # Projects CRUD + RBAC (17 tests)
    ├── tasks.test.ts          # Tasks CRUD + dependencies (16 tests)
    ├── members.test.ts        # Member list API (2 tests)
    ├── team.test.ts           # Team CRUD + plan limits (8 tests)
    ├── team-info.test.ts      # Team info GET/PUT (7 tests)
    ├── team-member.test.ts    # Team member PATCH/DELETE (14 tests)
    ├── auth-context.test.tsx  # Auth context component (9 tests)
    ├── sidebar.test.tsx       # Sidebar component (13 tests)
    ├── login.test.tsx         # Login page component (9 tests)
    ├── register-page.test.tsx # Register page component (9 tests)
    ├── dashboard.test.tsx     # Dashboard component (3 tests)
    ├── project-detail.test.tsx# Project detail component (6 tests)
    └── projects-page.test.tsx # Projects list component (8 tests)
e2e/
└── app.spec.ts                # Playwright E2E tests
```

---

## Architecture

### Route Groups
- `(app)/` — Protected routes (auth check in layout redirects to `/login`)
- `login/` — Public login page
- `register/` — Public registration page (new org or join via invite code)

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
| POST | `/api/auth/register` | No | Create account (new org or join via invite) |
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
| GET | `/api/team/info` | Yes | Tenant info (name, plan) |
| PUT | `/api/team/info` | Yes | Update tenant info (owner only) |
| PATCH | `/api/team/[id]` | Yes | Update member role (admin+) |
| DELETE | `/api/team/[id]` | Yes | Remove member (admin+) |

---

## SonarQube

Quality analysis is configured at `sonar-project.properties`:

```bash
npx sonarqube-scanner
```

Results are sent to `http://192.168.11.200:9002/dashboard?id=opencodetest`.
