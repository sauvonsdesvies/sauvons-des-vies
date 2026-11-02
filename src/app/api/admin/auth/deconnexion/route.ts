import { isAdminRequestOriginAllowed } from "@/lib/admin-request-origin";

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  PENDING_COOKIE,
} from "@/lib/admin-auth";


export async function POST(request: NextRequest) {
  if (!isAdminRequestOriginAllowed(request)) {
    return NextResponse.json(
      { success: false, message: "Requête non autorisée." },
      { status: 403 }
    );
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (token && process.env.AUTH_SECRET) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.AUTH_SECRET)
      );

      if (typeof payload.sessionId === "string") {
        await prisma.adminSession.deleteMany({
          where: { id: payload.sessionId },
        });
      }
    } catch {
      // Le cookie sera supprimé même si le jeton est expiré.
    }
  }

  const response = NextResponse.json({
    success: true,
    message: "Déconnexion effectuée.",
  });

  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(PENDING_COOKIE);

  return response;
}
