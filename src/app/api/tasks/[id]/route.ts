import { NextResponse } from 'next/server';
import { getSessionFromRequest, getTask, getUser, updateTask, deleteTask, recalculateProjectProgress, canEditTasks } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const task = await getTask(id);

  if (!task || task.tenantId !== session.tenantId) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canEditTasks(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const task = await getTask(id);

  if (!task || task.tenantId !== session.tenantId) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const body = await request.json();

  if (body.assigneeId) {
    const assignee = await getUser(body.assigneeId);
    body.assigneeName = assignee?.name || body.assigneeName || '';
  }

  const updated = {
    ...body,
    updatedAt: new Date().toISOString().split('T')[0]
  };

  await updateTask(id, updated);
  await recalculateProjectProgress(task.projectId, session.tenantId);

  const saved = await getTask(id);
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

  if (!canEditTasks(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const task = await getTask(id);

  if (!task || task.tenantId !== session.tenantId) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const projectId = task.projectId;
  await deleteTask(id);
  await recalculateProjectProgress(projectId, session.tenantId);

  return NextResponse.json({ success: true });
}
