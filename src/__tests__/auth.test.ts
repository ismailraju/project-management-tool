import { describe, it, expect } from 'vitest';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { GET as meHandler } from '@/app/api/auth/me/route';
import { createRequest, adminSession, expiredSession } from './helpers';

describe('POST /api/auth/login', () => {
  it('returns 400 when email is missing', async () => {
    const req = createRequest({ method: 'POST', body: { password: 'admin123' } });
    const res = await loginHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Email and password are required');
  });

  it('returns 400 when password is missing', async () => {
    const req = createRequest({ method: 'POST', body: { email: 'admin@demo.com' } });
    const res = await loginHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Email and password are required');
  });

  it('returns 401 for invalid email', async () => {
    const req = createRequest({ method: 'POST', body: { email: 'wrong@demo.com', password: 'admin123' } });
    const res = await loginHandler(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid email or password');
  });

  it('returns 401 for wrong password', async () => {
    const req = createRequest({ method: 'POST', body: { email: 'admin@demo.com', password: 'wrongpass' } });
    const res = await loginHandler(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid email or password');
  });

  it('returns 403 for inactive account', async () => {
    const req = createRequest({ method: 'POST', body: { email: 'inactive@demo.com', password: 'inactive123' } });
    const res = await loginHandler(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('deactivated');
  });

  it('returns 200 and sets session cookie on valid login', async () => {
    const req = createRequest({ method: 'POST', body: { email: 'admin@demo.com', password: 'admin123' } });
    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('admin@demo.com');
    expect(body.user.name).toBe('Admin User');
    expect(body.user.role).toBe('owner');
    expect(res.headers.getSetCookie()).toHaveLength(1);
    expect(res.headers.getSetCookie()[0]).toContain('session=');
  });

  it('returns 200 for manager login', async () => {
    const req = createRequest({ method: 'POST', body: { email: 'manager@demo.com', password: 'manager123' } });
    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.role).toBe('manager');
  });
});

describe('GET /api/auth/me', () => {
  it('returns user null when no cookie', async () => {
    const req = createRequest({});
    const res = await meHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it('returns user null with expired session', async () => {
    const req = createRequest({ sessionToken: expiredSession });
    const res = await meHandler(req);
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it('returns user data with valid session', async () => {
    const req = createRequest({ sessionToken: adminSession });
    const res = await meHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('admin@demo.com');
    expect(body.user.name).toBe('Admin User');
    expect(body.user.role).toBe('owner');
    expect(body.user.tenantName).toBe('Demo Company');
    expect(body.user.tenantPlan).toBe('professional');
  });
});
