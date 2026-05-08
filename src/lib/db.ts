import crypto from 'crypto';
import { Pool } from 'pg';
import { User, Tenant, Session, Project, Task } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'projectflow-secret-key-2026';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

const globalForPool = globalThis as unknown as { pool: Pool | undefined; dbInitialized: boolean | undefined };

function getPool(): Pool {
  if (!globalForPool.pool) {
    globalForPool.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return globalForPool.pool;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): Session | null {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;

    return payload as Session;
  } catch {
    return null;
  }
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  "createdAt" TEXT NOT NULL,
  "maxUsers" INTEGER NOT NULL DEFAULT 5,
  "maxProjects" INTEGER NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  avatar TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#6366f1',
  "createdAt" TEXT NOT NULL,
  "lastLoginAt" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(email)
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  "dueDate" TEXT NOT NULL DEFAULT '',
  progress INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#6366f1',
  "createdBy" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  "projectId" TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  "assigneeId" TEXT NOT NULL DEFAULT '',
  "assigneeName" TEXT NOT NULL DEFAULT '',
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  "startDate" TEXT NOT NULL DEFAULT '',
  "dueDate" TEXT NOT NULL DEFAULT '',
  "dependsOn" TEXT NOT NULL DEFAULT '',
  "createdBy" TEXT NOT NULL
);

