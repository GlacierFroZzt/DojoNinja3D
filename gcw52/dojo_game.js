import * as THREE from 'three';

// =============================================================
// 1. SISTEMA DE AUDIO Y MÚSICA PROCEDURAL (Web Audio API)
// Cumple: "Efectos de sonido y música de fondo"
// =============================================================
class SistemaSonido {
  constructor() {
    this.ctx = null;
    this.musicaActiva = false;
    this.intervaloBGM = null;
    this.notasOrientales = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440]; // Escala Japonesa Insen/Pentatónica
    this.pasoBGM = 0;
  }

  iniciar() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Efecto de sonido: Espadazo / Parry
  playParry() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  // Efecto de sonido: Recoger Ítem
  playItem() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // Do
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08); // Mi
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.16); // Sol
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  // Efecto de sonido: Impacto / Daño
  playGolpe() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  // Bucle de música de fondo estilo oriental tradicional
  iniciarBGM() {
    this.iniciar();
    if (this.musicaActiva) return;
    this.musicaActiva = true;

    this.intervaloBGM = setInterval(() => {
      if (!this.musicaActiva || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const f = this.notasOrientales[this.pasoBGM % this.notasOrientales.length];
        this.pasoBGM = (this.pasoBGM + Math.floor(Math.random() * 3) + 1) % this.notasOrientales.length;
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.45);
      } catch (e) {}
    }, 420);
  }

  detenerBGM() {
    this.musicaActiva = false;
    if (this.intervaloBGM) {
      clearInterval(this.intervaloBGM);
      this.intervaloBGM = null;
    }
  }

  alternarBGM() {
    if (this.musicaActiva) {
      this.detenerBGM();
      return false;
    } else {
      this.iniciarBGM();
      return true;
    }
  }
}

const audio = new SistemaSonido();

// =============================================================
// 2. CONFIGURACIÓN THREE.JS, CÁMARA Y RENDERER
// =============================================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141820);
scene.fog = new THREE.FogExp2(0x141820, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 4.2, 8.5);
camera.lookAt(0, 1.2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
container.appendChild(renderer.domElement);

// ILUMINACIÓN AMBIENTAL (Requisito Rúbrica)
const luzAmbiental = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(luzAmbiental);

// ILUMINACIÓN FOCAL / SPOTLIGHT (Requisito Rúbrica)
const luzFocal = new THREE.SpotLight(0xffffff, 3.5, 30, Math.PI / 4, 0.4, 1.2);
luzFocal.position.set(0, 8, 4);
luzFocal.castShadow = true;
luzFocal.shadow.mapSize.width = 1024;
luzFocal.shadow.mapSize.height = 1024;
scene.add(luzFocal);

// =============================================================
// 3. SISTEMA DE PARTÍCULAS
// Cumple: "Uso de partículas"
// =============================================================
class SistemaParticulas {
  constructor() {
    this.total = 120;
    this.geo = new THREE.BufferGeometry();
    this.posiciones = new Float32Array(this.total * 3);
    this.velocidades = new Float32Array(this.total * 3);
    this.vidas = new Float32Array(this.total);

    for (let i = 0; i < this.total; i++) {
      this.vidas[i] = 0; // Inactivas al inicio
      this.posiciones[i * 3] = 0;
      this.posiciones[i * 3 + 1] = -100;
      this.posiciones[i * 3 + 2] = 0;
    }

    this.geo.setAttribute('position', new THREE.BufferAttribute(this.posiciones, 3));
    this.mat = new THREE.PointsMaterial({
      color: 0xffd54f,
      size: 0.28,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    this.puntos = new THREE.Points(this.geo, this.mat);
    scene.add(this.puntos);
  }

  emitir(origen, colorHex = 0xffd54f, cantidad = 30) {
    this.mat.color.setHex(colorHex);
    let activadas = 0;
    for (let i = 0; i < this.total && activadas < cantidad; i++) {
      if (this.vidas[i] <= 0) {
        this.vidas[i] = 0.6 + Math.random() * 0.4; // Vida en segundos
        this.posiciones[i * 3] = origen.x;
        this.posiciones[i * 3 + 1] = origen.y;
        this.posiciones[i * 3 + 2] = origen.z;

        // Velocidad explosiva radial
        this.velocidades[i * 3] = (Math.random() - 0.5) * 8;
        this.velocidades[i * 3 + 1] = (Math.random() * 6) + 1;
        this.velocidades[i * 3 + 2] = (Math.random() - 0.5) * 8;
        activadas++;
      }
    }
  }

  actualizar(delta) {
    let cambio = false;
    for (let i = 0; i < this.total; i++) {
      if (this.vidas[i] > 0) {
        this.vidas[i] -= delta;
        this.posiciones[i * 3] += this.velocidades[i * 3] * delta;
        this.posiciones[i * 3 + 1] += this.velocidades[i * 3 + 1] * delta;
        this.posiciones[i * 3 + 2] += this.velocidades[i * 3 + 2] * delta;
        this.velocidades[i * 3 + 1] -= 9.8 * delta; // Gravedad
        cambio = true;
      } else {
        this.posiciones[i * 3 + 1] = -100;
      }
    }
    if (cambio) {
      this.geo.attributes.position.needsUpdate = true;
    }
  }
}

const particulas = new SistemaParticulas();

// =============================================================
// 4. GENERADOR PROCEDURAL DE TEXTURAS Y ESCENARIOS (3 Escenarios)
// =============================================================
function generarTexturaTatami() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4a3b2c';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 3;
  for (let y = 0; y <= 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  for (let x = 0; x <= 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

const sueloGeo = new THREE.PlaneGeometry(14, 120);
const sueloMat = new THREE.MeshStandardMaterial({
  map: generarTexturaTatami(),
  roughness: 0.75,
  metalness: 0.1
});
const suelo = new THREE.Mesh(sueloGeo, sueloMat);
suelo.rotation.x = -Math.PI / 2;
suelo.position.set(0, 0, -25);
suelo.receiveShadow = true;
scene.add(suelo);

// Paredes Dojo
const paredMat = new THREE.MeshStandardMaterial({ color: 0x1f232b, roughness: 0.9 });
const paredIzq = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6, 120), paredMat);
paredIzq.position.set(-6.8, 3, -25);
paredIzq.receiveShadow = true;
scene.add(paredIzq);

const paredDer = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6, 120), paredMat);
paredDer.position.set(6.8, 3, -25);
paredDer.receiveShadow = true;
scene.add(paredDer);

// Columnas de madera
for (let z = 5; z > -75; z -= 14) {
  const colMat = new THREE.MeshStandardMaterial({ color: 0x5c2c16, roughness: 0.6 });
  const colI = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 0.6), colMat);
  colI.position.set(-6.2, 3, z);
  colI.castShadow = true;
  scene.add(colI);

  const colD = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 0.6), colMat);
  colD.position.set(6.2, 3, z);
  colD.castShadow = true;
  scene.add(colD);
}

