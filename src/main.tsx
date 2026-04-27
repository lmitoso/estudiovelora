import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize Meta Pixel using the env variable (with fallback to current production ID)
const META_PIXEL_ID =
  (import.meta.env.VITE_META_PIXEL_ID as string | undefined) ?? "1385087536987067";

if (typeof window !== "undefined" && META_PIXEL_ID) {
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof fbq === "function") {
    fbq("init", META_PIXEL_ID);
    fbq("track", "PageView");
  }

  // noscript fallback pixel (appended at runtime so the ID stays env-driven)
  const noscript = document.createElement("noscript");
  const img = document.createElement("img");
  img.height = 1;
  img.width = 1;
  img.style.display = "none";
  img.src = `https://www.facebook.com/tr?id=${encodeURIComponent(META_PIXEL_ID)}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  document.body.appendChild(noscript);
}

createRoot(document.getElementById("root")!).render(<App />);
