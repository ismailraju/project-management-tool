// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import { Suspense } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProjectDetailPage from '@/app/(app)/projects/[id]/page';

const mockUser = {
  id: '1', email: 'admin@demo.com', name: 'Admin', role: 'owner',
  tenantId: 't1', tenantName: 'Demo Corp', tenantPlan: 'professional',
  avatar: '', color: '#6366f1',
};

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    login: vi.fn(), logout: vi.fn(), register: vi.fn(),
    canManageUsers: () => true, canManageProjects: () => true,
    canEditTasks: () => true, canDeleteProject: () => true,
    canManageSettings: () => true,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    const React = require('react');
    return React.createElement('a', { href, ...props }, children);
  },
}));

vi.mock('@/components/gantt-chart', () => ({
  GanttChart: ({ projectId }: { projectId: string }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'gantt-chart' }, `Gantt: ${projectId}`);
  },
}));

const mockProject = {
  id: '1', name: 'Website Redesign', description: 'Complete overhaul',
  status: 'active', progress: 65, color: '#6366f1',
  createdAt: '2026-01-15', updatedAt: '2026-05-01', dueDate: '2026-06-30',
  tenantId: 't1', createdBy: 'u1',
};

const mockTasks = [
  { id: '1', title: 'Design homepage', status: 'done', priority: 'high', assigneeId: 'u2', assigneeName: 'Sarah', projectId: '1', dueDate: '2026-02-15', tenantId: 't1', createdBy: 'u1', createdAt: '', updatedAt: '', startDate: '', description: 'Create concepts', dependsOn: '' },
  { id: '2', title: 'Responsive nav', status: 'in-progress', priority: 'high', assigneeId: 'u3', assigneeName: 'John', projectId: '1', dueDate: '2026-05-20', tenantId: 't1', createdBy: 'u2', createdAt: '', updatedAt: '', startDate: '', description: '', dependsOn: '1' },
];

const mockMembers = [
  { id: 'u2', name: 'Sarah' },
  { id: 'u3', name: 'John' },
];

function renderWithSuspense(ui: React.ReactElement) {
  return render(<Suspense fallback={<div>loading...</div>}>{ui}</Suspense>);
}

function resolvedParams(data: { id: string }): Promise<{ id: string }> {
  const p = Promise.resolve(data) as Promise<{ id: string }> & { status: string; value: { id: string } };
  p.status = 'fulfilled';
  p.value = data;
  return p;
}

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it('renders project name and description', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProject) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTasks) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMembers) });

    renderWithSuspense(<ProjectDetailPage params={resolvedParams({ id: '1' })} />);

    await waitFor(() => {
      expect(screen.getByText('Website Redesign')).toBeInTheDocument();
      expect(screen.getByText('Complete overhaul')).toBeInTheDocument();
    });
  });

  it('renders status badge', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProject) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTasks) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMembers) });

    renderWithSuspense(<ProjectDetailPage params={resolvedParams({ id: '1' })} />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('renders stat cards', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProject) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTasks) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMembers) });

    renderWithSuspense(<ProjectDetailPage params={resolvedParams({ id: '1' })} />);

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Due Date')).toBeInTheDocument();
      expect(screen.getAllByText('Tasks').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });
  });

  it('renders task tabs and Gantt tab', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProject) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTasks) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMembers) });

    renderWithSuspense(<ProjectDetailPage params={resolvedParams({ id: '1' })} />);

    await waitFor(() => {
      expect(screen.getByText('All (2)')).toBeInTheDocument();
      expect(screen.getByText('Gantt')).toBeInTheDocument();
    });
  });

  it('renders Add Task button', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProject) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTasks) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMembers) });

    renderWithSuspense(<ProjectDetailPage params={resolvedParams({ id: '1' })} />);

    await waitFor(() => {
      expect(screen.getByText('Add Task')).toBeInTheDocument();
    });
  });

  it('renders Edit and Delete buttons for owner', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProject) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTasks) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMembers) });

    renderWithSuspense(<ProjectDetailPage params={resolvedParams({ id: '1' })} />);

    await waitFor(() => {
      expect(screen.getByText('Edit Project')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });
});
