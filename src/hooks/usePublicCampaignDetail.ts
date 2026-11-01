
"use client";
import { subscribeCampaignUpdates } from "@/lib/campaigns/live-updates";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ==========================================================
// FONDATION SAUVONS DES VIES
// HOOK PUBLIC — DÉTAIL D'UNE CAMPAGNE
// ==========================================================
//
// Route API : /api/public/campaigns/[slug]
//
// Fonctionnalités :
// - Chargement sécurisé d'une campagne publiée
// - Photos et galerie
// - Informations du bénéficiaire
// - Progression des dons confirmés
// - Nombre de donateurs
// - Dates et statut de collecte
// - Publications et mises à jour
// - Campagnes similaires
// - Actualisation automatique
// - Actualisation au retour sur l'onglet
// - Actualisation après reconnexion
// - Annulation des requêtes obsolètes
// - Gestion des erreurs et des campagnes introuvables
//
// Aucun montant ou contenu fictif.
// Aucun paiement effectué depuis ce hook.
//
// ==========================================================

// ----------------------------------------------------------
// CONSTANTES
// ----------------------------------------------------------

const DEFAULT_REFRESH_INTERVAL = 10_000;
const MIN_REFRESH_INTERVAL = 5_000;
const REQUEST_TIMEOUT = 15_000;
const MAX_SIMILAR_CAMPAIGNS = 6;

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

export type PublicCampaignDetailStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "CLOSED";

export type PublicCampaignDetailPriority =
  | "URGENT"
  | "PRIORITY"
  | "NORMAL";

export type PublicCampaignDetailCategory = {
  id: string;
  name: string;
  slug: string;
};

export type PublicCampaignDetailPhoto = {
  id: string;
  imageUrl: string;
  position: number;
};

export type PublicCampaignDetailBeneficiary = {
  id: string;
  firstName: string;
  lastName: string;
  city: string | null;
  country: string | null;
};

export type PublicCampaignDetailUpdate = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  category: string;
  imageUrl: string | null;
  publishedAt: string | null;
};

export type PublicCampaignDetailSimilar = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  imageUrl: string | null;
  category: PublicCampaignDetailCategory | null;
  country: string | null;
  currency: string;
  targetAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  donorCount: number;
  isUrgent: boolean;
  status: PublicCampaignDetailStatus;
};

export type PublicCampaignDetail = {
  id: string;
  slug: string;

  title: string;
  shortDescription: string;
  description: string;

  imageUrl: string | null;
  photos: PublicCampaignDetailPhoto[];

  category: PublicCampaignDetailCategory | null;
  beneficiary: PublicCampaignDetailBeneficiary | null;

  country: string | null;
  countryCode: string | null;

  currency: string;
  targetAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  donorCount: number;

  isUrgent: boolean;
  priority: PublicCampaignDetailPriority;
  status: PublicCampaignDetailStatus;

  startDate: string | null;
  endDate: string | null;
  publishedAt: string | null;
  completedAt: string | null;

  updates: PublicCampaignDetailUpdate[];
  similarCampaigns: PublicCampaignDetailSimilar[];
};

export type PublicCampaignDetailErrorCode =
  | "INVALID_SLUG"
  | "NOT_FOUND"
  | "NETWORK_ERROR"
  | "REQUEST_TIMEOUT"
  | "INVALID_RESPONSE"
  | "SERVER_ERROR";

export type PublicCampaignDetailError = {
  code: PublicCampaignDetailErrorCode;
  message: string;
  status: number | null;
};

export type UsePublicCampaignDetailOptions = {
  slug: string;
  initialCampaign?: PublicCampaignDetail | null;
  refreshInterval?: number;
  enabled?: boolean;
};

export type UsePublicCampaignDetailResult = {
  campaign: PublicCampaignDetail | null;

  photos: PublicCampaignDetailPhoto[];
  updates: PublicCampaignDetailUpdate[];
  similarCampaigns: PublicCampaignDetailSimilar[];

  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  isNotFound: boolean;

  error: PublicCampaignDetailError | null;
  lastFetchedAt: string | null;

  refresh: () => Promise<void>;
};

