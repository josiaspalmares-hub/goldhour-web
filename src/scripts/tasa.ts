// Tasa euro oficial del BCV del día, desde la misma fuente que usa la hoja de precios de Goldhour.
const FUENTE = 'https://ve.dolarapi.com/v1/euros/oficial';

export interface Tasa {
  valor: number; // bolívares por euro
  fecha: Date;
}

export class TasaNoDisponible extends Error {}

export async function obtenerTasaEuro(): Promise<Tasa> {
  let respuesta: Response;
  try {
    respuesta = await fetch(FUENTE, { signal: AbortSignal.timeout(8000), cache: 'no-store' });
  } catch (error) {
    throw new TasaNoDisponible('No se pudo conectar con la fuente de la tasa', { cause: error });
  }
  if (!respuesta.ok) throw new TasaNoDisponible(`La fuente de la tasa respondió ${respuesta.status}`);

  const datos: { promedio?: unknown; fechaActualizacion?: unknown } = await respuesta.json();
  const valor = Number(datos.promedio);
  // Un valor fuera de rango es un error de la fuente, no una tasa: mejor no cobrar con él.
  if (!Number.isFinite(valor) || valor <= 0 || valor > 1_000_000) {
    throw new TasaNoDisponible(`Tasa recibida no válida: ${String(datos.promedio)}`);
  }
  const fecha = new Date(String(datos.fechaActualizacion));
  return { valor, fecha: Number.isNaN(fecha.getTime()) ? new Date() : fecha };
}

export const formatoBs = (monto: number) =>
  'Bs ' + monto.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatoUsd = (monto: number) =>
  '$' + monto.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
