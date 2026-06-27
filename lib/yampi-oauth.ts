import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { buildYampiAuthUrl, getYampiMissingEnvMessage } from "@/lib/yampi";

export const yampiStateCookie = "__Host-kombuy_yampi_state";
export const yampiVerifierCookie = "__Host-kombuy_yampi_code_verifier";

const cookieMaxAgeSeconds = 10 * 60;

function base64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function generatePkceValues() {
  const state = base64Url(randomBytes(32));
  const codeVerifier = base64Url(randomBytes(64));
  const codeChallenge = base64Url(createHash("sha256").update(codeVerifier).digest());

  return {
    state,
    codeVerifier,
    codeChallenge
  };
}

export function createYampiAuthorizationRedirect() {
  const { state, codeVerifier, codeChallenge } = generatePkceValues();
  const { url, missing } = buildYampiAuthUrl(state, codeChallenge);

  if (!url) {
    return NextResponse.json(
      { success: false, error: getYampiMissingEnvMessage(missing) },
      { status: 500 }
    );
  }

  const response = NextResponse.redirect(url);

  response.cookies.set(yampiStateCookie, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: cookieMaxAgeSeconds
  });

  response.cookies.set(yampiVerifierCookie, codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: cookieMaxAgeSeconds
  });

  return response;
}

export function clearYampiOauthCookies(response: NextResponse) {
  response.cookies.set(yampiStateCookie, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });

  response.cookies.set(yampiVerifierCookie, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });

  return response;
}

export function isValidState(receivedState: string | null, storedState: string | undefined) {
  if (!receivedState || !storedState || receivedState.length !== storedState.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(receivedState), Buffer.from(storedState));
}
