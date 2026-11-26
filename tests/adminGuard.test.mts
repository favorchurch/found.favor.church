import assert from 'node:assert/strict';
import test from 'node:test';
import { CLAIM, loadAdminGuard, memberRow, rockResponse, staffUser } from './helpers/authFixtures.mts';

const memberOk = async () => rockResponse([memberRow]);

async function refusal(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error as Error & { reason?: string; destination?: string };
  }
  assert.fail('expected the guard to refuse');
}

test('verified MNL Staff member is allowed', async () => {
  const guard = await loadAdminGuard({ user: staffUser(), rock: memberOk });
  const admin = await guard.requireAdmin();
  assert.deepEqual({ email: admin.email, personId: admin.personId }, { email: 'staff@example.org', personId: 777 });
  assert.equal(guard.rockCalls.length, 1);
  const call = guard.rockCalls[0];
  assert.match(call.url, /^https:\/\/rock\.example\.invalid\/api\/GroupMembers\?/);
  const filter = decodeURIComponent(call.url.split('$filter=')[1].split('&')[0]);
  assert.match(filter, /GroupId eq 42/);
  assert.match(filter, /PersonId eq 777/);
  assert.equal((call.init as { headers: Record<string, string> }).headers['Authorization-Token'], 'fixture-key');
});

test('an active row is found even when inactive rows for the same person come first', async () => {
  const guard = await loadAdminGuard({
    user: staffUser(),
    rock: async () => rockResponse([{ ...memberRow, GroupMemberStatus: 0 }, { ...memberRow, IsArchived: true }, memberRow]),
  });
  assert.equal((await guard.requireAdmin()).personId, 777);
});

test('person id claim may arrive as a numeric string', async () => {
  const guard = await loadAdminGuard({ user: staffUser({ [CLAIM]: '777' }), rock: memberOk });
  assert.equal((await guard.requireAdmin()).personId, 777);
});

test('unverified email is refused without asking Rock', async () => {
  for (const email_verified of [false, undefined, 'true']) {
    const guard = await loadAdminGuard({ user: staffUser({ email_verified }), rock: memberOk });
    const error = await refusal(guard.requireAdmin());
    assert.equal(error.reason, 'forbidden');
    assert.equal(guard.rockCalls.length, 0);
  }
});

test('missing or malformed rock_person_id is refused without asking Rock', async () => {
  for (const claim of [undefined, null, '', 'abc', 0, -3, 1.5, '12abc', {}]) {
    const guard = await loadAdminGuard({ user: staffUser({ [CLAIM]: claim }), rock: memberOk });
    const error = await refusal(guard.requireAdmin());
    assert.equal(error.reason, 'forbidden');
    assert.equal(guard.rockCalls.length, 0);
  }
});

test('non-member is refused', async () => {
  const guard = await loadAdminGuard({ user: staffUser(), rock: async () => rockResponse([]) });
  assert.equal((await refusal(guard.requireAdmin())).reason, 'forbidden');
});

test('membership rows for another person, group, status or archived state are refused', async () => {
  const rows = [
    { ...memberRow, PersonId: 1 },
    { ...memberRow, GroupId: 99 },
    { ...memberRow, GroupMemberStatus: 0 },
    { ...memberRow, IsArchived: true },
    { ...memberRow, IsArchived: undefined },
  ];
  for (const row of rows) {
    const guard = await loadAdminGuard({ user: staffUser(), rock: async () => rockResponse([row]) });
    assert.equal((await refusal(guard.requireAdmin())).reason, 'forbidden');
  }
});

test('Rock API errors, bad bodies and network failures are refused', async () => {
  const failures: Array<() => Promise<unknown>> = [
    async () => rockResponse({ Message: 'nope' }, 500),
    async () => rockResponse([memberRow], 401),
    async () => rockResponse({ not: 'an array' }),
    async () => { throw new Error('socket hang up'); },
  ];
  for (const rock of failures) {
    const guard = await loadAdminGuard({ user: staffUser(), rock });
    assert.equal((await refusal(guard.requireAdmin())).reason, 'forbidden');
  }
});

test('missing Rock env is refused without asking Rock', async () => {
  const envs: Record<string, string>[] = [{ ROCK_API_URL: '' }, { ROCK_API_KEY: '' }, { ROCK_MNL_STAFF_GROUP_ID: '' }, { ROCK_MNL_STAFF_GROUP_ID: '42 or 1 eq 1' }];
  for (const env of envs) {
    const guard = await loadAdminGuard({ user: staffUser(), rock: memberOk, env });
    assert.equal((await refusal(guard.requireAdmin())).reason, 'forbidden');
    assert.equal(guard.rockCalls.length, 0);
  }
});

test('no session is unauthenticated and redirects to login when asked', async () => {
  const guard = await loadAdminGuard({ user: null, rock: memberOk });
  assert.equal((await refusal(guard.requireAdmin())).reason, 'unauthenticated');
  const redirected = await refusal(guard.requireAdmin({ redirect: true }));
  assert.equal(redirected.destination, '/login');
  assert.equal(guard.rockCalls.length, 0);
});

test('signed-in non-staff are redirected to the home page', async () => {
  const guard = await loadAdminGuard({ user: staffUser(), rock: async () => rockResponse([]) });
  const redirected = await refusal(guard.requireAdmin({ redirect: true }));
  assert.equal(redirected.destination, '/');
});

test('a broken session cookie counts as no session', async () => {
  const guard = await loadAdminGuard({ sessionError: true, rock: memberOk });
  assert.equal((await refusal(guard.requireAdmin())).reason, 'unauthenticated');
});

test('development mock admin works only under next dev outside Vercel', async () => {
  const dev = await loadAdminGuard({ user: null, env: { NODE_ENV: 'development' } });
  assert.equal((await dev.requireAdmin()).email, 'dev@favor.church');

  const blocked: Record<string, string>[] = [
    { NODE_ENV: 'production' },
    { NODE_ENV: 'test' },
    { NODE_ENV: 'development', VERCEL_ENV: 'preview' },
    { NODE_ENV: 'development', VERCEL_ENV: 'production' },
  ];
  for (const env of blocked) {
    const guard = await loadAdminGuard({ user: null, env });
    assert.equal((await refusal(guard.requireAdmin())).reason, 'unauthenticated');
  }
});

test('development does not let a real non-staff session through', async () => {
  const guard = await loadAdminGuard({ user: staffUser({ email_verified: false }), env: { NODE_ENV: 'development' } });
  assert.equal((await refusal(guard.requireAdmin())).reason, 'forbidden');
});
