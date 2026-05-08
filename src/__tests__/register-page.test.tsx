// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '@/app/register/page';

const mockRegister = vi.fn();

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    mockRegister.mockReset();
  });

  it('renders the register heading', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Create your account')).toBeInTheDocument();
  });

  it('renders form fields', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm')).toBeInTheDocument();
  });

  it('shows tabs for new org and join', () => {
    render(<RegisterPage />);
    expect(screen.getByText('New Organization')).toBeInTheDocument();
    expect(screen.getByText('Join with Code')).toBeInTheDocument();
  });

  it('shows company name field for new org mode', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText('Organization Name')).toBeInTheDocument();
  });

  it('shows invite code field in join mode', () => {
    render(<RegisterPage />);
    fireEvent.click(screen.getByText('Join with Code'));
    expect(screen.getByLabelText('Invite Code')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    const { container } = render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByLabelText('Confirm'), { target: { value: 'different' } });
    const form = container.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('shows error when password is too short', async () => {
    const { container } = render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText('Confirm'), { target: { value: '12345' } });
    const form = container.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('calls register and shows loading state', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const { container } = render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@demo.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Organization Name'), { target: { value: 'My Company' } });
    const form = container.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@demo.com',
        password: 'password123',
        name: 'Test User',
        companyName: 'My Company',
        inviteCode: undefined,
      });
    });
  });

  it('shows error when registration fails', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Email already in use'));
    const { container } = render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'existing@demo.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Organization Name'), { target: { value: 'My Co' } });
    const form = container.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });
  });
});
