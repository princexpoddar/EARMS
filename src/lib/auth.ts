import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "assetflow-jwt-super-secret-key-987654";
export const TOKEN_COOKIE_NAME = "assetflow_session";

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  departmentId: string | null;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function getUserFromRequest(req: NextRequest): JWTPayload | null {
  const cookie = req.cookies.get(TOKEN_COOKIE_NAME);
  if (!cookie) return null;
  return verifyToken(cookie.value);
}