`;

const SEED_TENANTS = [
  { id: 'tenant-1', name: 'Demo Company', slug: 'demo', plan: 'professional', createdAt: '2026-01-01', maxUsers: 50, maxProjects: 100 },
  { id: 'tenant-2', name: 'Acme Corp', slug: 'acme', plan: 'starter', createdAt: '2026-02-15', maxUsers: 10, maxProjects: 20 },
];

const SEED_USERS = [
  { id: 'user-1', tenantId: 'tenant-1', email: 'admin@demo.com', password: hashPassword('admin123'), name: 'Admin User', role: 'owner', avatar: '', color: '#6366f1', createdAt: '2026-01-01', lastLoginAt: null, isActive: true },
  { id: 'user-2', tenantId: 'tenant-1', email: 'manager@demo.com', password: hashPassword('manager123'), name: 'Sarah Manager', role: 'manager', avatar: '', color: '#ec4899', createdAt: '2026-01-15', lastLoginAt: null, isActive: true },
  { id: 'user-3', tenantId: 'tenant-1', email: 'member@demo.com', password: hashPassword('member123'), name: 'John Member', role: 'member', avatar: '', color: '#22c55e', createdAt: '2026-02-01', lastLoginAt: null, isActive: true },
  { id: 'user-4', tenantId: 'tenant-2', email: 'admin@acme.com', password: hashPassword('admin123'), name: 'Acme Admin', role: 'owner', avatar: '', color: '#f59e0b', createdAt: '2026-02-15', lastLoginAt: null, isActive: true },
];

const SEED_PROJECTS = [
  { id: '1', tenantId: 'tenant-1', name: 'Website Redesign', description: 'Complete overhaul of the company website with modern design and improved UX', status: 'active', createdAt: '2026-01-15', updatedAt: '2026-05-01', dueDate: '2026-06-30', progress: 65, color: '#6366f1', createdBy: 'user-1' },
  { id: '2', tenantId: 'tenant-1', name: 'Mobile App Development', description: 'Native iOS and Android app for customer engagement', status: 'active', createdAt: '2026-02-20', updatedAt: '2026-05-05', dueDate: '2026-08-15', progress: 40, color: '#8b5cf6', createdBy: 'user-2' },
  { id: '3', tenantId: 'tenant-1', name: 'API Integration', description: 'Third-party API integrations for payment and shipping', status: 'completed', createdAt: '2025-11-01', updatedAt: '2026-02-28', dueDate: '2026-03-01', progress: 100, color: '#22c55e', createdBy: 'user-1' },
  { id: '4', tenantId: 'tenant-2', name: 'Inventory System', description: 'New inventory management system for warehouse', status: 'active', createdAt: '2026-03-10', updatedAt: '2026-04-15', dueDate: '2026-07-01', progress: 25, color: '#f59e0b', createdBy: 'user-4' },
];

const SEED_TASKS = [
  { id: '1', tenantId: 'tenant-1', projectId: '1', title: 'Design homepage mockups', description: 'Create 3 different homepage design concepts', status: 'done', priority: 'high', assigneeId: 'user-2', assigneeName: 'Sarah Manager', createdAt: '2026-01-16', updatedAt: '2026-02-10', startDate: '2026-01-16', dueDate: '2026-02-15', dependsOn: '', createdBy: 'user-1' },
  { id: '2', tenantId: 'tenant-1', projectId: '1', title: 'Implement responsive navigation', description: 'Build mobile-first navigation component', status: 'in-progress', priority: 'high', assigneeId: 'user-3', assigneeName: 'John Member', createdAt: '2026-02-20', updatedAt: '2026-05-02', startDate: '2026-02-20', dueDate: '2026-05-20', dependsOn: '1', createdBy: 'user-2' },
  { id: '3', tenantId: 'tenant-1', projectId: '1', title: 'Content migration strategy', description: 'Plan and execute content transfer from old site', status: 'todo', priority: 'medium', assigneeId: 'user-3', assigneeName: 'John Member', createdAt: '2026-03-01', updatedAt: '2026-03-01', startDate: '2026-04-01', dueDate: '2026-06-01', dependsOn: '2', createdBy: 'user-1' },
  { id: '4', tenantId: 'tenant-1', projectId: '2', title: 'Setup React Native project', description: 'Initialize project with TypeScript and required dependencies', status: 'done', priority: 'high', assigneeId: 'user-2', assigneeName: 'Sarah Manager', createdAt: '2026-02-21', updatedAt: '2026-03-05', startDate: '2026-02-21', dueDate: '2026-03-10', dependsOn: '', createdBy: 'user-2' },
  { id: '5', tenantId: 'tenant-1', projectId: '2', title: 'Design app wireframes', description: 'Create low-fidelity wireframes for all screens', status: 'review', priority: 'high', assigneeId: 'user-2', assigneeName: 'Sarah Manager', createdAt: '2026-03-06', updatedAt: '2026-04-28', startDate: '2026-03-06', dueDate: '2026-05-15', dependsOn: '4', createdBy: 'user-1' },
  { id: '6', tenantId: 'tenant-1', projectId: '2', title: 'Implement authentication flow', description: 'Build login, signup, and password reset screens', status: 'todo', priority: 'urgent', assigneeId: 'user-3', assigneeName: 'John Member', createdAt: '2026-04-01', updatedAt: '2026-04-01', startDate: '2026-04-01', dueDate: '2026-05-30', dependsOn: '', createdBy: 'user-2' },
  { id: '7', tenantId: 'tenant-2', projectId: '4', title: 'Setup database schema', description: 'Design and implement inventory database structure', status: 'in-progress', priority: 'high', assigneeId: 'user-4', assigneeName: 'Acme Admin', createdAt: '2026-03-11', updatedAt: '2026-04-20', startDate: '2026-03-11', dueDate: '2026-04-30', dependsOn: '', createdBy: 'user-4' },
];

const MIGRATIONS_SQL = `
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "startDate" TEXT NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "dependsOn" TEXT NOT NULL DEFAULT '';
`;

let migrationRan = false;

async function runMigrations(): Promise<void> {
  if (migrationRan) return;
  migrationRan = true;
  try {
    const pool = getPool();
    await pool.query(MIGRATIONS_SQL);
  } catch {
    // migrations are best-effort
  }
}

async function initDatabase(): Promise<void> {
  if (globalForPool.dbInitialized) return;
  globalForPool.dbInitialized = true;

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query(SCHEMA_SQL);

    const tenantCount = await client.query('SELECT COUNT(*) as count FROM tenants');
    if (Number(tenantCount.rows[0]?.count) > 0) return;

    for (const tenant of SEED_TENANTS) {
      await client.query(
        'INSERT INTO tenants (id, name, slug, plan, "createdAt", "maxUsers", "maxProjects") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [tenant.id, tenant.name, tenant.slug, tenant.plan, tenant.createdAt, tenant.maxUsers, tenant.maxProjects]
      );
    }

    for (const user of SEED_USERS) {
      await client.query(
        'INSERT INTO users (id, "tenantId", email, password, name, role, avatar, color, "createdAt", "lastLoginAt", "isActive") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [user.id, user.tenantId, user.email, user.password, user.name, user.role, user.avatar, user.color, user.createdAt, user.lastLoginAt, user.isActive]
      );
    }

    for (const project of SEED_PROJECTS) {
      await client.query(
        'INSERT INTO projects (id, "tenantId", name, description, status, "createdAt", "updatedAt", "dueDate", progress, color, "createdBy") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [project.id, project.tenantId, project.name, project.description, project.status, project.createdAt, project.updatedAt, project.dueDate, project.progress, project.color, project.createdBy]
      );
    }

    for (const task of SEED_TASKS) {
      await client.query(
        'INSERT INTO tasks (id, "tenantId", "projectId", title, description, status, priority, "assigneeId", "assigneeName", "createdAt", "updatedAt", "startDate", "dueDate", "dependsOn", "createdBy") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)',
        [task.id, task.tenantId, task.projectId, task.title, task.description, task.status, task.priority, task.assigneeId, task.assigneeName, task.createdAt, task.updatedAt, task.startDate, task.dueDate, task.dependsOn, task.createdBy]
      );
    }
  } finally {
    client.release();
  }
}

async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  await initDatabase();
  await runMigrations();
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows as T[];
}

async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function hashPasswordUtil(password: string): string {
  return hashPassword(password);
}

export function createSession(user: User, tenant: Tenant): string {
  const session: Session = {
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantName: tenant.name,
    exp: Date.now() + SESSION_DURATION
  };
  return generateToken(session);
}

export function verifySession(token: string): Session | null {
  return verifyToken(token);
}

export function getSessionFromRequest(request: Request): Session | null {
  const token = request.headers.get('cookie')?.split('; ')
    .find(c => c.startsWith('session='))
    ?.split('=')[1];
  return token ? verifySession(token) : null;
}

// --- Tenant queries ---

export async function getTenant(id: string): Promise<Tenant | null> {
  return queryOne<Tenant>('SELECT * FROM tenants WHERE id = $1', [id]);
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return queryOne<Tenant>('SELECT * FROM tenants WHERE slug = $1', [slug]);
}

export async function createTenant(tenant: Tenant): Promise<void> {
  await query(
    'INSERT INTO tenants (id, name, slug, plan, "createdAt", "maxUsers", "maxProjects") VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [tenant.id, tenant.name, tenant.slug, tenant.plan, tenant.createdAt, tenant.maxUsers, tenant.maxProjects]
  );
}

export async function updateTenant(id: string, data: Partial<Tenant>): Promise<void> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    setClauses.push(`"${key}" = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  }

  if (setClauses.length === 0) return;
  values.push(id);
  await query(`UPDATE tenants SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, values);
}

export async function getTenantProjectCount(tenantId: string): Promise<number> {
  const result = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM projects WHERE "tenantId" = $1', [tenantId]);
  return result ? Number(result.count) : 0;
}

// --- User queries ---

export async function getUsersByTenant(tenantId: string): Promise<User[]> {
  return query<User>('SELECT * FROM users WHERE "tenantId" = $1', [tenantId]);
}

export async function getUser(id: string): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE id = $1', [id]);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
}

export async function createUser(user: User): Promise<void> {
  await query(
    'INSERT INTO users (id, "tenantId", email, password, name, role, avatar, color, "createdAt", "lastLoginAt", "isActive") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
    [user.id, user.tenantId, user.email, user.password, user.name, user.role, user.avatar, user.color, user.createdAt, user.lastLoginAt, user.isActive]
  );
}

export async function updateUser(id: string, data: Partial<User>): Promise<void> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    setClauses.push(`"${key}" = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  }

  if (setClauses.length === 0) return;
  values.push(id);
  await query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, values);
}

