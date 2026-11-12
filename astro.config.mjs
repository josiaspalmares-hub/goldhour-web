// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Dirección pública de la web: se usa para el mapa del sitio y los enlaces al compartir.
  // Por ahora la gratuita de Vercel; al comprar goldhourparfums.com se cambia aquí, en robots.txt y en llms.txt.
  site: 'https://goldhourparfums.vercel.app',
  integrations: [sitemap()],
  // La barrita de herramientas de Astro tapaba la barra del pedido en el teléfono mientras probamos.
  devToolbar: { enabled: false },
});