// =============================================================
// 5. MODELADO DEL NINJA Y SUS COMPONENTES
// =============================================================
function crearKatana() {
  const g = new THREE.Group();
  const hojaGeo = new THREE.BoxGeometry(0.04, 1.1, 0.08);
  const hojaMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.95,
    roughness: 0.15,
    emissive: 0x224466,
    emissiveIntensity: 0.25
  });
  const hoja = new THREE.Mesh(hojaGeo, hojaMat);
  hoja.position.y = 0.55;
  hoja.castShadow = true;

  const tsuba = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 })
  );
  tsuba.position.y = 0.015;

  const tsuka = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
  );
  tsuka.position.y = -0.16;

  g.add(hoja, tsuba, tsuka);
  return g;
}

function crearNinja(colorTraje = 0x1a2430, colorCinta = 0xffffff) {
  const ninja = new THREE.Group();

  const matTraje = new THREE.MeshStandardMaterial({ color: colorTraje, roughness: 0.7, metalness: 0.1 });
  const matPiel = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.8 });
  const matCinta = new THREE.MeshStandardMaterial({ color: colorCinta, roughness: 0.5 });
  const matOjos = new THREE.MeshBasicMaterial({ color: 0x111111 });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.45), matTraje);
  torso.position.y = 1.1;
  torso.castShadow = true;
  ninja.add(torso);

  // Faja
  const faja = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 0.47), matCinta);
  faja.position.y = 0.75;
  ninja.add(faja);

  // Cabeza
  const cabeza = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), matTraje);
  cabeza.position.y = 1.82;
  cabeza.castShadow = true;
  ninja.add(cabeza);

  // Hendidura de ojos y ojos
  const piel = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.12), matPiel);
  piel.position.set(0, 1.84, 0.245);
  ninja.add(piel);

  const ojoI = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.03), matOjos);
  ojoI.position.set(-0.08, 1.84, 0.247);
  const ojoD = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.03), matOjos);
  ojoD.position.set(0.08, 1.84, 0.247);
  ninja.add(ojoI, ojoD);

  // Cinta con nudo
  const cinta = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), matCinta);
  cinta.position.y = 1.95;
  ninja.add(cinta);

  const colaGeo = new THREE.BoxGeometry(0.08, 0.4, 0.02);
  const cola1 = new THREE.Mesh(colaGeo, matCinta);
  cola1.position.set(-0.1, 1.8, -0.26);
  cola1.rotation.set(-0.3, 0, 0.25);
  const cola2 = new THREE.Mesh(colaGeo, matCinta);
  cola2.position.set(0.06, 1.75, -0.26);
  cola2.rotation.set(-0.35, 0, -0.2);
  ninja.add(cola1, cola2);

  // Articulaciones de brazos
  const hombroI = new THREE.Group();
  hombroI.position.set(-0.48, 1.45, 0);
  const bI = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22), matTraje);
  bI.position.y = -0.32;
  bI.castShadow = true;
  hombroI.add(bI);
  ninja.add(hombroI);
  ninja.brazoIzq = hombroI;

  const hombroD = new THREE.Group();
  hombroD.position.set(0.48, 1.45, 0);
  const bD = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22), matTraje);
  bD.position.y = -0.32;
  bD.castShadow = true;
  hombroD.add(bD);
  ninja.add(hombroD);
  ninja.brazoDer = hombroD;

  // Piernas
  const caderaI = new THREE.Group();
  caderaI.position.set(-0.2, 0.68, 0);
  const pI = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.72, 0.26), matTraje);
  pI.position.y = -0.36;
  pI.castShadow = true;
  caderaI.add(pI);
  ninja.add(caderaI);
  ninja.piernaIzq = caderaI;

  const caderaD = new THREE.Group();
  caderaD.position.set(0.2, 0.68, 0);
  const pD = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.72, 0.26), matTraje);
  pD.position.y = -0.36;
  pD.castShadow = true;
  caderaD.add(pD);
  ninja.add(caderaD);
  ninja.piernaDer = caderaD;

  // Katana
  const katana = crearKatana();
  katana.position.set(0.35, 0.85, 0.2);
  katana.rotation.set(-0.35, 0, -0.35);
  ninja.add(katana);
  ninja.katana = katana;

  return ninja;
}

