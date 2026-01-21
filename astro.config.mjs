import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

let siteUrl = 'http://localhost:4321';
if (process.env?.BRANCH === "main") {
  siteUrl = "https://councils.gov";
} else if (process.env?.BRANCH) {
  siteUrl = `${process.env.FEDERALIST_URL}/preview/${process.env.OWNER}/${process.env.REPOSITORY}/${process.env.BRANCH}/`
} else if (process.env.BASEURL) {
  siteUrl = process.env.BASEURL;
}

const baseUrl = siteUrl.startsWith('http://') || siteUrl.startsWith('https://')
  ? new URL(siteUrl).pathname
  : (siteUrl.startsWith('/') ? siteUrl : `/${siteUrl}`);

export default defineConfig({
  outDir: '_site',
  site: siteUrl,
  base: baseUrl.endsWith('/') ? baseUrl : baseUrl + '/',
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
