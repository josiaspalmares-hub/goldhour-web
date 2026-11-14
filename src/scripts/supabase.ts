// Conexión con Supabase (catálogo, medición y panel de socios).
// La clave es la "publishable": está hecha para usarse en el navegador; lo que cada quien puede leer o
// escribir lo deciden las reglas RLS de la base de datos (ver la migración del proyecto en Supabase).

export const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
export const SUPABASE_KEY = import.meta.env.PUBLIC_SUPABASE_KEY as string | undefined;

export class SupabaseNoConfigurado extends Error {}

export function config() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new SupabaseNoConfigurado('Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_KEY en el .env');
  }
  return { url: SUPABASE_URL, key: SUPABASE_KEY };
}

export type Estado = 'disponible' | 'encargo' | 'agotado';
export interface PerfumeCatalogo {
  id: string;
  slug: string;
  nombre: string;
  categoria: 'Caballero' | 'Dama' | 'Unisex';
  precio_usd: number;
  familia: string | null;
  notas: string | null;
  estado: Estado;
  destacado: boolean;
  foto_url: string | null;
}

export const ESTADOS: Record<Estado, string> = {
  disponible: 'Disponible',
  encargo: 'Por encargo · llega en 3 a 5 días',
  agotado: 'Agotado',
};

/** Todos los perfumes del catálogo (lectura pública). Lanza un error si la red o Supabase fallan. */
export async function leerCatalogo(): Promise<PerfumeCatalogo[]> {
  const { url, key } = config();
  const campos = 'id,slug,nombre,categoria,precio_usd,familia,notas,estado,destacado,foto_url';
  const res = await fetch(`${url}/rest/v1/perfumes?select=${campos}&order=destacado.desc,nombre.asc`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`El catálogo respondió ${res.status}`);
  return res.json();
}

/** La descripción completa se arma igual para todos (así viene en Kyte). */
export function descripcion(p: Pick<PerfumeCatalogo, 'familia' | 'notas'>) {
  return [
    'Perfume 100% original y sellado de fábrica.',
    p.familia && `Familia olfativa: ${p.familia}.`,
    p.notas && `Notas principales: ${p.notas}.`,
  ].filter(Boolean).join(' ');
}
