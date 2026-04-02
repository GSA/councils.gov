import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import matter from "gray-matter";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

// If BASEURL env variable exists, update base to the BASEURL
let base = "/";

if (process.env.BASEURL) {
  base = process.env.BASEURL;
}

// Redirect old /councils/{slug}/about/ and /councils/{slug}/ URLs to new structure
const contentDir = join(process.cwd(), "src/content/councils");
const councilRedirects = {};
try {
  const slugs = readdirSync(contentDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  for (const slug of slugs) {
    const aboutPath = join(contentDir, slug, "about.md");
    let externalSiteUrl = "";
    if (existsSync(aboutPath)) {
      const { data } = matter(readFileSync(aboutPath, "utf-8"));
      externalSiteUrl =
        data.externalSiteUrl != null ? String(data.externalSiteUrl).trim() : "";
    }

    if (externalSiteUrl) {
      councilRedirects[`/councils/${slug}/about/`] = externalSiteUrl;
      councilRedirects[`/councils/${slug}/`] = externalSiteUrl;
      councilRedirects[`/councils/${slug}/members-leaders/`] = externalSiteUrl;
      councilRedirects[`/${slug}/`] = externalSiteUrl;
      councilRedirects[`/${slug}/members-leaders/`] = externalSiteUrl;
    } else {
      councilRedirects[`/councils/${slug}/about/`] = `/${slug}/`;
      councilRedirects[`/councils/${slug}/`] = `/${slug}/`;
      councilRedirects[`/councils/${slug}/members-leaders/`] =
        `/${slug}/members-leaders/`;
    }
  }
} catch {
  // Ignore if content dir doesn't exist (e.g. during config validation)
}

export default defineConfig({
  outDir: "_site",
  site: "https://www.councils.gov",
  base,
  trailingSlash: "always",
  redirects: councilRedirects,
  integrations: [react(), sitemap()],
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