// =============================================================
// 6. GENERADORES DE OBSTÁCULOS E ÍTEMS ESPECIALES (3 Ítems)
// Cumple: "Uso de 'ítems' (objetos especiales) (3 como mínimo)"
// =============================================================
function crearShurikenMesh() {
  const g = new THREE.Group();
  const matMetal = new THREE.MeshStandardMaterial({
    color: 0x90a4ae,
    metalness: 0.95,
    roughness: 0.2,
    emissive: 0x112233
  });

  const centro = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 8), matMetal);
  centro.rotation.x = Math.PI / 2;
  g.add(centro);

  for (let i = 0; i < 4; i++) {
    const hojaGeo = new THREE.ConeGeometry(0.3, 0.9, 4);
    const hoja = new THREE.Mesh(hojaGeo, matMetal);
    const angulo = (i * Math.PI) / 2;
    hoja.position.set(Math.cos(angulo) * 0.7, Math.sin(angulo) * 0.7, 0);
    hoja.rotation.z = angulo - Math.PI / 2;
    g.add(hoja);
  }
  g.scale.set(1.1, 1.1, 1.1);
  return g;
}

// ÍTEM 1: Pergamino Dorado (+100 Puntos)
function crearPergaminoMesh() {
  const g = new THREE.Group();
  const matPapel = new THREE.MeshStandardMaterial({
    color: 0xffecb3,
    roughness: 0.4,
    emissive: 0xffb300,
    emissiveIntensity: 0.4
  });
  const rollo = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.2, 16), matPapel);
  rollo.rotation.z = Math.PI / 2;

  const matPomo = new THREE.MeshStandardMaterial({ color: 0xb71c1c, metalness: 0.4 });
  const tomoI = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.15, 12), matPomo);
  tomoI.rotation.z = Math.PI / 2;
  tomoI.position.x = -0.65;
  const tomoD = tomoI.clone();
  tomoD.position.x = 0.65;

  g.add(rollo, tomoI, tomoD);
  g.scale.set(1.1, 1.1, 1.1);
  return g;
}

// ÍTEM 2: Poción de Salud Roja (+1 Vida)
function crearPocionMesh() {
  const g = new THREE.Group();
  const frascoMat = new THREE.MeshStandardMaterial({
    color: 0xff1744,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0xd50000,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.85
  });
  const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), frascoMat);
  const cuello = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 12), frascoMat);
  cuello.position.y = 0.45;

  const corchoMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });
  const corcho = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.15, 10), corchoMat);
  corcho.position.y = 0.62;

  g.add(cuerpo, cuello, corcho);
  g.scale.set(1.1, 1.1, 1.1);
  return g;
}

