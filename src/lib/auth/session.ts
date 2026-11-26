import { Auth0Client, filterDefaultIdTokenClaims } from "@auth0/nextjs-auth0/server";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import { ROCK_PERSON_ID_CLAIM } from "@/lib/auth/claims";

/** Audience used by the prod Auth0 tenant; other tenants (e.g. preview) override it with AUTH0_AUDIENCE. */
export const DEFAULT_AUTH0_AUDIENCE = "https://favorchurch.au.auth0.com/userinfo";
export const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || DEFAULT_AUTH0_AUDIENCE;
export const AUTH0_SCOPE = "openid profile email";

/**
 * Without a beforeSessionSaved hook the SDK keeps only the standard ID token
 * claims, which drops the Rock person id that requireAdmin needs. Keep the
 * standard claims plus that one custom claim and nothing else.
 */
export async function keepRockPersonIdClaim(session: SessionData): Promise<SessionData> {
  const user = filterDefaultIdTokenClaims(session.user);
  const personId = session.user[ROCK_PERSON_ID_CLAIM];
  return {
    ...session,
    user: personId === undefined ? user : { ...user, [ROCK_PERSON_ID_CLAIM]: personId },
  };
}

/**
 * The single Auth0 client for this app. It serves /auth/login, /auth/logout
 * and /auth/callback through src/proxy.ts and reads sessions on the server.
 * Credentials come from AUTH0_* and APP_BASE_URL at request time, so
 * importing this module never needs them (builds run without them).
 * AUTH0_AUDIENCE is optional and falls back to the prod default.
 */
export const auth0 = new Auth0Client({
  beforeSessionSaved: keepRockPersonIdClaim,
  authorizationParameters: {
    audience: AUTH0_AUDIENCE,
    scope: AUTH0_SCOPE,
  },
});