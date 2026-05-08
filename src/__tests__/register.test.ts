import { describe, it, expect, vi } from 'vitest';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { createRequest } from './helpers';
import * as db from '@/lib/db';

const mockTenant = {
  id: 'tenant-2',
  name: 'Acme Corp',
  slug: 'acme-corp',
  plan: 'free',
  createdAt: '2026-01-01',
  maxUsers: 5,
  maxProjects: 10,
};

describe('POST /api/auth/register', () => {
  it('returns 400 when email is missing', async () => {
    const req = createRequest({ method: 'POST', body: { password: 'test123', name: 'Tester' } });
    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Email');
  });

  it('returns 400 when password is missing', async () => {
    const req = createRequest({ method: 'POST', body: { email: 'a@b.com', name: 'Tester' } });
    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('password');
  });

  it('returns 400 when name is missing', async () => {
    const req = createRequest({ method: 'POST', body: { email: 'a@b.com', password: 'test123' } });
    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('name');
  });

  it('returns 400 when password is too short', async () => {
    const req = createRequest({ method: 'POST', body: { email: 'a@b.com', password: '12345', name: 'Tester' } });
    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('6 characters');
  });

  it('returns 409 when email already exists', async () => {
    const req = createRequest({ method: 'POST', body: { email: 'admin@demo.com', password: 'test123', name: 'Tester' } });
    const res = await registerHandler(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('already exists');
  });

  it('returns 400 when companyName is missing for new org', async () => {
    const req = createRequest({ method: 'POST', body: { email: 'new@demo.com', password: 'test123', name: 'Tester' } });
    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Company name');
  });

  it('returns 409 when organization slug already exists', async () => {
    vi.mocked(db.getTenantBySlug).mockResolvedValueOnce(mockTenant);
    const req = createRequest({ method: 'POST', body: { email: 'new@demo.com', password: 'test123', name: 'Tester', companyName: 'Acme Corp' } });
    const res = await registerHandler(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('already exists');
  });

  it('returns 400 when invite code is invalid', async () => {
    const req = createRequest({ method: 'POST', body: { email: 'new@demo.com', password: 'test123', name: 'Tester', inviteCode: 'nonexistent' } });
    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('invite code');
  });

  it('returns 403 when organization is at user limit', async () => {
    vi.mocked(db.getTenantBySlug).mockResolvedValueOnce(mockTenant);
    vi.mocked(db.getUserCountByTenant).mockResolvedValueOnce(100);
    const req = createRequest({ method: 'POST', body: { email: 'new@demo.com', password: 'test123', name: 'Tester', inviteCode: 'acme-corp' } });
    const res = await registerHandler(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('user limit');
  });

  it('creates a new organization and owner user', async () => {
    vi.mocked(db.getTenantBySlug).mockResolvedValueOnce(null);
    vi.mocked(db.createTenant).mockClear();
    vi.mocked(db.createUser).mockClear();
    const req = createRequest({ method: 'POST', body: { email: 'new@demo.com', password: 'test123', name: 'New User', companyName: 'New Org' } });
    const res = await registerHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('new@demo.com');
    expect(body.user.name).toBe('New User');
    expect(body.user.role).toBe('owner');
    expect(res.headers.getSetCookie()).toHaveLength(1);
    expect(res.headers.getSetCookie()[0]).toContain('session=');
    expect(db.createTenant).toHaveBeenCalledTimes(1);
    expect(db.createUser).toHaveBeenCalledTimes(1);
  });

  it('joins an existing organization via invite code', async () => {
    vi.mocked(db.getTenantBySlug).mockResolvedValueOnce(mockTenant);
    vi.mocked(db.getUserCountByTenant).mockResolvedValueOnce(3);
    vi.mocked(db.createUser).mockClear();
    const req = createRequest({ method: 'POST', body: { email: 'joiner@demo.com', password: 'test123', name: 'Joiner', inviteCode: 'acme-corp' } });
    const res = await registerHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('joiner@demo.com');
    expect(body.user.role).toBe('member');
    expect(db.createUser).toHaveBeenCalledTimes(1);
  });
});
