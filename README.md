# Goldhour · tienda de perfumes en Caracas

Web de catálogo y pedidos para [@goldhour.parfums](https://www.instagram.com/goldhour.parfums/), una perfumería de Caracas que vende perfumes originales y decants (5 y 10 ml).

**En vivo:** https://goldhourparfums.vercel.app

## Qué tiene

- **Portada con carrusel de frascos**: los frascos giran como un reloj al tocarlos o deslizar (GSAP Flip), con un reflejo de luz que sigue al ratón.
- **Entra en el frasco**: al bajar, la cámara se mete en el líquido del Khamrah Qahwa y sus ingredientes reales (canela, café, vainilla…) flotan hacia la cámara por etapas. Burbujas y rayos de luz en canvas 2D, ingredientes en Three.js, todo sincronizado con el scroll (ScrollTrigger).
- **Encuentra tu perfume**: el cliente elige para quién es, si lo quiere dulce o fresco, de día o de noche y su presupuesto, y la web le recomienda tres perfumes del catálogo.
- **Vitrina y decants** con fichas honestas: pirámide de notas animada, duración, proyección y ocasión.
- **Pedido sin servidor**: el carrito vive en el navegador y se envía armado por WhatsApp. Los precios están en dólares y el total en bolívares se calcula con la tasa euro del día ([DolarApi](https://ve.dolarapi.com)); si la tasa no responde, la web lo dice en vez de inventar un monto.
- **Guía para reconocer un original**, cómo comprar, preguntas frecuentes, privacidad, cambios y créditos de fotos.

## Detalles cuidados

- Carga rápida: la portada en un móvil con 4G pinta en unos 2,2 s; Three.js y las fotos de ingredientes solo se descargan cuando la página terminó de cargar y la sección está cerca.
- Accesible: 0 problemas en axe (WCAG 2 A/AA). Funciona con teclado y respeta "reducir movimiento" del sistema.
- SEO: datos estructurados (Store, ItemList, FAQPage), mapa del sitio, Open Graph para compartir por WhatsApp y `llms.txt`.

## Tecnología

[Astro](https://astro.build) · TypeScript · GSAP · Three.js · CSS propio con tokens (ver `DESIGN.md`) · Vercel

## Correrlo en tu computadora

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # versión final en dist/
```

## Créditos

Las fotos de ingredientes son de Wikimedia Commons; autores y licencias en [/creditos](https://goldhourparfums.vercel.app/creditos).
