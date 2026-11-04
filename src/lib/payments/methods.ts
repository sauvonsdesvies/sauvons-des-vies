
/**
 * FONDATION SAUVONS DES VIES
 * ============================================================
 * src/lib/payments/methods.ts
 *
 * Gestion centralisée des moyens de paiement.
 *
 * Prestataires :
 * - FedaPay
 * - Kkiapay
 *
 * Moyens :
 * - Mobile Money
 * - Carte bancaire
 * - Wave
 *
 * Règles :
 * - Les configurations proviennent de Prisma / Supabase.
 * - Seules les configurations activées et valides sont utilisées.
 * - Les noms des prestataires ne sont jamais exposés au donateur.
 * - Aucun filtrage automatique par pays.
 * - Le prestataire est sélectionné côté serveur.
 * - Aucun secret API n'est exposé.
 * - Aucune configuration fictive n'est créée.
 *
 * Ce module ne crée et ne confirme aucun paiement.
 * ============================================================
 */

import "server-only";

import { prisma } from "@/lib/prisma";

import {
  DEFAULT_PAYMENT_CURRENCY,
  DEFAULT_PAYMENT_LANGUAGE,
  PAYMENT_METHODS,
  PAYMENT_PROVIDERS,
  createPaymentError,
  isPaymentLanguage,
  isPaymentMethod,
  isPaymentProvider,
  type AvailablePaymentMethodsResponse,
  type PaymentCurrency,
  type PaymentLanguage,
  type PaymentMethod,
  type PaymentMethodConfiguration,
  type PaymentProvider,
  type PublicPaymentMethod,
} from "./types";

// ============================================================
// 1. TYPES INTERNES
// ============================================================

export interface PaymentProviderCandidate {
  provider: PaymentProvider;
  paymentMethod: PaymentMethod;
  priority: number;
}

export interface PaymentMethodAvailability {
  paymentMethod: PaymentMethod;
  available: boolean;
  candidates: PaymentProviderCandidate[];
}

export interface PaymentMethodsOptions {
  currency?: PaymentCurrency;
  language?: PaymentLanguage;
}

type PaymentMethodText = {
  label: string;
  description: string;
};

type PaymentMethodTranslations = Record<
  PaymentLanguage,
  Record<PaymentMethod, PaymentMethodText>
>;

/**
 * Structure minimale correspondant aux champs
 * utilisés dans la table PaymentMethodConfig.
 *
 * Prisma retourne provider et paymentMethod
 * comme des chaînes de caractères.
 *
 * Nous validons ces chaînes avant de les utiliser
 * comme types métier stricts.
 */
