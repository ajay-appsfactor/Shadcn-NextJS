
export const cookieOptions = {
  name: process.env.COOKIE_NAME || "token",
  httpOnly: process.env.COOKIE_HTTP_ONLY === "true",
  secure: process.env.COOKIE_SECURE === "true",
  path: "/",
  maxAge: parseInt(process.env.COOKIE_MAX_AGE || "86400"), 
};
