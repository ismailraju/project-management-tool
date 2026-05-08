import { describe, it, expect } from 'vitest';
import { GET as listTeam, POST as createTeamMember } from '@/app/api/team/route';
import { createRequest, adminSession, memberSession } from './helpers';

describe('GET /api/team', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({});
    const res = await listTeam(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 for member role', async () => {
    const req = createRequest({ sessionToken: memberSession });
    const res = await listTeam(req);
    expect(res.status).toBe(403);
  });

  it('returns team members for admin/owner', async () => {
    const req = createRequest({ sessionToken: adminSession });
    const res = await listTeam(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    body.forEach((m: { id: string; name: string; email: string; role: string; isActive: boolean }) => {
      expect(m).toHaveProperty('id');
      expect(m).toHaveProperty('name');
      expect(m).toHaveProperty('email');
      expect(m).toHaveProperty('role');
      expect(m).toHaveProperty('isActive');
    });
  });
});

describe('POST /api/team', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({ method: 'POST', body: { name: 'Test', email: 'test@test.com', password: 'test123' } });
    const res = await createTeamMember(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 for member role', async () => {
    const req = createRequest({
      method: 'POST',
      body: { name: 'Test', email: 'test@test.com', password: 'test123' },
      sessionToken: memberSession,
    });
    const res = await createTeamMember(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 when required fields are missing', async () => {
    const req = createRequest({
      method: 'POST',
      body: { name: 'Test' },
      sessionToken: adminSession,
    });
    const res = await createTeamMember(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('required');
  });

  it('returns 409 when email already exists', async () => {
    const req = createRequest({
      method: 'POST',
      body: { name: 'Dup', email: 'admin@demo.com', password: 'pass123' },
      sessionToken: adminSession,
    });
    const res = await createTeamMember(req);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain('already exists');
  });

  it('creates a new team member as admin/owner', async () => {
    const req = createRequest({
      method: 'POST',
      body: { name: 'New Member', email: 'new@demo.com', password: 'newpass123', role: 'member' },
      sessionToken: adminSession,
    });
    const res = await createTeamMember(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('New Member');
    expect(body.email).toBe('new@demo.com');
    expect(body.role).toBe('member');
    expect(body.isActive).toBe(true);
    expect(body).toHaveProperty('color');
  });
});
