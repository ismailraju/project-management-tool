// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/sidebar';

const mockOwner = {
  id: '1', email: 'admin@demo.com', name: 'Admin User', role: 'owner',
  tenantId: 'tenant-1', tenantName: 'Demo Corp', tenantPlan: 'professional',
  avatar: '', color: '#6366f1',
};

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: mockOwner,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    canManageUsers: () => true,
    canManageProjects: () => true,
    canEditTasks: () => true,
    canDeleteProject: () => true,
    canManageSettings: () => true,
  }),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders app name', () => {
    render(<Sidebar />);
    expect(screen.getByText('ProjectFlow')).toBeInTheDocument();
  });

  it('renders all nav items for owner', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
  });

  it('shows user name and tenant', () => {
    render(<Sidebar />);
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Demo Corp')).toBeInTheDocument();
  });

  it('shows plan badge', () => {
    render(<Sidebar />);
    expect(screen.getByText('professional')).toBeInTheDocument();
  });

  it('shows role badge', () => {
    render(<Sidebar />);
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('shows logout button', () => {
    render(<Sidebar />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('shows settings link', () => {
    render(<Sidebar />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows Manage Team link for owner', () => {
    render(<Sidebar />);
    expect(screen.getByText('Manage Team')).toBeInTheDocument();
  });
});
