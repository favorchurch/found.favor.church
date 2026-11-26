import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { loadSourceModule } from './helpers/loadSourceModule.mts';

const signoutUrl = new URL('../src/app/auth/signout/route.ts', import.meta.url);
const proxyUrl = new URL('../src/proxy.ts', import.meta.url);
const loginFormUrl = new URL('../src/components/auth/LoginForm.tsx', import.meta.url);

/** Values built inside the VM context have a different Object prototype; compare plain copies. */
const plain = (value: unknown) => JSON.parse(JSON.stringify(value));

function redirectResponse(url: URL | string, options?: { status?: number }) {
  return { kind: 'redirect', destination: url.toString(), status: options?.status };
}

const nextResponse = { redirect: redirectResponse };

async function signout() {
  const loaded = await loadSourceModule(signoutUrl, { 'next/server': { NextResponse: nextResponse } });
  return loaded.POST as (request: unknown) => Promise<ReturnType<typeof redirectResponse>>;
}

test('signout hands off to the Auth0 logout route and imports no Supabase code', async () => {
  const POST = await signout();
  const result = await POST({ url: 'https://found.example/auth/signout' });
  assert.equal(result.destination, 'https://found.example/auth/logout');
  assert.equal(result.status, 303);
});

test('the old Supabase auth code paths are gone', () => {
  for (const path of ['../src/app/auth/callback/route.ts', '../src/utils/supabase/proxy.ts']) {
    assert.throws(() => readFileSync(new URL(path, import.meta.url)), /ENOENT/, path);
  }
  const server = readFileSync(new URL('../src/utils/supabase/server.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(server, /@supabase\/ssr|SERVICE_ROLE|SECRET_KEY|exchangeCodeForSession/);
});

test('proxy delegates every request to the Auth0 middleware and keeps its matcher', async () => {
  const seen: unknown[] = [];
  const middlewareResult = { kind: 'auth0-response' };
  const loaded = await loadSourceModule(proxyUrl, {
    'next/server': {},
    '@/lib/auth/session': { auth0: { middleware: async (request: unknown) => { seen.push(request); return middlewareResult; } } },
  });
  const request = { url: 'https://found.example/auth/login' };
  const result = await (loaded.proxy as (request: unknown) => Promise<unknown>)(request);
  assert.equal(result, middlewareResult);
  assert.equal(seen.length, 1);
  assert.equal(seen[0], request);

  const matcher = (loaded.config as { matcher: string[] }).matcher[0];
  const regex = new RegExp('^' + matcher + '$');
  assert.equal(regex.test('/auth/login'), true);
  assert.equal(regex.test('/auth/callback'), true);
  assert.equal(regex.test('/admin/dashboard'), true);
  assert.equal(regex.test('/_next/static/chunk.js'), false);
});

test('proxy does not treat a ?code= query as a Supabase exchange', async () => {
  const source = readFileSync(proxyUrl, 'utf8');
  assert.doesNotMatch(source, /searchParams|exchangeCodeForSession|supabase/i);
});

test('the login form sends users to Auth0 login and returns to the dashboard', () => {
  const source = readFileSync(loginFormUrl, 'utf8');
  assert.match(source, /\/auth\/login\?returnTo=%2Fadmin%2Fdashboard/);
  assert.doesNotMatch(source, /signInWithOAuth|supabase/i);
});

const sessionUrl = new URL('../src/lib/auth/session.ts', import.meta.url);

async function loadSession(env: Record<string, string>) {
  const configs: unknown[] = [];
  class FakeAuth0Client { constructor(config: unknown) { configs.push(config); } }
  const loaded = await loadSourceModule(sessionUrl, { '@auth0/nextjs-auth0/server': { Auth0Client: FakeAuth0Client } }, env);
  return { configs, loaded };
}

test('the Auth0 client defaults to the prod audience and reads no other env at import', async () => {
  const { configs, loaded } = await loadSession({});
  assert.equal(configs.length, 1);
  assert.deepEqual(plain(configs[0]), {
    authorizationParameters: {
      audience: 'https://favorchurch.au.auth0.com/userinfo',
      scope: 'openid profile email',
    },
  });
  assert.equal(loaded.AUTH0_AUDIENCE, 'https://favorchurch.au.auth0.com/userinfo');
});

test('AUTH0_AUDIENCE overrides the audience sent to Auth0', async () => {
  const audience = 'https://favorchurch-preview.au.auth0.com/userinfo';
  const { configs, loaded } = await loadSession({ AUTH0_AUDIENCE: audience });
  assert.equal(plain(configs[0]).authorizationParameters.audience, audience);
  assert.equal(loaded.AUTH0_AUDIENCE, audience);
});

test('an empty AUTH0_AUDIENCE falls back to the prod default', async () => {
  const { configs } = await loadSession({ AUTH0_AUDIENCE: '' });
  assert.equal(plain(configs[0]).authorizationParameters.audience, 'https://favorchurch.au.auth0.com/userinfo');
});
