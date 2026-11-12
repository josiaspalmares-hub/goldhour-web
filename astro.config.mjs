// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Dominio elegido para la web (todavía sin comprar): se usa para el mapa del sitio y los enlaces al compartir.
  site: 'https://goldhourparfums.com',
  integrations: [sitemap()],
  // La barrita de herramientas de Astro tapaba la barra del pedido en el teléfono mientras probamos.
  devToolbar: { enabled: false },
});
