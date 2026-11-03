
import "server-only";

import { randomInt, createHash, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const SESSION_COOKIE = "sdv_admin_session";
export const PENDING_COOKIE = "sdv_admin_pending";

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET doit contenir au moins 32 caractères.");
  }

  return encoder.encode(secret);
}

export function getAdminEmail() {
  const email = process.env.ADMIN_EMAIL;

  if (!email) {
    throw new Error("ADMIN_EMAIL manquant.");
  }

  return email.trim().toLowerCase();
}

export function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function generateOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function createPendingToken(challengeId: string) {
  return new SignJWT({ challengeId, purpose: "admin-otp" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(getSecret());
}

export async function readPendingToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (
      payload.purpose !== "admin-otp" ||
      typeof payload.challengeId !== "string"
    ) {
      return null;
    }

    return payload.challengeId;
  } catch {
    return null;
  }
}

export async function createAdminSession(database: Pick<Prisma.TransactionClient, "adminSession"> = prisma) {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

  const token = await new SignJWT({
    sessionId,
    role: "admin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());

  await database.adminSession.create({ data: { id: sessionId, expiresAt } });

  return { token, expiresAt };
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (
      payload.role !== "admin" ||
      typeof payload.sessionId !== "string"
    ) {
      return null;
    }

    const session = await prisma.adminSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.expiresAt <= new Date()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function secureCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}
