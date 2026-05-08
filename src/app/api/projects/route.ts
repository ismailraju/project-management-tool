import { NextResponse } from 'next/server';
import { getSessionFromRequest, getTenant, getProjectsByTenant, getTenantProjectCount, createProject, generateId, canManageProjects } from '@/lib/db';
import { Project } from '@/types';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projects = await getProjectsByTenant(session.tenantId);
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canManageProjects(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const tenant = await getTenant(session.tenantId);

  if (tenant) {
    const count = await getTenantProjectCount(session.tenantId);
    if (count >= tenant.maxProjects) {
      return NextResponse.json({ error: 'Project limit reached for this plan' }, { status: 403 });
    }
  }

  const body = await request.json();

  const newProject: Project = {
    id: generateId(),
    tenantId: session.tenantId,
    name: body.name,
    description: body.description || '',
    status: body.status || 'active',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    dueDate: body.dueDate || '',
    progress: 0,
    color: body.color || '#6366f1',
    createdBy: session.userId
  };

  await createProject(newProject);

  return NextResponse.json(newProject, { status: 201 });
}
