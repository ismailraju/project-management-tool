import { NextResponse } from 'next/server';
import { getUserByEmail, getTenantBySlug, createTenant, createUser, hashPasswordUtil, createSession, generateId } from '@/lib/db';
import { User, Tenant } from '@/types';

const colorOptions = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#22c55e', '#14b8a6', '#06b6d4'];

export async function POST(request: Request) {
  try {
    const { email, password, name, companyName, inviteCode } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    let tenant: Tenant;

    if (inviteCode) {
      const invitedTenant = await getTenantBySlug(inviteCode.toLowerCase());
      if (!invitedTenant) {
        return NextResponse.json(
          { error: 'Invalid invite code' },
          { status: 400 }
        );
      }

      const { getUserCountByTenant } = await import('@/lib/db');
      const count = await getUserCountByTenant(invitedTenant.id);
      if (count >= invitedTenant.maxUsers) {
        return NextResponse.json(
          { error: 'This organization has reached its user limit' },
          { status: 403 }
        );
      }

      tenant = invitedTenant;
    } else {
      if (!companyName) {
        return NextResponse.json(
          { error: 'Company name is required for new organizations' },
          { status: 400 }
        );
      }

      const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const existingTenant = await getTenantBySlug(slug);
      if (existingTenant) {
        return NextResponse.json(
          { error: 'An organization with this name already exists' },
          { status: 409 }
        );
      }

      tenant = {
        id: generateId(),
        name: companyName,
        slug,
        plan: 'free',
        createdAt: new Date().toISOString().split('T')[0],
        maxUsers: 5,
        maxProjects: 10
      };

      await createTenant(tenant);
    }

    const user: User = {
      id: generateId(),
      tenantId: tenant.id,
      email,
      password: hashPasswordUtil(password),
      name,
      role: inviteCode ? 'member' : 'owner',
      avatar: '',
      color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      createdAt: new Date().toISOString().split('T')[0],
      lastLoginAt: null,
      isActive: true
    };

    await createUser(user);

    const token = createSession(user, tenant);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant.name,
        tenantPlan: tenant.plan,
        avatar: user.avatar,
        color: user.color
      }
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
