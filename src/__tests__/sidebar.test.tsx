// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '@/components/sidebar';

const mockOwner = {
  id: '1', email: 'admin@demo.com', name: 'Admin User', role: 'owner',
  tenantId: 'tenant-1', tenantName: 'Demo Corp', tenantPlan: 'professional',
  avatar: '', color: '#6366f1',
};

const mockMember = {
  id: '3', email: 'member@demo.com', name: 'John Member', role: 'member',
  tenantId: 'tenant-1', tenantName: 'Demo Corp', tenantPlan: 'professional',
  avatar: '', color: '#22c55e',
};

let mockUser = mockOwner;
let mockLogout = vi.fn();

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    logout: mockLogout,
    register: vi.fn(),
    canManageUsers: () => mockUser?.role === 'owner' || mockUser?.role === 'admin',
    canManageProjects: () => true,
    canEditTasks: () => true,
    canDeleteProject: () => true,
    canManageSettings: () => true,
  }),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    mockUser = mockOwner;
    mockLogout = vi.fn();
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

  it('collapses when toggle is clicked', () => {
    render(<Sidebar />);
    expect(screen.getByText('ProjectFlow')).toBeInTheDocument();
    const toggleBtn = screen.getAllByRole('button')[0];
    fireEvent.click(toggleBtn);
    expect(screen.queryByText('ProjectFlow')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('hides Manage Team link for member role', () => {
    mockUser = mockMember;
    render(<Sidebar />);
    expect(screen.queryByText('Manage Team')).not.toBeInTheDocument();
  });

  it('hides Team nav item for member role', () => {
    mockUser = mockMember;
    render(<Sidebar />);
    expect(screen.queryByText('Team')).not.toBeInTheDocument();
  });

  it('hides user info panel when collapsed', () => {
    render(<Sidebar />);
    const toggleBtn = screen.getAllByRole('button')[0];
    fireEvent.click(toggleBtn);
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
