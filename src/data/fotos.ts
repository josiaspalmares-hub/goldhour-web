import type { ImageMetadata } from 'astro';

// Todas las fotos recortadas de src/assets/perfumes, buscadas por el id del perfume.
const archivos = import.meta.glob<{ default: ImageMetadata }>('../assets/perfumes/*.png', { eager: true });

export function fotoDe(id: string): ImageMetadata {
  const archivo = archivos[`../assets/perfumes/${id}.png`];
  if (!archivo) throw new Error(`Falta la foto src/assets/perfumes/${id}.png`);
  return archivo.default;
}
