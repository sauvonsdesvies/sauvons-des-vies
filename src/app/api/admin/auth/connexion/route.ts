
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

const schema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
});

const genericError =
  "Identifiants incorrects ou connexion temporairement indisponible.";

const emailError =
  "Le code de connexion n'a pas pu être envoyé par email. Réessayez plus tard.";

async function deleteChallenge(challengeId: string) {
  try {
    await prisma.adminOtpChallenge.deleteMany({
      where: { id: challengeId },
    });
  } catch (error) {
    console.error("Erreur de nettoyage du code administrateur:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérification de l'origine de la requête.
    const origin = request.headers.get("origin");

    if (origin !== request.nextUrl.origin) {
      return NextResponse.json(
        {
          success: false,
          message: "Requête non autorisée.",
        },
        { status: 403 }
      );
    }

    // Validation des données reçues.
    const body = await request.json();
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

    // Identification des tentatives sans conserver l'IP en clair.
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const rateKey = hashValue(
      `${ip}:${email}:${process.env.AUTH_SECRET}`
    );

    const now = new Date();
    const windowStart = new Date(
      Date.now() - 15 * 60 * 1000
    );

    // Limitation des tentatives de connexion.
    const attempts = await prisma.adminLoginAttempt.count({
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

    // Vérification des identifiants administrateur.
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;

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

    // Vérification de la configuration Resend.
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

    // Génération du code de vérification à six chiffres.
    const otp = generateOtp();
    const challengeId = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // Invalidation des anciens codes actifs.
    await prisma.adminOtpChallenge.updateMany({
      where: {
        consumedAt: null,
      },
      data: {
        consumedAt: now,
      },
    });

    // Enregistrement sécurisé du nouveau code.
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

    // Préparation du jeton temporaire avant l'envoi.
    let pendingToken: string;

    try {
      pendingToken = await createPendingToken(challengeId);
    } catch (error) {
      await deleteChallenge(challengeId);
      throw error;
    }

    // Envoi du code par Resend.
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
        // Diagnostic côté serveur uniquement.
        // Ne jamais afficher la clé API ni le code OTP.
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
          ? { name: error.name, message: error.message }
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

    // Connexion initiale validée : attente du code OTP.
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
