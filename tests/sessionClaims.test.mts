import assert from 'node:assert/strict';
import test from 'node:test';
import { CLAIM } from './helpers/authFixtures.mts';
import { loadSourceModule } from './helpers/loadSourceModule.mts';

// Real SDK claim filter, so the test reflects what the SDK would otherwise keep.
const sdk = await import('@auth0/nextjs-auth0/server');

type Saved = { user: Record<string, unknown>; internal?: unknown };
type Hook = (session: { user: Record<string, unknown>; internal?: unknown }) => Promise<Saved>;

async function loadSession() {
  const clientOptions: { beforeSessionSaved?: Hook }[] = [];
  const mod = await loadSourceModule(new URL('../src/lib/auth/session.ts', import.meta.url), {
    '@auth0/nextjs-auth0/server': {
      Auth0Client: class { constructor(options: (typeof clientOptions)[number]) { clientOptions.push(options); } },
      filterDefaultIdTokenClaims: sdk.filterDefaultIdTokenClaims,
    },
    '@/lib/auth/claims': { ROCK_PERSON_ID_CLAIM: CLAIM },
  });
  return { hook: mod.keepRockPersonIdClaim as Hook, clientOptions };
}

const baseUser = { sub: 'auth0|1', name: 'Staff', email: 'staff@example.org', email_verified: true };

test('the Auth0 client is configured with the claim-keeping hook', async () => {
  const { hook, clientOptions } = await loadSession();
  assert.equal(clientOptions.length, 1);
  assert.equal(clientOptions[0].beforeSessionSaved, hook);
});

test('session keeps the rock_person_id claim and standard claims', async () => {
  const { hook } = await loadSession();
  const saved = await hook({ user: { ...baseUser, [CLAIM]: 152 }, internal: { sid: 's', createdAt: 1 } });
  assert.equal(saved.user[CLAIM], 152);
  assert.equal(saved.user.email, 'staff@example.org');
  assert.equal(saved.user.email_verified, true);
  assert.equal(saved.user.sub, 'auth0|1');
  assert.deepEqual(saved.internal, { sid: 's', createdAt: 1 });
});

test('other custom claims are still dropped', async () => {
  const { hook } = await loadSession();
  const saved = await hook({
    user: { ...baseUser, [CLAIM]: 152, 'https://auth.favor.church/roles': ['admin'], custom_flag: true, nonce: 'n', iss: 'x' },
  });
  assert.equal(saved.user[CLAIM], 152);
  assert.equal(saved.user['https://auth.favor.church/roles'], undefined);
  assert.equal(saved.user.custom_flag, undefined);
  assert.equal(saved.user.nonce, undefined);
  assert.equal(saved.user.iss, undefined);
});

test('a session without the claim does not gain one', async () => {
  const { hook } = await loadSession();
  const saved = await hook({ user: { ...baseUser, custom_flag: true } });
  assert.equal(Object.hasOwn(saved.user, CLAIM), false);
  assert.equal(saved.user.custom_flag, undefined);
});
