import { describe, it, expect, vi } from 'vitest';
import { GET as getTeamInfo, PUT as updateTeamInfo } from '@/app/api/team/info/route';
import { createRequest, adminSession, memberSession } from './helpers';
import * as db from '@/lib/db';

describe('GET /api/team/info', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({});
    const res = await getTeamInfo(req);
    expect(res.status).toBe(401);
  });

  it('returns 404 when tenant not found', async () => {
    vi.mocked(db.getTenant).mockResolvedValueOnce(null);
    const req = createRequest({ sessionToken: adminSession });
    const res = await getTeamInfo(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('Tenant not found');
  });

  it('returns team info with valid session', async () => {
    vi.mocked(db.getTenant).mockClear();
    const req = createRequest({ sessionToken: adminSession });
    const res = await getTeamInfo(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tenant).toBeDefined();
    expect(body.tenant.name).toBe('Demo Company');
    expect(body.tenant.plan).toBe('professional');
    expect(body.tenant.maxUsers).toBe(50);
    expect(body.tenant.maxProjects).toBe(100);
    expect(body.stats).toBeDefined();
    expect(body.stats.totalUsers).toBeGreaterThan(0);
    expect(body.stats.activeUsers).toBeGreaterThan(0);
    expect(body.inviteCode).toBe('demo');
  });
});

describe('PUT /api/team/info', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({ method: 'PUT', body: { name: 'New Name' } });
    const res = await updateTeamInfo(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-owner role', async () => {
    const req = createRequest({ method: 'PUT', body: { name: 'New Name' }, sessionToken: memberSession });
    const res = await updateTeamInfo(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('owner');
  });

  it('returns 400 when name is missing', async () => {
    const req = createRequest({ method: 'PUT', body: {}, sessionToken: adminSession });
    const res = await updateTeamInfo(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Name');
  });

  it('updates tenant name', async () => {
    const mockUpdatedTenant = { id: 'tenant-1', name: 'New Company Name', slug: 'demo', plan: 'professional', createdAt: '2026-01-01', maxUsers: 50, maxProjects: 100 };
    vi.mocked(db.getTenant).mockResolvedValueOnce(mockUpdatedTenant);
    vi.mocked(db.updateTenant).mockClear();
    const req = createRequest({ method: 'PUT', body: { name: 'New Company Name' }, sessionToken: adminSession });
    const res = await updateTeamInfo(req);
    expect(res.status).toBe(200);
    expect(db.updateTenant).toHaveBeenCalledWith('tenant-1', { name: 'New Company Name' });
    const body = await res.json();
    expect(body.name).toBe('New Company Name');
  });
});
