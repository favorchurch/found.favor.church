import "server-only";
import { cache } from "react";
import { redirect, unstable_rethrow } from "next/navigation";
import { auth0 } from "@/lib/auth/session";
import { isActiveMnlStaffMember } from "@/lib/auth/rock";
import { ROCK_PERSON_ID_CLAIM } from "@/lib/auth/claims";

export interface AdminUser {
  /** Verified Auth0 email. */
  email: string;
  /** Rock person id from the Auth0 claim; null only for the development mock. */
  personId: number | null;
}

export type AdminRefusal = "unauthenticated" | "forbidden";

type AdminDecision = { ok: true; user: AdminUser } | { ok: false; reason: AdminRefusal };

export class AdminAccessError extends Error {
  readonly reason: AdminRefusal;
  constructor(reason: AdminRefusal) {
    super("Unauthorized");
    this.name = "AdminAccessError";
    this.reason = reason;
  }
}

const DEV_MOCK_ADMIN: AdminUser = { email: "dev@favor.church", personId: null };

/** The mock admin exists only for `next dev`; never in a Vercel preview or production build. */
function devMockAllowed(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  return process.env.NODE_ENV === "development" && (!vercelEnv || vercelEnv === "development");
}

function parsePersonId(claim: unknown): number | null {
  const value = typeof claim === "string" && /^\d+$/.test(claim.trim()) ? Number(claim.trim()) : claim;
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

async function readSession() {
  try {
    return await auth0.getSession();
  } catch (error) {
    // Let Next's own control-flow errors (dynamic rendering bailout) propagate.
    unstable_rethrow(error);
    console.error("Auth0 session lookup failed:", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}

const resolveAdmin = cache(async (): Promise<AdminDecision> => {
  const session = await readSession();
  if (!session?.user) {
    return devMockAllowed()
      ? { ok: true, user: DEV_MOCK_ADMIN }
      : { ok: false, reason: "unauthenticated" };
  }

  const { user } = session;
  const email = typeof user.email === "string" ? user.email.trim() : "";
  const personId = parsePersonId(user[ROCK_PERSON_ID_CLAIM]);
  if (user.email_verified !== true || !email || personId === null) {
    return { ok: false, reason: "forbidden" };
  }

  let isStaff = false;
  try {
    isStaff = await isActiveMnlStaffMember(personId);
  } catch (error) {
    console.error("Rock MNL Staff check failed:", error instanceof Error ? error.message : "unknown error");
  }
  if (!isStaff) return { ok: false, reason: "forbidden" };
  return { ok: true, user: { email, personId } };
});

/**
 * Resolves the signed-in MNL Staff member or refuses. Call before any admin
 * data access. Server actions use the default (throws AdminAccessError);
 * pages and layouts pass { redirect: true } to send unauthenticated users to
 * /login and signed-in non-staff to /.
 */
export async function requireAdmin(options: { redirect?: boolean } = {}): Promise<AdminUser> {
  const decision = await resolveAdmin();
  if (decision.ok) return decision.user;
  if (options.redirect) redirect(decision.reason === "unauthenticated" ? "/login" : "/");
  throw new AdminAccessError(decision.reason);
}
