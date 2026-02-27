import { defineConfig } from "astro/config";
import react from "@astrojs/react";

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
  integrations: [react()],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: ["./node_modules/@uswds/uswds/packages"],
        },
      },
    },
    ssr: {
      noExternal: ["@uswds/uswds"],
    },
    optimizeDeps: {
      include: ["react", "react-dom"],
    },
    resolve: {
      dedupe: ["react", "react-dom"],
    },
    build: {
      target: "esnext",
      minify: true,
      cssMinify: true,
    },
  },
});
