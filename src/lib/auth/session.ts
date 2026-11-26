import { Auth0Client } from "@auth0/nextjs-auth0/server";

/** Audience and scope shared with the other Favor Church apps on this Auth0 tenant. */
export const AUTH0_AUDIENCE = "https://favorchurch.au.auth0.com/userinfo";
export const AUTH0_SCOPE = "openid profile email";

/**
 * The single Auth0 client for this app. It serves /auth/login, /auth/logout
 * and /auth/callback through src/proxy.ts and reads sessions on the server.
 * Configuration comes from AUTH0_* and APP_BASE_URL at request time, so
 * importing this module never needs credentials (builds run without them).
 */
export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: AUTH0_AUDIENCE,
    scope: AUTH0_SCOPE,
  },
});
