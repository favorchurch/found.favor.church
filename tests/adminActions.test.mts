import assert from 'node:assert/strict';
import test from 'node:test';
import { loadSourceModule } from './helpers/loadSourceModule.mts';
import { loadAdminGuard, staffUser, rockResponse, memberRow } from './helpers/authFixtures.mts';

const adminClientUrl = new URL('../src/utils/supabase/admin.ts', import.meta.url);
const itemsUrl = new URL('../src/app/admin/actions/items.ts', import.meta.url);
const categoriesUrl = new URL('../src/app/admin/actions/categories.ts', import.meta.url);
const venuesUrl = new URL('../src/app/admin/actions/venues.ts', import.meta.url);
const photosUrl = new URL('../src/app/admin/actions/photos.ts', import.meta.url);

const supabaseEnv = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_SUPABASE_URL: 'https://db.example.invalid',
  SUPABASE_SERVICE_ROLE_KEY: 'fixture-service-role',
};

const validItem = {
  name: 'Blue umbrella',
  date_found: '2026-01-02',
  status: 'unclaimed',
  category: 'others',
  is_public: false,
};

function recordingSupabase() {
  const writes: unknown[] = [];
  const chain: Record<string, unknown> = {};
  for (const name of ['update', 'insert', 'delete', 'upsert', 'select', 'eq', 'in', 'lt', 'is', 'order']) {
    chain[name] = (...args: unknown[]) => { writes.push([name, ...args]); return chain; };
  }
  chain.then = (resolve: (value: unknown) => void) => resolve({ error: null, data: [], count: 2 });
  return {
    writes,
    client: {
      from: () => chain,
      rpc: async () => ({ data: [], error: null }),
      storage: { from: () => ({ remove: async () => ({ error: null }), list: async () => ({ data: [], error: null }) }) },
    },
  };
}

/** Wires a real getAdminClient (real requireAdmin underneath) to a recording Supabase stub. */
async function adminModules(options: { user: Record<string, unknown> | null; rock?: () => Promise<unknown> }) {
  const guard = await loadAdminGuard({ user: options.user, rock: options.rock });
  const supabase = recordingSupabase();
  const created: { url: string; key: string }[] = [];
  const adminClient = await loadSourceModule(adminClientUrl, {
    'server-only': {},
    '@supabase/supabase-js': {
      createClient: (url: string, key: string) => { created.push({ url, key }); return supabase.client; },
    },
    '@/lib/auth/admin': { requireAdmin: guard.requireAdmin },
  }, supabaseEnv);
  const common = {
    '@/utils/supabase/admin': adminClient,
    'next/cache': { revalidatePath: () => {} },
    zod: await import('zod'),
  };
  const items = await loadSourceModule(itemsUrl, common, supabaseEnv);
  const categories = await loadSourceModule(categoriesUrl, common, supabaseEnv);
  const venues = await loadSourceModule(venuesUrl, common, supabaseEnv);
  const photos = await loadSourceModule(photosUrl, { '@/utils/supabase/admin': adminClient }, supabaseEnv, { crypto });
  return { guard, supabase, created, items, categories, venues, photos, adminClient };
}

const plain = (value: unknown) => JSON.parse(JSON.stringify(value));

type Fn = (...args: unknown[]) => Promise<unknown>;

test('a non-staff session is refused before any Supabase client exists', async () => {
  const m = await adminModules({ user: staffUser(), rock: async () => rockResponse([]) });
  const calls: Array<[string, Fn, unknown[]]> = [
    ['upsertItem', m.items.upsertItem as Fn, [validItem]],
    ['archiveOldItems', m.items.archiveOldItems as Fn, []],
    ['deleteItem', m.items.deleteItem as Fn, ['6d0e0b83-2d0b-4a4e-8f55-0f4e2a5b9a10', 'photo.jpg']],
    ['getAdminItemCountsByDate', m.items.getAdminItemCountsByDate as Fn, []],
    ['getCategories', m.categories.getCategories as Fn, []],
    ['upsertCategory', m.categories.upsertCategory as Fn, [{ slug: 'x', name: 'X', prefix: 'XX' }]],
    ['deleteCategory', m.categories.deleteCategory as Fn, ['a', 'b']],
    ['getVenues', m.venues.getVenues as Fn, []],
    ['upsertVenue', m.venues.upsertVenue as Fn, [{ slug: 'x', name: 'X' }]],
    ['deleteVenue', m.venues.deleteVenue as Fn, ['a', 'b']],
    ['createPhotoUploadUrl', m.photos.createPhotoUploadUrl as Fn, ['jpg']],
    ['removePhoto', m.photos.removePhoto as Fn, ['photo.jpg']],
    ['scanOrphanedPhotos', m.photos.scanOrphanedPhotos as Fn, []],
    ['deleteOrphanedPhotos', m.photos.deleteOrphanedPhotos as Fn, [['photo.jpg']]],
  ];
  for (const [name, fn, args] of calls) {
    await assert.rejects(() => fn(...args), (error: Error) => error.message === 'Unauthorized', name);
  }
  assert.equal(m.created.length, 0, 'no service-role client may be created for a refused caller');
  assert.equal(m.supabase.writes.length, 0);
});

