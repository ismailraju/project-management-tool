import { NextResponse } from 'next/server';
import { getSessionFromRequest, getUsersByTenant, getTenant, createUser, getUserByEmail, getUserCountByTenant, generateId, hashPasswordUtil, canManageUsers } from '@/lib/db';

const colorOptions = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#22c55e', '#14b8a6', '#06b6d4'];

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManageUsers(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await getUsersByTenant(session.tenantId);
    const result = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      color: u.color,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      isActive: u.isActive
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManageUsers(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const tenant = await getTenant(session.tenantId);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const count = await getUserCountByTenant(session.tenantId);
    if (count >= tenant.maxUsers) {
      return NextResponse.json({ error: 'User limit reached for this plan' }, { status: 403 });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const newUser = {
      id: generateId(),
      tenantId: session.tenantId,
      name,
      email,
      password: hashPasswordUtil(password),
      role: session.role === 'owner' ? (role || 'member') : 'member',
      avatar: '',
      color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      createdAt: new Date().toISOString().split('T')[0],
      lastLoginAt: null,
      isActive: true
    };

    await createUser(newUser);

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      color: newUser.color,
      createdAt: newUser.createdAt,
      lastLoginAt: newUser.lastLoginAt,
      isActive: newUser.isActive
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
