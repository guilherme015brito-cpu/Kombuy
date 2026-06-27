import { createYampiAuthorizationRedirect } from "@/lib/yampi-oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  return createYampiAuthorizationRedirect();
}
