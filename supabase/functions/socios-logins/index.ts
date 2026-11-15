// Logins del panel. En el servidor porque necesita service_role, que nunca va al navegador. Solo para socios.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const ORIGENES = [
  'https://goldhourparfums.vercel.app',
  'https://goldhourparfums.com',
  'https://www.goldhourparfums.com',
  'http://localhost:4321',
];

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

class ErrorVisible extends Error {
  constructor(mensaje: string, public estado = 400) { super(mensaje); }
}

// 30 acciones cada 10 min por socio (por instancia)
const usos = new Map<string, number[]>();
function frenar(id: string) {
  const ahora = Date.now();
  const recientes = (usos.get(id) ?? []).filter((t) => ahora - t < 600_000);
  if (recientes.length >= 30) throw new ErrorVisible('Demasiados cambios seguidos. Espera unos minutos.', 429);
  recientes.push(ahora);
  usos.set(id, recientes);
}

const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
function correoValido(v: unknown) {
  const c = texto(v).toLowerCase();
  if (c.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) throw new ErrorVisible('Escribe un correo válido.');
  return c;
}
function claveValida(v: unknown) {
  const c = typeof v === 'string' ? v : '';
  if (c.length < 8 || c.length > 72) throw new ErrorVisible('La contraseña debe tener entre 8 y 72 caracteres.');
  return c;
}
function nombreValido(v: unknown) {
  const n = texto(v).replace(/\s+/g, ' ');
  if (n.length < 2 || n.length > 60) throw new ErrorVisible('El nombre debe tener entre 2 y 60 letras.');
  return n;
}
function idValido(v: unknown) {
  const id = texto(v);
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new ErrorVisible('Login no encontrado.', 404);
  return id;
}

async function quienLlama(req: Request) {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new ErrorVisible('Tu sesión venció. Vuelve a entrar.', 401);
  const { data: socio } = await admin.from('socios').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (!socio) throw new ErrorVisible('Tu cuenta no tiene acceso de socio.', 403);
  return data.user.id;
}

async function esSocio(id: string) {
  const { data, error } = await admin.from('socios').select('user_id').eq('user_id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ErrorVisible('Login no encontrado.', 404);
}

async function listar(yo: string) {
  const { data: socios, error } = await admin.from('socios').select('user_id, nombre');
  if (error) throw error;
  const { data, error: e2 } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (e2) throw e2;
  const usuarios = new Map(data.users.map((u) => [u.id, u]));
  return socios.map((s) => {
    const u = usuarios.get(s.user_id);
    const pausado = !!u?.banned_until && new Date(u.banned_until) > new Date();
    return {
      id: s.user_id, nombre: s.nombre, correo: u?.email ?? '',
      creado: u?.created_at ?? null, ultimo_ingreso: u?.last_sign_in_at ?? null,
      activo: !pausado, soy_yo: s.user_id === yo,
    };
  }).sort((a, b) => Number(b.soy_yo) - Number(a.soy_yo) || a.nombre.localeCompare(b.nombre));
}

async function crear(cuerpo: Record<string, unknown>) {
  const correo = correoValido(cuerpo.correo), clave = claveValida(cuerpo.clave), nombre = nombreValido(cuerpo.nombre);
  const { data, error } = await admin.auth.admin.createUser({ email: correo, password: clave, email_confirm: true });
  if (error) {
    if ((error as { code?: string }).code === 'email_exists' || /already/i.test(error.message)) {
      throw new ErrorVisible('Ese correo ya tiene una cuenta.', 409);
    }
    if ((error as { code?: string }).code === 'weak_password') throw new ErrorVisible('Esa contraseña es muy débil. Usa una más larga.');
    throw error;
  }
  const { error: e2 } = await admin.from('socios').insert({ user_id: data.user.id, nombre });
  if (e2) { await admin.auth.admin.deleteUser(data.user.id); throw e2; }
}

async function cambiar(yo: string, cuerpo: Record<string, unknown>) {
  const id = idValido(cuerpo.id);
  await esSocio(id);
  const datos: { password?: string; ban_duration?: string } = {};
  if (cuerpo.clave !== undefined) datos.password = claveValida(cuerpo.clave);
  if (cuerpo.activo !== undefined) {
    if (id === yo) throw new ErrorVisible('No puedes pausar tu propio acceso.');
    datos.ban_duration = cuerpo.activo ? 'none' : '876000h';
  }
  if (Object.keys(datos).length) {
    const { error } = await admin.auth.admin.updateUserById(id, datos);
    if (error) {
      if ((error as { code?: string }).code === 'weak_password') throw new ErrorVisible('Esa contraseña es muy débil. Usa una más larga.');
      throw error;
    }
  }
  if (cuerpo.nombre !== undefined) {
    const { error } = await admin.from('socios').update({ nombre: nombreValido(cuerpo.nombre) }).eq('user_id', id);
    if (error) throw error;
  }
}

async function borrar(yo: string, cuerpo: Record<string, unknown>) {
  const id = idValido(cuerpo.id);
  if (id === yo) throw new ErrorVisible('No puedes borrar tu propio acceso.');
  await esSocio(id);
  const { error } = await admin.auth.admin.deleteUser(id); // ON DELETE CASCADE
  if (error) throw error;
}

Deno.serve(async (req) => {
  const origen = req.headers.get('Origin') ?? '';
  const cors = {
    'Access-Control-Allow-Origin': ORIGENES.includes(origen) ? origen : ORIGENES[0],
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  const responder = (cuerpo: unknown, estado = 200) =>
    new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return responder({ error: 'Método no permitido.' }, 405);
  if (origen && !ORIGENES.includes(origen)) return responder({ error: 'Origen no permitido.' }, 403);

  try {
    const yo = await quienLlama(req);
    const cuerpo = await req.json().catch(() => { throw new ErrorVisible('Datos no válidos.'); });
    if (typeof cuerpo !== 'object' || cuerpo === null) throw new ErrorVisible('Datos no válidos.');
    if (cuerpo.accion !== 'listar') frenar(yo);
    switch (cuerpo.accion) {
      case 'listar': return responder({ logins: await listar(yo) });
      case 'crear': await crear(cuerpo); break;
      case 'cambiar': await cambiar(yo, cuerpo); break;
      case 'borrar': await borrar(yo, cuerpo); break;
      default: throw new ErrorVisible('Acción no válida.');
    }
    return responder({ logins: await listar(yo) });
  } catch (error) {
    if (error instanceof ErrorVisible) return responder({ error: error.message }, error.estado);
    console.error(error); // solo en los registros
    return responder({ error: 'No se pudo completar. Intenta de nuevo.' }, 500);
  }
});
