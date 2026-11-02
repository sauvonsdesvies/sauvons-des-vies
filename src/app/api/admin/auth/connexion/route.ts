
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";

import {
  PENDING_COOKIE,
  createPendingToken,
  generateOtp,
  getAdminEmail,
  hashValue,
  secureCookieOptions,
} from "@/lib/admin-auth";

// ==========================================================
// FONDATION SAUVONS DES VIES
// AUTHENTIFICATION ADMINISTRATEUR
// Compatible Next.js 16 / Hostinger / HTTPS
// ==========================================================

const schema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
});

const genericError =
  "Identifiants incorrects ou connexion temporairement indisponible.";

const emailError =
  "Le code de connexion n'a pas pu être envoyé par email. Réessayez plus tard.";

// ----------------------------------------------------------
// VÉRIFICATION SÉCURISÉE DE L'ORIGINE
// ----------------------------------------------------------

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  let parsedOrigin: URL;

  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }

  // Refuser toute origine contenant des identifiants,
  // un chemin ou des paramètres.
  if (
    parsedOrigin.username ||
    parsedOrigin.password ||
    parsedOrigin.pathname !== "/" ||
    parsedOrigin.search ||
    parsedOrigin.hash
  ) {
    return false;
  }

  // En production, HTTPS est obligatoire.
  if (
    process.env.NODE_ENV === "production" &&
    parsedOrigin.protocol !== "https:"
  ) {
    return false;
  }

  // Origines explicitement autorisées.
  // ADMIN_ALLOWED_ORIGIN doit être une URL publique exacte.
  const configuredOrigin =
    process.env.ADMIN_ALLOWED_ORIGIN?.trim();

  if (configuredOrigin) {
    try {
      const allowed = new URL(configuredOrigin);

      return parsedOrigin.origin === allowed.origin;
    } catch {
      console.error(
        "ADMIN_ALLOWED_ORIGIN est mal configurée."
      );

      return false;
    }
  }

  // En développement uniquement, utiliser l'origine
  // fournie par Next.js.
  if (process.env.NODE_ENV !== "production") {
    return parsedOrigin.origin === request.nextUrl.origin;
  }

  // Refuser en production si aucune origine
  // publique autorisée n'est configurée.
  return false;
}

// ----------------------------------------------------------
// NETTOYAGE DES CODES OTP
// ----------------------------------------------------------

async function deleteChallenge(challengeId: string) {
  try {
    await prisma.adminOtpChallenge.deleteMany({
      where: { id: challengeId },
    });
  } catch (error) {
    console.error(
      "Erreur de nettoyage du code administrateur:",
      error
    );
  }
}

