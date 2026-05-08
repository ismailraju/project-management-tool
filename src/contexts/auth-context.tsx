'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
  tenantPlan: string;
  tenantSlug?: string;
  avatar: string;
  color: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; companyName?: string; inviteCode?: string }) => Promise<void>;
  logout: () => Promise<void>;
  canManageUsers: () => boolean;
  canManageProjects: () => boolean;
  canEditTasks: () => boolean;
  canDeleteProject: () => boolean;
  canManageSettings: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setUser(data.user);
    router.push('/');
  }

  async function register(data: { email: string; password: string; name: string; companyName?: string; inviteCode?: string }) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const response = await res.json();

    if (!res.ok) {
      throw new Error(response.error || 'Registration failed');
    }

    setUser(response.user);
    router.push('/');
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  }

  function canManageUsers(): boolean {
    if (!user) return false;
    return ['owner', 'admin'].includes(user.role);
  }

  function canManageProjects(): boolean {
    if (!user) return false;
    return ['owner', 'admin', 'manager'].includes(user.role);
  }

  function canEditTasks(): boolean {
    if (!user) return false;
    return ['owner', 'admin', 'manager', 'member'].includes(user.role);
  }

  function canDeleteProject(): boolean {
    if (!user) return false;
    return ['owner', 'admin'].includes(user.role);
  }

  function canManageSettings(): boolean {
    if (!user) return false;
    return ['owner', 'admin'].includes(user.role);
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      canManageUsers,
      canManageProjects,
      canEditTasks,
      canDeleteProject,
      canManageSettings
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