// ----------------------------------------------------------
// OUTILS DE VALIDATION
// ----------------------------------------------------------

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function readString(
  value: unknown,
  fallback = ""
): string {
  return isString(value) ? value : fallback;
}

function readNullableString(
  value: unknown
): string | null {
  return isString(value) && value.trim()
    ? value
    : null;
}

function readNonNegativeNumber(
  value: unknown,
  fallback = 0
): number {
  return isFiniteNumber(value)
    ? Math.max(0, value)
    : fallback;
}

function readInteger(
  value: unknown,
  fallback = 0
): number {
  return isFiniteNumber(value)
    ? Math.max(0, Math.trunc(value))
    : fallback;
}

function readBoolean(
  value: unknown,
  fallback = false
): boolean {
  return typeof value === "boolean"
    ? value
    : fallback;
}

function readDate(
  value: unknown
): string | null {
  if (!isString(value) || !value.trim()) {
    return null;
  }

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp)
    ? value
    : null;
}

function readStatus(
  value: unknown
): PublicCampaignDetailStatus {
  if (
    value === "ACTIVE" ||
    value === "COMPLETED" ||
    value === "CLOSED"
  ) {
    return value;
  }

  return "ACTIVE";
}

function readPriority(
  value: unknown,
  isUrgent: boolean
): PublicCampaignDetailPriority {
  if (
    value === "URGENT" ||
    value === "PRIORITY" ||
    value === "NORMAL"
  ) {
    return value;
  }

  return isUrgent ? "URGENT" : "NORMAL";
}

// ----------------------------------------------------------
// CATÉGORIE
// ----------------------------------------------------------

function parseCategory(
  value: unknown
): PublicCampaignDetailCategory | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const name = readString(value.name);
  const slug = readString(value.slug);

  if (!id || !name || !slug) {
    return null;
  }

  return {
    id,
    name,
    slug,
  };
}

// ----------------------------------------------------------
// BÉNÉFICIAIRE
// ----------------------------------------------------------

function parseBeneficiary(
  value: unknown
): PublicCampaignDetailBeneficiary | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const firstName = readString(value.firstName);
  const lastName = readString(value.lastName);

  if (!id) {
    return null;
  }

  return {
    id,
    firstName,
    lastName,
    city: readNullableString(value.city),
    country: readNullableString(value.country),
  };
}

// ----------------------------------------------------------
// PHOTOS
// ----------------------------------------------------------

function parsePhotos(
  value: unknown
): PublicCampaignDetailPhoto[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const photos: PublicCampaignDetailPhoto[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    const imageUrl = readNullableString(
      item.imageUrl
    );

    if (!imageUrl || seen.has(imageUrl)) {
      continue;
    }

    const id =
      readNullableString(item.id) ?? imageUrl;

    photos.push({
      id,
      imageUrl,
      position: readInteger(item.position),
    });

    seen.add(imageUrl);
  }

  photos.sort(
    (a, b) => a.position - b.position
  );

  return photos;
}

// ----------------------------------------------------------
// PUBLICATIONS / MISES À JOUR
// ----------------------------------------------------------

function parseUpdates(
  value: unknown
): PublicCampaignDetailUpdate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const updates: PublicCampaignDetailUpdate[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    const id = readString(item.id);
    const slug = readString(item.slug);
    const title = readString(item.title);

    if (!id || !slug || !title || seen.has(id)) {
      continue;
    }

    updates.push({
      id,
      slug,
      title,
      shortDescription: readString(
        item.shortDescription
      ),
      content: readString(item.content),
      category: readString(item.category),
      imageUrl: readNullableString(
        item.imageUrl
      ),
      publishedAt: readDate(item.publishedAt),
    });

    seen.add(id);
  }

  updates.sort((a, b) => {
    const dateA = a.publishedAt
      ? Date.parse(a.publishedAt)
      : 0;

    const dateB = b.publishedAt
      ? Date.parse(b.publishedAt)
      : 0;

    return dateB - dateA;
  });

  return updates;
}

// ----------------------------------------------------------
// CAMPAGNES SIMILAIRES
// ----------------------------------------------------------

