---
name: Goldhour · Maison de Parfums
description: Vitrina nocturna de perfumería. Negro mate, oro en lámina solo en los momentos clave y una luz cálida lateral —la hora dorada— que recorre los frascos. Honestidad técnica en cada ficha (duración, proyección, ocasión).
---

# Goldhour · sistema de diseño de la web

Fuente de la marca: `goldhour-marca/REGLAS-DE-DISENO.md` y la guía de marca (`logo-final/guia-de-marca.html`).
Toda la web usa solo estos tokens (están en `src/styles/tokens.css`). Nada de colores o tamaños sueltos.

## Idea

**La hora dorada.** La luz del atardecer pega de lado y hace brillar el vidrio. Es la firma de la web:
una franja de luz cálida que recorre el frasco de la portada al bajar. Es la única animación protagonista.

Inspiración (de los videos guardados): lujo oscuro editorial de @wearebrand.io (titular serif enorme con
textura metálica, producto grande) y la entrada por pasos del hero de @overlocked.hq.

## Color

| Token | Valor | Uso |
|---|---|---|
| `--negro` | #0D0D0D | fondo base (negro mate) |
| `--negro-2` | #151413 | superficies elevadas, bases de los frascos |
| `--linea` | rgba(201,165,92,.22) | filetes finos y divisores |
| `--oro` | #C9A55C | acento: precios, etiquetas, filete |
| `--oro-lamina` | degradado #A98234 → #E6CB82 → #F7E6AE → #D9B565 → #A57D2F → #8A6624 | solo logo y titular de portada |
| `--marfil` | #F2ECE1 | fondo de la sección de decants (cambio de ritmo) |
| `--blanco` | #FFFFFF | nombre del perfume (regla de marca: títulos en blanco) |
| `--texto` | #E6E2DA | texto de apoyo sobre negro |
| `--texto-2` | #9F978A | texto secundario |
| `--tinta` | #1B1B1B | texto sobre marfil |

Reglas: el oro va en 3 lugares nada más (titular, precios, línea de luz). Sin degradados morados, sin glow
en todo, sin glass en todas las tarjetas (máximo 1 elemento: la barra del pedido).

## Tipografía

- **Bodoni Moda** (Didone, igual que el logo): titulares y nombre del perfume. Peso 500–600, nunca el
  más fino (regla de legibilidad).
- **Jost**: todo lo demás. Etiquetas en mayúsculas espaciadas (0.24em) en oro, tamaño 12–13 px.
- Escala (fluida con `clamp`): display 56→128 px · h2 36→64 · h3 24→32 · cuerpo 16–17 · pequeño 13.

## Espacio y forma

- Escala de espacios: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 · 112 · 160 px. Las secciones varían el ritmo:
  la portada y la vitrina respiran (112–160), cómo comprar y preguntas van más juntas (48–72).
- Radios: 2 px en botones y tarjetas (corte de joyería, nada de píldoras). 999 px solo en los controles de
  elegir: filtros de la vitrina y tamaños (5 ml / 10 ml / frasco).
- Sombras: solo la sombra de contacto bajo cada frasco sobre su base.

## Componentes

- **Botón principal**: fondo oro plano, texto negro, Jost 15 px mayúsculas. Altura mínima 48 px.
- **Botón secundario**: borde `--linea`, texto marfil.
- **Frasco en vitrina**: foto real recortada (≥ 1.200 px de alto) sobre una base `--negro-2` con luz cálida
  desde la izquierda; nombre en Bodoni blanco, casa en etiqueta oro, precio en oro.
- **Ficha honesta**: duración y proyección con 5 segmentos (como en los posts), ocasión en texto, pirámide
  salida / corazón / fondo.
- **Selector de tamaño (solo decants)**: 5 ml · 10 ml · frasco completo.
- **Pedido**: barra fija abajo en el teléfono; total en $ y, al pagar, total en Bs a la tasa euro BCV del día.

## Movimiento

- Protagonista: luz dorada que recorre el frasco del hero con el scroll (GSAP ScrollTrigger, solo `transform`
  y `opacity`).
- Entrada del hero por pasos: logo → titular → frasco → botón (total < 1,2 s).
- Micro: frasco que sube 4 px al pasar el dedo, filete dorado que se dibuja al entrar cada sección.
- Nada que se mueva solo en bucle. Con `prefers-reduced-motion` todo queda quieto.

## Lo que no se hace

Degradados azul/morado, glass en todo, emojis como íconos, tres tarjetas iguales con ícono, frases como
"lleva tu estilo al siguiente nivel", fotos pixeladas, más de 3 colores activos.
