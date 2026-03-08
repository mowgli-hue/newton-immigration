import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jungle Labs",
    short_name: "Jungle Labs",
    description: "Intelligent digital systems for modern businesses.",
    start_url: "/",
    display: "standalone",
    background_color: "#04070d",
    theme_color: "#04070d",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any"
      }
    ]
  };
}
