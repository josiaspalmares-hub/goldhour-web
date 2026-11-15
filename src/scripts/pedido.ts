// Pedido en localStorage (no va a ningún servidor)

export interface Linea {
  clave: string; // id del perfume + tamaño, ej. "ventana:5ml"
  id: string;
  nombre: string;
  casa: string;
  tamano: string;
  precio: number;
  cantidad: number;
  // Tamaños del decant
  opciones?: { tamano: string; precio: number }[];
}

const LLAVE = 'goldhour-pedido';
const EVENTO = 'pedido:cambio';

function leerGuardado(): Linea[] {
  let crudo: string | null;
  try {
    crudo = localStorage.getItem(LLAVE);
  } catch (error) {
    // Sin almacenamiento: solo esta visita
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

  // Cambiar tamaño; si ya existe esa línea, se juntan
  cambiarTamano(clave: string, tamano: string) {
    const linea = lineas.find((l) => l.clave === clave);
    const opcion = linea?.opciones?.find((o) => o.tamano === tamano);
    if (!linea || !opcion) throw new Error(`No se puede cambiar ${clave} a ${tamano}`);
    const nuevaClave = `${linea.id}:${tamano}`;
    const otra = lineas.find((l) => l.clave === nuevaClave && l !== linea);
    if (otra) {
      otra.cantidad = Math.min(otra.cantidad + linea.cantidad, 20);
      lineas = lineas.filter((l) => l !== linea);
    } else {
      Object.assign(linea, { clave: nuevaClave, tamano, precio: opcion.precio });
    }
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