// ÍTEM 3: Escudo Sagrado Azul (Invulnerabilidad temporal)
function crearEscudoItemMesh() {
  const g = new THREE.Group();
  const matEscudo = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    metalness: 0.3,
    roughness: 0.1,
    emissive: 0x00b0ff,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.75
  });
  const esfera = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), matEscudo);
  const anilloMat = new THREE.MeshBasicMaterial({ color: 0x80d8ff, wireframe: true });
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.04, 8, 24), anilloMat);
  anillo.rotation.x = Math.PI / 4;

  g.add(esfera, anillo);
  g.anillo = anillo;
  g.scale.set(1.1, 1.1, 1.1);
  return g;
}

// =============================================================
// 7. JUGADOR, MULTIJUGADOR Y ESFERA DE ESCUDO
// Cumple: "Multijugador en tiempo real"
// =============================================================
const jugador = crearNinja(0x1a2430, 0x64b5f6);
scene.add(jugador);

// Esfera visual de escudo activo alrededor del jugador
const geoEscudoVisual = new THREE.SphereGeometry(1.6, 16, 16);
const matEscudoVisual = new THREE.MeshBasicMaterial({
  color: 0x00e5ff,
  transparent: true,
  opacity: 0.35,
  wireframe: true
});
const escudoVisualJugador = new THREE.Mesh(geoEscudoVisual, matEscudoVisual);
escudoVisualJugador.visible = false;
jugador.add(escudoVisualJugador);

let otrosNinjas = {};
const socket = io();

socket.on('jugadoresActuales', (lista) => {
  Object.keys(lista).forEach(id => {
    if (id !== socket.id && !otrosNinjas[id]) {
      const otro = crearNinja(0x8c2a2a, 0xffb74d);
      otro.position.set(lista[id].x || 0, 0, lista[id].z || 0);
      scene.add(otro);
      otrosNinjas[id] = otro;
    }
  });
});

socket.on('nuevoJugador', (datos) => {
  if (datos.id !== socket.id && !otrosNinjas[datos.id]) {
    const otro = crearNinja(0x8c2a2a, 0xffb74d);
    otro.position.set(datos.x || 0, 0, datos.z || 0);
    scene.add(otro);
    otrosNinjas[datos.id] = otro;
  }
});

socket.on('jugadorMovido', (datos) => {
  if (otrosNinjas[datos.id]) {
    otrosNinjas[datos.id].position.x = datos.x;
  }
});

socket.on('jugadorSalio', (id) => {
  if (otrosNinjas[id]) {
    scene.remove(otrosNinjas[id]);
    delete otrosNinjas[id];
  }
});

// =============================================================
// 8. INTELIGENCIA ARTIFICIAL: ENEMIGO CON SEGUIMIENTO EN CAMPO DE VISIÓN
// Cumple: "Inteligencia Artificial (seguimiento de enemigos al personaje
// principal cuándo se encuentre en su campo de visión)"
// =============================================================
const enemigoIA = crearNinja(0x881111, 0xff1744); // Ninja Rojo Rival
enemigoIA.position.set(0, 0, -32);
scene.add(enemigoIA);

const RANGO_VISION_IA = 24.0; // Distancia máxima del cono de visión
const VELOCIDAD_IA = 4.2;

function actualizarIA(delta) {
  if (!juegoActivo || juegoPausado) return;

  // Calcular vector hacia el jugador
  const distanciaZ = jugador.position.z - enemigoIA.position.z;
  const distanciaX = jugador.position.x - enemigoIA.position.x;
  const distanciaTotal = Math.sqrt(distanciaX * distanciaX + distanciaZ * distanciaZ);

  // ¿El jugador está dentro del campo de visión frontal del enemigo?
  // El enemigo mira hacia adelante (+Z hacia el jugador)
  if (distanciaZ > 0 && distanciaZ <= RANGO_VISION_IA) {
    // Campo de visión detectado: Perseguir al personaje lateralmente
    if (Math.abs(distanciaX) > 0.15) {
      const direccion = Math.sign(distanciaX);
      enemigoIA.position.x += direccion * VELOCIDAD_IA * delta;
      // Limitar a los márgenes del dojo
      enemigoIA.position.x = Math.max(-4.2, Math.min(4.2, enemigoIA.position.x));
    }
    // Animación de persecución
    const paso = Math.sin(clock.getElapsedTime() * 12) * 0.4;
    enemigoIA.brazoIzq.rotation.x = paso;
    enemigoIA.brazoDer.rotation.x = -paso;
    enemigoIA.piernaIzq.rotation.x = -paso;
    enemigoIA.piernaDer.rotation.x = paso;
  } else {
    // Si no lo ve, patrulla lenta de lado a lado
    enemigoIA.position.x = Math.sin(clock.getElapsedTime() * 1.5) * 3;
  }
}

