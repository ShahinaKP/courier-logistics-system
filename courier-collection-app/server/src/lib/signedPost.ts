import crypto from "crypto";

// POST JSON with double-auth headers. Signs the EXACT body bytes that are sent,
// so the receiver's HMAC over its raw body matches.
export async function signedPost(
  url: string,
  payload: unknown,
  apiKey: string,
  secret: string,
) {
  const body = JSON.stringify(payload);
  const signature =
    "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "x-signature": signature,
    },
    body,
  });
}