// ----------------------------------------------------------
// ROUTE DE CONNEXION
// ----------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Vérification de l'origine avant toute opération.
    if (!isAllowedOrigin(request)) {
      console.warn("ADMIN_ORIGIN_REJECTED", {
        origin: request.headers.get("origin"),
        requestOrigin: request.nextUrl.origin,
        configured:
          Boolean(process.env.ADMIN_ALLOWED_ORIGIN),
      });

      return NextResponse.json(
        {
          success: false,
          message: "Requête non autorisée.",
        },
        { status: 403 }
      );
    }

    // Validation des données.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Informations invalides.",
        },
        { status: 400 }
      );
    }

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Informations invalides.",
        },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    // A malformed deployment configuration must not look like a bad password.
    const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
    const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const configurationValid =
      Boolean(passwordHash && /^\$2[aby]\$(0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/.test(passwordHash)) &&
      Boolean(configuredEmail && z.email().safeParse(configuredEmail).success) &&
      (process.env.AUTH_SECRET?.length ?? 0) >= 32;

    if (!configurationValid) {
      console.error("ADMIN_AUTH_CONFIGURATION_INVALID: vérifier ADMIN_EMAIL, ADMIN_PASSWORD_HASH et AUTH_SECRET.");
      return NextResponse.json(
        { success: false, message: "Connexion temporairement indisponible. Réessayez plus tard." },
        { status: 503 }
      );
    }

    // Identification des tentatives.
    const ip =
      request.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim() || "unknown";

    const rateKey = hashValue(
      `${ip}:${email}:${process.env.AUTH_SECRET}`
    );

    const now = new Date();

    const windowStart = new Date(
      now.getTime() - 15 * 60 * 1000
    );

    // Limitation des tentatives.
    const attempts =
      await prisma.adminLoginAttempt.count({
        where: {
          rateKey,
          createdAt: {
            gte: windowStart,
          },
        },
      });

    if (attempts >= 5) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Trop de tentatives. Réessayez dans 15 minutes.",
        },
        { status: 429 }
      );
    }

    await prisma.adminLoginAttempt.create({
      data: {
        rateKey,
        createdAt: now,
      },
    });

    // Vérification du mot de passe administrateur.
    if (!passwordHash) {
      throw new Error(
        "Configuration administrateur incomplète."
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      passwordHash
    );

    const emailValid = email === getAdminEmail();

    if (!passwordValid || !emailValid) {
      return NextResponse.json(
        {
          success: false,
          message: genericError,
        },
        { status: 401 }
      );
    }

    // Vérification Resend.
    const resendKey = process.env.RESEND_API_KEY;
    const sender = process.env.MAIL_FROM;

    if (!resendKey || !sender) {
      console.error(
        "Configuration Resend incomplète : vérifiez RESEND_API_KEY et MAIL_FROM."
      );

      return NextResponse.json(
        {
          success: false,
          message: emailError,
        },
        { status: 503 }
      );
    }

    // Génération OTP.
    const otp = generateOtp();

    const challengeId = crypto.randomUUID();

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // Invalidation des anciens codes.
    await prisma.adminOtpChallenge.updateMany({
      where: {
        consumedAt: null,
      },
      data: {
        consumedAt: now,
      },
    });

    // Enregistrement du nouveau code.
    await prisma.adminOtpChallenge.create({
      data: {
        id: challengeId,
        codeHash: hashValue(
          `${challengeId}:${otp}:${process.env.AUTH_SECRET}`
        ),
        expiresAt,
        attempts: 0,
      },
    });

    // Création du jeton temporaire.
    let pendingToken: string;

    try {
      pendingToken =
        await createPendingToken(challengeId);
    } catch (error) {
      await deleteChallenge(challengeId);
      throw error;
    }

    // Envoi OTP par Resend.
    try {
      const resend = new Resend(resendKey);

      const { error } = await resend.emails.send({
        from: sender,
        to: getAdminEmail(),
        subject:
          "Code de connexion — Fondation Sauvons des Vies",
        text:
          `Votre code de connexion est : ${otp}\n\n` +
          "Ce code expire dans 5 minutes.\n" +
          "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
      });

      if (error) {
        console.error("REFUS_RESEND_ADMIN", {
          name: error.name,
          message: error.message,
        });

        await deleteChallenge(challengeId);

        return NextResponse.json(
          {
            success: false,
            message: emailError,
          },
          { status: 503 }
        );
      }
    } catch (error) {
      console.error(
        "ERREUR_TECHNIQUE_RESEND_ADMIN",
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
            }
          : "Erreur inconnue"
      );

      await deleteChallenge(challengeId);

      return NextResponse.json(
        {
          success: false,
          message: emailError,
        },
        { status: 503 }
      );
    }

    // Connexion validée : attente OTP.
    const response = NextResponse.json({
      success: true,
      message: "Un code de vérification a été envoyé.",
    });

    response.cookies.set(
      PENDING_COOKIE,
      pendingToken,
      secureCookieOptions(300)
    );

    return response;
  } catch (error) {
    console.error(
      "Erreur de connexion administrateur:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: genericError,
      },
      { status: 500 }
    );
  }
}
