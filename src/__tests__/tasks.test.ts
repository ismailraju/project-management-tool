import { describe, it, expect } from 'vitest';
import { GET as listTasks, POST as createTask } from '@/app/api/tasks/route';
import { GET as getTask, PUT as updateTask, DELETE as deleteTask } from '@/app/api/tasks/[id]/route';
import { createRequest, adminSession, memberSession } from './helpers';

describe('GET /api/tasks', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({});
    const res = await listTasks(req);
    expect(res.status).toBe(401);
  });

  it('returns all tasks for tenant', async () => {
    const req = createRequest({ sessionToken: adminSession });
    const res = await listTasks(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(2);
  });

  it('filters tasks by projectId', async () => {
    const req = createRequest({ sessionToken: adminSession, searchParams: { projectId: '1' } });
    const res = await listTasks(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    body.forEach((t: { projectId: string }) => {
      expect(t.projectId).toBe('1');
    });
  });
});

describe('POST /api/tasks', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({ method: 'POST', body: { title: 'Test', projectId: '1' } });
    const res = await createTask(req);
    expect(res.status).toBe(401);
  });

  it('creates task for any authenticated role', async () => {
    const req = createRequest({
      method: 'POST',
      body: {
        title: 'New Task',
        description: 'Test description',
        projectId: '1',
        status: 'in-progress',
        priority: 'high',
        assigneeId: 'user-3',
        startDate: '2026-06-01',
        dueDate: '2026-06-15',
        dependsOn: '1',
      },
      sessionToken: memberSession,
    });
    const res = await createTask(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe('New Task');
    expect(body.description).toBe('Test description');
    expect(body.projectId).toBe('1');
    expect(body.status).toBe('in-progress');
    expect(body.priority).toBe('high');
    expect(body.assigneeId).toBe('user-3');
    expect(body.startDate).toBe('2026-06-01');
    expect(body.dueDate).toBe('2026-06-15');
    expect(body.dependsOn).toBe('1');
    expect(body.createdBy).toBe('user-3');
  });

  it('creates task with defaults', async () => {
    const req = createRequest({
      method: 'POST',
      body: { title: 'Minimal Task', projectId: '1' },
      sessionToken: adminSession,
    });
    const res = await createTask(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('todo');
    expect(body.priority).toBe('medium');
    expect(body.description).toBe('');
    expect(body.assigneeId).toBe('');
  });

  it('returns 404 for non-existent project', async () => {
    const req = createRequest({
      method: 'POST',
      body: { title: 'Task', projectId: 'nonexistent' },
      sessionToken: adminSession,
    });
    const res = await createTask(req);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/tasks/[id]', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({});
    const res = await getTask(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(401);
  });

  it('returns task by id', async () => {
    const req = createRequest({ sessionToken: adminSession });
    const res = await getTask(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('1');
    expect(body.title).toBe('Design homepage');
  });

  it('returns 404 for non-existent task', async () => {
    const req = createRequest({ sessionToken: adminSession });
    const res = await getTask(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/tasks/[id]', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({ method: 'PUT', body: { title: 'Updated' } });
    const res = await updateTask(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(401);
  });

  it('updates task fields', async () => {
    const req = createRequest({
      method: 'PUT',
      body: { title: 'Updated Title', status: 'done', priority: 'urgent' },
      sessionToken: memberSession,
    });
    const res = await updateTask(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Updated Title');
    expect(body.status).toBe('done');
    expect(body.priority).toBe('urgent');
  });

  it('updates assignee with name resolution', async () => {
    const req = createRequest({
      method: 'PUT',
      body: { assigneeId: 'user-2' },
      sessionToken: adminSession,
    });
    const res = await updateTask(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.assigneeId).toBe('user-2');
    expect(body.assigneeName).toBe('Sarah Manager');
  });

  it('updates task dates and dependency', async () => {
    const req = createRequest({
      method: 'PUT',
      body: { startDate: '2026-07-01', dueDate: '2026-07-15', dependsOn: '2' },
      sessionToken: adminSession,
    });
    const res = await updateTask(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.startDate).toBe('2026-07-01');
    expect(body.dueDate).toBe('2026-07-15');
    expect(body.dependsOn).toBe('2');
  });

  it('returns 404 for non-existent task', async () => {
    const req = createRequest({ method: 'PUT', body: { title: 'Updated' }, sessionToken: adminSession });
    const res = await updateTask(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/tasks/[id]', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({ method: 'DELETE' });
    const res = await deleteTask(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(401);
  });

  it('deletes task for any authenticated role', async () => {
    const req = createRequest({ method: 'DELETE', sessionToken: memberSession });
    const res = await deleteTask(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 404 for non-existent task', async () => {
    const req = createRequest({ method: 'DELETE', sessionToken: adminSession });
    const res = await deleteTask(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});
