// Medición propia y anónima: visitas, perfumes vistos, búsquedas, agregados al pedido y clics a WhatsApp.
// Sin cookies ni datos personales: solo un identificador al azar que dura lo que dura la visita (sessionStorage).
// Si la medición falla, la página sigue funcionando igual: solo se avisa en la consola.
import { config, SupabaseNoConfigurado } from './supabase';

export type TipoEvento = 'visita' | 'ver_perfume' | 'whatsapp' | 'busqueda' | 'agregar';

function sesion(): string {
  const nueva = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
  try {
    let s = sessionStorage.getItem('gh-sesion');
    if (!s) { s = nueva(); sessionStorage.setItem('gh-sesion', s); }
    return s;
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
    return nueva(); // almacenamiento bloqueado: cada evento cuenta como visita aparte
  }
}

const recorta = (t: string | undefined, n: number) => (t ? t.trim().slice(0, n) : undefined);

// Las pruebas en la propia PC no se cuentan, salvo que la dirección lleve ?medir (para probar la medición)
const esPrueba = () => ['localhost', '127.0.0.1'].includes(location.hostname) && !location.search.includes('medir');

export function medir(tipo: TipoEvento, datos: { perfume?: string; detalle?: string } = {}) {
  if (esPrueba()) return;
  let cfg;
  try { cfg = config(); } catch (error) {
    if (error instanceof SupabaseNoConfigurado) return; // en desarrollo sin .env no se mide
    throw error;
  }
  const cuerpo = {
    tipo,
    perfume: recorta(datos.perfume, 160),
    detalle: recorta(datos.detalle, 120),
    pagina: location.pathname.slice(0, 60),
    sesion: sesion(),
  };
  // keepalive: el evento llega aunque el clic abra WhatsApp y la persona salga de la página
  fetch(`${cfg.url}/rest/v1/eventos`, {
    method: 'POST',
    keepalive: true,
    headers: { apikey: cfg.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(cuerpo),
  }).then((r) => { if (!r.ok) console.warn('Medición no registrada:', r.status); })
    .catch((e) => console.warn('Medición no registrada:', e));
}

/** Una visita por sesión. */
export function medirVisita() {
  try {
    if (sessionStorage.getItem('gh-visita')) return;
    sessionStorage.setItem('gh-visita', '1');
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
  }
  medir('visita');
}
