import assert from 'node:assert/strict';
import test from 'node:test';
import { loadSourceModule } from './helpers/loadSourceModule.mts';

const callbackUrl = new URL('../src/app/auth/callback/route.ts', import.meta.url);
const signoutUrl = new URL('../src/app/auth/signout/route.ts', import.meta.url);
const proxyUrl = new URL('../src/utils/supabase/proxy.ts', import.meta.url);

function response(kind: string, url?: URL | string, options?: { status?: number }) {
  const cookieStore = new Map<string, string>();
  return {
    kind,
    destination: url?.toString(),
    status: options?.status,
    cookies: {
      getAll: () => [...cookieStore].map(([name, value]) => ({ name, value })),
      set: (name: string, value: string) => { cookieStore.set(name, value); },
    },
  };
}

const nextResponse = {
  next: () => response('next'),
  redirect: (url: URL | string, options?: { status?: number }) => response('redirect', url, options),
};

function request(url: string, headers: Record<string, string> = {}) {
  return {
    url,
    headers: { get: (key: string) => headers[key] ?? null },
  };
}

function nextRequest(url: string) {
  const original = new URL(url);
  const cookieStore = new Map<string, string>();
  return {
    url,
    headers: {},
    nextUrl: {
      pathname: original.pathname,
      searchParams: original.searchParams,
      clone: () => new URL(original),
    },
    cookies: {
      getAll: () => [...cookieStore].map(([name, value]) => ({ name, value })),
      set: (name: string, value: string) => { cookieStore.set(name, value); },
    },
  };
}

async function callback(options: {
  error?: unknown;
  env?: string;
} = {}) {
  let called = 0;
  let roleSetting: boolean | undefined;
  const loaded = await loadSourceModule(callbackUrl, {
    'next/server': { NextResponse: nextResponse },
    '@/utils/supabase/server': {
      createClient: async ({ useServiceRole }: { useServiceRole: boolean }) => {
        called++;
        roleSetting = useServiceRole;
        return { auth: { exchangeCodeForSession: async () => ({ error: options.error ?? null }) } };
      },
    },
  }, { NODE_ENV: options.env ?? 'production' });
  return { GET: loaded.GET as (request: unknown) => Promise<ReturnType<typeof response>>, getCalls: () => called, roleSetting: () => roleSetting };
}

test('OAuth callback without a code goes to an error page without creating a client', async () => {
  const handler = await callback();
  const result = await handler.GET(request('https://found.example/auth/callback'));
  assert.equal(result.destination, 'https://found.example/auth/auth-code-error');
  assert.equal(handler.getCalls(), 0);
});

test('OAuth callback exchanges the code without service-role privileges', async () => {
  const handler = await callback();
  const result = await handler.GET(request('https://found.example/auth/callback?code=fixture'));
  assert.equal(result.destination, 'https://found.example/admin/dashboard');
  assert.equal(handler.getCalls(), 1);
  assert.equal(handler.roleSetting(), false);
});

test('OAuth callback honors forwarded host and relative next path in production', async () => {
  const handler = await callback();
  const result = await handler.GET(request('https://found.example/auth/callback?code=fixture&next=%2Fadmin%2Fitems', { 'x-forwarded-host': 'proxy.example' }));
  assert.equal(result.destination, 'https://proxy.example/admin/items');
});

test('OAuth callback rejected exchange redirects to error page', async () => {
  const handler = await callback({ error: { message: 'synthetic failure' } });
  const result = await handler.GET(request('https://found.example/auth/callback?code=fixture'));
  assert.equal(result.destination, 'https://found.example/auth/auth-code-error');
});

