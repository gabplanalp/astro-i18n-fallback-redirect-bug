import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // Disable CSRF origin check so the repro works without a browser / configured site.
  security: { checkOrigin: false },
  i18n: {
    locales: ['de', 'en'],
    defaultLocale: 'de',
    fallback: { en: 'de' },
  },
});