// =============================================================
// 9. ESTADO DEL JUEGO Y CONTROLES
// =============================================================
let juegoActivo = false;
let juegoPausado = false;
let vidas = 3;
let puntos = 0;
let tiempo = 30;
let modoActual = 'esquivar';
let dificultadActual = 'facil';
let escenarioActual = 'dojo';
let velocidadObstaculos = 16;
let parryTimer = 0;
let escudoTimer = 0;
let walkTimer = 0;
let intervaloTiempo = null;

const teclas = { izquierda: false, derecha: false };

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') teclas.izquierda = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') teclas.derecha = true;
  if (e.key === ' ' || e.code === 'Space') {
    if (juegoActivo && !juegoPausado && parryTimer <= 0) {
      parryTimer = 0.28;
      audio.playParry();
      particulas.emitir(jugador.position, 0x64b5f6, 15);
    }
  }
  if (e.key === 'p' || e.key === 'P') {
    alternarPausa();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') teclas.izquierda = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') teclas.derecha = false;
});

// =============================================================
// 10. APLICAR ESCENARIOS (3 Escenarios Distintos)
// =============================================================
function aplicarEscenario(esc) {
  escenarioActual = esc;
  if (esc === 'ciudad') {
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog.color = new THREE.Color(0x0a0e17);
    sueloMat.color.setHex(0x212121);
    paredMat.color.setHex(0x121824);
    luzAmbiental.color.setHex(0x7986cb);
  } else if (esc === 'volcan') {
    scene.background = new THREE.Color(0x210606);
    scene.fog.color = new THREE.Color(0x210606);
    sueloMat.color.setHex(0xd84315);
    paredMat.color.setHex(0x3e1008);
    luzAmbiental.color.setHex(0xff7043);
  } else {
    // Dojo tradicional
    scene.background = new THREE.Color(0x141820);
    scene.fog.color = new THREE.Color(0x141820);
    sueloMat.color.setHex(0xffffff);
    paredMat.color.setHex(0x1f232b);
    luzAmbiental.color.setHex(0xffffff);
  }
}

// =============================================================
// 11. GENERACIÓN DE ELEMENTOS (OBSTÁCULOS E ÍTEMS)
// =============================================================
let obstaculos = [];
let spawnTimer = 0;

function generarElemento(delta) {
  spawnTimer += delta;
  const frecuencia = dificultadActual === 'dificil' ? 0.6 : 0.85;
  if (spawnTimer >= frecuencia) {
    spawnTimer = 0;
    const posX = (Math.random() * 8) - 4; // Entre -4 y 4
    const rand = Math.random();

    let obj;
    // 25% de probabilidad de generar uno de los 3 ítems especiales
    if (rand < 0.10) {
      obj = crearPocionMesh();
      obj.tipo = 'item_pocion';
      obj.position.set(posX, 1.2, -45);
    } else if (rand < 0.20) {
      obj = crearEscudoItemMesh();
      obj.tipo = 'item_escudo';
      obj.position.set(posX, 1.2, -45);
    } else if (rand < 0.28) {
      obj = crearPergaminoMesh();
      obj.tipo = 'item_pergamino';
      obj.position.set(posX, 1.2, -45);
    } else {
      if (modoActual === 'esquivar') {
        obj = crearShurikenMesh();
        obj.tipo = 'shuriken';
        obj.position.set(posX, 1.2, -45);
      } else {
        obj = crearPergaminoMesh();
        obj.tipo = 'pergamino';
        obj.position.set(posX, 1.2, -45);
      }
    }
    scene.add(obj);
    obstaculos.push(obj);
  }
}

function mostrarAviso(elemId, texto) {
  const el = document.getElementById(elemId);
  if (!el) return;
  if (texto) el.textContent = texto;
  el.classList.add('mostrar');
  setTimeout(() => el.classList.remove('mostrar'), 650);
}

function flashImpacto() {
  const imp = document.getElementById('impacto-rojo');
  if (imp) {
    imp.classList.add('activo');
    setTimeout(() => imp.classList.remove('activo'), 180);
  }
}

