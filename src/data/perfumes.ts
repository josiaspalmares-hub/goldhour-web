// Catálogo de la web. Para agregar un perfume: copia un bloque, cambia los datos y pon su foto
// recortada (PNG con fondo transparente, mínimo 1.200 px de alto) en src/assets/perfumes/<id>.png.
// Precios en dólares, sacados de "Catalogo Perfumes $.xlsx" (PRECIO FINAL A VENDER).

export type Nivel = 1 | 2 | 3 | 4 | 5;

export interface Ficha {
  familia: string;
  salida: string[];
  corazon: string[];
  fondo: string[];
  duracion: string;
  duracionNivel: Nivel;
  proyeccion: string;
  proyeccionNivel: Nivel;
  ocasion: string[];
}

export interface Tamano {
  id: string;
  etiqueta: string;
  precio: number;
}

// Perfil para "Encuentra tu perfume": cuán dulce, fresco y de noche es, de 0 a 10.
export interface Perfil {
  dulce: number;
  fresco: number;
  noche: number;
}

export interface Perfume {
  id: string;
  casa: string;
  nombre: string;
  concentracion: string;
  para: 'Él' | 'Ella' | 'Unisex';
  frase: string;
  ficha: Ficha;
  perfil: Perfil;
  tamanos: Tamano[];
}

const frasco = (ml: string, precio: number): Tamano[] => [{ id: 'frasco', etiqueta: ml, precio }];

const decant = (frascoMl: string, precioFrasco: number): Tamano[] => [
  { id: '5ml', etiqueta: '5 ml', precio: 6 },
  { id: '10ml', etiqueta: '10 ml', precio: 10 },
  { id: 'frasco', etiqueta: `Frasco ${frascoMl}`, precio: precioFrasco },
];