export async function deleteUser(id: string): Promise<void> {
  await query('DELETE FROM users WHERE id = $1', [id]);
}

export async function getUserCountByTenant(tenantId: string): Promise<number> {
  const result = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users WHERE "tenantId" = $1', [tenantId]);
  return result ? Number(result.count) : 0;
}

// --- Project queries ---

export async function getProjectsByTenant(tenantId: string): Promise<Project[]> {
  return query<Project>('SELECT * FROM projects WHERE "tenantId" = $1', [tenantId]);
}

export async function getProject(id: string): Promise<Project | null> {
  return queryOne<Project>('SELECT * FROM projects WHERE id = $1', [id]);
}

export async function createProject(project: Project): Promise<void> {
  await query(
    'INSERT INTO projects (id, "tenantId", name, description, status, "createdAt", "updatedAt", "dueDate", progress, color, "createdBy") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
    [project.id, project.tenantId, project.name, project.description, project.status, project.createdAt, project.updatedAt, project.dueDate, project.progress, project.color, project.createdBy]
  );
}

export async function updateProject(id: string, data: Partial<Project>): Promise<void> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    setClauses.push(`"${key}" = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  }

  if (setClauses.length === 0) return;
  values.push(id);
  await query(`UPDATE projects SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, values);
}

export async function deleteProject(id: string): Promise<void> {
  await query('DELETE FROM tasks WHERE "projectId" = $1', [id]);
  await query('DELETE FROM projects WHERE id = $1', [id]);
}

