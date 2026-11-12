// Comportamiento compartido de la tienda: abrir fichas, agregar al pedido y el contador del menú.
import { pedido } from './pedido';

const fichaPorId = (id: string) => document.querySelector<HTMLDialogElement>(`#ficha-${CSS.escape(id)}`);

function abrirFicha(id: string) {
  const ficha = fichaPorId(id);
  if (ficha && !ficha.open) ficha.showModal();
}

// Botones "Ver ficha" y foto de cada perfume.
document.addEventListener('click', (e) => {
  const objetivo = e.target as HTMLElement;

  const abrir = objetivo.closest<HTMLElement>('[data-abrir-ficha]');
  if (abrir?.dataset.abrirFicha) {
    e.preventDefault();
    abrirFicha(abrir.dataset.abrirFicha);
    return;
  }

  if (objetivo.closest('[data-cerrar-ficha]')) {
    objetivo.closest('dialog')?.close();
    return;
  }

  // Tocar fuera de la caja cierra la ficha.
  if (objetivo instanceof HTMLDialogElement && objetivo.open) objetivo.close();

  const agregar = objetivo.closest<HTMLButtonElement>('[data-agregar]');
  if (agregar) agregarDesde(agregar);
});

// Los enlaces #id (por ejemplo, "Ver ficha" de la portada) abren la ficha de ese perfume.
function abrirDesdeHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id && fichaPorId(id)) abrirFicha(id);
}
window.addEventListener('hashchange', abrirDesdeHash);
abrirDesdeHash();

function agregarDesde(boton: HTMLButtonElement) {
  const { id, nombre, casa } = boton.dataset;
  // El tamaño sale del selector de la tarjeta (decants) o del propio botón (frascos).
  const radios = [...(boton.closest('[data-producto]')?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? [])];
  const selector = radios.find((r) => r.checked);
  const tamano = selector?.value ?? boton.dataset.tamano;
  const precio = Number(selector?.dataset.precio ?? boton.dataset.precio);
  if (!id || !nombre || !casa || !tamano || !Number.isFinite(precio) || precio <= 0) {
    throw new Error(`Botón de agregar sin datos completos (${id ?? 'sin id'})`);
  }
  const opciones = radios.length > 1 ? radios.map((r) => ({ tamano: r.value, precio: Number(r.dataset.precio) })) : undefined;
  pedido.agregar({ id, nombre, casa, tamano, precio, opciones });

  const texto = boton.querySelector('[data-texto]') ?? boton;
  const original = boton.dataset.textoOriginal ?? texto.textContent ?? '';
  boton.dataset.textoOriginal = original;
  texto.textContent = 'Agregado al pedido';
  boton.classList.add('agregado');
  window.setTimeout(() => {
    texto.textContent = original;
    boton.classList.remove('agregado');
  }, 1600);
}

// Al elegir un tamaño (5 ml, 10 ml o frasco) se avisa a la tarjeta o ficha que lo contiene,
// para que muestre el frasquito de ese tamaño junto al perfume.
document.addEventListener('change', (e) => {
  const opcion = e.target as HTMLInputElement;
  if (opcion.type !== 'radio') return;
  const contenedor = opcion.closest<HTMLElement>('[data-elegido]');
  if (contenedor) contenedor.dataset.elegido = opcion.value;
});

function pintarContador() {
  const unidades = String(pedido.unidades());
  document.querySelectorAll('[data-cuenta-pedido]').forEach((n) => (n.textContent = unidades));
}
pedido.alCambiar(pintarContador);
pintarContador();
