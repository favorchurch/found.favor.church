import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lost & Found | Favor Church",
    short_name: "Lost & Found",
    start_url: "/",
    display: "standalone",
    background_color: "#ff6a00",
    theme_color: "#ff6a00",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
