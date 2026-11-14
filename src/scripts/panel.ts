// Panel de socios: entrar, ver qué funciona en la web y cambiar el catálogo.
// Quién puede leer o cambiar qué lo deciden las reglas RLS de Supabase (solo los socios editan y ven la medición);
// este archivo solo arma la pantalla. Todo texto que viene de la base se pone con textContent, nunca como HTML.
import { createClient, type Session } from '@supabase/supabase-js';
import { config, ESTADOS, type Estado, type PerfumeCatalogo } from './supabase';

const { url, key } = config();
const sb = createClient(url, key);

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, clase?: string, texto?: string) {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto !== undefined) n.textContent = texto;
  return n;
}

// ---------- Pantallas ----------
type Pantalla = 'cargando' | 'entrar' | 'sin-acceso' | 'panel';
function mostrar(p: Pantalla) {
  document.querySelectorAll<HTMLElement>('[data-pantalla]').forEach((s) => { s.hidden = s.dataset.pantalla !== p; });
}

function aviso(texto: string, tipo: 'ok' | 'error' = 'ok') {
  const caja = $('[data-aviso]');
  caja.textContent = texto;
  caja.dataset.tipo = tipo;
  caja.classList.add('visible');
  clearTimeout(Number(caja.dataset.t));
  caja.dataset.t = String(setTimeout(() => caja.classList.remove('visible'), 3500));
}

// Los mensajes de Supabase vienen en inglés y a veces con detalles internos: se traducen a algo claro.
function mensajeAuth(error: { message: string; status?: number }) {
  const m = error.message.toLowerCase();
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Falta confirmar el correo: revisa tu bandeja (y spam).';
  if (m.includes('password')) return 'La contraseña debe tener al menos 8 caracteres.';
  if (error.status === 429 || m.includes('rate')) return 'Demasiados intentos. Espera unos minutos y vuelve a probar.';
  return 'No se pudo entrar. Revisa tu conexión y vuelve a intentar.';
}

// ---------- Entrar ----------
// No hay registro público: los logins los crea un socio desde la sección Logins.
let fallos = 0;

function prepararEntrada() {
  const form = $<HTMLFormElement>('[data-form-entrar]');
  const error = $('[data-entrar-error]');
  const boton = $<HTMLButtonElement>('[data-entrar-boton]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = new FormData(form);
    const correo = String(datos.get('correo') ?? '').trim();
    const clave = String(datos.get('clave') ?? '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { error.textContent = 'Escribe un correo válido.'; return; }
    if (clave.length < 8) { error.textContent = 'La contraseña debe tener al menos 8 caracteres.'; return; }

    error.textContent = '';
    boton.disabled = true;
    boton.textContent = 'Entrando…';
    const r = await sb.auth.signInWithPassword({ email: correo, password: clave });
    boton.textContent = 'Entrar';

    if (r.error) {
      error.textContent = /banned/i.test(r.error.message) ? 'Este login está pausado. Pídele a un socio que lo active.' : mensajeAuth(r.error);
      // Freno extra en el navegador; el límite real lo pone Supabase Auth en el servidor.
      fallos++;
      const espera = fallos >= 5 ? 30 : 0;
      if (espera) {
        error.textContent += ` Espera ${espera} segundos.`;
        setTimeout(() => { boton.disabled = false; }, espera * 1000);
      } else boton.disabled = false;
      return;
    }
    boton.disabled = false;
    fallos = 0;
    form.reset();
  });
}

// ---------- Sesión ----------
let socio: { nombre: string } | null = null;
let iniciado = false;

async function alCambiarSesion(sesion: Session | null) {
  if (!sesion) { socio = null; iniciado = false; mostrar('entrar'); return; }
  if (iniciado) return;
  mostrar('cargando');
  const { data, error } = await sb.from('socios').select('nombre').eq('user_id', sesion.user.id).maybeSingle();
  if (error) { mostrar('entrar'); $('[data-entrar-error]').textContent = 'No se pudo revisar tu acceso. Intenta de nuevo.'; return; }
  if (!data) {
    $('[data-sin-acceso-correo]').textContent = sesion.user.email ?? '';
    mostrar('sin-acceso');
    return;
  }
  socio = data;
  iniciado = true;
  $('[data-hola]').textContent = `Hola, ${socio.nombre.split(' ')[0]}`;
  mostrar('panel');
  irA(location.hash === '#perfumes' ? 'perfumes' : location.hash === '#logins' ? 'logins' : 'resumen');
}

