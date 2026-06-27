export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email?: string | null) {
  const allowedEmails = getAdminEmails();

  if (allowedEmails.length === 0 || !email) {
    return false;
  }

  return allowedEmails.includes(email.toLowerCase());
}
