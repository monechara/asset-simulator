/**
 * Manekara entry funnel analytics.
 * Existing light, friendly financial-service UI is preserved; this file only emits
 * four non-identifying milestone events to the already loaded Umami endpoint.
 */
export type FunnelEventName =
  | "simple_input_start"
  | "simple_result_view"
  | "detailed_input_start"
  | "detailed_result_view";

type UmamiClient = {
  track?: (eventName: string, data?: Record<string, string>) => void;
};

type GtagClient = (...args: unknown[]) => void;

declare global {
  interface Window {
    umami?: UmamiClient;
    gtag?: GtagClient;
  }
}

const FUNNEL_PARAMS = {
  product: "asset-simulator",
  funnel: "asset-simulator",
} as const;

export function trackFunnelEvent(eventName: FunnelEventName): void {
  if (typeof window === "undefined") return;

  let attempts = 0;
  const send = () => {
    try {
      // Keep both analytics destinations active during the GA4 migration.
      if (window.gtag) {
        window.gtag("event", eventName, FUNNEL_PARAMS);
      }
      if (window.umami?.track) {
        window.umami.track(eventName, FUNNEL_PARAMS);
      }

      if (window.gtag || window.umami?.track) return;
      if (attempts < 5) {
        attempts += 1;
        window.setTimeout(send, 250);
      }
    } catch {
      // Analytics must never interrupt simulation input or result rendering.
    }
  };

  send();
}
