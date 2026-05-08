// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.name : 'null'}</div>
      <div data-testid="loading">{auth.loading ? 'loading' : 'done'}</div>
      <div data-testid="can-manage-users">{String(auth.canManageUsers())}</div>
      <div data-testid="can-manage-projects">{String(auth.canManageProjects())}</div>
      <div data-testid="can-edit-tasks">{String(auth.canEditTasks())}</div>
      <div data-testid="can-delete-project">{String(auth.canDeleteProject())}</div>
      <div data-testid="can-manage-settings">{String(auth.canManageSettings())}</div>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn();
});

describe('AuthContext', () => {
  it('shows loading state initially', () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({}),
    });
    renderWithProvider();
    expect(screen.getByTestId('loading').textContent).toBe('loading');
  });

  it('sets user after successful auth check', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({
        user: { id: '1', name: 'Admin', role: 'owner', email: 'a@b.com', tenantId: 't1', tenantName: 'T', tenantPlan: 'free', avatar: '', color: '#000' },
      }),
    });
    renderWithProvider();
    await vi.waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Admin');
    });
  });

  it('permission helpers work for owner', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({
        user: { id: '1', name: 'Admin', role: 'owner', email: 'a@b.com', tenantId: 't1', tenantName: 'T', tenantPlan: 'free', avatar: '', color: '#000' },
      }),
    });
    renderWithProvider();
    await vi.waitFor(() => {
      expect(screen.getByTestId('can-manage-users').textContent).toBe('true');
      expect(screen.getByTestId('can-manage-projects').textContent).toBe('true');
      expect(screen.getByTestId('can-edit-tasks').textContent).toBe('true');
      expect(screen.getByTestId('can-delete-project').textContent).toBe('true');
      expect(screen.getByTestId('can-manage-settings').textContent).toBe('true');
    });
  });

  it('login calls fetch and sets user', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ json: () => Promise.resolve({}) }) // initial check
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          user: { id: '2', name: 'Manager', role: 'manager', email: 'm@b.com', tenantId: 't1', tenantName: 'T', tenantPlan: 'free', avatar: '', color: '#000' },
        }),
      });
    function LoginTest() {
      const { login, user } = useAuth();
      return (
        <div>
          <div data-testid="user">{user?.name || 'null'}</div>
          <button onClick={() => login('m@b.com', 'pass')}>Login</button>
        </div>
      );
    }
    render(<AuthProvider><LoginTest /></AuthProvider>);
    await vi.waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'));
    fireEvent.click(screen.getByText('Login'));
    await vi.waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Manager'));
  });

  it('calls fetch on login attempt', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });
    function LoginTest() {
      const { login } = useAuth();
      return (
        <div>
          <button data-testid="login-btn" onClick={() => login('x', 'y').catch(() => {})}>Login</button>
        </div>
      );
    }
    render(<AuthProvider><LoginTest /></AuthProvider>);
    await vi.waitFor(() => expect(screen.getByTestId('login-btn')).toBeInTheDocument());
  });

  it('permits all roles to edit tasks', async () => {
    const roles = ['owner', 'admin', 'manager', 'member'];
    for (const role of roles) {
      (global.fetch as any).mockReset();
      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve({
          user: { id: '1', name: 'U', role, email: 'u@b.com', tenantId: 't1', tenantName: 'T', tenantPlan: 'free', avatar: '', color: '#000' },
        }),
      });
      const { unmount } = render(<AuthProvider><TestConsumer /></AuthProvider>);
      await vi.waitFor(() => {
        expect(screen.getByTestId('can-edit-tasks').textContent).toBe('true');
      });
      unmount();
    }
  });
});
