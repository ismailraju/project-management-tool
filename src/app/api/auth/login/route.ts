import { NextResponse } from 'next/server';
import { getUserByEmail, getTenant, updateUser, hashPasswordUtil, createSession } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const hashedPassword = hashPasswordUtil(password);
    const user = await getUserByEmail(email);

    if (!user || user.password !== hashedPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated. Contact your administrator.' },
        { status: 403 }
      );
    }

    const tenant = await getTenant(user.tenantId);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 500 }
      );
    }

    await updateUser(user.id, { lastLoginAt: new Date().toISOString() });

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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
