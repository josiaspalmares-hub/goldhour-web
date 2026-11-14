# Goldhour · tienda de perfumes en Caracas

Web de catálogo y pedidos para [@goldhour.parfums](https://www.instagram.com/goldhour.parfums/), una perfumería de Caracas que vende perfumes originales y decants (5 y 10 ml).

**En vivo:** https://goldhourparfums.vercel.app

## Qué tiene

- **Portada con carrusel de frascos**: los frascos giran como un reloj al tocarlos o deslizar (GSAP Flip), con un reflejo de luz que sigue al ratón.
- **Entra en el frasco**: al bajar, la cámara se mete en el frasco dorado del Le Male Elixir y cada etapa de su perfume se ve con un video real de sus ingredientes: líquido dorado, lavanda (salida), vainilla (corazón) y miel (fondo), con polvo dorado flotando y las notas pasando hacia la cámara. Todo sincronizado con el scroll (ScrollTrigger).
- **Nuestros 20 favoritos**: vitrina de 10 perfumes para él y 10 para ella con fichas honestas (pirámide de notas, duración, proyección y ocasión). Toda la tarjeta abre la ficha.
- **Encuentra tu perfume**: el cliente elige para quién es, si lo quiere dulce o fresco, de día o de noche y su presupuesto, y la web le recomienda los 3 mejores de **todo el catálogo**. El perfil de cada perfume (dulce, fresco, de noche) se calcula de su familia olfativa y sus notas.
- **Catálogo completo**: más de 300 perfumes con buscador sin acentos, filtros y estado de cada uno (**disponible**, **por encargo · llega en 3 a 5 días** o **agotado**).
- **Decants** de 5 y 10 ml para probar antes de comprar el frasco.
- **Pedido sin cuentas**: el carrito vive en el navegador y se envía armado por WhatsApp. Los precios están en dólares y el total en bolívares se calcula con la tasa euro del día ([DolarApi](https://ve.dolarapi.com)); si la tasa no responde, la web lo dice en vez de inventar un monto.
- **Panel de socios** (`/panel`, privado): mide visitas, perfumes vistos, búsquedas, agregados y pedidos por WhatsApp; permite cambiar precios, estados y fotos del catálogo y administrar los logins de los socios.

## Detalles cuidados

- **Datos en Supabase** con RLS en todas las tablas: el catálogo es de lectura pública y solo los socios pueden editar. Crear o cambiar logins lo hace una Edge Function en el servidor (la clave secreta nunca va al navegador).
- **Medición propia y anónima**: sin cookies ni datos personales, solo un identificador al azar por visita.
- **Videos livianos**: versiones horizontales y verticales; cada video se baja cuando el visitante se acerca y solo se reproduce el que se ve.
- **Accesible**: 0 problemas en axe (WCAG 2 A/AA). Funciona con teclado y respeta "reducir movimiento" del sistema.
- **SEO**: datos estructurados (Store, ItemList, FAQPage), mapa del sitio, Open Graph para compartir por WhatsApp y `llms.txt`.

## Tecnología

[Astro](https://astro.build) · TypeScript · GSAP · Supabase (Postgres, Auth, Storage, Edge Functions) · CSS propio con tokens (ver `DESIGN.md`) · Vercel

## Correrlo en tu computadora

```sh
npm install
cp .env.example .env   # y pon la URL y la clave publishable de tu proyecto de Supabase
npm run dev            # http://localhost:4321
npm run build          # versión final en dist/
```

## Créditos

Fotos de los perfumes: sus marcas. Videos de ingredientes: [Pexels](https://www.pexels.com) (licencia libre); detalle en [/creditos](https://goldhourparfums.vercel.app/creditos).
