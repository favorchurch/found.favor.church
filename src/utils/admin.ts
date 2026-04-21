export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith("@favor.church");
}
