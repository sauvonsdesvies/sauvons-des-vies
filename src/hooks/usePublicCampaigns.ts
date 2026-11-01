
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
// HOOK PUBLIC — CAMPAGNES DE DONS
// ==========================================================
//
// API : GET /api/public/campaigns
//
// - Campagnes réellement publiées
// - Campagnes urgentes, prioritaires et ordinaires
// - Recherche et filtres
// - Tri et pagination
// - Actualisation automatique
// - Actualisation au retour sur l'onglet
// - Actualisation au retour de la connexion
// - Protection contre les requêtes concurrentes
// - Annulation des requêtes obsolètes
// - Conservation des dernières données valides
// - Aucun accès aux données administratives privées
//
// Compatible React / Next.js 16 / TypeScript.
//
// ==========================================================

// ----------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------

const CAMPAIGNS_API_URL = "/api/public/campaigns";

const DEFAULT_REFRESH_INTERVAL = 10_000;
const MIN_REFRESH_INTERVAL = 5_000;

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 60;

const DEFAULT_ERROR_MESSAGE =
  "Impossible de charger les campagnes de dons.";

// ----------------------------------------------------------
// TYPES PUBLICS
// ----------------------------------------------------------

export type PublicCampaignPriority =
  | "URGENT"
  | "PRIORITY"
  | "NORMAL";

export type PublicCampaignStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "CLOSED";

export type PublicCampaign = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  imageUrl: string | null;

  category: {
    id: string;
    name: string;
    slug: string;
  } | null;

  country: string | null;

  targetAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  donorCount: number;

  currency: string;

  isUrgent: boolean;
  priority: PublicCampaignPriority;
  status: PublicCampaignStatus;

  startDate: string | null;
  endDate: string | null;
};

export type PublicCampaignCategory = {
  id: string;
  name: string;
  slug: string;
  campaignCount: number;
};

export type CampaignSort =
  | "newest"
  | "oldest"
  | "most-funded"
  | "least-funded"
  | "ending-soon";

export type CampaignFilters = {
  search: string;
  category: string;
  status: string;
  country: string;
  sort: CampaignSort;
  page: number;
  pageSize: number;
};

export type CampaignPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type CampaignsApiSuccess = {
  success: true;
  campaigns: PublicCampaign[];
  pagination: CampaignPagination;
  categories?: PublicCampaignCategory[];
};

export type CampaignsApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type CampaignsApiResponse =
  | CampaignsApiSuccess
  | CampaignsApiFailure;

// ----------------------------------------------------------
// OPTIONS DU HOOK
// ----------------------------------------------------------

export type UsePublicCampaignsOptions = {
  initialCampaigns?: PublicCampaign[];
  initialPagination?: CampaignPagination | null;
  initialCategories?: PublicCampaignCategory[];

  initialFilters?: Partial<CampaignFilters>;

  refreshInterval?: number;
  enabled?: boolean;
};

// ----------------------------------------------------------
// RÉSULTAT DU HOOK
// ----------------------------------------------------------

export type UsePublicCampaignsResult = {
  campaigns: PublicCampaign[];
  categories: PublicCampaignCategory[];

  filters: CampaignFilters;
  pagination: CampaignPagination;

  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  error: string | null;

  lastFetchedAt: string | null;

  setSearch: (value: string) => void;
  setCategory: (value: string) => void;
  setStatus: (value: string) => void;
  setCountry: (value: string) => void;
  setSort: (value: CampaignSort) => void;
  setPage: (value: number) => void;
  setPageSize: (value: number) => void;

  resetFilters: () => void;
  refresh: () => Promise<void>;
};

// ----------------------------------------------------------
// VALEURS PAR DÉFAUT
// ----------------------------------------------------------

