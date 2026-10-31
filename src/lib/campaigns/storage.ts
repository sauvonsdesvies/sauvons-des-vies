
import "server-only";
import { randomUUID } from "node:crypto";

export class CampaignPhotoError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) {
    super(message);
    this.name = "CampaignPhotoError";
  }
}

type StorageConfig = {
  url: string;
  serviceKey: string;
  bucket: string;
};

function getStorageConfig(): StorageConfig {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_CAMPAIGNS_BUCKET;

  if (!url || !serviceKey || !bucket) {
    const missing = [!url && "SUPABASE_URL", !serviceKey && "SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY)", !bucket && "SUPABASE_CAMPAIGNS_BUCKET"].filter(Boolean);
    console.error("Variables Storage manquantes:", missing);
    throw new CampaignPhotoError("STORAGE_NOT_CONFIGURED", 503, "Le stockage des photos n’est pas configuré. Contactez le responsable du site.");
  }

  let validUrl = false;
  try { const parsed = new URL(url); validUrl = parsed.protocol === "https:" && !parsed.username && !parsed.password && parsed.pathname === "/"; } catch {}
  if (!validUrl) throw new CampaignPhotoError("STORAGE_URL_INVALID", 503, "L’adresse du stockage des photos est mal configurée.");

  return {
    url: url.replace(/\/+$/, ""),
    serviceKey,
    bucket,
  };
}

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function getCampaignPhotoUrl(storagePath: string) {
  const config = getStorageConfig();

  return (
    `${config.url}/storage/v1/object/public/` +
    `${encodeURIComponent(config.bucket)}/` +
    encodeStoragePath(storagePath)
  );
}

export async function uploadCampaignPhoto(
  file: File,
  sessionId: string
) {
  const config = getStorageConfig();

  if (file.size === 0 || file.size > 5 * 1024 * 1024) {
    throw new CampaignPhotoError("INVALID_FILE_SIZE", 400, "La photo doit peser entre 1 octet et 5 Mo.");
  }

  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const extension = extensions[file.type];

  if (!extension) {
    throw new CampaignPhotoError("INVALID_FILE_TYPE", 400, "Formats acceptés : JPG, PNG et WebP.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const signatures: Record<string, boolean> = {
    "image/jpeg":
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
    "image/png":
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
      ),
    "image/webp":
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP",
  };

  if (!signatures[file.type]) {
    throw new CampaignPhotoError("INVALID_FILE_CONTENT", 400, "Le contenu du fichier ne correspond pas à une image JPG, PNG ou WebP.");
  }

  const headers: Record<string, string> = { apikey: config.serviceKey };
  // Les nouvelles clés sb_secret ne sont pas des JWT.
  if (!config.serviceKey.startsWith("sb_secret_")) headers.Authorization = `Bearer ${config.serviceKey}`;
  let bucketResponse: Response;
  try {
    bucketResponse = await fetch(`${config.url}/storage/v1/bucket/${encodeURIComponent(config.bucket)}`, {
      headers, cache: "no-store", signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new CampaignPhotoError("STORAGE_UNREACHABLE", 503, "Le stockage des photos est temporairement inaccessible.");
  }
  if (!bucketResponse.ok) {
    console.error("Vérification du bucket refusée:", { status: bucketResponse.status });
    throw new CampaignPhotoError("STORAGE_BUCKET_UNAVAILABLE", 503, "Le bucket des photos est introuvable ou son accès serveur est mal configuré.");
  }
  const bucketInfo = await bucketResponse.json();
  // Ne jamais rendre public un bucket privé, notamment les documents médicaux.
  if (bucketInfo.public !== true || /medical|médic|document|confiden|private/i.test(config.bucket)) {
    throw new CampaignPhotoError("STORAGE_BUCKET_NOT_PUBLIC_PHOTOS", 503, "Un bucket public dédié aux photos des collectes est requis. Les documents confidentiels doivent rester dans un stockage privé séparé.");
  }

  const storagePath =
    `campaign-uploads/${sessionId}/` +
    `${randomUUID()}.${extension}`;

  const uploadUrl =
    `${config.url}/storage/v1/object/` +
    `${encodeURIComponent(config.bucket)}/` +
    encodeStoragePath(storagePath);

  let response: Response;
  try { response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": file.type,
      "x-upsert": "false",
      "Cache-Control": "public, max-age=3600",
    },
    body: buffer,
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  }); } catch {
    throw new CampaignPhotoError("STORAGE_UNREACHABLE", 503, "L’envoi de la photo a été interrompu. Réessayez.");
  }

  if (!response.ok) {
    // Ne jamais journaliser le corps brut du service ni ses en-têtes d’authentification.
    console.error("Refus Supabase Storage:", { status: response.status });
    throw new CampaignPhotoError("STORAGE_UPLOAD_FAILED", 502, "Supabase n’a pas accepté la photo. Vérifiez la configuration du bucket ou réessayez.");
  }

  return {
    storagePath,
    imageUrl: getCampaignPhotoUrl(storagePath),
  };
}
