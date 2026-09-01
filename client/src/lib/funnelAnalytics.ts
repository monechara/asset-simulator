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

declare global {
  interface Window {
    umami?: UmamiClient;
  }
}

export function trackFunnelEvent(eventName: FunnelEventName): void {
  if (typeof window === "undefined") return;

  let attempts = 0;
  const send = () => {
    try {
      if (window.umami?.track) {
        window.umami.track(eventName, { funnel: "asset-simulator" });
        return;
      }
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
