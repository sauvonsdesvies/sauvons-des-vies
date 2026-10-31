"use client";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

// Actualisation des données serveur, sans recharger la page ni perdre la navigation.
export default function LiveRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    const refresh = () => {
      if (!pending && document.visibilityState === "visible") startTransition(() => router.refresh());
    };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [router, pending]);
  return null;
}