const DEFAULT_FILTERS: CampaignFilters = {
  search: "",
  category: "",
  status: "",
  country: "",
  sort: "newest",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

function createEmptyPagination(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): CampaignPagination {
  return {
    page,
    pageSize,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

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

function isNonNegativeNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}

function isNonNegativeInteger(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function isPositiveInteger(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function isNullableString(
  value: unknown
): value is string | null {
  return value === null || typeof value === "string";
}

function isValidDate(
  value: unknown
): value is string | null {
  return (
    value === null ||
    (
      typeof value === "string" &&
      !Number.isNaN(Date.parse(value))
    )
  );
}

function isValidPriority(
  value: unknown
): value is PublicCampaignPriority {
  return (
    value === "URGENT" ||
    value === "PRIORITY" ||
    value === "NORMAL"
  );
}

function isValidStatus(
  value: unknown
): value is PublicCampaignStatus {
  return (
    value === "ACTIVE" ||
    value === "COMPLETED" ||
    value === "CLOSED"
  );
}

function isValidCategory(
  value: unknown
): value is PublicCampaignCategory {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    isNonNegativeInteger(value.campaignCount)
  );
}

function isValidCampaign(
  value: unknown
): value is PublicCampaign {
  if (!isRecord(value)) {
    return false;
  }

  const category = value.category;

  const validCategory =
    category === null ||
    (
      isRecord(category) &&
      typeof category.id === "string" &&
      typeof category.name === "string" &&
      typeof category.slug === "string"
    );

  return (
    typeof value.id === "string" &&
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    typeof value.shortDescription === "string" &&
    isNullableString(value.imageUrl) &&
    validCategory &&
    isNullableString(value.country) &&
    isNonNegativeNumber(value.targetAmount) &&
    isNonNegativeNumber(value.collectedAmount) &&
    isNonNegativeNumber(value.remainingAmount) &&
    isNonNegativeNumber(value.progressPercentage) &&
    value.progressPercentage <= 100 &&
    isNonNegativeInteger(value.donorCount) &&
    typeof value.currency === "string" &&
    typeof value.isUrgent === "boolean" &&
    isValidPriority(value.priority) &&
    isValidStatus(value.status) &&
    isValidDate(value.startDate) &&
    isValidDate(value.endDate)
  );
}

function isValidPagination(
  value: unknown
): value is CampaignPagination {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isPositiveInteger(value.page) &&
    isPositiveInteger(value.pageSize) &&
    isNonNegativeInteger(value.total) &&
    isNonNegativeInteger(value.totalPages) &&
    typeof value.hasNextPage === "boolean" &&
    typeof value.hasPreviousPage === "boolean"
  );
}

function isValidApiResponse(
  value: unknown
): value is CampaignsApiResponse {
  if (!isRecord(value)) {
    return false;
  }

  if (value.success === true) {
    return (
      Array.isArray(value.campaigns) &&
      value.campaigns.every(isValidCampaign) &&
      isValidPagination(value.pagination) &&
      (
        value.categories === undefined ||
        (
          Array.isArray(value.categories) &&
          value.categories.every(isValidCategory)
        )
      )
    );
  }

  if (value.success === false) {
    return (
      isRecord(value.error) &&
      typeof value.error.code === "string" &&
      typeof value.error.message === "string"
    );
  }

  return false;
}

// ----------------------------------------------------------
// NORMALISATION DES FILTRES
// ----------------------------------------------------------

function normalizePage(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    return 1;
  }

  return value;
}

function normalizePageSize(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(value, MAX_PAGE_SIZE);
}

function normalizeFilters(
  input: Partial<CampaignFilters> = {}
): CampaignFilters {
  return {
    search:
      typeof input.search === "string"
        ? input.search.slice(0, 200)
        : DEFAULT_FILTERS.search,

    category:
      typeof input.category === "string"
        ? input.category.slice(0, 100)
        : DEFAULT_FILTERS.category,

    status:
      typeof input.status === "string"
        ? input.status.slice(0, 50)
        : DEFAULT_FILTERS.status,

    country:
      typeof input.country === "string"
        ? input.country.slice(0, 100)
        : DEFAULT_FILTERS.country,

    sort:
      input.sort === "oldest" ||
      input.sort === "most-funded" ||
      input.sort === "least-funded" ||
      input.sort === "ending-soon"
        ? input.sort
        : "newest",

    page: normalizePage(
      input.page ?? DEFAULT_FILTERS.page
    ),

    pageSize: normalizePageSize(
      input.pageSize ?? DEFAULT_FILTERS.pageSize
    ),
  };
}

// ----------------------------------------------------------
// CONSTRUCTION DE L'URL API
// ----------------------------------------------------------

function buildCampaignsApiUrl(
  filters: CampaignFilters
): string {
  const params = new URLSearchParams();

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.category.trim()) {
    params.set("category", filters.category.trim());
  }

  if (filters.status.trim()) {
    params.set("status", filters.status.trim());
  }

  if (filters.country.trim()) {
    params.set("country", filters.country.trim());
  }

  params.set("sort", filters.sort);
  params.set("page", String(filters.page));
  params.set("pageSize", String(filters.pageSize));

  return `${CAMPAIGNS_API_URL}?${params.toString()}`;
}

