import { NextResponse } from 'next/server';
import { getSessionFromRequest, getProject, updateProject, deleteProject, canManageProjects, canDeleteProject } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const project = await getProject(id);

  if (!project || project.tenantId !== session.tenantId) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canManageProjects(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const project = await getProject(id);

  if (!project || project.tenantId !== session.tenantId) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const body = await request.json();
  const updated = {
    ...body,
    updatedAt: new Date().toISOString().split('T')[0]
  };

  await updateProject(id, updated);

  const saved = await getProject(id);
  return NextResponse.json(saved);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canDeleteProject(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const project = await getProject(id);

  if (!project || project.tenantId !== session.tenantId) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  await deleteProject(id);

  return NextResponse.json({ success: true });
}