type DatabasePaymentMethodConfiguration = {
  id: string;
  provider: string;
  paymentMethod: string;
  isEnabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================
// 2. ORDRE DES MOYENS DE PAIEMENT
// ============================================================

const PAYMENT_METHOD_ORDER: readonly PaymentMethod[] = [
  PAYMENT_METHODS.MOBILE_MONEY,
  PAYMENT_METHODS.CARD,
  PAYMENT_METHODS.WAVE,
];

// ============================================================
// 3. TEXTES MULTILINGUES
// ============================================================

const PAYMENT_METHOD_TRANSLATIONS: PaymentMethodTranslations = {
  fr: {
    MOBILE_MONEY: {
      label: "Mobile Money",
      description:
        "Effectuez votre don avec votre portefeuille mobile.",
    },
    CARD: {
      label: "Carte bancaire",
      description:
        "Effectuez votre don par carte bancaire sécurisée.",
    },
    WAVE: {
      label: "Wave",
      description:
        "Effectuez votre don avec Wave.",
    },
  },

  en: {
    MOBILE_MONEY: {
      label: "Mobile Money",
      description:
        "Donate using your mobile wallet.",
    },
    CARD: {
      label: "Bank card",
      description:
        "Make a secure donation using your bank card.",
    },
    WAVE: {
      label: "Wave",
      description:
        "Donate using Wave.",
    },
  },

  de: {
    MOBILE_MONEY: {
      label: "Mobile Money",
      description:
        "Spenden Sie mit Ihrer mobilen Geldbörse.",
    },
    CARD: {
      label: "Bankkarte",
      description:
        "Spenden Sie sicher mit Ihrer Bankkarte.",
    },
    WAVE: {
      label: "Wave",
      description:
        "Spenden Sie mit Wave.",
    },
  },

  es: {
    MOBILE_MONEY: {
      label: "Dinero móvil",
      description:
        "Realice su donación con su billetera móvil.",
    },
    CARD: {
      label: "Tarjeta bancaria",
      description:
        "Realice una donación segura con su tarjeta bancaria.",
    },
    WAVE: {
      label: "Wave",
      description:
        "Realice su donación con Wave.",
    },
  },
};

// ============================================================
// 4. VALIDATION DES PARAMÈTRES
// ============================================================

function normalizePaymentLanguage(
  language: unknown
): PaymentLanguage {
  if (isPaymentLanguage(language)) {
    return language;
  }

  return DEFAULT_PAYMENT_LANGUAGE;
}

function normalizePaymentCurrency(
  currency: unknown
): PaymentCurrency {
  if (typeof currency !== "string") {
    return DEFAULT_PAYMENT_CURRENCY;
  }

  const normalized = currency
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalized)) {
    return DEFAULT_PAYMENT_CURRENCY;
  }

  return normalized;
}

// ============================================================
// 5. VALIDATION DES CONFIGURATIONS PRISMA
// ============================================================

/**
 * Garde de type :
 *
 * Vérifie qu'une ligne Prisma correspond réellement
 * à une configuration de paiement exploitable.
 *
 * Après validation, TypeScript sait que :
 *
 * - provider est un PaymentProvider
 * - paymentMethod est un PaymentMethod
 * - priority est un entier sûr
 * - isEnabled est true
 *
 * Cette validation évite de forcer les types
 * avec "as PaymentProvider".
 */
export function isProviderConfigured(provider: string, method: string): boolean {
  if (provider === "FEDAPAY") return Boolean(process.env.FEDAPAY_SECRET_KEY?.trim() && process.env.FEDAPAY_WEBHOOK_SECRET?.trim()) && method !== "WAVE";
  if (provider === "KKIAPAY") return Boolean(process.env.KKIAPAY_PUBLIC_KEY?.trim() || process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY?.trim()) && ["KKIAPAY_PRIVATE_KEY", "KKIAPAY_SECRET_KEY", "KKIAPAY_WEBHOOK_SECRET"].every(key => Boolean(process.env[key]?.trim())) && method !== "WAVE" && [undefined, "", "true", "false"].includes(process.env.KKIAPAY_SANDBOX?.trim().toLowerCase()) && !(process.env.NODE_ENV === "production" && process.env.KKIAPAY_SANDBOX?.trim().toLowerCase() === "true");
  return false;
}

function isValidPaymentConfiguration(
  config: DatabasePaymentMethodConfiguration
): config is DatabasePaymentMethodConfiguration &
  PaymentMethodConfiguration & {
    provider: PaymentProvider;
    paymentMethod: PaymentMethod;
    isEnabled: true;
  } {
  return (
    config.isEnabled === true &&
    isProviderConfigured(config.provider, config.paymentMethod) &&
    isPaymentProvider(config.provider) &&
    isPaymentMethod(config.paymentMethod) &&
    Number.isSafeInteger(config.priority)
  );
}

// ============================================================
// 6. LECTURE DE LA BASE SUPABASE
// ============================================================

/**
 * Retourne uniquement les configurations :
 *
 * - activées
 * - reconnues par l'application
 * - correctement typées
 *
 * Si aucune configuration n'est activée,
 * le tableau retourné est vide.
 *
 * Aucune configuration par défaut n'est créée.
 */
export async function getEnabledPaymentConfigurations(): Promise<
  PaymentMethodConfiguration[]
