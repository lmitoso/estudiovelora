// Meta Pixel helper — wrapper around the global fbq() loaded in index.html
// Pixel ID is configured via VITE_META_PIXEL_ID and injected at build time
// in index.html. This helper just dispatches events safely.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type StandardEvent =
  | "PageView"
  | "Lead"
  | "ViewContent"
  | "Purchase"
  | "InitiateCheckout"
  | "AddToCart"
  | "CompleteRegistration";

export function fbqTrack(event: StandardEvent, params?: Record<string, unknown>) {
  try {
    if (typeof window === "undefined") return;
    if (typeof window.fbq !== "function") return;
    if (params) {
      window.fbq("track", event, params);
    } else {
      window.fbq("track", event);
    }
  } catch (err) {
    // Never break the app because of analytics
    console.warn("[MetaPixel] track failed:", err);
  }
}
