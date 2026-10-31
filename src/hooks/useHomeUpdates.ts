
"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { PublicStatistics } from "@/lib/statistics/service";
import type { HomeData } from "@/lib/public/home-types";

// ==========================================================
// FONDATION SAUVONS DES VIES
// SYNCHRONISATION — PAGE D'ACCUEIL PUBLIQUE
// ==========================================================
//
// - Statistiques officielles de l'administration
// - Actualisation automatique toutes les 30 secondes
// - Actualisation au retour sur l'onglet
// - Actualisation au retour de la connexion
// - Aucune donnée fictive
// - Aucune somme totale collectée
// - Protection contre les requêtes concurrentes
// - Annulation des requêtes lors du démontage
// - Conservation des dernières données valides
// - Compatible React / Next.js 16 / ESLint
//
// ==========================================================

// ----------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------

const HOME_API_URL = "/api/public/home";

const DEFAULT_REFRESH_INTERVAL = 30_000;

const MIN_REFRESH_INTERVAL = 5_000;

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

export type HomeStatistics = PublicStatistics;

type HomeApiSuccess = {
  success: true;
  statistics: HomeStatistics;
  data?: HomeData;
};

type HomeApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

type HomeApiResponse =
  | HomeApiSuccess
  | HomeApiFailure;

export type UseHomeUpdatesOptions = {
  initialData?: HomeData;
  initialStatistics?: HomeStatistics | null;
  refreshInterval?: number;
  enabled?: boolean;
};

export type UseHomeUpdatesResult = {
  homeData: HomeData | null;
  statistics: HomeStatistics | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  error: string | null;
  lastUpdatedAt: string | null;
  refresh: () => Promise<void>;
};

// ----------------------------------------------------------
// VALIDATION DES DONNÉES
// ----------------------------------------------------------

function isValidCount(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function isValidStatistics(
  value: unknown
): value is HomeStatistics {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    isValidCount(data.activeCampaigns) &&
    isValidCount(data.beneficiariesHelped) &&
    isValidCount(data.verifiedFiles) &&
    (
      data.updatedAt === null ||
      (
        typeof data.updatedAt === "string" &&
        !Number.isNaN(
          Date.parse(data.updatedAt)
        )
      )
    )
  );
}

function isHomeApiResponse(
  value: unknown
): value is HomeApiResponse {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  if (data.success === true) {
    return isValidStatistics(data.statistics);
  }

  if (data.success === false) {
    const error = data.error;

    return (
      typeof error === "object" &&
      error !== null &&
      !Array.isArray(error) &&
      typeof (
        error as Record<string, unknown>
      ).code === "string" &&
      typeof (
        error as Record<string, unknown>
      ).message === "string"
    );
  }

  return false;
}

// ----------------------------------------------------------
// COMPARAISON DES STATISTIQUES
// ----------------------------------------------------------

function areStatisticsEqual(
  previous: HomeStatistics | null,
  next: HomeStatistics
): boolean {
  if (!previous) {
    return false;
  }

  return (
    previous.activeCampaigns ===
      next.activeCampaigns &&
    previous.beneficiariesHelped ===
      next.beneficiariesHelped &&
    previous.verifiedFiles ===
      next.verifiedFiles &&
    previous.updatedAt === next.updatedAt
  );
}

// ----------------------------------------------------------
// HOOK PRINCIPAL
// ----------------------------------------------------------

