import { NextResponse } from 'next/server';
import { getSessionFromRequest, getUser, deleteUser, updateUser, canManageUsers } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManageUsers(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;
    const user = await getUser(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userId === session.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    if (user.tenantId !== session.tenantId) {
      return NextResponse.json({ error: 'User not in your organization' }, { status: 403 });
    }

    if (user.role === 'owner') {
      return NextResponse.json({ error: 'Cannot delete the owner' }, { status: 403 });
    }

    await deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, role, isActive } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await getUser(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.tenantId !== session.tenantId) {
      return NextResponse.json({ error: 'User not in your organization' }, { status: 403 });
    }

    if (user.role === 'owner' && session.role !== 'owner') {
      return NextResponse.json({ error: 'Cannot modify owner role' }, { status: 403 });
    }

    if (role && session.role !== 'owner' && role === 'owner') {
      return NextResponse.json({ error: 'Only owner can assign owner role' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (role) updates.role = role;
    if (typeof isActive === 'boolean') updates.isActive = isActive;

    if (Object.keys(updates).length > 0) {
      await updateUser(userId, updates);
    }

    const updated = await getUser(userId);

    return NextResponse.json({
      id: updated!.id,
      name: updated!.name,
      email: updated!.email,
      role: updated!.role,
      avatar: updated!.avatar,
      color: updated!.color,
      createdAt: updated!.createdAt,
      lastLoginAt: updated!.lastLoginAt,
      isActive: updated!.isActive
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
