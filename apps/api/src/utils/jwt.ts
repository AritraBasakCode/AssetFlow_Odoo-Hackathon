import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";

export interface AccessTokenPayload {
  sub: string; // userId
  role: string;
  departmentId: string | null;
}

export const signAccessToken = (payload: AccessTokenPayload) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL as jwt.SignOptions["expiresIn"] });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload & { iat: number; exp: number };

// Refresh tokens are opaque random strings, hashed before storage in the Session table.
// This lets us revoke sessions server-side (logout, deactivation) unlike a self-contained JWT.
export const generateRefreshToken = () => crypto.randomBytes(48).toString("hex");

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");
