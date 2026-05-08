// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/(app)/page';

const mockUser = {
  id: '1', email: 'admin@demo.com', name: 'Admin User', role: 'owner',
  tenantId: 'tenant-1', tenantName: 'Demo Corp', tenantPlan: 'professional',
  avatar: '', color: '#6366f1',
};

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: mockUser, loading: false, login: vi.fn(), logout: vi.fn(), register: vi.fn(),
    canManageUsers: () => true, canManageProjects: () => true,
    canEditTasks: () => true, canDeleteProject: () => true, canManageSettings: () => true,
  }),
}));

const mockProjects = [
  { id: '1', name: 'Website Redesign', description: 'Overhaul', status: 'active', progress: 65, color: '#6366f1', createdAt: '2026-01-15', dueDate: '2026-06-30', tenantId: 't1', createdBy: 'u1', updatedAt: '' },
  { id: '2', name: 'Mobile App', description: 'Native apps', status: 'active', progress: 40, color: '#8b5cf6', createdAt: '2026-02-20', dueDate: '2026-08-15', tenantId: 't1', createdBy: 'u1', updatedAt: '' },
];

const mockTasks = [
  { id: '1', title: 'Design homepage', status: 'done', priority: 'high', assigneeId: 'u2', assigneeName: 'Sarah', projectId: '1', dueDate: '2026-02-15', tenantId: 't1', createdBy: 'u1', createdAt: '', updatedAt: '', startDate: '', description: '', dependsOn: '' },
  { id: '2', title: 'Responsive nav', status: 'in-progress', priority: 'high', assigneeId: 'u3', assigneeName: 'John', projectId: '1', dueDate: '2026-05-20', tenantId: 't1', createdBy: 'u2', createdAt: '', updatedAt: '', startDate: '', description: '', dependsOn: '1' },
];

const mockMembers = [
  { id: 'u1', name: 'Admin', email: 'admin@demo.com', role: 'owner', color: '#6366f1' },
  { id: 'u2', name: 'Sarah', email: 'sarah@demo.com', role: 'manager', color: '#22c55e' },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it('renders welcome message with user name', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTasks) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMembers) });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Admin User/)).toBeInTheDocument();
    });
  });

  it('shows New Project button for owner', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTasks) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMembers) });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });
  });

  it('renders stat cards', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTasks) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMembers) });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Projects')).toBeInTheDocument();
      expect(screen.getByText('Completed Tasks')).toBeInTheDocument();
      expect(screen.getByText('Overdue Tasks')).toBeInTheDocument();
      expect(screen.getByText('Team Members')).toBeInTheDocument();
    });
  });
});
