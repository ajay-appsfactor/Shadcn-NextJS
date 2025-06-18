import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Create a JWT Token
export function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// Set JWT Cookie
export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    path: "/",
    secure: false,
    maxAge: 60 * 60 * 24 * 1,
  });
}

// Read JWT Cookie (on server)
export async function getToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  return token || null;
}

// Decode token and get user payload
export async function getUserFromToken() {
  const token = await getToken();
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('Invalid token:', err);
    return null;
  }
}

// Destroy cookie (logout)
export async function destroyAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
}
