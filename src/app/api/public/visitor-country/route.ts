
import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_COUNTRIES = new Set([
  "BJ", "TG", "CI", "SN", "BF", "ML", "NE",
  "GH", "NG", "CM", "GA", "CG", "CD",
  "FR", "DE", "AT", "IT", "ES", "BE",
  "CH", "GB", "US", "CA",
]);

export async function GET(request: NextRequest) {
  // Ces en-têtes doivent provenir d'un proxy
  // ou hébergeur de confiance.
  const vercelCountry = request.headers.get(
    "x-vercel-ip-country"
  );

  const cloudflareCountry = request.headers.get(
    "cf-ipcountry"
  );

  const detectedCountry = (
    vercelCountry ||
    cloudflareCountry ||
    ""
  )
    .trim()
    .toUpperCase();

  const detected = SUPPORTED_COUNTRIES.has(
    detectedCountry
  );

  return NextResponse.json(
    {
      success: true,
      country: detected ? detectedCountry : "BJ",
      detected,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