async function salir() {
  const { error } = await sb.auth.signOut();
  if (error) aviso('No se pudo cerrar la sesión. Intenta de nuevo.', 'error');
}

// ---------- Navegación interna ----------
type Vista = 'resumen' | 'perfumes' | 'logins';
function irA(v: Vista) {
  document.querySelectorAll<HTMLElement>('[data-vista]').forEach((s) => { s.hidden = s.dataset.vista !== v; });
  document.querySelectorAll<HTMLAnchorElement>('[data-ir]').forEach((a) => {
    if (a.dataset.ir === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  history.replaceState(null, '', v === 'resumen' ? '/panel' : `/panel#${v}`);
  if (v === 'resumen') cargarResumen();
  else if (v === 'logins') cargarLogins();
  else if (!perfumes.length) cargarPerfumes();
}

// ---------- Resumen ----------
interface Resumen {
  visitas: number; vistas: number; whatsapp: number; busquedas: number; agregados: number;
  por_dia: { dia: string; visitas: number; whatsapp: number }[];
  top_vistos: { perfume: string; veces: number }[];
  top_whatsapp: { perfume: string; veces: number }[];
  top_busquedas: { texto: string; veces: number }[];
}
let dias = 7;
const numero = (n: number) => n.toLocaleString('es-VE');
const diaCaracas = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/Caracas' }); // AAAA-MM-DD

async function cargarResumen() {
  const zona = $('[data-resumen]');
  zona.dataset.estado = 'cargando';
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data, error } = await sb.rpc('resumen_eventos', { desde });
  if (error) {
    zona.dataset.estado = 'error';
    return;
  }
  const r = data as Resumen;
  zona.dataset.estado = r.visitas + r.vistas + r.whatsapp + r.busquedas + r.agregados === 0 ? 'vacio' : 'listo';

  const kpis: [string, number][] = [
    ['visitas', r.visitas], ['vistas', r.vistas], ['busquedas', r.busquedas], ['agregados', r.agregados], ['whatsapp', r.whatsapp],
  ];
  for (const [k, v] of kpis) $(`[data-kpi=${k}]`).textContent = numero(v);
  // Cuántas visitas terminan en un pedido por WhatsApp: el número que más importa
  $('[data-kpi=conversion]').textContent = r.visitas ? `${Math.round((r.whatsapp / r.visitas) * 1000) / 10}%` : '—';

  pintarGrafica(r.por_dia);
  pintarTop('[data-top=vistos]', r.top_vistos.map((t) => [t.perfume, t.veces]), 'Nadie ha abierto fichas todavía.');
  pintarTop('[data-top=pedidos]', r.top_whatsapp.map((t) => [t.perfume, t.veces]), 'Todavía no hay perfumes agregados al pedido.');
  pintarTop('[data-top=busquedas]', r.top_busquedas.map((t) => [t.texto, t.veces]), 'Aún no hay búsquedas.');
  $('[data-actualizado]').textContent = `Actualizado ${new Date().toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

function pintarTop(sel: string, filas: [string, number][], vacio: string) {
  const lista = $(sel);
  lista.replaceChildren();
  if (!filas.length) { lista.append(el('li', 'top__vacio', vacio)); return; }
  const max = Math.max(...filas.map((f) => f[1]));
  for (const [texto, veces] of filas) {
    const li = el('li', 'top__fila');
    const barra = el('span', 'top__barra');
    barra.style.setProperty('--p', String(veces / max));
    li.append(barra, el('span', 'top__texto', texto), el('span', 'top__veces', numero(veces)));
    lista.append(li);
  }
}

const SVG = 'http://www.w3.org/2000/svg';
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) {
  const n = document.createElementNS(SVG, tag);
  for (const [a, v] of Object.entries(attrs)) n.setAttribute(a, String(v));
  return n;
}

// Visitas como área y clics a WhatsApp como barras, un punto por día (los días sin datos cuentan como 0)
function pintarGrafica(porDia: Resumen['por_dia']) {
  const caja = $('[data-grafica]');
  const mapa = new Map(porDia.map((d) => [d.dia, d]));
  const serie = Array.from({ length: dias }, (_, i) => {
    const fecha = new Date(Date.now() - (dias - 1 - i) * 86_400_000);
    const d = mapa.get(diaCaracas(fecha));
    return { fecha, visitas: d?.visitas ?? 0, whatsapp: d?.whatsapp ?? 0 };
  });
  // El ancho sigue a la tarjeta para que las letras del eje no se encojan en el teléfono
  const W = Math.max(300, caja.clientWidth || 720), H = W < 500 ? 200 : 240, pad = { t: 16, r: 8, b: 28, l: 32 };
  const max = Math.max(4, ...serie.map((s) => Math.max(s.visitas, s.whatsapp)));
  const x = (i: number) => pad.l + (serie.length === 1 ? 0 : (i / (serie.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.t - pad.b);

  const g = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Visitas y pedidos por WhatsApp de los últimos ${dias} días` });
  const defs = svg('defs', {});
  const grad = svg('linearGradient', { id: 'relleno', x1: 0, y1: 0, x2: 0, y2: 1 });
  grad.append(svg('stop', { offset: '0%', 'stop-color': '#c9a55c', 'stop-opacity': 0.45 }), svg('stop', { offset: '100%', 'stop-color': '#c9a55c', 'stop-opacity': 0 }));
  defs.append(grad); g.append(defs);

  for (let k = 0; k <= 4; k++) {
    const v = Math.round((max / 4) * k);
    g.append(svg('line', { x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v), class: 'grafica__guia' }));
    const t = svg('text', { x: pad.l - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'grafica__eje' }); t.textContent = String(v); g.append(t);
  }
  const ancho = Math.max(3, Math.min(14, ((W - pad.l - pad.r) / serie.length) * 0.4));
  serie.forEach((s, i) => {
    if (s.whatsapp) g.append(svg('rect', { x: x(i) - ancho / 2, y: y(s.whatsapp), width: ancho, height: y(0) - y(s.whatsapp), rx: Math.min(3, ancho / 2), class: 'grafica__barra' }));
  });
  const puntos = serie.map((s, i) => `${x(i)},${y(s.visitas)}`);
  g.append(svg('path', { d: `M${pad.l},${y(0)} L${puntos.join(' L')} L${x(serie.length - 1)},${y(0)} Z`, fill: 'url(#relleno)' }));
  g.append(svg('path', { d: `M${puntos.join(' L')}`, class: 'grafica__linea' }));

  const cada = Math.ceil(serie.length / (W < 500 ? 4 : 7));
  serie.forEach((s, i) => {
    if (i % cada && i !== serie.length - 1) return;
    const t = svg('text', { x: x(i), y: H - 8, 'text-anchor': 'middle', class: 'grafica__eje' });
    t.textContent = s.fecha.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', timeZone: 'America/Caracas' });
    g.append(t);
  });
  caja.replaceChildren(g);
}

