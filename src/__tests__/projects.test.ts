import { describe, it, expect } from 'vitest';
import { GET as listProjects, POST as createProject } from '@/app/api/projects/route';
import { GET as getProject, PUT as updateProject, DELETE as deleteProject } from '@/app/api/projects/[id]/route';
import { createRequest, adminSession, managerSession, memberSession } from './helpers';

describe('GET /api/projects', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({});
    const res = await listProjects(req);
    expect(res.status).toBe(401);
  });

  it('returns projects list for authenticated user', async () => {
    const req = createRequest({ sessionToken: adminSession });
    const res = await listProjects(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(2);
    expect(body[0]).toHaveProperty('name');
    expect(body[0]).toHaveProperty('status');
    expect(body[0]).toHaveProperty('progress');
  });
});

describe('POST /api/projects', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({ method: 'POST', body: { name: 'Test' } });
    const res = await createProject(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 for member role', async () => {
    const req = createRequest({ method: 'POST', body: { name: 'Test' }, sessionToken: memberSession });
    const res = await createProject(req);
    expect(res.status).toBe(403);
  });

  it('creates project for admin/manager', async () => {
    const req = createRequest({
      method: 'POST',
      body: { name: 'New Project', description: 'Test', dueDate: '2026-12-31' },
      sessionToken: adminSession,
    });
    const res = await createProject(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('New Project');
    expect(body.description).toBe('Test');
    expect(body.dueDate).toBe('2026-12-31');
    expect(body.tenantId).toBe('tenant-1');
    expect(body.status).toBe('active');
    expect(body.progress).toBe(0);
  });

  it('creates project with defaults', async () => {
    const req = createRequest({
      method: 'POST',
      body: { name: 'Minimal' },
      sessionToken: adminSession,
    });
    const res = await createProject(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('Minimal');
    expect(body.description).toBe('');
    expect(body.color).toBe('#6366f1');
  });
});

describe('GET /api/projects/[id]', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({});
    const res = await getProject(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(401);
  });

  it('returns project by id', async () => {
    const req = createRequest({ sessionToken: adminSession });
    const res = await getProject(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('1');
    expect(body.name).toBe('Website Redesign');
  });

  it('returns 404 for non-existent project', async () => {
    const req = createRequest({ sessionToken: adminSession });
    const res = await getProject(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/projects/[id]', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({ method: 'PUT', body: { name: 'Updated' } });
    const res = await updateProject(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 for member role', async () => {
    const req = createRequest({ method: 'PUT', body: { name: 'Updated' }, sessionToken: memberSession });
    const res = await updateProject(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(403);
  });

  it('updates project for manager', async () => {
    const req = createRequest({ method: 'PUT', body: { name: 'Updated Name' }, sessionToken: managerSession });
    const res = await updateProject(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Updated Name');
  });

  it('returns 404 for non-existent project', async () => {
    const req = createRequest({ method: 'PUT', body: { name: 'Updated' }, sessionToken: adminSession });
    const res = await updateProject(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/projects/[id]', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({ method: 'DELETE' });
    const res = await deleteProject(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 for member role', async () => {
    const req = createRequest({ method: 'DELETE', sessionToken: memberSession });
    const res = await deleteProject(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(403);
  });

  it('returns 403 for manager role', async () => {
    const req = createRequest({ method: 'DELETE', sessionToken: managerSession });
    const res = await deleteProject(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(403);
  });

  it('deletes project for admin/owner', async () => {
    const req = createRequest({ method: 'DELETE', sessionToken: adminSession });
    const res = await deleteProject(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 404 for non-existent project', async () => {
    const req = createRequest({ method: 'DELETE', sessionToken: adminSession });
    const res = await deleteProject(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});
