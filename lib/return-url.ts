export function getAllowedReturnHosts() {
  return (process.env.ALLOWED_RETURN_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

export function getSafeReturnUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const allowedHosts = getAllowedReturnHosts();
    const isProduction = process.env.NODE_ENV === "production";

    if (url.protocol !== "https:" && (isProduction || url.protocol !== "http:")) {
      return null;
    }

    if (!allowedHosts.includes(url.hostname.toLowerCase())) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}
