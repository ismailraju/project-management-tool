import { NextResponse } from 'next/server';
import { getSessionFromRequest, getTenant, getUsersByTenant, updateTenant } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenant(session.tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const users = await getUsersByTenant(session.tenantId);

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        maxUsers: tenant.maxUsers,
        maxProjects: tenant.maxProjects
      },
      stats: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length
      },
      inviteCode: tenant.slug
    });
  } catch (error) {
    console.error('Error fetching team info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'owner') {
      return NextResponse.json({ error: 'Only owner can update team settings' }, { status: 403 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await updateTenant(session.tenantId, { name });

    const updated = await getTenant(session.tenantId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
