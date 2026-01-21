import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const isPreviewBranch = Boolean(process.env.BRANCH && process.env.BRANCH !== 'main');
const baseEnv = process.env.BASEURL;
const baseEnvIsUrl = Boolean(baseEnv && /^https?:\/\//.test(baseEnv));

let siteUrl = 'http://localhost:4321';
if (process.env.BRANCH === 'main') {
  siteUrl = 'https://councils.gov';
} else if (isPreviewBranch && process.env.FEDERALIST_URL) {
  siteUrl = process.env.FEDERALIST_URL;
} else if (baseEnvIsUrl) {
  siteUrl = baseEnv;
}

let baseUrl = '/';
if (isPreviewBranch && process.env.OWNER && process.env.REPOSITORY && process.env.BRANCH) {
  baseUrl = `/preview/${process.env.OWNER}/${process.env.REPOSITORY}/${process.env.BRANCH}/`;
} else if (baseEnv) {
  baseUrl = baseEnvIsUrl ? new URL(baseEnv).pathname : baseEnv;
}

if (!baseUrl.startsWith('/')) {
  baseUrl = `/${baseUrl}`;
}


export default defineConfig({
  outDir: '_site',
  site: siteUrl,
  base: baseUrl.endsWith('/') ? baseUrl : baseUrl + '/',
  integrations: [react()],
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
