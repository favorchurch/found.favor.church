import { loadSourceModule } from './loadSourceModule.mts';

export const CLAIM = 'https://auth.favor.church/rock_person_id';
export const rockEnv = {
  NODE_ENV: 'production',
  ROCK_API_URL: 'https://rock.example.invalid',
  ROCK_API_KEY: 'fixture-key',
  ROCK_MNL_STAFF_GROUP_ID: '42',
};

export class Redirect extends Error {
  destination: string;
  constructor(destination: string) {
    super('NEXT_REDIRECT ' + destination);
    this.destination = destination;
  }
}

export type SessionUser = Record<string, unknown>;

export function staffUser(overrides: SessionUser = {}): SessionUser {
  return { email: 'staff@example.org', email_verified: true, [CLAIM]: 777, ...overrides };
}

export const memberRow = { PersonId: 777, GroupId: 42, GroupMemberStatus: 1, IsArchived: false };

export function rockResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

/** Loads the real rock.ts and admin.ts with Auth0 and Rock stubbed; no network. */
export async function loadAdminGuard(options: {
  user?: SessionUser | null;
  sessionError?: boolean;
  rock?: (url: string, init: unknown) => Promise<unknown>;
  env?: Record<string, string>;
} = {}) {
  const rockCalls: { url: string; init: unknown }[] = [];
  const fetchStub = async (url: string, init: unknown) => {
    rockCalls.push({ url, init });
    if (!options.rock) throw new Error('unexpected network call');
    return options.rock(url, init);
  };
  const env = { ...rockEnv, ...options.env };
  const rock = await loadSourceModule(new URL('../../src/lib/auth/rock.ts', import.meta.url), {
    'server-only': {},
  }, env, {
    fetch: fetchStub,
    AbortSignal,
    encodeURIComponent,
    Number,
    Array,
    String,
  });
  const admin = await loadSourceModule(new URL('../../src/lib/auth/admin.ts', import.meta.url), {
    'server-only': {},
    react: { cache: <T,>(fn: T) => fn },
    'next/navigation': {
      redirect: (destination: string) => { throw new Redirect(destination); },
      unstable_rethrow: (error: unknown) => { if (error instanceof Redirect) throw error; },
    },
    '@/lib/auth/session': {
      auth0: {
        getSession: async () => {
          if (options.sessionError) throw new Error('cookie decode failed');
          return options.user === null || options.user === undefined ? null : { user: options.user };
        },
      },
    },
    '@/lib/auth/rock': rock,
    '@/lib/auth/claims': { ROCK_PERSON_ID_CLAIM: CLAIM },
  }, env, { Number });
  return {
    requireAdmin: admin.requireAdmin as (options?: { redirect?: boolean }) => Promise<{ email: string; personId: number | null }>,
    rockCalls,
  };
}