// =============================================================
// 12. DETECCIÓN Y USO DE COLISIONES CON BOX3
// =============================================================
function procesarColisiones() {
  const boxJugador = new THREE.Box3().setFromObject(jugador);
  const esParry = parryTimer > 0;
  const conEscudo = escudoTimer > 0;

  for (let i = obstaculos.length - 1; i >= 0; i--) {
    const obj = obstaculos[i];
    const boxObj = new THREE.Box3().setFromObject(obj);

    if (boxJugador.intersectsBox(boxObj)) {
      scene.remove(obj);
      obstaculos.splice(i, 1);

      // ÍTEM ESPECIAL 1: Poción de Salud
      if (obj.tipo === 'item_pocion') {
        vidas = Math.min(3, vidas + 1);
        puntos += 30;
        audio.playItem();
        particulas.emitir(jugador.position, 0xff1744, 25);
        mostrarAviso('hud-aviso-cerca', '❤️ +1 VIDA');
        actualizarHUD();
        continue;
      }

      // ÍTEM ESPECIAL 2: Escudo Sagrado
      if (obj.tipo === 'item_escudo') {
        escudoTimer = 6.0; // 6 segundos de escudo protector
        audio.playItem();
        particulas.emitir(jugador.position, 0x00e5ff, 30);
        mostrarAviso('hud-aviso-parry', '🛡️ ESCUDO ACTIVO (6s)');
        actualizarHUD();
        continue;
      }

      // ÍTEM ESPECIAL 3: Pergamino Dorado
      if (obj.tipo === 'item_pergamino') {
        puntos += 200;
        audio.playItem();
        particulas.emitir(jugador.position, 0xffd54f, 35);
        mostrarAviso('hud-aviso-parry', '📜 PERGAMINO +200');
        actualizarHUD();
        continue;
      }

      // OBSTÁCULO: Shuriken
      if (obj.tipo === 'shuriken') {
        if (esParry) {
          puntos += 150;
          audio.playParry();
          particulas.emitir(jugador.position, 0x64b5f6, 30);
          mostrarAviso('hud-aviso-parry', '⚔️ PARRY KATANA +150');
        } else if (conEscudo) {
          audio.playParry();
          particulas.emitir(jugador.position, 0x00e5ff, 20);
          mostrarAviso('hud-aviso-cerca', '🛡️ ¡ESCUDO ABSORBIÓ!');
        } else {
          vidas--;
          audio.playGolpe();
          particulas.emitir(jugador.position, 0xe53935, 25);
          flashImpacto();
          actualizarHUD();
          if (vidas <= 0) {
            terminarJuego('¡Has caído en batalla!');
          }
        }
      } else if (obj.tipo === 'pergamino') {
        puntos += 50;
        audio.playItem();
        particulas.emitir(jugador.position, 0xffb300, 20);
        mostrarAviso('hud-aviso-cerca', '+50 PERGAMINO');
        actualizarHUD();
      }
      continue;
    }

    // Si pasó de largo
    if (obj.position.z > 6) {
      scene.remove(obj);
      obstaculos.splice(i, 1);
      if (obj.tipo === 'shuriken') {
        puntos += 20;
        mostrarAviso('hud-aviso-cerca', 'CERCA +20');
        actualizarHUD();
      }
    }
  }
}

// =============================================================
// 13. BUCLE DE RENDERIZADO Y ANIMACIÓN
// =============================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (juegoActivo && !juegoPausado) {
    // Movimiento lateral del ninja
    if (teclas.izquierda && jugador.position.x > -4.2) {
      jugador.position.x -= 8.5 * delta;
    }
    if (teclas.derecha && jugador.position.x < 4.2) {
      jugador.position.x += 8.5 * delta;
    }

    // Animación de correr
    walkTimer += delta * 14;
    const anguloPaso = Math.sin(walkTimer) * 0.45;
    jugador.brazoIzq.rotation.x = anguloPaso;
    jugador.brazoDer.rotation.x = -anguloPaso;
    jugador.piernaIzq.rotation.x = -anguloPaso;
    jugador.piernaDer.rotation.x = anguloPaso;
    jugador.position.y = Math.abs(Math.sin(walkTimer)) * 0.12;

    // Animación de Katana Parry
    if (parryTimer > 0) {
      parryTimer -= delta;
      const prog = 1 - Math.max(0, parryTimer / 0.28);
      const slash = Math.sin(prog * Math.PI) * 2.2;
      jugador.katana.position.set(0.1 - prog * 0.6, 1.1, 0.6);
      jugador.katana.rotation.set(0.6, 0.4, -0.6 - slash);
    } else {
      jugador.katana.position.set(0.35, 0.85, 0.2);
      jugador.katana.rotation.set(-0.35, 0, -0.35);
    }

    // Estado del Escudo Visual
    if (escudoTimer > 0) {
      escudoTimer -= delta;
      escudoVisualJugador.visible = true;
      escudoVisualJugador.rotation.y += 3.5 * delta;
    } else {
      escudoVisualJugador.visible = false;
    }

    // Luz focal sigue al ninja
    luzFocal.target = jugador;

    // Multijugador: transmitir coordenadas al servidor
    socket.emit('mover', { x: jugador.position.x, y: 0, z: 0 });

    // Inteligencia Artificial enemiga
    actualizarIA(delta);

    // Obstáculos y rotaciones
    generarElemento(delta);
    for (let i = 0; i < obstaculos.length; i++) {
      const obs = obstaculos[i];
      obs.position.z += velocidadObstaculos * delta;
      if (obs.tipo === 'shuriken') {
        obs.rotation.z += 24 * delta;
      } else if (obs.anillo) {
        obs.anillo.rotation.z += 4 * delta;
        obs.rotation.y += 2 * delta;
      } else {
        obs.rotation.y += 3 * delta;
      }
    }

    procesarColisiones();
  }

  // Actualizar partículas
  particulas.actualizar(delta);

  renderer.render(scene, camera);
}

