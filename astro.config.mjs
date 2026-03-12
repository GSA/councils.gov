import { defineConfig } from "astro/config";
import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";

// If BASEURL env variable exists, update base to the BASEURL
let base = "/";

if (process.env.BASEURL) {
  base = process.env.BASEURL;
}

export default defineConfig({
  outDir: "_site",
  site: "https://councils.gov",
  base,
  trailingSlash: "always",
  integrations: [react(), sitemap()],
  image: {
    remotePatterns: [{ protocol: "https" }],
  },
  vite: {
    ssr: {
      noExternal: ["@uswds/uswds"],
    },
    optimizeDeps: {
      include: ["react", "react-dom"],
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@uswds/uswds/dist/css/uswds.css": "@uswds/uswds/css/uswds.css",
      },
    },
    build: {
      target: "esnext",
    },
  },
});