export function useHomeUpdates({
  initialData,
  initialStatistics = null,
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
  enabled = true,
}: UseHomeUpdatesOptions = {}): UseHomeUpdatesResult {
  const { language } = useTranslation();
  const [homeData, setHomeData] = useState<HomeData | null>(initialData ?? null);

  // --------------------------------------------------------
  // ÉTATS
  // --------------------------------------------------------

  const [statistics, setStatistics] =
    useState<HomeStatistics | null>(
      initialStatistics
    );

  const [isLoading, setIsLoading] =
    useState<boolean>(
      initialStatistics === null && enabled
    );

  const [isRefreshing, setIsRefreshing] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string | null>(null);

  // --------------------------------------------------------
  // RÉFÉRENCES
  // --------------------------------------------------------

  const abortControllerRef =
    useRef<AbortController | null>(null);

  const requestInProgressRef =
    useRef<boolean>(false);

  const mountedRef =
    useRef<boolean>(false);

  // --------------------------------------------------------
  // INTERVALLE SÉCURISÉ
  // --------------------------------------------------------

  const safeRefreshInterval =
    Number.isFinite(refreshInterval) &&
    refreshInterval >= MIN_REFRESH_INTERVAL
      ? refreshInterval
      : DEFAULT_REFRESH_INTERVAL;

  // --------------------------------------------------------
  // RÉCUPÉRATION DES STATISTIQUES
  // --------------------------------------------------------

  const refresh = useCallback(
    async (): Promise<void> => {
      if (
        !enabled ||
        !mountedRef.current ||
        requestInProgressRef.current
      ) {
        return;
      }

      requestInProgressRef.current = true;

      const controller = new AbortController();

      abortControllerRef.current = controller;

      setIsRefreshing(true);

      try {
        const response = await fetch(
          `${HOME_API_URL}?lang=${language}`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "Impossible d'actualiser les statistiques."
          );
        }

        const payload: unknown =
          await response.json();

        if (!isHomeApiResponse(payload)) {
          throw new Error(
            "Les statistiques reçues sont invalides."
          );
        }

        if (!payload.success) {
          throw new Error(
            payload.error.message
          );
        }

        if (
          !mountedRef.current ||
          controller.signal.aborted
        ) {
          return;
        }

        const nextStatistics =
          payload.statistics;
        if (payload.data && Array.isArray(payload.data.campaigns) && Array.isArray(payload.data.urgentCampaigns) && Array.isArray(payload.data.causes) && Array.isArray(payload.data.news)) {
          const next = payload.data;
          setHomeData(previous => {
            if (!previous) return next;
            const { generatedAt: previousTime, ...previousContent } = previous;
            const { generatedAt: nextTime, ...nextContent } = next;
            void previousTime; void nextTime;
            return JSON.stringify(previousContent) === JSON.stringify(nextContent) ? previous : next;
          });
        }

        setStatistics((previous) => {
          if (
            areStatisticsEqual(
              previous,
              nextStatistics
            )
          ) {
            return previous;
          }

          return nextStatistics;
        });

        setError(null);

      } catch (caughtError: unknown) {
        if (
          !mountedRef.current ||
          controller.signal.aborted
        ) {
          return;
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Une erreur est survenue.";

        setError(message);

      } finally {
        // Ne pas laisser une ancienne requête
        // modifier l'état d'une nouvelle requête.

        if (
          abortControllerRef.current ===
          controller
        ) {
          abortControllerRef.current = null;

          requestInProgressRef.current = false;

          if (mountedRef.current) {
            setIsRefreshing(false);
            setIsLoading(false);
          }
        }
      }
    },
    [enabled, language]
  );

  // --------------------------------------------------------
  // INITIALISATION ET SYNCHRONISATION
  // --------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      return () => {
        mountedRef.current = false;

        abortControllerRef.current?.abort();
        abortControllerRef.current = null;

        requestInProgressRef.current = false;
      };
    }

    // ------------------------------------------------------
    // PREMIÈRE ACTUALISATION
    //
    // setTimeout évite l'appel synchrone à setState
    // directement depuis useEffect.
    // ------------------------------------------------------

    const initialRefreshId =
      window.setTimeout(() => {
        void refresh();
      }, 0);

    // ------------------------------------------------------
    // ACTUALISATION PÉRIODIQUE
    // ------------------------------------------------------

    const intervalId =
      window.setInterval(() => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void refresh();
        }
      }, safeRefreshInterval);

    // ------------------------------------------------------
    // RETOUR SUR L'ONGLET
    // ------------------------------------------------------

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void refresh();
      }
    }

    // ------------------------------------------------------
    // RETOUR DE LA CONNEXION INTERNET
    // ------------------------------------------------------

    function handleOnline() {
      void refresh();
    }

    // ------------------------------------------------------
    // ÉVÉNEMENTS
    // ------------------------------------------------------

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "online",
      handleOnline
    );

    // ------------------------------------------------------
    // NETTOYAGE COMPLET
    // ------------------------------------------------------

    return () => {
      mountedRef.current = false;

      window.clearTimeout(
        initialRefreshId
      );

      window.clearInterval(
        intervalId
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "online",
        handleOnline
      );

      abortControllerRef.current?.abort();

      abortControllerRef.current = null;

      requestInProgressRef.current = false;
    };

  }, [
    enabled,
    refresh,
    safeRefreshInterval,
  ]);

  // --------------------------------------------------------
  // RÉSULTAT PUBLIC DU HOOK
  // --------------------------------------------------------

  return {
    homeData,
    statistics,
    isLoading,
    isRefreshing,
    isError: error !== null,
    error,
    lastUpdatedAt:
      statistics?.updatedAt ?? null,
    refresh,
  };
}

export default useHomeUpdates;