export const frascos: Perfume[] = [
  {
    id: 'asad', casa: 'Lattafa', nombre: 'Asad', concentracion: 'Eau de Parfum', para: 'Él',
    frase: 'El árabe que todos te preguntan.',
    ficha: {
      familia: 'Ambarado especiado',
      salida: ['Pimienta negra', 'Piña', 'Tabaco'], corazon: ['Café', 'Iris'], fondo: ['Vainilla', 'Ámbar'],
      duracion: '8–10 h', duracionNivel: 5, proyeccion: 'Fuerte', proyeccionNivel: 4,
      ocasion: ['Noche', 'Salidas', 'Clima fresco'],
    },
    perfil: { dulce: 7, fresco: 2, noche: 8 },
    tamanos: frasco('100 ml', 35),
  },
  {
    id: 'la-vie-est-belle', casa: 'Lancôme', nombre: 'La Vie Est Belle', concentracion: 'Eau de Parfum', para: 'Ella',
    frase: 'El femenino más vendido de los últimos años.',
    ficha: {
      familia: 'Gourmand floral',
      salida: ['Grosella negra', 'Pera'], corazon: ['Iris', 'Jazmín', 'Azahar'], fondo: ['Praliné', 'Vainilla'],
      duracion: '8–10 h', duracionNivel: 5, proyeccion: 'Fuerte', proyeccionNivel: 4,
      ocasion: ['Diario', 'Regalo', 'Noche'],
    },
    perfil: { dulce: 9, fresco: 2, noche: 6 },
    tamanos: frasco('100 ml', 140),
  },
  {
    id: 'good-girl', casa: 'Carolina Herrera', nombre: 'Good Girl', concentracion: 'Eau de Parfum', para: 'Ella',
    frase: 'El zapato más famoso de la perfumería.',
    ficha: {
      familia: 'Ambarado floral',
      salida: ['Almendra', 'Café'], corazon: ['Tuberosa', 'Jazmín'], fondo: ['Haba tonka', 'Cacao'],
      duracion: '6–8 h', duracionNivel: 4, proyeccion: 'Fuerte', proyeccionNivel: 4,
      ocasion: ['Noche', 'Citas', 'Eventos'],
    },
    perfil: { dulce: 8, fresco: 1, noche: 9 },
    tamanos: frasco('80 ml', 145),
  },
  {
    id: 'one-million', casa: 'Paco Rabanne', nombre: '1 Million', concentracion: 'Eau de Toilette', para: 'Él',
    frase: 'El clásico de la noche y la fiesta.',
    ficha: {
      familia: 'Ambarado especiado',
      salida: ['Toronja', 'Menta', 'Mandarina'], corazon: ['Rosa', 'Canela'], fondo: ['Cuero', 'Ámbar'],
      duracion: '6–8 h', duracionNivel: 4, proyeccion: 'Fuerte', proyeccionNivel: 4,
      ocasion: ['Noche', 'Fiesta'],
    },
    perfil: { dulce: 7, fresco: 3, noche: 9 },
    tamanos: frasco('100 ml', 105),
  },
  {
    id: 'khamrah-qahwa', casa: 'Lattafa', nombre: 'Khamrah Qahwa', concentracion: 'Eau de Parfum', para: 'Unisex',
    frase: 'Café con canela que te dura todo el día.',
    ficha: {
      familia: 'Gourmand',
      salida: ['Canela', 'Cardamomo', 'Jengibre'], corazon: ['Café', 'Praliné', 'Dátiles'], fondo: ['Vainilla', 'Haba tonka'],
      duracion: '8–10 h', duracionNivel: 5, proyeccion: 'Fuerte', proyeccionNivel: 4,
      ocasion: ['Noche', 'Citas', 'Lluvia'],
    },
    perfil: { dulce: 10, fresco: 0, noche: 8 },
    tamanos: frasco('100 ml', 45),
  },
  {
    id: 'hawas-tropical', casa: 'Rasasi', nombre: 'Hawas Tropical', concentracion: 'Eau de Parfum', para: 'Él',
    frase: 'Fresco, cremoso y con muy buena duración.',
    ficha: {
      familia: 'Frutal cremoso',
      salida: ['Agua de coco', 'Hoja de higo', 'Jengibre'], corazon: ['Coco', 'Higo', 'Menta'], fondo: ['Haba tonka', 'Almizcle', 'Sándalo'],
      duracion: '8–10 h', duracionNivel: 5, proyeccion: 'Fuerte', proyeccionNivel: 4,
      ocasion: ['Día', 'Calor', 'Playa'],
    },
    perfil: { dulce: 5, fresco: 8, noche: 3 },
    tamanos: frasco('100 ml', 60),
  },
  {
    id: 'cdn-intense', casa: 'Armaf', nombre: 'Club de Nuit Intense', concentracion: 'Eau de Toilette', para: 'Él',
    frase: 'Fresco, ahumado y con presencia toda la noche.',
    ficha: {
      familia: 'Frutal ahumado',
      salida: ['Piña', 'Limón', 'Bergamota'], corazon: ['Abedul', 'Jazmín', 'Rosa'], fondo: ['Almizcle', 'Ámbar gris', 'Vainilla'],
      duracion: '8–10 h', duracionNivel: 5, proyeccion: 'Fuerte', proyeccionNivel: 4,
      ocasion: ['Noche', 'Salidas', 'Citas'],
    },
    perfil: { dulce: 4, fresco: 6, noche: 7 },
    tamanos: frasco('105 ml', 45),
  },
  {
    id: 'invictus', casa: 'Paco Rabanne', nombre: 'Invictus', concentracion: 'Eau de Toilette', para: 'Él',
    frase: 'Fresco y marino, aguanta el ritmo de Caracas.',
    ficha: {
      familia: 'Aromático marino',
      salida: ['Toronja', 'Notas marinas'], corazon: ['Laurel', 'Jazmín'], fondo: ['Ámbar gris', 'Pachulí', 'Guayaco'],
      duracion: '6–8 h', duracionNivel: 4, proyeccion: 'Moderada a fuerte', proyeccionNivel: 3,
      ocasion: ['Diario', 'Calor', 'Gym'],
    },
    perfil: { dulce: 3, fresco: 9, noche: 3 },
    tamanos: frasco('100 ml', 100),
  },
  {
    id: 'le-male', casa: 'Jean Paul Gaultier', nombre: 'Le Male', concentracion: 'Eau de Toilette', para: 'Él',
    frase: 'El torso de marinero que no pasa de moda.',
    ficha: {
      familia: 'Ambarado fougère',
      salida: ['Lavanda', 'Menta', 'Cardamomo'], corazon: ['Canela', 'Azahar'], fondo: ['Vainilla', 'Haba tonka', 'Sándalo'],
      duracion: '6–8 h', duracionNivel: 4, proyeccion: 'Moderada a fuerte', proyeccionNivel: 3,
      ocasion: ['Diario', 'Noche', 'Clima fresco'],
    },
    perfil: { dulce: 7, fresco: 4, noche: 6 },
    tamanos: frasco('125 ml', 115),
  },
  {
    id: 'le-male-le-parfum', casa: 'Jean Paul Gaultier', nombre: 'Le Male Le Parfum', concentracion: 'Eau de Parfum Intense', para: 'Él',
    frase: 'La versión de noche: más oscura y elegante.',
    ficha: {
      familia: 'Ambarado amaderado',
      salida: ['Cardamomo'], corazon: ['Lavanda', 'Iris'], fondo: ['Vainilla', 'Maderas'],
      duracion: '8–10 h', duracionNivel: 5, proyeccion: 'Fuerte', proyeccionNivel: 4,
      ocasion: ['Noche', 'Eventos', 'Citas'],
    },
    perfil: { dulce: 7, fresco: 2, noche: 9 },
    tamanos: frasco('125 ml', 140),
  },
  {
    id: 'bir-uomo-intense', casa: 'Valentino', nombre: 'Born in Roma Uomo Intense', concentracion: 'Eau de Parfum Intense', para: 'Él',
    frase: 'Vainilla y lavanda para una noche en Roma.',
    ficha: {
      familia: 'Ambarado fougère',
      salida: ['Mandarina', 'Jengibre', 'Bergamota'], corazon: ['Lavandín'], fondo: ['Vainilla', 'Vetiver'],
      duracion: '8–10 h', duracionNivel: 5, proyeccion: 'Fuerte', proyeccionNivel: 4,
      ocasion: ['Noche', 'Citas', 'Clima fresco'],
    },
    perfil: { dulce: 8, fresco: 3, noche: 8 },
    tamanos: frasco('100 ml', 195),
  },
  {
    id: 'bir-donna-intense', casa: 'Valentino', nombre: 'Born in Roma Donna Intense', concentracion: 'Eau de Parfum Intense', para: 'Ella',
    frase: 'Jazmín y vainilla con carácter.',
    ficha: {
      familia: 'Ambarado floral',
      salida: ['Jazmín'], corazon: ['Jazmín sambac'], fondo: ['Vainilla', 'Benjuí'],
      duracion: '8–10 h', duracionNivel: 5, proyeccion: 'Fuerte', proyeccionNivel: 4,
      ocasion: ['Noche', 'Eventos', 'Regalo'],
    },
    perfil: { dulce: 8, fresco: 2, noche: 8 },
    tamanos: frasco('100 ml', 200),
  },
];