// =============================================================
// 14. CONTROL DE MENÚS Y FLUJO DE PARTIDA
// =============================================================
function actualizarHUD() {
  document.getElementById('hud-puntos').textContent = puntos;
  document.getElementById('hud-tiempo').textContent = `TIEMPO 00:${tiempo < 10 ? '0' : ''}${tiempo}`;
  document.getElementById('hud-sala-tag').textContent = `MODO: ${modoActual.toUpperCase()}`;
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`vida-${i}`);
    if (el) el.classList.toggle('perdida', i > vidas);
  }
}

function empezarPartida() {
  modoActual = document.getElementById('modo-juego').value;
  dificultadActual = document.getElementById('dificultad-juego').value;
  const esc = document.getElementById('escenario-juego').value;
  aplicarEscenario(esc);

  velocidadObstaculos = dificultadActual === 'dificil' ? 24 : 17;
  vidas = 3;
  puntos = 0;
  tiempo = 30; // 30 segundos garantizados
  juegoActivo = true;
  juegoPausado = false;
  jugador.position.set(0, 0, 0);

  // Limpiar escena
  obstaculos.forEach(o => scene.remove(o));
  obstaculos = [];

  document.getElementById('menu-inicio').style.display = 'none';
  document.getElementById('pantalla-gameover').style.display = 'none';
  document.getElementById('menu-pausa').style.display = 'none';
  document.getElementById('hud-juego').style.display = 'block';

  actualizarHUD();

  // Iniciar BGM oriental
  audio.iniciarBGM();

  // Notificar al servidor multijugador
  const nombre = document.getElementById('nombre-jugador').value || 'Ninja';
  socket.emit('entrarJuego', { nombre });

  if (intervaloTiempo) clearInterval(intervaloTiempo);
  intervaloTiempo = setInterval(() => {
    if (!juegoPausado && juegoActivo) {
      tiempo--;
      actualizarHUD();
      if (tiempo <= 0) {
        terminarJuego('¡Tiempo cumplido! ¡Misión superada!');
      }
    }
  }, 1000);
}

function terminarJuego(motivo) {
  juegoActivo = false;
  clearInterval(intervaloTiempo);

  document.getElementById('gameover-titulo').textContent = motivo.includes('superada') ? '¡MISIÓN CUMPLIDA!' : '¡GAME OVER!';
  document.getElementById('gameover-subtitulo').textContent = motivo;
  document.getElementById('gameover-puntos').textContent = puntos;
  document.getElementById('gameover-stats').textContent = `Dificultad: ${dificultadActual.toUpperCase()} | Modo: ${modoActual.toUpperCase()}`;
  document.getElementById('pantalla-gameover').style.display = 'flex';

  // Guardar en el servicio web REST
  const nombre = document.getElementById('nombre-jugador').value || 'Ninja Anónimo';
  fetch('/api/puntuaciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre,
      puntos,
      dificultad: dificultadActual,
      escenario: escenarioActual
    })
  }).catch(() => {});
}

function pausarJuego() {
  if (!juegoActivo) return;
  juegoPausado = true;
  document.getElementById('menu-pausa').style.display = 'flex';
}

function reanudarJuego() {
  if (!juegoActivo) return;
  juegoPausado = false;
  document.getElementById('menu-pausa').style.display = 'none';
}

function alternarPausa() {
  if (juegoPausado) reanudarJuego();
  else pausarJuego();
}

function volverAlMenu() {
  juegoActivo = false;
  juegoPausado = false;
  clearInterval(intervaloTiempo);
  obstaculos.forEach(o => scene.remove(o));
  obstaculos = [];

  document.getElementById('menu-inicio').style.display = 'flex';
  document.getElementById('menu-pausa').style.display = 'none';
  document.getElementById('pantalla-gameover').style.display = 'none';
  document.getElementById('hud-juego').style.display = 'none';
}

// =============================================================
// 15. LISTENERS DE BOTONES Y MENÚS
// =============================================================
document.getElementById('btn-jugar').onclick = empezarPartida;
document.getElementById('btn-reintentar').onclick = empezarPartida;
document.getElementById('btn-pausa-hud').onclick = pausarJuego;
document.getElementById('btn-reanudar').onclick = reanudarJuego;
document.getElementById('btn-salir-menu').onclick = volverAlMenu;
document.getElementById('btn-gameover-salir').onclick = volverAlMenu;

