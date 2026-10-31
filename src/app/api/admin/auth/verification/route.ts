
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  PENDING_COOKIE,
  SESSION_COOKIE,
  createAdminSession,
  hashValue,
  readPendingToken,
  secureCookieOptions,
} from "@/lib/admin-auth";


const schema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("origin") !== request.nextUrl.origin) {
      return NextResponse.json(
        { success: false, message: "Requête non autorisée." },
        { status: 403 }
      );
    }

    const parsed = schema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Code invalide." },
        { status: 400 }
      );
    }

    const pendingToken = request.cookies.get(PENDING_COOKIE)?.value;
    const challengeId = pendingToken
      ? await readPendingToken(pendingToken)
      : null;

    if (!challengeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Session de vérification expirée. Reconnectez-vous.",
        },
        { status: 401 }
      );
    }

    const challenge = await prisma.adminOtpChallenge.findUnique({
      where: { id: challengeId },
    });

    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt <= new Date() ||
      challenge.attempts >= 5
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Code expiré ou nombre d'essais dépassé.",
        },
        { status: 401 }
      );
    }

    const receivedHash = Buffer.from(
      hashValue(
        `${challengeId}:${parsed.data.code}:${process.env.AUTH_SECRET}`
      ),
      "hex"
    );

    const expectedHash = Buffer.from(challenge.codeHash, "hex");

    const valid =
      receivedHash.length === expectedHash.length &&
      timingSafeEqual(receivedHash, expectedHash);

    // Mise à jour conditionnelle pour empêcher la réutilisation du code.
    const updated = await prisma.adminOtpChallenge.updateMany({
      where: {
        id: challengeId,
        consumedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: 5 },
      },
      data: valid
        ? { consumedAt: new Date() }
        : { attempts: { increment: 1 } },
    });

    if (updated.count !== 1 || !valid) {
      return NextResponse.json(
        { success: false, message: "Code incorrect ou expiré." },
        { status: 401 }
      );
    }

    const session = await createAdminSession();

    const response = NextResponse.json({
      success: true,
      message: "Connexion réussie.",
    });

    response.cookies.set(
      SESSION_COOKIE,
      session.token,
      secureCookieOptions(8 * 60 * 60)
    );

    response.cookies.delete(PENDING_COOKIE);

    return response;
  } catch (error) {
    console.error("Erreur de vérification administrateur:", error);

    return NextResponse.json(
      { success: false, message: "Vérification impossible." },
      { status: 500 }
    );
  }
}
