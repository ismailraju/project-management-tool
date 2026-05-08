import { NextResponse } from 'next/server';
import { getSessionFromRequest, getProject, getTasksByTenant, createTask, recalculateProjectProgress, getUser, generateId, canEditTasks } from '@/lib/db';
import { Task } from '@/types';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  const tasks = await getTasksByTenant(session.tenantId, projectId || undefined);

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canEditTasks(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  const project = await getProject(body.projectId);
  if (!project || project.tenantId !== session.tenantId) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const assigneeUser = body.assigneeId ? await getUser(body.assigneeId) : null;

  const newTask: Task = {
    id: generateId(),
    tenantId: session.tenantId,
    projectId: body.projectId,
    title: body.title,
    description: body.description || '',
    status: body.status || 'todo',
    priority: body.priority || 'medium',
    assigneeId: body.assigneeId || '',
    assigneeName: assigneeUser?.name || body.assigneeName || '',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    startDate: body.startDate || body.createdAt || new Date().toISOString().split('T')[0],
    dueDate: body.dueDate || '',
    dependsOn: body.dependsOn || '',
    createdBy: session.userId
  };

  await createTask(newTask);
  await recalculateProjectProgress(body.projectId, session.tenantId);

  return NextResponse.json(newTask, { status: 201 });
}
