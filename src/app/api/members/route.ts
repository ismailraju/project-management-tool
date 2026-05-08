import { NextResponse } from 'next/server';
import { getSessionFromRequest, getUsersByTenant } from '@/lib/db';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await getUsersByTenant(session.tenantId);
  const members = users
    .filter((u) => u.isActive)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      color: u.color
    }));

  return NextResponse.json(members);
}