> {
  const configurations =
    await prisma.paymentMethodConfig.findMany({
      where: {
        isEnabled: true,
      },

      orderBy: [
        {
          priority: "asc",
        },
        {
          provider: "asc",
        },
        {
          paymentMethod: "asc",
        },
      ],
    });

  const validConfigurations =
    configurations.filter(
      isValidPaymentConfiguration
    );

  return validConfigurations.map(
    (configuration): PaymentMethodConfiguration => ({
      id: configuration.id,
      provider: configuration.provider,
      paymentMethod: configuration.paymentMethod,
      isEnabled: configuration.isEnabled,
      priority: configuration.priority,
      createdAt: configuration.createdAt,
      updatedAt: configuration.updatedAt,
    })
  );
}

// ============================================================
// 7. CANDIDATS PAR MOYEN DE PAIEMENT
// ============================================================

/**
 * Plusieurs prestataires peuvent proposer
 * le même moyen de paiement.
 *
 * Exemple :
 *
 * FEDAPAY  / MOBILE_MONEY / priorité 10
 * KKIAPAY  / MOBILE_MONEY / priorité 20
 *
 * Le prestataire ayant la plus petite priorité
 * sera proposé en premier au service de paiement.
 *
 * En cas d'égalité, un tri alphabétique
 * garantit un ordre déterministe.
 */
export async function getPaymentProviderCandidates(
  paymentMethod: PaymentMethod
): Promise<PaymentProviderCandidate[]> {
  if (!isPaymentMethod(paymentMethod)) {
    return [];
  }

  const configurations =
    await getEnabledPaymentConfigurations();

  const candidates: PaymentProviderCandidate[] =
    configurations
      .filter(
        (configuration) =>
          configuration.paymentMethod ===
          paymentMethod
      )
      .map(
        (configuration): PaymentProviderCandidate => ({
          provider: configuration.provider,
          paymentMethod: configuration.paymentMethod,
          priority: configuration.priority,
        })
      );

  candidates.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    return a.provider.localeCompare(b.provider);
  });

  return candidates;
}

// ============================================================
// 8. SÉLECTION AUTOMATIQUE DU PRESTATAIRE
// ============================================================

/**
 * Le donateur choisit uniquement :
 *
 * - Mobile Money
 * - Carte bancaire
 * - Wave
 *
 * Il ne choisit pas FedaPay ou Kkiapay.
 *
 * La sélection finale du prestataire
 * est réalisée exclusivement côté serveur.
 */
export async function selectPaymentProvider(
  paymentMethod: PaymentMethod
): Promise<PaymentProvider | null> {
  if (!isPaymentMethod(paymentMethod)) {
    return null;
  }

  const candidates =
    await getPaymentProviderCandidates(paymentMethod);

  if (candidates.length === 0) {
    return null;
  }

  return candidates[0].provider;
}

// ============================================================
// 9. DISPONIBILITÉ D'UN MOYEN
// ============================================================

export async function getPaymentMethodAvailability(
  paymentMethod: PaymentMethod
): Promise<PaymentMethodAvailability> {
  const candidates =
    await getPaymentProviderCandidates(paymentMethod);

  return {
    paymentMethod,
    available: candidates.length > 0,
    candidates,
  };
}

export async function isPaymentMethodEnabled(
  paymentMethod: PaymentMethod
): Promise<boolean> {
  const availability =
    await getPaymentMethodAvailability(paymentMethod);

  return availability.available;
}

// ============================================================
// 10. LISTE PUBLIQUE DES MOYENS
// ============================================================

/**
 * Un moyen apparaît une seule fois.
 *
 * Exemple :
 *
 * FEDAPAY + KKIAPAY proposent Mobile Money.
 *
 * Le donateur voit :
 * "Mobile Money"
 *
 * Les prestataires restent invisibles.
 */
