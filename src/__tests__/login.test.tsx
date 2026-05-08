// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';

const mockLogin = vi.fn();

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: mockLogin,
    logout: vi.fn(),
    register: vi.fn(),
    canManageUsers: () => false,
    canManageProjects: () => false,
    canEditTasks: () => true,
    canDeleteProject: () => false,
    canManageSettings: () => false,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading and description', () => {
    render(<LoginPage />);
    expect(screen.getByText('ProjectFlow')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('renders email and password fields', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders register link', () => {
    render(<LoginPage />);
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  it('renders demo accounts', () => {
    render(<LoginPage />);
    expect(screen.getByText('Demo accounts:')).toBeInTheDocument();
    expect(screen.getByText(/admin@demo.com/)).toBeInTheDocument();
    expect(screen.getByText(/manager@demo.com/)).toBeInTheDocument();
    expect(screen.getByText(/member@demo.com/)).toBeInTheDocument();
  });

  it('calls login on form submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await userEvent.type(emailInput, 'admin@demo.com');
    await userEvent.type(passwordInput, 'admin123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@demo.com', 'admin123');
    });
  });

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(emailInput, { target: { value: 'bad@email.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    let resolveLogin: () => void;
    mockLogin.mockReturnValue(new Promise<void>((resolve) => { resolveLogin = resolve; }));
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });

    resolveLogin!();
  });

  it('disables inputs during loading', async () => {
    let resolveLogin: () => void;
    mockLogin.mockReturnValue(new Promise<void>((resolve) => { resolveLogin = resolve; }));
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeDisabled();
      expect(screen.getByLabelText('Password')).toBeDisabled();
    });

    resolveLogin!();
  });
});
