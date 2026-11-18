// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Al comprar goldhourparfums.com cambiar aquí, en robots.txt y en llms.txt
  site: 'https://goldhourparfums.vercel.app',
  // Panel privado: fuera del mapa del sitio
  integrations: [sitemap({ filter: (pagina) => !pagina.includes('/panel') })],
  // La barra de Astro tapaba la del pedido en el teléfono
  devToolbar: { enabled: false },
  // Ningún script dentro del HTML: así la CSP no necesita 'unsafe-inline'
  vite: { build: { assetsInlineLimit: 0 } },
});
