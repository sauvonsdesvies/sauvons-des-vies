/** Retry a failed asset once per tab and URL; never loop or retry other errors. */
export function recoverChunkLoad(
  error: Error,
  storage: Pick<Storage, "getItem" | "setItem">,
  location: Pick<Location, "pathname" | "reload">
): boolean {
  if (!/ChunkLoadError|Loading chunk [\s\S]* failed|Failed to fetch dynamically imported module/i.test(`${error.name}: ${error.message}`)) return false;
  const key = `sdv:chunk-retry:${location.pathname}:${error.message}`;
  try {
    if (storage.getItem(key)) return false;
    storage.setItem(key, "1");
  } catch { return false; }
  location.reload();
  return true;
}
