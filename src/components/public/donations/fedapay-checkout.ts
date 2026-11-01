"use client";

export interface FedaPayCheckoutOptions {
  public_key: string;
  environment: "sandbox" | "live";
  locale: string;
  transaction: { id: number };
  onComplete: (event?: { reason?: number }) => void;
}

type CheckoutInstance = { open: () => void };
type CheckoutSdk = { DIALOG_DISMISSED?: number; init: (options: FedaPayCheckoutOptions) => CheckoutInstance };
declare global { interface Window { FedaPay?: CheckoutSdk } }

let loading: Promise<CheckoutSdk> | undefined;

export function loadFedaPayCheckout(): Promise<CheckoutSdk> {
  if (window.FedaPay) return Promise.resolve(window.FedaPay);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => fail(), 15000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      loading = undefined;
      reject(new Error("FEDAPAY_CHECKOUT_UNAVAILABLE"));
    }
    script.src = "https://cdn.fedapay.com/checkout.js?v=1.1.7";
    script.async = true;
    script.onload = () => {
      window.clearTimeout(timeout);
      if (window.FedaPay) resolve(window.FedaPay); else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loading;
}

export async function openFedaPayCheckout(payload: Record<string, unknown>, onComplete: (dismissed: boolean) => void): Promise<CheckoutInstance> {
  const transaction = payload.transaction as { id?: unknown } | undefined;
  if (typeof payload.public_key !== "string" || !/^pk_(sandbox|live)_/.test(payload.public_key) ||
      (payload.environment !== "live" && payload.environment !== "sandbox") ||
      !payload.public_key.startsWith(`pk_${payload.environment}_`) ||
      !Number.isSafeInteger(transaction?.id) || Number(transaction?.id) <= 0) {
    throw new Error("INVALID_FEDAPAY_WIDGET");
  }
  const sdk = await loadFedaPayCheckout();
  const widget = sdk.init({
    public_key: payload.public_key, environment: payload.environment,
    locale: typeof payload.locale === "string" && ["fr", "en", "de", "es"].includes(payload.locale) ? payload.locale : "fr",
    transaction: { id: Number(transaction!.id) },
    onComplete: event => onComplete(typeof sdk.DIALOG_DISMISSED === "number" && event?.reason === sdk.DIALOG_DISMISSED),
  });
  widget.open();
  return widget;
}
