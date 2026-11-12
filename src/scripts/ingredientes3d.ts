// Ingredientes reales del perfume (fotos recortadas, ver /creditos) flotando dentro del líquido.
// La cámara avanza entre ellos al bajar con el scroll. Se carga solo cuando la sección está cerca.
import * as THREE from 'three';

type Etapa = 0 | 1 | 2; // salida · corazón · fondo
interface Tipo {
  fotos: { archivo: string; aspecto: number }[];
  etapa: Etapa;
  cantidad: number;
  alto: number; // tamaño en la escena
}

const f = (archivo: string, aspecto: number) => ({ archivo, aspecto });
// Coinciden con las notas reales del Khamrah Qahwa
const TIPOS: Tipo[] = [
  { etapa: 0, cantidad: 10, alto: 0.55, fotos: [f('canela-0', 2.178), f('canela-1', 2.353)] },
  { etapa: 0, cantidad: 12, alto: 0.75, fotos: [f('cardamomo-0', 0.341)] },
  { etapa: 0, cantidad: 6, alto: 0.9, fotos: [f('jengibre-0', 1.415)] },
  { etapa: 1, cantidad: 20, alto: 0.42, fotos: [f('cafe-0', 1.703), f('cafe-1', 1.453), f('cafe-2', 1.306)] },
  { etapa: 1, cantidad: 8, alto: 0.6, fotos: [f('avellana-0', 1.306), f('avellana-1', 1.212)] },
  { etapa: 1, cantidad: 8, alto: 0.8, fotos: [f('datil-0', 0.457), f('datil-1', 0.484), f('datil-2', 1.045)] },
  { etapa: 2, cantidad: 9, alto: 0.7, fotos: [f('vainilla-0', 2.167)] },
  {
    etapa: 2, cantidad: 20, alto: 0.45,
    fotos: [f('tonka-0', 1.587), f('tonka-1', 1.6), f('tonka-2', 1.272), f('tonka-3', 0.796), f('tonka-4', 1.739), f('tonka-5', 1.582), f('tonka-6', 1.472)],
  },
];

export interface Ingredientes {
  /** avance 0..1 del recorrido por el líquido; t en milisegundos */
  dibujar(avance: number, t: number): void;
  medir(): void;
  destruir(): void;
}

// Dónde queda cada etapa en el camino de la cámara (coincide con el momento en que salen sus palabras)
const LARGO = 60;
const CENTROS = [0.21, 0.48, 0.75].map((a) => -a * LARGO - 5);

type Pieza = {
  sprite: THREE.Sprite;
  base: THREE.Vector3;
  ancho: number;
  alto: number;
  giro: number;
  flota: number;
  volteo: number;
};

export function crearIngredientes(canvas: HTMLCanvasElement, movil: boolean): Ingredientes {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !movil, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, movil ? 1.25 : 1.5));

  const escena = new THREE.Scene();
  // La niebla ámbar hace que lo lejano se funda con el líquido, como bajo el agua
  escena.fog = new THREE.Fog(new THREE.Color('#b8742a'), 5, 19);
  const camara = new THREE.PerspectiveCamera(50, 1, 0.1, 40);

  const cargador = new THREE.TextureLoader();
  const texturas = new Map<string, THREE.Texture>();
  const textura = (archivo: string) => {
    let t = texturas.get(archivo);
    if (!t) {
      t = cargador.load(`/ingredientes/${archivo}.webp`, undefined, undefined, () => {
        console.error(`No se pudo cargar la foto del ingrediente ${archivo}`);
      });
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      texturas.set(archivo, t);
    }
    return t;
  };

  const n = movil ? 0.6 : 1;
  const piezas: Pieza[] = [];
  for (const tipo of TIPOS) {
    for (let i = 0; i < Math.round(tipo.cantidad * n); i++) {
      const foto = tipo.fotos[i % tipo.fotos.length];
      const material = new THREE.SpriteMaterial({
        map: textura(foto.archivo),
        color: new THREE.Color('#fff1dc'), // un toque cálido, como si la luz pasara por el perfume
        fog: true,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        rotation: Math.random() * Math.PI * 2,
      });
      const sprite = new THREE.Sprite(material);
      // A los lados y arriba/abajo, dejando libre el centro donde pasan las palabras
      const lado = Math.random() < 0.5 ? -1 : 1;
      const x = lado * (1.3 + Math.random() * (movil ? 2.2 : 4.4));
      const y = (Math.random() * 2 - 1) * 3.2;
      const alto = tipo.alto * 1.6 * (0.8 + Math.random() * 0.5);
      piezas.push({
        sprite,
        base: new THREE.Vector3(x, y, CENTROS[tipo.etapa] + (Math.random() * 2 - 1) * 6),
        ancho: alto * foto.aspecto,
        alto,
        giro: (Math.random() < 0.5 ? -1 : 1) * (0.08 + Math.random() * 0.2),
        flota: Math.random() * Math.PI * 2,
        volteo: 0.2 + Math.random() * 0.4,
      });
      escena.add(sprite);
    }
  }

  const raton = { x: 0, y: 0 };
  const alMover = (e: PointerEvent) => {
    raton.x = (e.clientX / window.innerWidth) * 2 - 1;
    raton.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  if (!movil) window.addEventListener('pointermove', alMover, { passive: true });

  const niebla = escena.fog as THREE.Fog;
  const nieblaClara = new THREE.Color('#c27f30');
  const nieblaOscura = new THREE.Color('#4a2208');
  let anterior = 0;

  return {
    medir() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camara.aspect = w / h;
      camara.fov = w < h ? 62 : 50; // en móvil vertical se abre un poco el ángulo
      camara.updateProjectionMatrix();
    },
    dibujar(avance, t) {
      const s = t * 0.001;
      const dt = anterior ? Math.min(s - anterior, 0.05) : 0;
      anterior = s;
      camara.position.set(
        camara.position.x + (raton.x * 0.5 - camara.position.x) * 0.05,
        camara.position.y + (-raton.y * 0.3 - camara.position.y) * 0.05,
        -avance * LARGO,
      );
      camara.lookAt(camara.position.x * 0.5, camara.position.y * 0.5, camara.position.z - 10);
      niebla.color.copy(nieblaClara).lerp(nieblaOscura, avance);

      for (const pz of piezas) {
        const { sprite } = pz;
        const material = sprite.material as THREE.SpriteMaterial;
        sprite.position.copy(pz.base);
        // flotan despacio dentro del líquido
        sprite.position.y += Math.sin(s * 0.6 + pz.flota) * 0.22;
        sprite.position.x += Math.cos(s * 0.4 + pz.flota) * 0.12;
        material.rotation += pz.giro * dt;
        // Aparecen poco a poco al entrar en escena y se van al pasar la cámara, sin saltos
        const delante = camara.position.z - sprite.position.z;
        const visible = THREE.MathUtils.smoothstep(delante, -1.5, 1.2) * (1 - THREE.MathUtils.smoothstep(delante, 15, 19));
        material.opacity = visible;
        // un leve "volteo" al girar, para que no se vean como recortes planos
        const voltea = 0.82 + 0.18 * Math.cos(s * pz.volteo + pz.flota);
        sprite.scale.set(pz.ancho * voltea, pz.alto, 1);
        sprite.visible = visible > 0.01;
      }
      renderer.render(escena, camara);
    },
    destruir() {
      window.removeEventListener('pointermove', alMover);
      piezas.forEach((pz) => (pz.sprite.material as THREE.SpriteMaterial).dispose());
      texturas.forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
}
