import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

let siteUrl = process.env.BASEURL ? process.env.BASEURL : 'http://localhost:4321';
if (process.env?.BRANCH === "main") {
  siteUrl = "https://councils.gov";
} else if (process.env?.BRANCH) {
  siteUrl = `${process.env.FEDERALIST_URL}/preview/${process.env.OWNER}/${process.env.REPOSITORY}/${process.env.BRANCH}/`
}

export default defineConfig({
  outDir: '_site',
  site: siteUrl,
  base: process.env.BASEURL ? process.env.BASEURL + '/' : '/',
  integrations: [react(), sitemap()],
  vite: {
    ssr: {
      noExternal: ['@uswds/uswds'],
    },
    resolve: {
      alias: {
        '@uswds/uswds/dist/css/uswds.css': '@uswds/uswds/css/uswds.css',
      },
    },
    build: {
      target: 'esnext',
    },
  },
});
