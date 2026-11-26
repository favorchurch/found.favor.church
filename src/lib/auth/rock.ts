import "server-only";

const REQUEST_TIMEOUT_MS = 5000;

/**
 * Checks Rock for an active, non-archived membership of the MNL Staff group.
 * Fails closed: missing env, a non-2xx response, a network error or an
 * unexpected body all return false.
 */
export async function isActiveMnlStaffMember(personId: number): Promise<boolean> {
  const baseUrl = process.env.ROCK_API_URL?.trim().replace(/\/+$/, "").replace(/\/api$/i, "");
  const apiKey = process.env.ROCK_API_KEY;
  const groupId = process.env.ROCK_MNL_STAFF_GROUP_ID?.trim();

  if (!baseUrl || !apiKey || !groupId || !/^\d+$/.test(groupId) || !Number.isSafeInteger(personId) || personId <= 0) {
    return false;
  }

  // Status and archive state are checked on the returned rows: enum literals in OData filters are version-sensitive.
  const filter = `GroupId eq ${groupId} and PersonId eq ${personId}`;
  const url = `${baseUrl}/api/GroupMembers?$filter=${encodeURIComponent(filter)}&$top=50`;

  try {
    const response = await fetch(url, {
      headers: { "Authorization-Token": apiKey, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error("Rock MNL Staff lookup failed with status", response.status);
      return false;
    }
    const members: unknown = await response.json();
    return (
      Array.isArray(members) &&
      members.some(
        (member) =>
          member?.PersonId === personId &&
          String(member?.GroupId) === groupId &&
          (member?.GroupMemberStatus === 1 || member?.GroupMemberStatus === "Active") &&
          member?.IsArchived === false,
      )
    );
  } catch (error) {
    console.error("Rock MNL Staff lookup failed:", error instanceof Error ? error.message : "unknown error");
    return false;
  }
}
