import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        // Map the old path to the new export path
        '@uswds/uswds/dist/css/uswds.css': '@uswds/uswds/css/uswds.css',
      },
    },
  },
});