// ----------------------------------------------------------
// HOOK PRINCIPAL
// ----------------------------------------------------------

export function usePublicCampaigns({
  initialCampaigns = [],
  initialPagination = null,
  initialCategories = [],
  initialFilters = {},
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
  enabled = true,
}: UsePublicCampaignsOptions = {}): UsePublicCampaignsResult {

  // --------------------------------------------------------
  // FILTRES
  // --------------------------------------------------------

  const { language } = useTranslation();
  const [filters, setFilters] = useState<CampaignFilters>(
    () => normalizeFilters(initialFilters)
  );

  // --------------------------------------------------------
  // DONNÉES
  // --------------------------------------------------------

  const [campaigns, setCampaigns] =
    useState<PublicCampaign[]>(initialCampaigns);

  const [categories, setCategories] =
    useState<PublicCampaignCategory[]>(
      initialCategories
    );

  const [pagination, setPagination] =
    useState<CampaignPagination>(
      initialPagination ??
        createEmptyPagination(
          filters.page,
          filters.pageSize
        )
    );

  // --------------------------------------------------------
  // ÉTATS DE CHARGEMENT
  // --------------------------------------------------------

  
  // --------------------------------------------------------
  // ÉTATS DE CHARGEMENT
  // --------------------------------------------------------

  const [isLoading, setIsLoading] = useState<boolean>(
    enabled && initialPagination === null
  );

  const [isRefreshing, setIsRefreshing] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string | null>(null);

  const [lastFetchedAt, setLastFetchedAt] =
    useState<string | null>(null);

  // --------------------------------------------------------
  // RÉFÉRENCES
  // --------------------------------------------------------

  const mountedRef = useRef<boolean>(false);
  const hasInitialCampaignsRef = useRef(initialCampaigns.length > 0);

  const abortControllerRef =
    useRef<AbortController | null>(null);

  const requestIdRef = useRef<number>(0);

  const lastSuccessfulUrlRef =
    useRef<string | null>(null);

  const filtersRef = useRef<CampaignFilters>(filters);

  const enabledRef = useRef<boolean>(enabled);

  // --------------------------------------------------------
  // SYNCHRONISATION DES RÉFÉRENCES
  // --------------------------------------------------------
  //
  // Les références sont mises à jour après le rendu.
  // Aucune écriture dans ref.current pendant le rendu.
  //
  // Compatible avec :
  // - React
  // - Next.js 16
  // - ESLint react-hooks/refs
  //
  // --------------------------------------------------------

  useEffect(() => {
    filtersRef.current = filters;
    enabledRef.current = enabled;
  }, [filters, enabled]);

  // --------------------------------------------------------
  // INTERVALLE D'ACTUALISATION
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
  // ACTUALISATION DES CAMPAGNES
  // --------------------------------------------------------

  const refresh = useCallback(
    async (): Promise<void> => {
      if (!enabledRef.current || !mountedRef.current) {
        return;
      }

      const currentFilters = filtersRef.current;

      const requestUrl =
        buildCampaignsApiUrl(currentFilters);

      const requestId = ++requestIdRef.current;

      // Une nouvelle requête remplace l'ancienne.
      abortControllerRef.current?.abort();

      const controller = new AbortController();

      abortControllerRef.current = controller;

      const isFirstRequest =
        lastSuccessfulUrlRef.current === null && !hasInitialCampaignsRef.current;

      if (isFirstRequest) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await fetch(`${requestUrl}&lang=${language}`, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(DEFAULT_ERROR_MESSAGE);
        }

        const payload: unknown =
          await response.json();

        if (!isValidApiResponse(payload)) {
          throw new Error(
            "Les données des campagnes sont invalides."
          );
        }

        if (!payload.success) {
          throw new Error(payload.error.message);
        }

        // Empêche une ancienne requête de
        // remplacer les données récentes.
        if (
          !mountedRef.current ||
          controller.signal.aborted ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setCampaigns(previous => JSON.stringify(previous) === JSON.stringify(payload.campaigns) ? previous : payload.campaigns);
        setPagination(payload.pagination);

        if (payload.categories !== undefined) {
          setCategories(payload.categories);
        }

        lastSuccessfulUrlRef.current = requestUrl;

        setLastFetchedAt(
          new Date().toISOString()
        );

        setError(null);

      } catch (caughtError: unknown) {
        if (
          !mountedRef.current ||
          controller.signal.aborted ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : DEFAULT_ERROR_MESSAGE;

        setError(message);

      } finally {
        if (
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          abortControllerRef.current = null;

          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [language]
  );

  // --------------------------------------------------------
  // MISE À JOUR DES FILTRES
  // --------------------------------------------------------

  const updateFilters = useCallback(
    (changes: Partial<CampaignFilters>) => {
      setFilters((previous) =>
        normalizeFilters({
          ...previous,
          ...changes,
          page:
            changes.page !== undefined
              ? changes.page
              : 1,
        })
      );
    },
    []
  );

  const setSearch = useCallback(
    (value: string) => {
      updateFilters({ search: value });
    },
    [updateFilters]
  );

  const setCategory = useCallback(
    (value: string) => {
      updateFilters({ category: value });
    },
    [updateFilters]
  );

  const setStatus = useCallback(
    (value: string) => {
      updateFilters({ status: value });
    },
    [updateFilters]
  );

  const setCountry = useCallback(
    (value: string) => {
      updateFilters({ country: value });
    },
    [updateFilters]
  );

  const setSort = useCallback(
    (value: CampaignSort) => {
      updateFilters({ sort: value });
    },
    [updateFilters]
  );

  const setPage = useCallback(
    (value: number) => {
      updateFilters({ page: value });
    },
    [updateFilters]
  );

  const setPageSize = useCallback(
    (value: number) => {
      updateFilters({ pageSize: value });
    },
    [updateFilters]
  );

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  // --------------------------------------------------------
  // SYNCHRONISATION AUTOMATIQUE
  // --------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      return () => {
        mountedRef.current = false;

        requestIdRef.current += 1;

        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
      };
    }

    // Appel asynchrone pour respecter
    // react-hooks/set-state-in-effect.
    const initialTimer = window.setTimeout(() => {
      void refresh();
    }, 0);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, safeRefreshInterval);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }

    function handleOnline() {
      void refresh();
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "online",
      handleOnline
    );

    return () => {
      mountedRef.current = false;

      window.clearTimeout(initialTimer);
      window.clearInterval(intervalId);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "online",
        handleOnline
      );

      requestIdRef.current += 1;

      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, [
    enabled,
    refresh,
    safeRefreshInterval,
    filters,
  ]);

  // --------------------------------------------------------
  // RÉSULTAT
  // --------------------------------------------------------

  useEffect(() => {
    if (!enabled) return;
    return subscribeCampaignUpdates(() => { void refresh(); });
  }, [enabled, refresh]);

  return {
    campaigns,
    categories,
    filters,
    pagination,

    isLoading,
    isRefreshing,
    isError: error !== null,
    error,

    lastFetchedAt,

    setSearch,
    setCategory,
    setStatus,
    setCountry,
    setSort,
    setPage,
    setPageSize,

    resetFilters,
    refresh,
  };
}

export default usePublicCampaigns;
