// Pedido del cliente: vive en el navegador de quien lo arma (no se envía a ningún servidor).
// Se guarda en localStorage para no perderlo si recarga la página.

export interface Linea {
  clave: string; // id del perfume + tamaño, ej. "ventana:5ml"
  id: string;
  nombre: string;
  casa: string;
  tamano: string;
  precio: number;
  cantidad: number;
}

const LLAVE = 'goldhour-pedido';
const EVENTO = 'pedido:cambio';

function leerGuardado(): Linea[] {
  let crudo: string | null;
  try {
    crudo = localStorage.getItem(LLAVE);
  } catch (error) {
    // Navegador en modo privado o con el almacenamiento bloqueado: el pedido vive solo en esta visita.
    console.warn('No se pudo leer el pedido guardado', error);
    return [];
  }
  if (!crudo) return [];
  try {
    const datos: unknown = JSON.parse(crudo);
    return Array.isArray(datos) ? (datos as Linea[]) : [];
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    console.warn('Pedido guardado dañado; se empieza uno nuevo', error);
    return [];
  }
}

let lineas: Linea[] = leerGuardado();

function guardar() {
  try {
    localStorage.setItem(LLAVE, JSON.stringify(lineas));
  } catch (error) {
    console.warn('No se pudo guardar el pedido', error);
  }
  window.dispatchEvent(new CustomEvent(EVENTO));
}

export const pedido = {
  lineas: () => lineas,
  unidades: () => lineas.reduce((t, l) => t + l.cantidad, 0),
  totalUsd: () => lineas.reduce((t, l) => t + l.precio * l.cantidad, 0),

  agregar(linea: Omit<Linea, 'clave' | 'cantidad'>) {
    const clave = `${linea.id}:${linea.tamano}`;
    const existente = lineas.find((l) => l.clave === clave);
    if (existente) existente.cantidad += 1;
    else lineas.push({ ...linea, clave, cantidad: 1 });
    guardar();
  },

  cambiarCantidad(clave: string, cantidad: number) {
    if (cantidad <= 0) lineas = lineas.filter((l) => l.clave !== clave);
    else {
      const linea = lineas.find((l) => l.clave === clave);
      if (linea) linea.cantidad = Math.min(cantidad, 20);
    }
    guardar();
  },

  vaciar() {
    lineas = [];
    guardar();
  },

  alCambiar(fn: () => void) {
    window.addEventListener(EVENTO, fn);
  },
};