function parseSimilarCampaigns(
  value: unknown
): PublicCampaignDetailSimilar[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const campaigns: PublicCampaignDetailSimilar[] =
    [];

  const seen = new Set<string>();

  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    const id = readString(item.id);
    const slug = readString(item.slug);
    const title = readString(item.title);

    if (
      !id ||
      !slug ||
      !title ||
      seen.has(id)
    ) {
      continue;
    }

    const targetAmount =
      readNonNegativeNumber(item.targetAmount);

    const collectedAmount =
      readNonNegativeNumber(item.collectedAmount);

    const remainingAmount = Math.max(
      0,
      targetAmount - collectedAmount
    );

    const progressPercentage =
      targetAmount > 0
        ? Math.min(
            100,
            Math.round(
              (collectedAmount / targetAmount) *
                100
            )
          )
        : 0;

    campaigns.push({
      id,
      slug,
      title,
      shortDescription: readString(
        item.shortDescription
      ),
      imageUrl: readNullableString(
        item.imageUrl
      ),
      category: parseCategory(item.category),
      country: readNullableString(item.country),
      currency: readString(
        item.currency,
        "XOF"
      ),
      targetAmount,
      collectedAmount,
      remainingAmount,
      progressPercentage,
      donorCount: readInteger(item.donorCount),
      isUrgent: readBoolean(item.isUrgent),
      status: readStatus(item.status),
    });

    seen.add(id);

    if (
      campaigns.length >= MAX_SIMILAR_CAMPAIGNS
    ) {
      break;
    }
  }

  return campaigns;
}

// ----------------------------------------------------------
// CAMPAGNE PRINCIPALE
// ----------------------------------------------------------

function parseCampaign(
  value: unknown
): PublicCampaignDetail | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const slug = readString(value.slug);
  const title = readString(value.title);

  if (!id || !slug || !title) {
    return null;
  }

  const targetAmount =
    readNonNegativeNumber(value.targetAmount);

  const collectedAmount =
    readNonNegativeNumber(value.collectedAmount);

  const remainingAmount = Math.max(
    0,
    targetAmount - collectedAmount
  );

  const progressPercentage =
    targetAmount > 0
      ? Math.min(
          100,
          Math.round(
            (collectedAmount / targetAmount) *
              100
          )
        )
      : 0;

  const isUrgent = readBoolean(
    value.isUrgent
  );

  const photos = parsePhotos(value.photos);

  const mainImage = readNullableString(
    value.imageUrl
  );

  // La photo principale est toujours disponible
  // pour la galerie lorsqu'elle existe.
  //
  // Aucune image fictive n'est ajoutée.

  if (
    mainImage &&
    !photos.some(
      (photo) => photo.imageUrl === mainImage
    )
  ) {
    photos.unshift({
      id: `main-${id}`,
      imageUrl: mainImage,
      position: -1,
    });
  }

  const updates = parseUpdates(value.updates);

  const similarCampaigns =
    parseSimilarCampaigns(
      value.similarCampaigns
    ).filter(
      (campaign) => campaign.id !== id
    );

  return {
    id,
    slug,
    title,

    shortDescription: readString(
      value.shortDescription
    ),

    description: readString(
      value.description
    ),

    imageUrl:
      mainImage ??
      photos[0]?.imageUrl ??
      null,

    photos,

    category: parseCategory(value.category),

    beneficiary: parseBeneficiary(
      value.beneficiary
    ),

    country: readNullableString(
      value.country
    ),

    countryCode: readNullableString(
      value.countryCode
    ),

    currency: readString(
      value.currency,
      "XOF"
    ),

    targetAmount,
    collectedAmount,
    remainingAmount,
    progressPercentage,

    donorCount: readInteger(
      value.donorCount
    ),

    isUrgent,

    priority: readPriority(
      value.priority,
      isUrgent
    ),

    status: readStatus(value.status),

    startDate: readDate(value.startDate),
    endDate: readDate(value.endDate),

    publishedAt: readDate(
      value.publishedAt
    ),

    completedAt: readDate(
      value.completedAt
    ),

    updates,
    similarCampaigns,
  };
}

