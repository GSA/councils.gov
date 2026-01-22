import { defineConfig } from "astro/config";
import react from "@astrojs/react";

let base = "/";

// If BASEURL env variable exists, update pathPrefix to the BASEURL
if (process.env.BASEURL) {
  base = process.env.BASEURL;
}

export default defineConfig({
  outDir: "_site",
  site: "https://councils.gov",
  base,
  integrations: [react()],
  vite: {
    ssr: {
      noExternal: ["@uswds/uswds"],
    },
    resolve: {
      alias: {
        "@uswds/uswds/dist/css/uswds.css": "@uswds/uswds/css/uswds.css",
      },
    },
    build: {
      target: "esnext",
    },
  },
});