// ---------- Perfumes ----------
let perfumes: PerfumeCatalogo[] = [];
let mostrados = 30;
const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const slugDe = (t: string) => sinAcentos(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

async function cargarPerfumes() {
  const zona = $('[data-perfumes]');
  zona.dataset.estado = 'cargando';
  const { data, error } = await sb.from('perfumes')
    .select('id,slug,nombre,categoria,precio_usd,familia,notas,estado,destacado,foto_url')
    .order('destacado', { ascending: false }).order('nombre');
  if (error) { zona.dataset.estado = 'error'; return; }
  perfumes = data as PerfumeCatalogo[];
  zona.dataset.estado = 'listo';
  contarEstados();
  pintarPerfumes();
}

function contarEstados() {
  const c = { disponible: 0, encargo: 0, agotado: 0 };
  perfumes.forEach((p) => c[p.estado]++);
  $('[data-cuenta=total]').textContent = numero(perfumes.length);
  (Object.keys(c) as Estado[]).forEach((e) => { $(`[data-cuenta=${e}]`).textContent = numero(c[e]); });
}

function filtrados() {
  const q = sinAcentos($<HTMLInputElement>('[data-p-buscar]').value.trim()).split(/\s+/).filter(Boolean);
  const est = $<HTMLSelectElement>('[data-p-estado]').value;
  return perfumes.filter((p) => (est === 'todos' || p.estado === est) && q.every((w) => sinAcentos(p.nombre).includes(w)));
}

function pintarPerfumes() {
  const lista = $('[data-p-lista]');
  const todos = filtrados();
  lista.replaceChildren(...todos.slice(0, mostrados).map(fila));
  $('[data-p-total]').textContent = `${numero(Math.min(mostrados, todos.length))} de ${numero(todos.length)}`;
  $('[data-p-vacio]').hidden = todos.length > 0;
  $('[data-p-mas]').hidden = todos.length <= mostrados;
}

function miniatura(p: PerfumeCatalogo) {
  const caja = el('span', 'p-foto');
  if (p.foto_url) {
    const img = el('img'); img.src = p.foto_url; img.alt = ''; img.width = 56; img.height = 56; img.loading = 'lazy';
    caja.append(img);
  } else caja.append(el('span', 'p-foto__marca', p.nombre.slice(0, 1)));
  return caja;
}

function fila(p: PerfumeCatalogo) {
  const li = el('li', 'p-fila');
  const id = `p-${p.id}`;

  const info = el('div', 'p-fila__info');
  info.append(el('span', 'p-fila__nombre', p.nombre), el('span', 'p-fila__meta', [p.categoria, p.familia].filter(Boolean).join(' · ')));

  const precio = el('input', 'campo campo--precio');
  Object.assign(precio, { type: 'number', min: '1', max: '9999', step: '0.5', value: String(p.precio_usd), id: `${id}-precio` });
  precio.setAttribute('aria-label', `Precio en dólares de ${p.nombre}`);

  const estado = el('select', 'campo campo--estado');
  estado.setAttribute('aria-label', `Estado de ${p.nombre}`);
  (Object.keys(ESTADOS) as Estado[]).forEach((e) => {
    const o = el('option', undefined, e === 'encargo' ? 'Por encargo' : ESTADOS[e]); o.value = e; o.selected = e === p.estado; estado.append(o);
  });
  estado.dataset.valor = p.estado;

  const destacado = el('label', 'p-destacado');
  const check = el('input'); check.type = 'checkbox'; check.checked = p.destacado;
  destacado.append(check, el('span', undefined, 'Destacado'));

  const foto = el('label', 'boton-vidrio boton-vidrio--chico');
  const archivo = el('input', 'visualmente-oculto'); archivo.type = 'file'; archivo.accept = 'image/jpeg,image/png,image/webp';
  foto.append(archivo, document.createTextNode(p.foto_url ? 'Cambiar foto' : 'Subir foto'));
  archivo.addEventListener('change', () => { if (archivo.files?.[0]) subirFoto(p, archivo.files[0], li); });

  const guardar = el('button', 'boton-oro boton-oro--chico', 'Guardar');
  guardar.type = 'button'; guardar.disabled = true;

  const cambio = () => {
    const sucio = Number(precio.value) !== Number(p.precio_usd) || estado.value !== p.estado || check.checked !== p.destacado;
    guardar.disabled = !sucio; li.classList.toggle('p-fila--sucia', sucio);
    estado.dataset.valor = estado.value;
  };
  precio.addEventListener('input', cambio); estado.addEventListener('change', cambio); check.addEventListener('change', cambio);
  guardar.addEventListener('click', () => guardarFila(p, { precio_usd: Number(precio.value), estado: estado.value as Estado, destacado: check.checked }, guardar, li));

  const acciones = el('div', 'p-fila__acciones');
  acciones.append(destacado, foto, guardar);
  li.append(miniatura(p), info, precio, estado, acciones);
  return li;
}

function precioValido(n: number) { return Number.isFinite(n) && n > 0 && n < 10000; }

async function guardarFila(p: PerfumeCatalogo, cambios: Pick<PerfumeCatalogo, 'precio_usd' | 'estado' | 'destacado'>, boton: HTMLButtonElement, li: HTMLElement) {
  if (!precioValido(cambios.precio_usd)) { aviso('El precio debe estar entre $1 y $9.999.', 'error'); return; }
  boton.disabled = true; boton.textContent = 'Guardando…';
  const { data, error } = await sb.from('perfumes').update(cambios).eq('id', p.id).select('id');
  boton.textContent = 'Guardar';
  // Sin error pero sin filas: la regla RLS no dejó cambiarlo (cuenta sin permiso de socio)
  if (error || !data?.length) { boton.disabled = false; aviso('No se pudo guardar. Revisa tu conexión o tu acceso.', 'error'); return; }
  Object.assign(p, cambios);
  li.classList.remove('p-fila--sucia');
  contarEstados();
  aviso(`${p.nombre}: guardado.`);
}

const TIPOS_FOTO: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
async function subirFoto(p: PerfumeCatalogo, archivo: File, li: HTMLElement) {
  const ext = TIPOS_FOTO[archivo.type];
  if (!ext) { aviso('La foto debe ser JPG, PNG o WEBP.', 'error'); return; }
  if (archivo.size > 3 * 1024 * 1024) { aviso('La foto pesa más de 3 MB. Redúcela y vuelve a subirla.', 'error'); return; }
  aviso('Subiendo foto…');
  const ruta = `perfumes/${p.slug}-${Date.now()}.${ext}`;
  const subida = await sb.storage.from('fotos').upload(ruta, archivo, { contentType: archivo.type, cacheControl: '31536000' });
  if (subida.error) { aviso('No se pudo subir la foto. Intenta de nuevo.', 'error'); return; }
  const foto_url = sb.storage.from('fotos').getPublicUrl(ruta).data.publicUrl;
  const { data, error } = await sb.from('perfumes').update({ foto_url }).eq('id', p.id).select('id');
  if (error || !data?.length) { aviso('La foto subió, pero no se pudo poner en el perfume.', 'error'); return; }
  p.foto_url = foto_url;
  li.replaceWith(fila(p));
  aviso(`${p.nombre}: foto lista. Ya se ve en la tienda.`);
}

// ---------- Nuevo perfume ----------
function prepararNuevo() {
  const dialogo = $<HTMLDialogElement>('[data-nuevo]');
  const form = $<HTMLFormElement>('[data-form-nuevo]');
  const error = $('[data-nuevo-error]');
  $('[data-abrir-nuevo]').addEventListener('click', () => { form.reset(); error.textContent = ''; dialogo.showModal(); });
  $('[data-cerrar-nuevo]').addEventListener('click', () => dialogo.close());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const nombre = String(d.get('nombre') ?? '').trim().replace(/\s+/g, ' ');
    const precio_usd = Number(d.get('precio'));
    const slug = slugDe(nombre);
    if (nombre.length < 2 || nombre.length > 160) { error.textContent = 'El nombre debe tener entre 2 y 160 letras.'; return; }
    if (!precioValido(precio_usd)) { error.textContent = 'El precio debe estar entre $1 y $9.999.'; return; }
    if (perfumes.some((p) => p.slug === slug)) { error.textContent = 'Ese perfume ya está en el catálogo.'; return; }

    const nuevo = {
      slug, nombre, precio_usd,
      categoria: String(d.get('categoria')),
      familia: String(d.get('familia') ?? '').trim().slice(0, 80) || null,
      notas: String(d.get('notas') ?? '').trim().slice(0, 300) || null,
      estado: String(d.get('estado')) as Estado,
      destacado: d.get('destacado') === 'on',
    };
    const boton = form.querySelector<HTMLButtonElement>('[type=submit]')!;
    boton.disabled = true;
    const { data, error: fallo } = await sb.from('perfumes').insert(nuevo)
      .select('id,slug,nombre,categoria,precio_usd,familia,notas,estado,destacado,foto_url').single();
    boton.disabled = false;
    if (fallo) {
      error.textContent = fallo.code === '23505' ? 'Ese perfume ya está en el catálogo.' : 'No se pudo guardar. Revisa los datos y tu acceso.';
      return;
    }
    perfumes.unshift(data as PerfumeCatalogo);
    dialogo.close();
    contarEstados(); pintarPerfumes();
    aviso(`${nombre}: agregado al catálogo.`);
  });
}