// ----------------------------------------------------------
// VALIDATION DU SLUG
// ----------------------------------------------------------

function normalizeSlug(
  value: string
): string {
  return value.trim();
}

function isValidSlug(
  value: string
): boolean {
  return (
    value.length > 0 &&
    value.length <= 200 &&
    /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value)
  );
}

// ----------------------------------------------------------
// CONSTRUCTION DES ERREURS
// ----------------------------------------------------------

function createError(
  code: PublicCampaignDetailErrorCode,
  message: string,
  status: number | null = null
): PublicCampaignDetailError {
  return {
    code,
    message,
    status,
  };
}

// ----------------------------------------------------------
// EXTRACTION DE LA RÉPONSE API
// ----------------------------------------------------------

function parseApiResponse(
  payload: unknown
): PublicCampaignDetail | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (payload.success !== true) {
    return null;
  }

  return parseCampaign(payload.campaign);
}

// ----------------------------------------------------------
// HOOK PRINCIPAL
// ----------------------------------------------------------

export function usePublicCampaignDetail({
  slug,
  initialCampaign = null,
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
  enabled = true,
}: UsePublicCampaignDetailOptions): UsePublicCampaignDetailResult {
  const normalizedSlug = useMemo(
    () => normalizeSlug(slug),
    [slug]
  );

  const [campaign, setCampaign] =
    useState<PublicCampaignDetail | null>(
      initialCampaign
    );

  const [isLoading, setIsLoading] =
    useState<boolean>(
      enabled && initialCampaign === null
    );

  const [isRefreshing, setIsRefreshing] =
    useState<boolean>(false);

  const [error, setError] =
    useState<PublicCampaignDetailError | null>(
      null
    );

  const [lastFetchedAt, setLastFetchedAt] =
    useState<string | null>(null);

  // --------------------------------------------------------
  // RÉFÉRENCES
  // --------------------------------------------------------

  const { language } = useTranslation();
  const mountedRef = useRef(false);

  const abortControllerRef =
    useRef<AbortController | null>(null);

  const requestIdRef = useRef(0);

  // --------------------------------------------------------
  // INTERVALLE SÉCURISÉ
  // --------------------------------------------------------

  const safeRefreshInterval = useMemo(() => {
    if (
      !Number.isFinite(refreshInterval) ||
      refreshInterval < MIN_REFRESH_INTERVAL
    ) {
      return DEFAULT_REFRESH_INTERVAL;
    }

    return refreshInterval;
  }, [refreshInterval]);

  // --------------------------------------------------------
  // CHARGEMENT API
  // --------------------------------------------------------

  const fetchCampaign = useCallback(
    async (
      requestedSlug: string,
      signal: AbortSignal
    ): Promise<PublicCampaignDetail> => {
      const url =
        `/api/public/campaigns/` +
        encodeURIComponent(requestedSlug) + `?lang=${language}`;

      let response: Response;

      try {
        response = await fetch(url, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal,
          headers: {
            Accept: "application/json",
          },
        });
      } catch (fetchError) {
        if (signal.aborted) {
          throw fetchError;
        }

        throw createError(
          "NETWORK_ERROR",
          "Impossible de contacter le serveur."
        );
      }

      if (response.status === 404) {
        throw createError(
          "NOT_FOUND",
          "Cette campagne est introuvable ou n'est plus disponible.",
          404
        );
      }

      if (!response.ok) {
        throw createError(
          "SERVER_ERROR",
          "Impossible de charger cette campagne.",
          response.status
        );
      }

      let payload: unknown;

      try {
        payload = await response.json();
      } catch {
        throw createError(
          "INVALID_RESPONSE",
          "Le serveur a retourné une réponse invalide.",
          response.status
        );
      }

      const parsed = parseApiResponse(payload);

      if (!parsed) {
        throw createError(
          "INVALID_RESPONSE",
          "Les informations de la campagne sont incomplètes.",
          response.status
        );
      }

      return parsed;
    },
    [language]
  );

  // --------------------------------------------------------
  // ACTUALISATION
  // --------------------------------------------------------

  const refresh = useCallback(
    async (): Promise<void> => {
      if (!enabled) {
        return;
      }

      if (!isValidSlug(normalizedSlug)) {
        setCampaign(null);

        setError(
          createError(
            "INVALID_SLUG",
            "L'adresse de cette campagne est invalide."
          )
        );

        setIsLoading(false);
        setIsRefreshing(false);

        return;
      }

      abortControllerRef.current?.abort();

      const controller = new AbortController();

      abortControllerRef.current =
        controller;

      const currentRequestId =
        ++requestIdRef.current;

      const timeoutId = window.setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT
      );

      setIsRefreshing(true);

      try {
        const result = await fetchCampaign(
          normalizedSlug,
          controller.signal
        );

        if (
          controller.signal.aborted ||
          currentRequestId !==
            requestIdRef.current
        ) {
          return;
        }

        setCampaign(result);
        setError(null);
        setLastFetchedAt(
          new Date().toISOString()
        );
      } catch (caughtError) {
        if (
          currentRequestId !==
          requestIdRef.current
        ) {
          return;
        }

        if (
          controller.signal.aborted
        ) {
          // Une nouvelle requête a pu remplacer
          // celle-ci. Dans ce cas, aucune erreur
          // ne doit être affichée.

          return;
        }

        if (
          isRecord(caughtError) &&
          typeof caughtError.code === "string"
        ) {
          setError(
            caughtError as PublicCampaignDetailError
          );
        } else {
          setError(
            createError(
              "SERVER_ERROR",
              "Une erreur est survenue pendant le chargement."
            )
          );
        }
      } finally {
        window.clearTimeout(timeoutId);

        if (
          currentRequestId ===
          requestIdRef.current &&
          mountedRef.current
        ) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [
      enabled,
      normalizedSlug,
      fetchCampaign,
    ]
  );

  // --------------------------------------------------------
  // PREMIER CHARGEMENT ET CHANGEMENT DE CAMPAGNE
  // --------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      window.clearTimeout(timer);

      mountedRef.current = false;

      abortControllerRef.current?.abort();

      requestIdRef.current += 1;
    };
  }, [refresh]);

  // --------------------------------------------------------
  // ACTUALISATION AUTOMATIQUE
  // --------------------------------------------------------

  useEffect(() => {
    if (!enabled || !isValidSlug(normalizedSlug)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        navigator.onLine
      ) {
        void refresh();
      }
    }, safeRefreshInterval);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    enabled,
    normalizedSlug,
    refresh,
    safeRefreshInterval,
  ]);

  // --------------------------------------------------------
  // RETOUR SUR L'ONGLET
  // --------------------------------------------------------

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onVisibilityChange = () => {
      if (
        document.visibilityState === "visible"
      ) {
        void refresh();
      }
    };

    document.addEventListener(
      "visibilitychange",
      onVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );
    };
  }, [enabled, refresh]);

  // --------------------------------------------------------
  // RECONNEXION INTERNET
  // --------------------------------------------------------

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onOnline = () => {
      void refresh();
    };

    window.addEventListener(
      "online",
      onOnline
    );

    return () => {
      window.removeEventListener(
        "online",
        onOnline
      );
    };
  }, [enabled, refresh]);

  // --------------------------------------------------------
  // DONNÉES POUR L'INTERFACE
  // --------------------------------------------------------

  const photos = useMemo(
    () => campaign?.photos ?? [],
    [campaign]
  );

  const updates = useMemo(
    () => campaign?.updates ?? [],
    [campaign]
  );

  const similarCampaigns = useMemo(
    () => campaign?.similarCampaigns ?? [],
    [campaign]
  );

  const isNotFound =
    error?.code === "NOT_FOUND";

  useEffect(() => {
    if (!enabled) return;
    return subscribeCampaignUpdates(() => { void refresh(); });
  }, [enabled, refresh]);

  return {
    campaign,

    photos,
    updates,
    similarCampaigns,

    isLoading,
    isRefreshing,

    isError: error !== null,
    isNotFound,

    error,
    lastFetchedAt,

    refresh,
  };
}

export default usePublicCampaignDetail;