async function signout(user: unknown) {
  let signedOut = 0;
  let roleSetting: boolean | undefined;
  const revalidated: unknown[][] = [];
  const loaded = await loadSourceModule(signoutUrl, {
    'next/server': { NextResponse: nextResponse },
    'next/cache': { revalidatePath: (...args: unknown[]) => { revalidated.push(args); } },
    '@/utils/supabase/server': {
      createClient: async ({ useServiceRole }: { useServiceRole: boolean }) => {
        roleSetting = useServiceRole;
        return { auth: { getUser: async () => ({ data: { user } }), signOut: async () => { signedOut++; } } };
      },
    },
  });
  return { POST: loaded.POST as (request: unknown) => Promise<ReturnType<typeof response>>, getSignedOut: () => signedOut, revalidated, roleSetting: () => roleSetting };
}

test('signed-in user is signed out without service role and redirected', async () => {
  const handler = await signout({ id: 'synthetic-user' });
  const result = await handler.POST(request('https://found.example/auth/signout'));
  assert.equal(handler.roleSetting(), false);
  assert.equal(handler.getSignedOut(), 1);
  assert.deepEqual(handler.revalidated, [['/', 'layout']]);
  assert.equal(result.destination, 'https://found.example/login');
  assert.equal(result.status, 302);
});

test('signout does not issue a sign-out call for anonymous users', async () => {
  const handler = await signout(null);
  const result = await handler.POST(request('https://found.example/auth/signout'));
  assert.equal(handler.getSignedOut(), 0);
  assert.equal(result.destination, 'https://found.example/login');
});

async function proxy(options: { user?: unknown; env?: string; setCookie?: boolean } = {}) {
  let clientCreated = 0;
  const loaded = await loadSourceModule(proxyUrl, {
    'next/server': { NextResponse: nextResponse },
    '@supabase/ssr': {
      createServerClient: (_url: string, _key: string, config: { cookies: { setAll: (cookies: { name: string; value: string }[]) => void } }) => {
        clientCreated++;
        return { auth: {
          getUser: async () => {
            if (options.setCookie) config.cookies.setAll([{ name: 'fixture-cookie', value: 'synthetic' }]);
            return { data: { user: options.user ?? null } };
          },
        } };
      },
    },
  }, { NODE_ENV: options.env ?? 'production', NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fixture' });
  return { updateSession: loaded.updateSession as (request: unknown) => Promise<ReturnType<typeof response>>, getClientCreated: () => clientCreated };
}

test('proxy sends OAuth code requests to the callback before loading auth', async () => {
  const handler = await proxy();
  const result = await handler.updateSession(nextRequest('https://found.example/admin?code=fixture'));
  assert.equal(result.destination, 'https://found.example/auth/callback?code=fixture');
  assert.equal(handler.getClientCreated(), 0);
});

test('proxy blocks anonymous access to an admin route in production', async () => {
  const handler = await proxy({ user: null });
  const result = await handler.updateSession(nextRequest('https://found.example/admin/items'));
  assert.equal(result.kind, 'redirect');
  assert.equal(result.destination, 'https://found.example/login');
});

test('proxy allows an authenticated user through the admin route', async () => {
  const handler = await proxy({ user: { id: 'synthetic-user' } });
  const result = await handler.updateSession(nextRequest('https://found.example/admin/items'));
  assert.equal(result.kind, 'next');
});

test('proxy keeps public pages available to anonymous users', async () => {
  const handler = await proxy({ user: null });
  const result = await handler.updateSession(nextRequest('https://found.example/'));
  assert.equal(result.kind, 'next');
});

test('proxy preserves refreshed session cookies on anonymous admin redirect', async () => {
  const handler = await proxy({ user: null, setCookie: true });
  const result = await handler.updateSession(nextRequest('https://found.example/admin/items'));
  assert.equal(result.destination, 'https://found.example/login');
  assert.deepEqual(result.cookies.getAll(), [{ name: 'fixture-cookie', value: 'synthetic' }]);
});

test('proxy keeps its documented development-only anonymous admin bypass', async () => {
  const handler = await proxy({ user: null, env: 'development' });
  const result = await handler.updateSession(nextRequest('https://found.example/admin/items'));
  assert.equal(result.kind, 'next');
});
