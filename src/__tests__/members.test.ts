import { describe, it, expect } from 'vitest';
import { GET as listMembers } from '@/app/api/members/route';
import { createRequest, adminSession } from './helpers';

describe('GET /api/members', () => {
  it('returns 401 without session', async () => {
    const req = createRequest({});
    const res = await listMembers(req);
    expect(res.status).toBe(401);
  });

  it('returns active members for tenant', async () => {
    const req = createRequest({ sessionToken: adminSession });
    const res = await listMembers(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    const inactiveMember = body.find((m: { email: string }) => m.email === 'inactive@demo.com');
    expect(inactiveMember).toBeUndefined();
    body.forEach((m: { id: string; name: string; email: string; role: string; color: string }) => {
      expect(m).toHaveProperty('id');
      expect(m).toHaveProperty('name');
      expect(m).toHaveProperty('email');
      expect(m).toHaveProperty('role');
      expect(m).toHaveProperty('color');
    });
  });
});