// --- Task queries ---

export async function getTasksByTenant(tenantId: string, projectId?: string): Promise<Task[]> {
  if (projectId) {
    return query<Task>('SELECT * FROM tasks WHERE "tenantId" = $1 AND "projectId" = $2', [tenantId, projectId]);
  }
  return query<Task>('SELECT * FROM tasks WHERE "tenantId" = $1', [tenantId]);
}

export async function getTask(id: string): Promise<Task | null> {
  return queryOne<Task>('SELECT * FROM tasks WHERE id = $1', [id]);
}

export async function createTask(task: Task): Promise<void> {
  await query(
    'INSERT INTO tasks (id, "tenantId", "projectId", title, description, status, priority, "assigneeId", "assigneeName", "createdAt", "updatedAt", "startDate", "dueDate", "dependsOn", "createdBy") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)',
    [task.id, task.tenantId, task.projectId, task.title, task.description, task.status, task.priority, task.assigneeId, task.assigneeName, task.createdAt, task.updatedAt, task.startDate, task.dueDate, task.dependsOn, task.createdBy]
  );
}

export async function updateTask(id: string, data: Partial<Task>): Promise<void> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    setClauses.push(`"${key}" = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  }

  if (setClauses.length === 0) return;
  values.push(id);
  await query(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, values);
}

export async function deleteTask(id: string): Promise<void> {
  await query('DELETE FROM tasks WHERE id = $1', [id]);
}

// --- Project progress ---

export async function recalculateProjectProgress(projectId: string, tenantId: string): Promise<void> {
  const tasks = await getTasksByTenant(tenantId, projectId);
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  await updateProject(projectId, { progress, updatedAt: new Date().toISOString().split('T')[0] });
}

// --- Permission helpers ---

export function canManageUsers(role: string): boolean {
  return ['owner', 'admin'].includes(role);
}

export function canManageProjects(role: string): boolean {
  return ['owner', 'admin', 'manager'].includes(role);
}

export function canEditTasks(role: string): boolean {
  return ['owner', 'admin', 'manager', 'member'].includes(role);
}

export function canDeleteProject(role: string): boolean {
  return ['owner', 'admin'].includes(role);
}

export function canManageSettings(role: string): boolean {
  return ['owner', 'admin'].includes(role);
}
