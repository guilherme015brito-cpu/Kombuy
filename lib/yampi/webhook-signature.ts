import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export function calculateYampiWebhookSignature(rawBody: string, secret: string) {
  return createHmac("sha256", secret).update(rawBody).digest("base64");
}

export function verifyYampiWebhookSignature(rawBody: string, signature: string | null, secret: string | null) {
  if (!secret || !signature) {
    return false;
  }

  const expected = Buffer.from(calculateYampiWebhookSignature(rawBody, secret));
  const received = Buffer.from(signature);

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(received, expected);
}