// ---------- Logins ----------
// Crear y cambiar cuentas necesita la clave secreta: lo hace la función socios-logins en el servidor de Supabase,
// que revisa que quien la llama sea socio. Aquí solo se piden los cambios.
interface Login { id: string; nombre: string; correo: string; creado: string | null; ultimo_ingreso: string | null; activo: boolean; soy_yo: boolean }

class FalloLogins extends Error {}
async function pedirLogins(cuerpo: Record<string, unknown>): Promise<Login[]> {
  const { data, error } = await sb.functions.invoke('socios-logins', { body: cuerpo });
  if (error) {
    // La función responde { error: 'mensaje en español' }; si no se puede leer, mensaje general
    const respuesta = (error as { context?: unknown }).context;
    let mensaje = 'No se pudo conectar. Revisa tu conexión.';
    if (respuesta instanceof Response) {
      const json = await respuesta.json().catch((e: unknown) => { if (e instanceof SyntaxError) return null; throw e; });
      if (typeof json?.error === 'string') mensaje = json.error;
    }
    throw new FalloLogins(mensaje);
  }
  return (data as { logins: Login[] }).logins;
}

const fechaCorta = (iso: string | null) => iso
  ? new Date(iso).toLocaleString('es-VE', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Caracas' })
  : 'nunca';

async function cargarLogins() {
  const zona = $('[data-logins]');
  zona.dataset.estado = 'cargando';
  try {
    pintarLogins(await pedirLogins({ accion: 'listar' }));
    zona.dataset.estado = 'listo';
  } catch (error) {
    if (!(error instanceof FalloLogins)) throw error;
    $('[data-logins-error]').textContent = error.message;
    zona.dataset.estado = 'error';
  }
}

function pintarLogins(logins: Login[]) {
  $('[data-l-lista]').replaceChildren(...logins.map(filaLogin));
}

function filaLogin(l: Login) {
  const li = el('li', `vidrio l-fila${l.activo ? '' : ' l-fila--pausada'}`);
  const nombre = el('span', 'l-nombre', l.nombre);
  if (l.soy_yo) nombre.append(el('span', 'l-chip l-chip--yo', 'Tú'));
  nombre.append(el('span', l.activo ? 'l-chip' : 'l-chip l-chip--pausado', l.activo ? 'Activo' : 'Pausado'));
  const info = el('div', 'l-info');
  info.append(nombre, el('span', 'l-correo', l.correo), el('span', 'l-meta', `Último ingreso: ${fechaCorta(l.ultimo_ingreso)}`));

  const acciones = el('div', 'l-acciones');
  const boton = (texto: string, clase = '') => {
    const b = el('button', `boton-vidrio boton-vidrio--chico ${clase}`.trim(), texto); b.type = 'button'; acciones.append(b); return b;
  };
  boton('Cambiar contraseña').addEventListener('click', () => abrirLogin('clave', l));
  boton('Cambiar nombre').addEventListener('click', () => abrirLogin('nombre', l));
  if (!l.soy_yo) {
    const pausar = boton(l.activo ? 'Pausar' : 'Activar');
    pausar.addEventListener('click', () =>
      accionLogin(pausar, { accion: 'cambiar', id: l.id, activo: !l.activo }, l.activo ? `${l.nombre}: pausado.` : `${l.nombre}: activo otra vez.`));
    const borrar = boton('Borrar', 'boton-peligro');
    borrar.addEventListener('click', () => {
      if (!confirm(`¿Borrar el login de ${l.nombre} (${l.correo})? Ya no podrá entrar al panel. Esto no se puede deshacer.`)) return;
      accionLogin(borrar, { accion: 'borrar', id: l.id }, `${l.nombre}: login borrado.`);
    });
  }
  li.append(el('span', 'l-avatar', l.nombre.slice(0, 1).toUpperCase()), info, acciones);
  return li;
}

async function accionLogin(boton: HTMLButtonElement, cuerpo: Record<string, unknown>, listo: string) {
  boton.disabled = true;
  try {
    pintarLogins(await pedirLogins(cuerpo));
    aviso(listo);
  } catch (error) {
    if (!(error instanceof FalloLogins)) throw error;
    boton.disabled = false;
    aviso(error.message, 'error');
  }
}

// Un mismo formulario para agregar, cambiar contraseña o cambiar nombre
type ModoLogin = 'nuevo' | 'clave' | 'nombre';
let editando: { modo: ModoLogin; login?: Login } = { modo: 'nuevo' };
function abrirLogin(modo: ModoLogin, login?: Login) {
  editando = { modo, login };
  const form = $<HTMLFormElement>('[data-form-login]');
  form.reset();
  $('[data-login-error]').textContent = '';
  const titulos: Record<ModoLogin, string> = { nuevo: 'Agregar login', clave: `Nueva contraseña para ${login?.nombre}`, nombre: `Cambiar nombre de ${login?.correo}` };
  $('[data-login-titulo]').textContent = titulos[modo];
  $('[data-login-guardar]').textContent = modo === 'nuevo' ? 'Agregar' : 'Guardar';
  const ver = { nombre: modo !== 'clave', correo: modo === 'nuevo', clave: modo !== 'nombre' };
  (Object.keys(ver) as (keyof typeof ver)[]).forEach((c) => { $(`[data-login-campo=${c}]`).hidden = !ver[c]; });
  if (modo === 'nombre' && login) form.querySelector<HTMLInputElement>('[name=nombre]')!.value = login.nombre;
  $<HTMLDialogElement>('[data-login-dialogo]').showModal();
}

function prepararLogins() {
  const dialogo = $<HTMLDialogElement>('[data-login-dialogo]');
  const form = $<HTMLFormElement>('[data-form-login]');
  const error = $('[data-login-error]');
  $('[data-abrir-login]').addEventListener('click', () => abrirLogin('nuevo'));
  $('[data-cerrar-login]').addEventListener('click', () => dialogo.close());
  $('[data-logins-reintentar]').addEventListener('click', cargarLogins);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const nombre = String(d.get('nombre') ?? '').trim().replace(/\s+/g, ' ');
    const correo = String(d.get('correo') ?? '').trim().toLowerCase();
    const clave = String(d.get('clave') ?? '');
    const { modo, login } = editando;
    if (modo !== 'clave' && (nombre.length < 2 || nombre.length > 60)) { error.textContent = 'El nombre debe tener entre 2 y 60 letras.'; return; }
    if (modo === 'nuevo' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { error.textContent = 'Escribe un correo válido.'; return; }
    if (modo !== 'nombre' && (clave.length < 8 || clave.length > 72)) { error.textContent = 'La contraseña debe tener entre 8 y 72 caracteres.'; return; }

    const cuerpo = modo === 'nuevo' ? { accion: 'crear', nombre, correo, clave }
      : modo === 'clave' ? { accion: 'cambiar', id: login!.id, clave }
      : { accion: 'cambiar', id: login!.id, nombre };
    const boton = $<HTMLButtonElement>('[data-login-guardar]');
    boton.disabled = true;
    try {
      pintarLogins(await pedirLogins(cuerpo));
      dialogo.close();
      aviso(modo === 'nuevo' ? `${nombre} ya puede entrar con ${correo}.` : modo === 'clave' ? 'Contraseña cambiada.' : 'Nombre cambiado.');
      if (modo === 'nombre' && login?.soy_yo) $('[data-hola]').textContent = `Hola, ${nombre.split(' ')[0]}`;
    } catch (fallo) {
      if (!(fallo instanceof FalloLogins)) throw fallo;
      error.textContent = fallo.message;
    } finally {
      boton.disabled = false;
    }
  });
}

