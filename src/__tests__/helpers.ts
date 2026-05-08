export function createRequest({
  method = 'GET',
  body,
  sessionToken,
  url = 'http://localhost:3000',
  searchParams,
}: {
  method?: string;
  body?: unknown;
  sessionToken?: string;
  url?: string;
  searchParams?: Record<string, string>;
}): Request {
  const headers: Record<string, string> = {};

  if (sessionToken) {
    headers['cookie'] = `session=${sessionToken}`;
  }

  if (body) {
    headers['content-type'] = 'application/json';
  }

  let fullUrl = url;
  if (searchParams) {
    const params = new URLSearchParams(searchParams);
    fullUrl += `?${params.toString()}`;
  }

  return new Request(fullUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function createSessionToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fakesig`;
}

export const adminSession = createSessionToken({
  userId: 'user-1',
  tenantId: 'tenant-1',
  email: 'admin@demo.com',
  name: 'Admin User',
  role: 'owner',
  tenantName: 'Demo Company',
  exp: Date.now() + 86400000,
});

export const managerSession = createSessionToken({
  userId: 'user-2',
  tenantId: 'tenant-1',
  email: 'manager@demo.com',
  name: 'Sarah Manager',
  role: 'manager',
  tenantName: 'Demo Company',
  exp: Date.now() + 86400000,
});

export const memberSession = createSessionToken({
  userId: 'user-3',
  tenantId: 'tenant-1',
  email: 'member@demo.com',
  name: 'John Member',
  role: 'member',
  tenantName: 'Demo Company',
  exp: Date.now() + 86400000,
});

export const expiredSession = createSessionToken({
  userId: 'user-1',
  tenantId: 'tenant-1',
  email: 'admin@demo.com',
  name: 'Admin User',
  role: 'owner',
  tenantName: 'Demo Company',
  exp: Date.now() - 1000,
});
