import jwt, { type SignOptions } from "jsonwebtoken";

// No hardcoded fallback: a secret baked into shipped source would let anyone
// who reads the repo forge tokens for any user on a deployment that forgot
// to set this. Fail fast instead of silently signing with a public value.
const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET env var must be set to a random string of at least 32 characters (see backend/.env.example). Refusing to start without one.",
    );
  }
  return secret;
})();

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];

export interface AuthTokenPayload {
  sub: string; // user id
  email: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}
