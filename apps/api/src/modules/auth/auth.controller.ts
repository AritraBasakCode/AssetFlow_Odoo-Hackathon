import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth";
import * as authService from "./auth.service";
import { prisma } from "../../lib/prisma";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("accessToken", accessToken, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/api/auth" });
}

export async function signup(req: AuthedRequest, res: Response) {
  const user = await authService.signup(req.body);
  const { accessToken, refreshToken } = await authService.issueSession(user.id, user.role, user.departmentId);
  setAuthCookies(res, accessToken, refreshToken);
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
}

export async function login(req: AuthedRequest, res: Response) {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  const { accessToken, refreshToken } = await authService.login(email, password);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ id: user!.id, name: user!.name, email: user!.email, role: user!.role, departmentId: user!.departmentId });
}

export async function refresh(req: AuthedRequest, res: Response) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });
  const { accessToken, refreshToken } = await authService.refreshSession(token);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ ok: true });
}

export async function logout(req: AuthedRequest, res: Response) {
  await authService.logout(req.cookies?.refreshToken);
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.json({ ok: true });
}

export async function forgotPassword(req: AuthedRequest, res: Response) {
  await authService.forgotPassword(req.body.email);
  res.json({ ok: true, message: "If that email exists, a reset link has been sent." });
}

export async function resetPassword(req: AuthedRequest, res: Response) {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  res.json({ ok: true });
}

export async function me(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, role: true, departmentId: true, status: true },
  });
  res.json(user);
}
