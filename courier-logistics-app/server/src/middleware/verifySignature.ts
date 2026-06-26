import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Express discards the raw bytes after JSON parsing, but HMAC must be computed
// over the exact bytes received. Capture them in the body parser:
//   app.use(express.json({ verify: captureRawBody }))
export const captureRawBody = (
  req: Request & { rawBody?: Buffer },
  _res: Response,
  buf: Buffer,
) => {
  req.rawBody = buf;
};

const safeEqual = (a: string, b: string) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
};

// Two-factor auth for inter-service calls:
//   1. x-api-key   === expected key            (who is calling)
//   2. x-signature === HMAC-SHA256(secret, body) (shared-secret + integrity)
// Both must pass.
export const verifySignature =
  (expectedKey: string, secret: string) =>
  (
    req: Request & { rawBody?: Buffer },
    res: Response,
    next: NextFunction,
  ): void => {
    if (!expectedKey || !secret) {
      console.error(
        "verifySignature: missing API key/secret env on this server",
      );
      res.status(500).json({ error: "Server auth not configured" });
      return;
    }

    const apiKey = req.header("x-api-key");
    const signature = req.header("x-signature");
    if (!apiKey || !signature) {
      res.status(401).json({ error: "Missing x-api-key or x-signature" });
      return;
    }
    if (!safeEqual(apiKey, expectedKey)) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }

    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    const expected =
      "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (!safeEqual(signature, expected)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
    next();
  };