// Toggle de Música en HUD
const btnSonido = document.getElementById('btn-sonido-toggle');
if (btnSonido) {
  btnSonido.onclick = () => {
    const sonando = audio.alternarBGM();
    btnSonido.textContent = sonando ? '🔊 MÚSICA' : '🔇 MÚSICA';
  };
}

// Configuración de Iluminación
document.getElementById('btn-configuracion').onclick = () => {
  document.getElementById('modal-opciones').style.display = 'flex';
};
document.getElementById('btn-cerrar-opciones').onclick = () => {
  document.getElementById('modal-opciones').style.display = 'none';
};

document.getElementById('cfg-luz-focal').onchange = (e) => {
  luzFocal.color.set(e.target.value);
};
document.getElementById('cfg-luz-ambiental').oninput = (e) => {
  luzAmbiental.intensity = parseFloat(e.target.value);
};
document.getElementById('cfg-sombras').onchange = (e) => {
  renderer.shadowMap.enabled = e.target.checked;
};

// Puntuaciones (Servicio Web REST)
document.getElementById('btn-puntuaciones').onclick = () => {
  document.getElementById('modal-puntuaciones').style.display = 'flex';
  const lista = document.getElementById('lista-puntuaciones-tabla');
  lista.innerHTML = 'Consultando servicio web...';

  fetch('/api/puntuaciones')
    .then(r => r.json())
    .then(datos => {
      if (!datos || datos.length === 0) {
        lista.innerHTML = '<p>No hay puntuaciones registradas aún.</p>';
        return;
      }
      let html = '<table style="width: 100%; border-collapse: collapse; color: #eee;">';
      html += '<tr style="border-bottom: 1px solid #555;"><th style="padding: 4px;">#</th><th>Ninja</th><th>Pts</th><th>Modo</th></tr>';
      datos.slice(0, 10).forEach((p, idx) => {
        html += `<tr style="border-bottom: 1px solid #333; text-align: center;">
          <td style="padding: 4px;">${idx + 1}</td>
          <td style="font-weight: bold; color: #ffb74d;">${p.nombre || 'Ninja'}</td>
          <td style="color: #64b5f6;">${p.puntos}</td>
          <td style="font-size: 11px; color: #aaa;">${p.dificultad || 'Fácil'}</td>
        </tr>`;
      });
      html += '</table>';
      lista.innerHTML = html;
    })
    .catch(() => {
      lista.innerHTML = 'Error al consultar el servicio web.';
    });
};

document.getElementById('btn-cerrar-puntuaciones').onclick = () => {
  document.getElementById('modal-puntuaciones').style.display = 'none';
};

// =============================================================
// 16. COMPARTIR EN REDES SOCIALES (Facebook, Twitter o Instagram, WhatsApp)
// Cumple: "Facebook, Twitter o Instagram"
// =============================================================
function compartirWhatsApp() {
  const t = encodeURIComponent(`¡Logré ${puntos} puntos en el Dojo Ninja 3D! ¿Puedes superarme?`);
  window.open(`https://api.whatsapp.com/send?text=${t}`, '_blank');
}
function compartirTwitter() {
  const t = encodeURIComponent(`¡Hice ${puntos} puntos esquivando shurikens en Dojo Ninja 3D con Three.js!`);
  window.open(`https://twitter.com/intent/tweet?text=${t}`, '_blank');
}
function compartirFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}
function compartirInstagram() {
  alert(`Copia tu récord para tu historia de Instagram:\n"¡Hice ${puntos} puntos en Dojo Ninja 3D!"`);
  window.open('https://www.instagram.com/', '_blank');
}

// Botones en modal puntuaciones
document.getElementById('btn-share-whatsapp').onclick = compartirWhatsApp;
document.getElementById('btn-share-twitter').onclick = compartirTwitter;
const btnShareFb = document.getElementById('btn-share-facebook');
if (btnShareFb) btnShareFb.onclick = compartirFacebook;
const btnShareIg = document.getElementById('btn-share-instagram');
if (btnShareIg) btnShareIg.onclick = compartirInstagram;

// Botones en modal gameover
document.getElementById('btn-gameover-whatsapp').onclick = compartirWhatsApp;
const btnGoTw = document.getElementById('btn-gameover-twitter');
if (btnGoTw) btnGoTw.onclick = compartirTwitter;
const btnGoFb = document.getElementById('btn-gameover-facebook');
if (btnGoFb) btnGoFb.onclick = compartirFacebook;
const btnGoIg = document.getElementById('btn-gameover-instagram');
if (btnGoIg) btnGoIg.onclick = compartirInstagram;

// Ocultar pantalla de carga inicial
const pCarga = document.getElementById('pantalla-carga');
if (pCarga) pCarga.style.display = 'none';

animate();
