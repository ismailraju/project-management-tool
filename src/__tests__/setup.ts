/* eslint-disable @typescript-eslint/no-require-imports */
import { vi } from 'vitest';
import { Task, Project, User, Tenant } from '@/types';

vi.mock('@/lib/db', () => {
  const crypto = require('crypto');
  const hashPassword = (password: string) => {
    return crypto.createHash('sha256').update(password).digest('hex');
  };

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'admin@demo.com',
    password: hashPassword('admin123'),
    name: 'Admin User',
    role: 'owner',
    avatar: '',
    color: '#6366f1',
    createdAt: '2026-01-01',
    lastLoginAt: null,
    isActive: true,
  };

  const mockManager: User = {
    id: 'user-2',
    tenantId: 'tenant-1',
    email: 'manager@demo.com',
    password: hashPassword('manager123'),
    name: 'Sarah Manager',
    role: 'manager',
    avatar: '',
    color: '#ec4899',
    createdAt: '2026-01-15',
    lastLoginAt: null,
    isActive: true,
  };

  const mockMember: User = {
    id: 'user-3',
    tenantId: 'tenant-1',
    email: 'member@demo.com',
    password: hashPassword('member123'),
    name: 'John Member',
    role: 'member',
    avatar: '',
    color: '#22c55e',
    createdAt: '2026-02-01',
    lastLoginAt: null,
    isActive: true,
  };

  const mockInactiveUser: User = {
    id: 'user-99',
    tenantId: 'tenant-1',
    email: 'inactive@demo.com',
    password: hashPassword('inactive123'),
    name: 'Inactive User',
    role: 'member',
    avatar: '',
    color: '#ef4444',
    createdAt: '2026-03-01',
    lastLoginAt: null,
    isActive: false,
  };

  const mockTenant: Tenant = {
    id: 'tenant-1',
    name: 'Demo Company',
    slug: 'demo',
    plan: 'professional',
    createdAt: '2026-01-01',
    maxUsers: 50,
    maxProjects: 100,
  };

  const mockProjectsStore: Project[] = [
    {
      id: '1',
      tenantId: 'tenant-1',
      name: 'Website Redesign',
      description: 'Complete overhaul',
      status: 'active',
      createdAt: '2026-01-15',
      updatedAt: '2026-05-01',
      dueDate: '2026-06-30',
      progress: 65,
      color: '#6366f1',
      createdBy: 'user-1',
    },
    {
      id: '2',
      tenantId: 'tenant-1',
      name: 'Mobile App',
      description: 'Native apps',
      status: 'active',
      createdAt: '2026-02-20',
      updatedAt: '2026-05-05',
      dueDate: '2026-08-15',
      progress: 40,
      color: '#8b5cf6',
      createdBy: 'user-2',
    },
  ];

  const mockTasksStore: Task[] = [
    {
      id: '1',
      tenantId: 'tenant-1',
      projectId: '1',
      title: 'Design homepage',
      description: 'Create concepts',
      status: 'done',
      priority: 'high',
      assigneeId: 'user-2',
      assigneeName: 'Sarah Manager',
      createdAt: '2026-01-16',
      updatedAt: '2026-02-10',
      startDate: '2026-01-16',
      dueDate: '2026-02-15',
      dependsOn: '',
      createdBy: 'user-1',
    },
    {
      id: '2',
      tenantId: 'tenant-1',
      projectId: '1',
      title: 'Responsive nav',
      description: 'Build navigation',
      status: 'in-progress',
      priority: 'high',
      assigneeId: 'user-3',
      assigneeName: 'John Member',
      createdAt: '2026-02-20',
      updatedAt: '2026-05-02',
      startDate: '2026-02-20',
      dueDate: '2026-05-20',
      dependsOn: '1',
      createdBy: 'user-2',
    },
  ];

  const users = [mockUser, mockManager, mockMember, mockInactiveUser];

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  function hashPasswordUtil(password: string) {
    return hashPassword(password);
  }

  function verifyToken(token: string) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
      if (payload.exp < Date.now()) return null;
      return payload;
    } catch {
      return null;
    }
  }

  function createSession(user: User, tenant: Tenant) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantName: tenant.name,
      exp: Date.now() + 86400000,
    })).toString('base64url');
    return `${header}.${body}.fakesig`;
  }

  return {
    getSessionFromRequest: vi.fn((request: Request) => {
      const token = request.headers.get('cookie')
        ?.split('; ')
        .find((c: string) => c.startsWith('session='))
        ?.split('=')[1];
      return token ? verifyToken(token) : null;
    }),

    verifySession: vi.fn((token: string) => verifyToken(token)),

    getUser: vi.fn(async (id: string) => users.find(u => u.id === id) || null),

    getUserByEmail: vi.fn(async (email: string) =>
      users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
    ),

    getUsersByTenant: vi.fn(async (tenantId: string) =>
      users.filter(u => u.tenantId === tenantId)
    ),

    getTenant: vi.fn(async (id: string) =>
      id === 'tenant-1' ? mockTenant : null
    ),

    getTenantBySlug: vi.fn(async () => null),

    getProjectsByTenant: vi.fn(async () => mockProjectsStore),

    getProject: vi.fn(async (id: string) =>
      mockProjectsStore.find(p => p.id === id) || null
    ),

    createProject: vi.fn(),

    updateProject: vi.fn(async (id: string, data: Partial<Project>) => {
      const idx = mockProjectsStore.findIndex(p => p.id === id);
      if (idx !== -1) Object.assign(mockProjectsStore[idx], data);
    }),

    deleteProject: vi.fn(async (id: string) => {
      const idx = mockProjectsStore.findIndex(p => p.id === id);
      if (idx !== -1) mockProjectsStore.splice(idx, 1);
    }),

    getTenantProjectCount: vi.fn(async () => 2),

    getTasksByTenant: vi.fn(async (tenantId: string, projectId?: string) => {
      if (projectId) return mockTasksStore.filter(t => t.projectId === projectId);
      return mockTasksStore;
    }),

    getTask: vi.fn(async (id: string) =>
      mockTasksStore.find(t => t.id === id) || null
    ),

    createTask: vi.fn(),

    updateTask: vi.fn(async (id: string, data: Partial<Task>) => {
      const idx = mockTasksStore.findIndex(t => t.id === id);
      if (idx !== -1) Object.assign(mockTasksStore[idx], data);
    }),

    deleteTask: vi.fn(async (id: string) => {
      const idx = mockTasksStore.findIndex(t => t.id === id);
      if (idx !== -1) mockTasksStore.splice(idx, 1);
    }),

    recalculateProjectProgress: vi.fn(),

    getUserCountByTenant: vi.fn(async () => 3),

    createUser: vi.fn(),

    updateUser: vi.fn(),

    deleteUser: vi.fn(),

    generateId,

    hashPasswordUtil,

    createSession,

    canManageUsers: vi.fn((role: string) => ['owner', 'admin'].includes(role)),
    canManageProjects: vi.fn((role: string) => ['owner', 'admin', 'manager'].includes(role)),
    canEditTasks: vi.fn(() => true),
    canDeleteProject: vi.fn((role: string) => ['owner', 'admin'].includes(role)),
    canManageSettings: vi.fn((role: string) => ['owner', 'admin'].includes(role)),
  };
});
