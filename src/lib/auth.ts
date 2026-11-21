import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const SESSION_COOKIE_NAME = "buno_session_id";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function setSessionCookie(userId: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionUserId) {
    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: {
        profile: true,
        settings: true,
      },
    });
    if (user) return user;
  }

  return null;
}
