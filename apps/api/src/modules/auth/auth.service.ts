import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { hashPassword, comparePassword } from "../../utils/password";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../utils/jwt";

const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);

export async function signup(input: { name: string; email: string; password: string; departmentId?: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    const err: any = new Error("An account with this email already exists");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await hashPassword(input.password);

  // role is hardcoded to EMPLOYEE — never derived from client input.
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "EMPLOYEE",
      departmentId: input.departmentId,
    },
  });

  return user;
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throwInvalidCreds();
  if (user!.status !== "ACTIVE") {
    const err: any = new Error("Account is deactivated. Contact your administrator.");
    err.statusCode = 403;
    throw err;
  }

  const valid = await comparePassword(password, user!.passwordHash);
  if (!valid) throwInvalidCreds();

  return issueSession(user!.id, user!.role, user!.departmentId);
}

export async function issueSession(userId: string, role: string, departmentId: string | null) {
  const accessToken = signAccessToken({ sub: userId, role, departmentId });
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);

  await prisma.session.create({
    data: { userId, refreshTokenHash, expiresAt },
  });

  return { accessToken, refreshToken };
}

export async function refreshSession(refreshToken: string) {
  const refreshTokenHash = hashToken(refreshToken);
  const session = await prisma.session.findFirst({
    where: { refreshTokenHash, expiresAt: { gt: new Date() } },
    include: { user: true },
  });

  if (!session || session.user.status !== "ACTIVE") {
    const err: any = new Error("Session expired or revoked. Please log in again.");
    err.statusCode = 401;
    throw err;
  }

  // Rotate: delete old session, issue a new access+refresh pair.
  await prisma.session.delete({ where: { id: session.id } });
  return issueSession(session.user.id, session.user.role, session.user.departmentId);
}

export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return;
  const refreshTokenHash = hashToken(refreshToken);
  await prisma.session.deleteMany({ where: { refreshTokenHash } });
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond success-shaped even if user not found — avoids leaking
  // which emails are registered.
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  // Hackathon note: wire this into a real mail provider (Resend/SendGrid/SMTP).
  // For the demo, log it so the reset link is easy to grab.
  console.log(`[password reset] token for ${email}: ${rawToken}`);
  return rawToken;
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
  });

  if (!record) {
    const err: any = new Error("Reset link is invalid or expired");
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Revoke all existing sessions on password change.
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);
}

function throwInvalidCreds(): never {
  const err: any = new Error("Invalid email or password");
  err.statusCode = 401;
  throw err;
}
