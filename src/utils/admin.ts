/**
 * @file admin.ts
 * @description Helper functions for validating user authorization.
 */

/**
 * Checks if a given email belongs to a church administrator/staff member.
 * This app permits any user with an email ending in `@favor.church` to perform admin tasks.
 * 
 * @param email - The email to evaluate
 * @returns True if the email is a valid admin/staff email
 */
export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith("@favor.church");
}