export async function getAvailablePaymentMethods(
  options: PaymentMethodsOptions = {}
): Promise<PublicPaymentMethod[]> {
  const language =
    normalizePaymentLanguage(
      options.language
    );

  const configurations =
    await getEnabledPaymentConfigurations();

  const enabledMethods =
    new Set<PaymentMethod>();

  for (const configuration of configurations) {
    enabledMethods.add(
      configuration.paymentMethod
    );
  }

  return PAYMENT_METHOD_ORDER
    .filter(
      (method) =>
        enabledMethods.has(method)
    )
    .map(
      (method): PublicPaymentMethod => {
        const translation =
          PAYMENT_METHOD_TRANSLATIONS[language][method];

        return {
          id: method,
          label: translation.label,
          description: translation.description,
          enabled: true,

          requiresPhone: true,

          requiresEmail: false,
        };
      }
    );
}

// ============================================================
// 11. RÉPONSE POUR L'API PUBLIQUE
// ============================================================

/**
 * Utilisé par :
 *
 * src/app/api/payments/methods/route.ts
 *
 * La réponse contient uniquement :
 *
 * - moyens disponibles
 * - descriptions publiques
 * - devise
 *
 * Aucun secret ni nom de prestataire.
 */
export async function getAvailablePaymentMethodsResponse(
  options: PaymentMethodsOptions = {}
): Promise<AvailablePaymentMethodsResponse> {
  const currency =
    normalizePaymentCurrency(
      options.currency
    );

  try {
    const methods =
      await getAvailablePaymentMethods(options);

    return {
      success: true,
      methods,
      currency,
    };
  } catch (error) {
    console.error(
      "[payments/methods] Unable to load payment methods:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return {
      success: false,
      methods: [],
      currency,

      error: createPaymentError(
        "DATABASE_ERROR",
        "Impossible de charger les moyens de paiement.",
        true
      ),
    };
  }
}

// ============================================================
// 12. CONTRÔLE AVANT CRÉATION D'UN PAIEMENT
// ============================================================

/**
 * Appelé par le service de paiement.
 *
 * Le prestataire doit ensuite contrôler :
 *
 * - le montant
 * - la devise
 * - l'opérateur
 * - la disponibilité de l'API
 * - ses propres contraintes
 */
export async function assertPaymentMethodAvailable(
  paymentMethod: PaymentMethod
): Promise<PaymentProviderCandidate[]> {
  if (!isPaymentMethod(paymentMethod)) {
    throw new Error(
      "INVALID_PAYMENT_METHOD"
    );
  }

  const candidates =
    await getPaymentProviderCandidates(paymentMethod);

  if (candidates.length === 0) {
    throw new Error(
      "PAYMENT_METHOD_UNAVAILABLE"
    );
  }

  return candidates;
}

// ============================================================
// 13. INFORMATIONS DE CONFIGURATION
// ============================================================

/**
 * Fonction réservée au serveur.
 *
 * Ne jamais retourner directement
 * ce résumé depuis une API publique.
 */
export async function getPaymentMethodsConfigurationSummary(): Promise<{
  totalEnabledConfigurations: number;
  enabledMethods: PaymentMethod[];
  enabledProviders: PaymentProvider[];
}> {
  const configurations =
    await getEnabledPaymentConfigurations();

  const methods =
    new Set<PaymentMethod>();

  const providers =
    new Set<PaymentProvider>();

  for (const configuration of configurations) {
    methods.add(
      configuration.paymentMethod
    );

    providers.add(
      configuration.provider
    );
  }

  const enabledMethods =
    PAYMENT_METHOD_ORDER.filter(
      (method) =>
        methods.has(method)
    );

  const enabledProviders: PaymentProvider[] = [
    PAYMENT_PROVIDERS.FEDAPAY,
    PAYMENT_PROVIDERS.KKIAPAY,
  ].filter(
    (provider) =>
      providers.has(provider)
  );

  return {
    totalEnabledConfigurations:
      configurations.length,

    enabledMethods,
    enabledProviders,
  };
}
