import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize Meta Pixel using the env variable (with fallback to current production ID)
const META_PIXEL_ID =
  (import.meta.env.VITE_META_PIXEL_ID as string | undefined) ?? "1385087536987067";

const NEW_PIXEL_ID = "628010976785349";

if (typeof window !== "undefined" && META_PIXEL_ID) {
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof fbq === "function") {
    fbq("init", META_PIXEL_ID);
    fbq("track", "PageView");

    // Second pixel for Pack campaigns
    fbq("init", NEW_PIXEL_ID);
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

  // noscript fallback for the second pixel
  const noscript2 = document.createElement("noscript");
  const img2 = document.createElement("img");
  img2.height = 1;
  img2.width = 1;
  img2.style.display = "none";
  img2.src = `https://www.facebook.com/tr?id=${encodeURIComponent(NEW_PIXEL_ID)}&ev=PageView&noscript=1`;
  noscript2.appendChild(img2);
  document.body.appendChild(noscript2);
}

createRoot(document.getElementById("root")!).render(<App />);
