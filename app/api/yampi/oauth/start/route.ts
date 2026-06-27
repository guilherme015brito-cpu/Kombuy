import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { buildYampiAuthUrl, getYampiMissingEnvMessage } from "@/lib/yampi";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = randomUUID();
  const { url, missing } = buildYampiAuthUrl(state);

  if (!url) {
    return NextResponse.json(
      { success: false, error: getYampiMissingEnvMessage(missing) },
      { status: 500 }
    );
  }

  return NextResponse.redirect(url);
}
