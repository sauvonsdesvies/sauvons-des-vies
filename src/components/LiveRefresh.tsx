"use client";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { subscribeCampaignUpdates } from "@/lib/campaigns/live-updates";

// Actualisation des données serveur, sans recharger la page ni perdre la navigation.
export default function LiveRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    const refresh = () => {
      if (!pending && document.visibilityState === "visible") startTransition(() => router.refresh());
    };
    const timer = window.setInterval(refresh, 10000);
    const unsubscribe = subscribeCampaignUpdates(refresh);
    window.addEventListener("focus", refresh);
    return () => { unsubscribe(); window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [router, pending]);
  return null;
}
