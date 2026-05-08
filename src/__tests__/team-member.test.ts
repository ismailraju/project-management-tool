import { describe, it, expect, vi } from 'vitest';
import { DELETE as deleteMember, PATCH as updateMember } from '@/app/api/team/[id]/route';
import { createRequest, adminSession, memberSession } from './helpers';
import * as db from '@/lib/db';

describe('DELETE /api/team/[id]', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({ method: 'DELETE' });
    const res = await deleteMember(req, { params: Promise.resolve({ id: 'user-2' }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin role', async () => {
    const req = createRequest({ method: 'DELETE', sessionToken: memberSession });
    const res = await deleteMember(req, { params: Promise.resolve({ id: 'user-2' }) });
    expect(res.status).toBe(403);
  });

  it('returns 404 when user not found', async () => {
    vi.mocked(db.getUser).mockResolvedValueOnce(null);
    const req = createRequest({ method: 'DELETE', sessionToken: adminSession });
    const res = await deleteMember(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('User not found');
  });

  it('returns 400 when deleting own account', async () => {
    const req = createRequest({ method: 'DELETE', sessionToken: adminSession });
    const res = await deleteMember(req, { params: Promise.resolve({ id: 'user-1' }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('own account');
  });

  it('returns 403 when deleting an owner', async () => {
    vi.mocked(db.getUser).mockResolvedValueOnce({
      id: 'user-5', tenantId: 'tenant-1', email: 'owner2@demo.com', name: 'Owner 2',
      role: 'owner', avatar: '', color: '#000', createdAt: '2026-01-01', lastLoginAt: null, isActive: true,
    });
    const req = createRequest({ method: 'DELETE', sessionToken: adminSession });
    const res = await deleteMember(req, { params: Promise.resolve({ id: 'user-5' }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Cannot delete the owner');
  });

  it('returns 403 when user not in same tenant', async () => {
    vi.mocked(db.getUser).mockResolvedValueOnce({
      id: 'user-99', tenantId: 'tenant-2', email: 'other@demo.com', name: 'Other',
      role: 'member', avatar: '', color: '#000', createdAt: '2026-01-01', lastLoginAt: null, isActive: true,
    });
    const req = createRequest({ method: 'DELETE', sessionToken: adminSession });
    const res = await deleteMember(req, { params: Promise.resolve({ id: 'user-99' }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('not in your organization');
  });

  it('deletes a team member successfully', async () => {
    vi.mocked(db.deleteUser).mockClear();
    const req = createRequest({ method: 'DELETE', sessionToken: adminSession });
    const res = await deleteMember(req, { params: Promise.resolve({ id: 'user-3' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(db.deleteUser).toHaveBeenCalledWith('user-3');
  });
});

describe('PATCH /api/team/[id]', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({ method: 'PATCH', body: { userId: 'user-2', role: 'admin' } });
    const res = await updateMember(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when userId is missing', async () => {
    const req = createRequest({ method: 'PATCH', body: { role: 'admin' }, sessionToken: adminSession });
    const res = await updateMember(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('User ID');
  });

  it('returns 404 when user not found', async () => {
    vi.mocked(db.getUser).mockResolvedValueOnce(null);
    const req = createRequest({ method: 'PATCH', body: { userId: 'nonexistent', role: 'admin' }, sessionToken: adminSession });
    const res = await updateMember(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('User not found');
  });

  it('returns 403 when user not in same tenant', async () => {
    vi.mocked(db.getUser).mockResolvedValueOnce({
      id: 'user-99', tenantId: 'tenant-2', email: 'other@demo.com', name: 'Other',
      role: 'member', avatar: '', color: '#000', createdAt: '2026-01-01', lastLoginAt: null, isActive: true,
    });
    const req = createRequest({ method: 'PATCH', body: { userId: 'user-99', role: 'admin' }, sessionToken: adminSession });
    const res = await updateMember(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('not in your organization');
  });

  it('returns 403 when non-owner tries to modify owner', async () => {
    const req = createRequest({ method: 'PATCH', body: { userId: 'user-1', role: 'admin' }, sessionToken: memberSession });
    const res = await updateMember(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Cannot modify owner');
  });

  it('returns 403 when non-owner tries to assign owner', async () => {
    const req = createRequest({ method: 'PATCH', body: { userId: 'user-2', role: 'owner' }, sessionToken: memberSession });
    const res = await updateMember(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('owner can assign');
  });

  it('updates member role successfully', async () => {
    vi.mocked(db.updateUser).mockClear();
    vi.mocked(db.getUser)
      .mockResolvedValueOnce({
        id: 'user-3', tenantId: 'tenant-1', email: 'member@demo.com', name: 'John Member',
        role: 'member', avatar: '', color: '#22c55e', createdAt: '2026-02-01', lastLoginAt: null, isActive: true,
      })
      .mockResolvedValueOnce({
        id: 'user-3', tenantId: 'tenant-1', email: 'member@demo.com', name: 'John Member',
        role: 'admin', avatar: '', color: '#22c55e', createdAt: '2026-02-01', lastLoginAt: null, isActive: true,
      });
    const req = createRequest({ method: 'PATCH', body: { userId: 'user-3', role: 'admin' }, sessionToken: adminSession });
    const res = await updateMember(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('admin');
    expect(db.updateUser).toHaveBeenCalledWith('user-3', { role: 'admin' });
  });
});