export const decants: Perfume[] = [
  {
    id: 'jean-lowe-immortel', casa: 'Maison Alhambra', nombre: 'Jean Lowe Immortal', concentracion: 'Eau de Parfum', para: 'Él',
    frase: 'De los frescos que más cumplidos reciben en el calor.',
    ficha: {
      familia: 'Fresco acuático',
      salida: ['Pomelo', 'Jengibre', 'Bergamota'], corazon: ['Notas acuáticas', 'Romero', 'Salvia'], fondo: ['Ambroxan', 'Ámbar'],
      duracion: '6–8 h', duracionNivel: 3, proyeccion: 'Moderada', proyeccionNivel: 3,
      ocasion: ['Diario', 'Oficina', 'Calor'],
    },
    perfil: { dulce: 2, fresco: 9, noche: 2 },
    tamanos: decant('100 ml', 40),
  },
  {
    id: 'ventana', casa: 'Armaf', nombre: 'Ventana', concentracion: 'Eau de Parfum', para: 'Él',
    frase: 'Versátil de día y de noche.',
    ficha: {
      familia: 'Amaderado aromático',
      salida: ['Pomelo', 'Limón', 'Mandarina'], corazon: ['Lavanda', 'Geranio', 'Pachulí'], fondo: ['Cedro', 'Maderas', 'Ámbar'],
      duracion: '6–8 h', duracionNivel: 3, proyeccion: 'Moderada', proyeccionNivel: 3,
      ocasion: ['Diario', 'Oficina', 'Noche'],
    },
    perfil: { dulce: 3, fresco: 6, noche: 5 },
    tamanos: decant('100 ml', 35),
  },
  {
    id: 'cdn-blue-iconic', casa: 'Armaf', nombre: 'Club de Nuit Blue Iconic', concentracion: 'Eau de Parfum', para: 'Él',
    frase: 'Elegante para la oficina y fuerte para la noche.',
    ficha: {
      familia: 'Fresco amaderado',
      salida: ['Pomelo', 'Limón', 'Menta'], corazon: ['Jengibre', 'Nuez moscada'], fondo: ['Incienso', 'Sándalo', 'Ámbar'],
      duracion: '7–9 h', duracionNivel: 4, proyeccion: 'Fuerte', proyeccionNivel: 4,
      ocasion: ['Diario', 'Oficina', 'Noche'],
    },
    perfil: { dulce: 2, fresco: 8, noche: 4 },
    tamanos: decant('100 ml', 55),
  },
  {
    id: 'sauvage-parfum', casa: 'Dior', nombre: 'Sauvage Parfum', concentracion: 'Parfum', para: 'Él',
    frase: 'Más cálido y más duradero que el Sauvage de siempre.',
    ficha: {
      familia: 'Ambarado amaderado',
      salida: ['Bergamota', 'Mandarina'], corazon: ['Sándalo', 'Elemí'], fondo: ['Haba tonka', 'Vainilla'],
      duracion: '8–10 h', duracionNivel: 4, proyeccion: 'Fuerte', proyeccionNivel: 4,
      ocasion: ['Noche', 'Citas', 'Clima fresco'],
    },
    perfil: { dulce: 5, fresco: 4, noche: 8 },
    tamanos: decant('100 ml', 215),
  },
  {
    id: 'stallion-53', casa: 'Emper', nombre: 'Stallion 53', concentracion: 'Eau de Parfum', para: 'Unisex',
    frase: 'Para quien quiere oler distinto todos los días.',
    ficha: {
      familia: 'Amaderado cuero',
      salida: ['Cardamomo', 'Violeta'], corazon: ['Iris', 'Ámbar'], fondo: ['Sándalo', 'Cuero', 'Cedro'],
      duracion: '7–9 h', duracionNivel: 4, proyeccion: 'Moderada', proyeccionNivel: 3,
      ocasion: ['Diario', 'Noche', 'Todo el año'],
    },
    perfil: { dulce: 3, fresco: 4, noche: 5 },
    tamanos: decant('100 ml + 20 ml', 30),
  },
  {
    id: 'ck-one', casa: 'Calvin Klein', nombre: 'CK One', concentracion: 'Eau de Toilette', para: 'Unisex',
    frase: 'Cítrico y ligero, para él o para ella.',
    ficha: {
      familia: 'Cítrico',
      salida: ['Bergamota', 'Piña', 'Papaya'], corazon: ['Jazmín', 'Violeta'], fondo: ['Almizcle'],
      duracion: '4–6 h', duracionNivel: 2, proyeccion: 'Suave', proyeccionNivel: 2,
      ocasion: ['Diario', 'Calor', 'Gym'],
    },
    perfil: { dulce: 1, fresco: 10, noche: 1 },
    tamanos: decant('200 ml', 50),
  },
];

export const WHATSAPP = '584126109580';
export const INSTAGRAM = 'goldhour.parfums';
