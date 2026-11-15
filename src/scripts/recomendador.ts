// Recomendador: dulce, fresco y noche (0 a 10) a partir de la familia y las notas
import type { PerfumeCatalogo } from './supabase';

export interface Perfil { dulce: number; fresco: number; noche: number }

// Peso por palabra; fondo y familia pesan más porque duran más en la piel
const PESOS: Record<keyof Perfil, [string, number][]> = {
  dulce: [
    ['gourmand', 3], ['vainilla', 2.5], ['caramelo', 3], ['praline', 3], ['tonka', 2], ['miel', 2], ['cacao', 2],
    ['chocolate', 2], ['dulce', 2], ['datil', 2], ['castana', 2], ['almendra', 1.5], ['coco', 1.5], ['benjui', 1.5],
    ['ambarado', 1.2], ['ambar', 0.8], ['cafe', 1.2], ['canela', 1], ['fresa', 1.5], ['frambuesa', 1.5],
    ['cereza', 1.5], ['lichi', 1], ['durazno', 1], ['melocoton', 1], ['pera', 0.8], ['pina', 0.8], ['mango', 1],
    ['frutal', 0.8], ['tabaco', 0.8], ['azucar', 2], ['malvavisco', 2], ['ron', 1],
  ],
  fresco: [
    ['acuatico', 3], ['marino', 3], ['marinas', 3], ['citrico', 2.5], ['fresco', 2], ['limon', 2], ['pomelo', 2],
    ['toronja', 2], ['yuzu', 2], ['menta', 2], ['pepino', 2], ['agua', 1.5], ['ozon', 2], ['bergamota', 1.2],
    ['mandarina', 1], ['naranja', 1], ['neroli', 1.2], ['verde', 1.5], ['hoja', 1], ['te ', 1.2], ['jengibre', 1],
    ['aromatico', 1.5], ['lavanda', 1], ['romero', 1], ['salvia', 0.8], ['fougere', 1], ['salino', 1.5],
    ['sal ', 1], ['ambroxan', 1.2], ['vetiver', 0.6], ['helado', 1.5],
  ],
  noche: [
    ['oud', 3], ['cuero', 2.5], ['tabaco', 2.5], ['incienso', 2], ['mirra', 2], ['oriental', 2], ['ambarado', 1.5],
    ['especiado', 1.5], ['ambar', 1.2], ['pachuli', 1.5], ['cafe', 1.5], ['licor', 2], ['ron', 2], ['whisky', 2],
    ['vainilla', 1], ['canela', 1], ['pimienta negra', 1], ['benjui', 1], ['cacao', 1], ['tonka', 0.8],
    ['madera', 0.6], ['amaderado', 0.8], ['almizcle', 0.4], ['nardo', 1], ['tuberosa', 1], ['champan', 1],
  ],
};

const plano = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Rendimiento decreciente
const escala = (s: number) => 10 * (1 - Math.exp(-s / 4.5));

export function perfilDe(p: Pick<PerfumeCatalogo, 'nombre' | 'familia' | 'notas'>): Perfil {
  const familia = plano(p.familia ?? '');
  const partes = plano(p.notas ?? '').split('·'); // salida · corazón · fondo
  const textos: [string, number][] = [[familia, 1.4], ...partes.map((t, i): [string, number] => [t, i === partes.length - 1 ? 1.2 : 1])];
  const suma = (lista: [string, number][]) =>
    textos.reduce((total, [texto, peso]) => total + lista.reduce((s, [palabra, v]) => s + (` ${texto} `.includes(palabra) ? v * peso : 0), 0), 0);

  const nombre = plano(p.nombre);
  // EDT y colonia: día; Parfum y Elixir: noche
  const ajusteNoche = /elixir|intense|intenso|extrait|parfum \d|le parfum|absolu/.test(nombre) ? 1.5
    : /cologne|colonia|eau fraiche|sport|fresh/.test(nombre) ? -1.5
    : /eau de toilette/.test(nombre) ? -0.6 : 0;

  const dulce = escala(suma(PESOS.dulce));
  const fresco = escala(suma(PESOS.fresco));
  const noche = Math.min(10, Math.max(0, escala(suma(PESOS.noche)) - fresco * 0.25 + ajusteNoche));
  return { dulce, fresco, noche };
}

export interface Criterios {
  para: 'todos' | 'Él' | 'Ella' | 'Unisex';
  estilo: number; // 0 dulce · 1 fresco
  momento: number; // 0 día · 1 noche
  tope: number; // presupuesto máximo en $; 0 = cualquiera
}

const CATEGORIA = { 'Él': 'Caballero', Ella: 'Dama', Unisex: 'Unisex' } as const;
// Mismo perfume en otro tamaño cuenta una vez
const linea = (nombre: string) => plano(nombre).replace(/\b(eau de (parfum|toilette|cologne)|parfum|extrait)\b.*$/, '').trim();

export function recomendar(catalogo: PerfumeCatalogo[], c: Criterios, cuantos = 3) {
  const objetivo: Perfil = { dulce: (1 - c.estilo) * 10, fresco: c.estilo * 10, noche: c.momento * 10 };
  const puntuados = catalogo
    .filter((p) => p.estado !== 'agotado')
    .filter((p) => c.para === 'todos' || p.categoria === CATEGORIA[c.para] || p.categoria === 'Unisex')
    .filter((p) => !c.tope || Number(p.precio_usd) <= c.tope)
    .map((p) => {
      const f = perfilDe(p);
      let distancia = Math.abs(f.dulce - objetivo.dulce) + Math.abs(f.fresco - objetivo.fresco) + Math.abs(f.noche - objetivo.noche) * 0.9;
      // Empujón a disponibles y favoritos
      if (p.estado === 'disponible') distancia -= 1.2;
      if (p.destacado) distancia -= 0.6;
      return { p, distancia };
    })
    .sort((a, b) => a.distancia - b.distancia);

  // Una por casa
  const elegidos: PerfumeCatalogo[] = [];
  const lineas = new Set<string>(), casas = new Set<string>();
  for (const { p } of puntuados) {
    const l = linea(p.nombre), casa = plano(p.nombre.split(' ')[0]);
    if (lineas.has(l) || casas.has(casa)) continue;
    elegidos.push(p); lineas.add(l); casas.add(casa);
    if (elegidos.length === cuantos) break;
  }
  return elegidos;
}
