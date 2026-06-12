import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "World Cup 2026 Match Center",
    short_name: "WC 2026",
    description:
      "Every match, group, venue and bracket of the FIFA World Cup 2026 — with predictions, calendar export and an interactive map.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#050b14",
    theme_color: "#050b14",
    lang: "en",
    dir: "ltr",
    categories: ["sports", "news"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Matches", url: "/matches", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Groups", url: "/groups", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Calendar", url: "/calendar", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
