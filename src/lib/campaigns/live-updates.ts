"use client";

const KEY = "sdv:campaign-updated";
export function notifyCampaignUpdate() {
  window.dispatchEvent(new Event(KEY));
  try { localStorage.setItem(KEY, crypto.randomUUID()); } catch { /* Polling remains available. */ }
}
export function subscribeCampaignUpdates(refresh: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === KEY) refresh(); };
  window.addEventListener(KEY, refresh);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(KEY, refresh);
    window.removeEventListener("storage", storage);
  };
}