// ---------- Arranque ----------
export function iniciarPanel() {
  prepararEntrada();
  prepararNuevo();
  prepararLogins();
  document.querySelectorAll<HTMLAnchorElement>('[data-ir]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault(); irA(a.dataset.ir as Vista);
  }));
  document.querySelectorAll('[data-salir]').forEach((b) => b.addEventListener('click', salir));
  document.querySelectorAll<HTMLButtonElement>('[data-dias]').forEach((b) => b.addEventListener('click', () => {
    dias = Number(b.dataset.dias);
    document.querySelectorAll('[data-dias]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    cargarResumen();
  }));
  $('[data-resumen-reintentar]').addEventListener('click', cargarResumen);
  $('[data-p-reintentar]').addEventListener('click', cargarPerfumes);
  $('[data-p-buscar]').addEventListener('input', () => { mostrados = 30; pintarPerfumes(); });
  $('[data-p-estado]').addEventListener('change', () => { mostrados = 30; pintarPerfumes(); });
  $('[data-p-mas]').addEventListener('click', () => { mostrados += 30; pintarPerfumes(); });

  // onAuthStateChange avisa al cargar (sesión guardada o ninguna) y cada vez que se entra o sale
  sb.auth.onAuthStateChange((_evento, sesion) => { setTimeout(() => alCambiarSesion(sesion), 0); });
}
