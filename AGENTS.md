<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

Next.js 16 has breaking changes. Read relevant docs in `node_modules/next/dist/docs/` before writing code.
<!-- END:nextjs-agent-rules -->

# ProjectFlow - Multi-tenant Project Management Portal

## Stack
- **Next.js 16.2.5** with App Router
- **shadcn/ui** (uses Base UI, NOT Radix) + Tailwind v4
- **JSON file database** at `data/db.json`

## Critical UI Component Quirks

### shadcn/ui uses Base UI (not Radix)
This is different from most shadcn setups. Key differences:
- `DropdownMenuTrigger` does NOT support `asChild` prop - render child directly
- `Select` `onValueChange` returns `string | null`, NOT `string`
- Always use: `onValueChange={(value) => handler(value || '')}` or cast with `as Type`

### Button nesting
Never nest `<Button>` inside `<DropdownMenuTrigger>` - causes hydration errors. Use:
```tsx
<DropdownMenuTrigger>
  <Button variant="ghost" ...>...</Button>
</DropdownMenuTrigger>
```

## Next.js 16 Patterns

### Async Params
Route params are now Promises - must unwrap:
```tsx
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // or: const { id } = await params;
}
```

## Database
- Location: `data/db.json`
- **Delete this file when schema changes** - it won't regenerate with new structure
- Use `npm run dev` to regenerate on first request

## Project Architecture

### Route Groups
- `(app)/` - Protected routes (require auth)
- `login/` and `register/` - Public auth pages
- Auth check in `(app)/layout.tsx` redirects to `/login`

### Authentication
- Session stored in HTTP-only cookie named `session`
- JWT tokens with 7-day expiry
- Auth context at `src/contexts/auth-context.tsx`

### Role-Based Access Control
| Role | Permissions |
|------|-------------|
| owner | Full access + organization settings |
| admin | Manage team, projects, tasks |
| manager | Manage projects, tasks |
| member | View/edit assigned tasks |

### Permission Helpers (from useAuth)
```tsx
canManageUsers()    // owner, admin
canManageProjects() // owner, admin, manager
canEditTasks()      // all roles
canDeleteProject() // owner, admin
canManageSettings() // owner, admin
```

## Commands
```bash
npm run dev    # Start development server
npm run build  # Production build (runs typecheck)
npm run lint   # ESLint
```

## Demo Accounts
```
admin@demo.com / admin123    (Owner)
manager@demo.com / manager123 (Manager)
member@demo.com / member123  (Member)
```

## Key Files
- `src/lib/db.ts` - Database utilities, auth helpers, permission functions
- `src/types/index.ts` - All TypeScript interfaces
- `src/contexts/auth-context.tsx` - Auth state and permission helpers
- `src/components/sidebar.tsx` - Navigation with role-based menu items
