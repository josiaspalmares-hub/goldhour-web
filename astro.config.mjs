// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // La barrita de herramientas de Astro tapaba la barra del pedido en el teléfono mientras probamos.
  devToolbar: { enabled: false },
});