test('an anonymous caller is refused before any Supabase client exists', async () => {
  const m = await adminModules({ user: null });
  await assert.rejects(() => (m.items.upsertItem as Fn)(validItem), /Unauthorized/);
  assert.equal(m.created.length, 0);
});

test('an admin write records the verified Auth0 email and null user ids', async () => {
  const m = await adminModules({ user: staffUser({ email: 'Staff@Example.org' }), rock: async () => rockResponse([memberRow]) });
  await (m.items.upsertItem as Fn)(validItem);
  assert.deepEqual(m.created, [{ url: 'https://db.example.invalid', key: 'fixture-service-role' }]);
  const insert = m.supabase.writes.find((w) => (w as unknown[])[0] === 'insert') as [string, Record<string, unknown>[]];
  const row = insert[1][0];
  assert.equal(row.created_by, null);
  assert.equal(row.updated_by, null);
  assert.equal(row.created_by_email, 'Staff@Example.org');
  assert.equal(row.updated_by_email, 'Staff@Example.org');

  await (m.items.upsertItem as Fn)({ ...validItem, id: '6d0e0b83-2d0b-4a4e-8f55-0f4e2a5b9a10' });
  const update = m.supabase.writes.find((w) => (w as unknown[])[0] === 'update') as [string, Record<string, unknown>];
  assert.equal(update[1].updated_by, null);
  assert.equal(update[1].updated_by_email, 'Staff@Example.org');
  assert.equal('created_by' in update[1], false);
});

test('archiving stamps the verified email', async () => {
  const m = await adminModules({ user: staffUser(), rock: async () => rockResponse([memberRow]) });
  await (m.items.archiveOldItems as Fn)();
  const update = m.supabase.writes.find((w) => (w as unknown[])[0] === 'update') as [string, Record<string, unknown>];
  assert.equal(update[1].updated_by, null);
  assert.equal(update[1].updated_by_email, 'staff@example.org');
});

test('the admin client refuses to run without the service-role key', async () => {
  const guard = await loadAdminGuard({ user: staffUser(), rock: async () => rockResponse([memberRow]) });
  let created = 0;
  const adminClient = await loadSourceModule(adminClientUrl, {
    'server-only': {},
    '@supabase/supabase-js': { createClient: () => { created++; return {}; } },
    '@/lib/auth/admin': { requireAdmin: guard.requireAdmin },
  }, { NODE_ENV: 'production', NEXT_PUBLIC_SUPABASE_URL: 'https://db.example.invalid' });
  await assert.rejects(() => (adminClient.getAdminClient as Fn)(), /not configured/);
  assert.equal(created, 0);
});

test('orphan deletion only removes files that are still unreferenced', async () => {
  const removed: string[][] = [];
  const guard = await loadAdminGuard({ user: staffUser(), rock: async () => rockResponse([memberRow]) });
  const supabase = {
    from: () => ({ select: async () => ({ data: [{ photo_path: 'linked.jpg' }], error: null }) }),
    storage: { from: () => ({
      list: async () => ({ data: [{ name: 'linked.jpg' }, { name: 'orphan.jpg' }], error: null }),
      remove: async (names: string[]) => { removed.push(names); return { error: null }; },
    }) },
  };
  const adminClient = await loadSourceModule(adminClientUrl, {
    'server-only': {},
    '@supabase/supabase-js': { createClient: () => supabase },
    '@/lib/auth/admin': { requireAdmin: guard.requireAdmin },
  }, supabaseEnv);
  const photos = await loadSourceModule(photosUrl, { '@/utils/supabase/admin': adminClient }, supabaseEnv, { crypto });
  const result = await (photos.deleteOrphanedPhotos as Fn)(['linked.jpg', 'orphan.jpg', 'unknown.jpg']);
  assert.deepEqual(plain(result), { deleted: 1 });
  assert.deepEqual(plain(removed), [['orphan.jpg']]);
});
