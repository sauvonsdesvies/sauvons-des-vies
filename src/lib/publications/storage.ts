
import "server-only";
import { randomUUID } from "node:crypto";
import type { PublicationImage } from "@/types/publication";

const MAX_BYTES = 5 * 1024 * 1024;

function config() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.PUBLICATION_IMAGES_BUCKET || process.env.SUPABASE_CAMPAIGNS_BUCKET;

  if (!url || !serviceKey || !bucket) {
    throw new Error(
      "Configuration Supabase Storage des publications manquante."
    );
  }

  return {
    url: url.replace(/\/$/, ""),
    serviceKey,
    bucket,
  };
}

function encodedPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function getPublicationPhotoUrl(storagePath: string) {
  const { url, bucket } = config();

  if (
    !/^publications\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(storagePath)
  ) {
    throw new Error("Chemin de photo invalide.");
  }

  return (
    `${url}/storage/v1/object/public/` +
    `${encodeURIComponent(bucket)}/${encodedPath(storagePath)}`
  );
}

function detectImage(
  bytes: Uint8Array
): { type: string; extension: string } | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { type: "image/jpeg", extension: "jpg" };
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { type: "image/png", extension: "png" };
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return { type: "image/webp", extension: "webp" };
  }

  return null;
}

export async function uploadPublicationPhoto(
  file: File
): Promise<PublicationImage> {
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error("Taille de photo invalide.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const image = detectImage(bytes);

  if (!image || file.type !== image.type) {
    throw new Error("Format de photo non autorisé.");
  }

  const { url, serviceKey, bucket } = config();

  const storagePath = `publications/${randomUUID()}.${image.extension}`;

  const uploadUrl =
    `${url}/storage/v1/object/` +
    `${encodeURIComponent(bucket)}/${encodedPath(storagePath)}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      ...(!serviceKey.startsWith("sb_secret_") ? { Authorization: `Bearer ${serviceKey}` } : {}),
      "Content-Type": image.type,
      "x-upsert": "false",
    },
    body: bytes,
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error("Le stockage Supabase a refusé la photo.");
  }

  return {
    storagePath,
    imageUrl: getPublicationPhotoUrl(storagePath),
  };
}
