
/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS integration test loader. */

"use strict";

/**
 * FONDATION SAUVONS DES VIES
 * Test d'intégration des photos de campagnes.
 *
 * Ce test :
 * - crée une session administrateur temporaire ;
 * - vérifie les protections de l'API ;
 * - téléverse trois miniatures du logo officiel ;
 * - vérifie les images stockées ;
 * - teste le rejet des fichiers invalides ;
 * - vérifie la limite de cinq photos ;
 * - expire la session dans tous les cas.
 *
 * ATTENTION :
 * Les trois images téléversées sont conservées dans
 * Supabase Storage. Le test n'efface aucune donnée.
 *
 * Ne jamais afficher :
 * - clés API ;
 * - JWT ;
 * - cookies ;
 * - identifiants de session.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const sharp = require("sharp");

const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd(), true, {
  info() {},
  error() {},
});

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// ==========================================================
// CONFIGURATION
// ==========================================================

const PROJECT_ROOT = process.cwd();

const LOGO_PATH = path.join(
  PROJECT_ROOT,
  "public",
  "logo",
  "logo.png"
);

const TEST_ORIGIN =
  process.env.PHOTO_TEST_ORIGIN ||
  "http://localhost:3002";

const ENDPOINT_PATH = "/api/admin/campaigns/photos";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_FORMATS = [
  {
    format: "jpeg",
    mime: "image/jpeg",
    extension: "jpg",
  },
  {
    format: "png",
    mime: "image/png",
    extension: "png",
  },
  {
    format: "webp",
    mime: "image/webp",
    extension: "webp",
  },
];

// ==========================================================
// VÉRIFICATION DE LA CONFIGURATION
// ==========================================================

function validateConfiguration() {
  const requiredVariables = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "SUPABASE_URL",
  ];

  for (const name of requiredVariables) {
    assert.ok(
      process.env[name],
      `Configuration manquante : ${name}`
    );
  }

  assert.ok(
    fs.existsSync(LOGO_PATH),
    "Logo officiel introuvable : public/logo/logo.png"
  );

  const parsedOrigin = new URL(TEST_ORIGIN);

  assert.equal(
    parsedOrigin.protocol,
    "http:",
    "Le serveur de test doit utiliser HTTP local."
  );

  assert.ok(
    ["localhost", "127.0.0.1"].includes(
      parsedOrigin.hostname
    ),
    "Le test est limité à localhost."
  );

  assert.ok(
    parsedOrigin.port,
    "Le serveur de test doit utiliser un port explicite."
  );

  assert.equal(
    parsedOrigin.pathname,
    "/",
    "PHOTO_TEST_ORIGIN ne doit pas contenir de chemin."
  );

  assert.equal(
    parsedOrigin.search,
    "",
    "PHOTO_TEST_ORIGIN ne doit pas contenir de paramètres."
  );

  assert.equal(
    parsedOrigin.hash,
    "",
    "PHOTO_TEST_ORIGIN ne doit pas contenir de fragment."
  );

  return parsedOrigin.origin;
}

// ==========================================================
// CHARGEMENT DES MODULES TYPESCRIPT SERVEUR
// ==========================================================

function loadServerModule(filename, prisma) {
  const absolutePath = path.resolve(
    PROJECT_ROOT,
    filename
  );

  assert.ok(
    fs.existsSync(absolutePath),
    `Module introuvable : ${filename}`
  );

  const source = fs.readFileSync(
    absolutePath,
    "utf8"
  );

  const transpiled = ts.transpileModule(source, {
    fileName: absolutePath,

    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },

    reportDiagnostics: true,
  });

  const errors = (
    transpiled.diagnostics || []
  ).filter(
    (diagnostic) =>
      diagnostic.category ===
      ts.DiagnosticCategory.Error
  );

  assert.equal(
    errors.length,
    0,
    `Erreur de transpilation : ${filename}`
  );

  const loadedModule = {
    exports: {},
  };

  function resolveModule(name) {
    if (name === "server-only") {
      return {};
    }

    if (name === "@/lib/prisma") {
      return { prisma };
    }

    return require(name);
  }

  const execute = new Function(
    "require",
    "module",
    "exports",
    transpiled.outputText
  );

  execute(
    resolveModule,
    loadedModule,
    loadedModule.exports
  );

  return loadedModule.exports;
}

// ==========================================================
// LECTURE SÉCURISÉE DES RÉPONSES
// ==========================================================

async function readJsonResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

// ==========================================================
// CRÉATION D'UN FORMULAIRE IMAGE
// ==========================================================

function createImageForm(bytes, filename, mime) {
  const form = new FormData();

  const file = new File(
    [bytes],
    filename,
    { type: mime }
  );

  form.append("file", file);

  return form;
}

// ==========================================================
// TEST : SESSION ADMINISTRATEUR REQUISE
// ==========================================================

async function testAuthentication(endpoint, origin) {
  const response = await fetch(endpoint, {
    method: "POST",

    headers: {
      origin,
    },
  });

  assert.equal(
    response.status,
    401,
    `Session absente : HTTP ${response.status}`
  );

  console.log(
    "PASS : session administrateur requise (401)."
  );
}

// ==========================================================
// TEST : REFUS D'UNE ORIGINE EXTERNE
// ==========================================================

async function testCrossOrigin(endpoint, cookie) {
  const response = await fetch(endpoint, {
    method: "POST",

    headers: {
      origin: "https://example.invalid",
      cookie,
    },
  });

  assert.equal(
    response.status,
    403,
    `Origine externe : HTTP ${response.status}`
  );

  console.log(
    "PASS : origine externe refusée (403)."
  );
}

// ==========================================================
// TEST : TÉLÉVERSEMENT DES IMAGES
// ==========================================================

async function testImageUploads({
  endpoint,
  headers,
  sessionId,
}) {
  const supabaseOrigin = new URL(
    process.env.SUPABASE_URL
  ).origin;

  for (const item of ALLOWED_FORMATS) {
    const bytes = await sharp(LOGO_PATH)
      .resize(16, 16)
      .toFormat(item.format)
      .toBuffer();

    const form = createImageForm(
      bytes,
      `test-logo.${item.extension}`,
      item.mime
    );

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: form,
    });

    const body = await readJsonResponse(response);

    assert.equal(
      response.status,
      201,
      `${item.format} : HTTP ${response.status}, code ${
        body?.code || "inconnu"
      }`
    );

    assert.ok(
      body &&
      typeof body === "object" &&
      body.photo &&
      typeof body.photo === "object",
      `${item.format} : réponse photo manquante.`
    );

    const storagePath = body.photo.storagePath;
    const imageUrl = body.photo.imageUrl;

    assert.equal(
      typeof storagePath,
      "string",
      "Chemin de stockage invalide."
    );

    assert.equal(
      typeof imageUrl,
      "string",
      "URL de l'image invalide."
    );

    assert.ok(
      storagePath.startsWith(
        `campaign-uploads/${sessionId}/`
      ),
      "Chemin de stockage inattendu."
    );

    const publicImageUrl = new URL(imageUrl);

    assert.equal(
      publicImageUrl.protocol,
      "https:",
      "L'image publique doit utiliser HTTPS."
    );

    assert.equal(
      publicImageUrl.origin,
      supabaseOrigin,
      "Origine de stockage inattendue."
    );

    const imageResponse = await fetch(
      publicImageUrl
    );

    assert.equal(
      imageResponse.status,
      200,
      `Image publique : HTTP ${imageResponse.status}`
    );

    const actualMime = (
      imageResponse.headers.get("content-type") || ""
    )
      .split(";")[0]
      .trim()
      .toLowerCase();

    assert.equal(
      actualMime,
      item.mime,
      "Type MIME inattendu."
    );

    const downloadedBytes = Buffer.from(
      await imageResponse.arrayBuffer()
    );

    assert.deepEqual(
      downloadedBytes,
      bytes,
      "Le contenu téléchargé diffère du fichier envoyé."
    );

    console.log(
      `PASS : ${item.format}, téléversement 201, image publique 200 et contenu identique.`
    );
  }
}

// ==========================================================
// TEST : FICHIERS INVALIDES
// ==========================================================

async function testInvalidFiles(endpoint, headers) {
  const invalidFiles = [
    {
      name: "contenu falsifié",
      bytes: Buffer.from(
        "contenu non image"
      ),
      mime: "image/png",
    },
    {
      name: "fichier supérieur à 5 Mo",
      bytes: Buffer.alloc(
        MAX_IMAGE_SIZE + 1
      ),
      mime: "image/png",
    },
    {
      name: "document PDF",
      bytes: Buffer.from("document"),
      mime: "application/pdf",
    },
  ];

  for (const item of invalidFiles) {
    const form = createImageForm(
      item.bytes,
      "fichier-refuse",
      item.mime
    );

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: form,
    });

    assert.equal(
      response.status,
      400,
      `${item.name} : HTTP ${response.status}`
    );
  }

  console.log(
    "PASS : contenu falsifié, fichier > 5 Mo et PDF refusés (400)."
  );
}

// ==========================================================
// TEST : LIMITE DE CINQ PHOTOS
// ==========================================================

function testPhotoLimit(prisma) {
  const validation = loadServerModule(
    "src/lib/campaigns/validation.ts",
    prisma
  );

  assert.equal(
    typeof validation.validateCampaignInput,
    "function",
    "Fonction de validation introuvable."
  );

  const result = validation.validateCampaignInput({
    title: "Validation limite photos",

    shortDescription:
      "Validation locale de la limite",

    description:
      "Validation locale sans création de collecte en base.",

    categoryId:
      "00000000-0000-4000-8000-000000000000",

    targetAmount: 1,

    status: "DRAFT",

    photos: Array.from(
      { length: 6 },
      () => ({})
    ),
  });

  assert.equal(
    result.success,
    false,
    "Six photos doivent être refusées."
  );

  assert.match(
    String(result.error || ""),
    /cinq photos maximum/i,
    "Message de validation inattendu."
  );

  console.log(
    "PASS : six photos refusées par la validation serveur."
  );
}

// ==========================================================
// EXÉCUTION PRINCIPALE
// ==========================================================

async function main() {
  const origin = validateConfiguration();

  const endpoint = new URL(
    ENDPOINT_PATH,
    origin
  ).toString();

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString:
        process.env.DATABASE_URL,
    }),
  });

  let sessionId = null;

  try {
    const auth = loadServerModule(
      "src/lib/admin-auth.ts",
      prisma
    );

    assert.equal(
      typeof auth.createAdminSession,
      "function",
      "Helper de création de session introuvable."
    );

    assert.equal(
      typeof auth.SESSION_COOKIE,
      "string",
      "Nom du cookie de session introuvable."
    );

    const session =
      await auth.createAdminSession();

    assert.ok(
      session &&
      typeof session.token === "string",
      "Le helper n'a pas retourné de token."
    );

    const { jwtVerify } = require("jose");

    const verified = await jwtVerify(
      session.token,
      new TextEncoder().encode(
        process.env.AUTH_SECRET
      )
    );

    sessionId = verified.payload.sessionId;

    assert.equal(
      typeof sessionId,
      "string",
      "Identifiant de session absent du JWT."
    );

    const headers = {
      origin,

      cookie:
        `${auth.SESSION_COOKIE}=${session.token}`,
    };

    // Vérification de la protection de l'API.

    await testAuthentication(
      endpoint,
      origin
    );

    await testCrossOrigin(
      endpoint,
      headers.cookie
    );

    // Vérification des images autorisées.

    await testImageUploads({
      endpoint,
      headers,
      sessionId,
    });

    // Vérification des fichiers interdits.

    await testInvalidFiles(
      endpoint,
      headers
    );

    // Vérification de la limite de photos.

    testPhotoLimit(prisma);

    console.log(
      "SUCCÈS : tous les tests d'intégration sont passés."
    );
  } finally {
    // La session de test est expirée,
    // même si un test échoue.

    if (sessionId) {
      try {
        await prisma.adminSession.update({
          where: {
            id: sessionId,
          },

          data: {
            expiresAt: new Date(),
          },
        });

        console.log(
          "Session de test expirée."
        );
      } catch {
        console.error(
          "ATTENTION : expiration de session non confirmée."
        );
      }
    }

    await prisma.$disconnect();

    console.log(
      "Aucune suppression de données effectuée."
    );
  }
}

// ==========================================================
// GESTION FINALE DES ERREURS
// ==========================================================

main().catch(() => {
  console.error(
    "ÉCHEC DU TEST : vérifiez la configuration, les réponses HTTP et les journaux du serveur. Aucun secret n'est affiché."
  );

  process.exitCode = 1;
});
