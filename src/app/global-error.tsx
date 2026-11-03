"use client";

import { useEffect } from "react";
import { recoverChunkLoad } from "@/lib/chunk-recovery";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    try { recoverChunkLoad(error, window.sessionStorage, window.location); } catch { /* Manual reload remains available. */ }
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, background: "#F3F8FC", color: "#092B50", fontFamily: "Arial, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <div style={{ maxWidth: 460, textAlign: "center", lineHeight: 1.6 }}>
            <h1 style={{ fontSize: 26 }}>Chargement interrompu</h1>
            <p>Rechargez la page pour continuer.</p>
            <button onClick={() => window.location.reload()} style={{ background: "#E71E3D", color: "white", border: 0, borderRadius: 12, padding: "14px 24px", fontSize: 18, cursor: "pointer" }}>Recharger la page</button>
          </div>
        </main>
      </body>
    </html>
  );
}
