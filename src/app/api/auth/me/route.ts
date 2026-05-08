import { NextResponse } from 'next/server';
import { verifySession, getUser, getTenant } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('cookie')?.split('; ')
      .find(c => c.startsWith('session='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const session = verifySession(token);

    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await getUser(session.userId);
    const tenant = await getTenant(session.tenantId);

    if (!user || !tenant) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant.name,
        tenantPlan: tenant.plan,
        tenantSlug: tenant.slug,
        avatar: user.avatar,
        color: user.color
      }
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
