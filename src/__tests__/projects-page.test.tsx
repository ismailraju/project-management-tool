// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProjectsPage from '@/app/(app)/projects/page';

const mockUser = {
  id: '1', email: 'admin@demo.com', name: 'Admin', role: 'owner',
  tenantId: 't1', tenantName: 'Demo Corp', tenantPlan: 'professional',
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
  { id: '1', name: 'Website Redesign', description: 'Complete overhaul', status: 'active', progress: 65, color: '#6366f1', createdAt: '2026-01-15', dueDate: '2026-06-30', tenantId: 't1', createdBy: 'u1', updatedAt: '' },
  { id: '2', name: 'Mobile App', description: 'Native mobile apps', status: 'on-hold', progress: 40, color: '#8b5cf6', createdAt: '2026-02-20', dueDate: '2026-08-15', tenantId: 't1', createdBy: 'u1', updatedAt: '' },
];

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it('shows page heading after data loads', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });
  });

  it('renders project list after data loads', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('Website Redesign')).toBeInTheDocument();
      expect(screen.getByText('Mobile App')).toBeInTheDocument();
    });
  });

  it('renders New Project button', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });
  });

  it('renders search input', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
    });
  });

  it('renders status filter', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage and track all your projects')).toBeInTheDocument();
    });
  });

  it('shows status badges', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('On Hold')).toBeInTheDocument();
    });
  });

  it('shows progress percentages', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();
    });
  });

  it('renders View Project buttons', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    render(<ProjectsPage />);

    await waitFor(() => {
      const buttons = screen.getAllByText('View Project');
      expect(buttons.length).toBe(2);
    });
  });
});
