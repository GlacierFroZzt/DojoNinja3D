import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// =============================================================
// 1. SISTEMA DE AUDIO Y MÚSICA PROCEDURAL (Web Audio API)
// Cumple: "Efectos de sonido y música de fondo"
// =============================================================
class SistemaSonido {
  constructor() {
    this.ctx = null;
    this.musicaActiva = false;
    this.intervaloBGM = null;
    this.notasOrientales = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440];
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

  playParry() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(850, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1700, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playItem() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  playGolpe() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

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
scene.fog = new THREE.FogExp2(0x141820, 0.012);

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
const luzAmbiental = new THREE.AmbientLight(0xffecc4, 1.2);
scene.add(luzAmbiental);

// ILUMINACIÓN FOCAL / SPOTLIGHT (Requisito Rúbrica)
const luzFocal = new THREE.SpotLight(0xffffff, 3.5, 35, Math.PI / 4, 0.4, 1.2);
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
      this.vidas[i] = 0;
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
        this.vidas[i] = 0.6 + Math.random() * 0.4;
        this.posiciones[i * 3] = origen.x;
        this.posiciones[i * 3 + 1] = origen.y + 0.8;
        this.posiciones[i * 3 + 2] = origen.z;

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
        this.velocidades[i * 3 + 1] -= 9.8 * delta;
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
// 4. MAPAS Y ESCENARIOS TOTALMENTE DISTINTOS (3 Escenarios)
// Cumple: "Debe contener al menos 3 escenarios totalmente distintos"
// =============================================================
const textureLoader = new THREE.TextureLoader();

// Textura 1: Tatami original de dojo
const texDojo = textureLoader.load('models/ninja/textures/dojo_floor.png');
texDojo.wrapS = THREE.RepeatWrapping;
texDojo.wrapT = THREE.RepeatWrapping;
texDojo.repeat.set(6, 40);

// Textura 2: Asfalto de carretera con líneas de neón
function generarTexturaAsfalto() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111317';
  ctx.fillRect(0, 0, 512, 512);

  // Textura de asfalto con ruido
  for (let i = 0; i < 2000; i++) {
    const rx = Math.random() * 512, ry = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? '#1a1f26' : '#0a0c0e';
    ctx.fillRect(rx, ry, 2, 2);
  }

  // Líneas divisorias viales reflectivas de neón
  ctx.fillStyle = '#00e5ff';
  for (let y = 0; y < 512; y += 64) {
    ctx.fillRect(250, y + 10, 12, 40);
  }
  // Bordes laterales
  ctx.fillStyle = '#ff007f';
  ctx.fillRect(10, 0, 8, 512);
  ctx.fillRect(494, 0, 8, 512);

  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 20);
  return t;
}
const texAsfalto = generarTexturaAsfalto();

// Textura 3: Lava volcánica incandescente y roca basáltica
function generarTexturaLava() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ff3d00';
  ctx.fillRect(0, 0, 512, 512);

  // Grietas de fuego
  ctx.strokeStyle = '#ffee55';
  ctx.lineWidth = 6;
  for (let i = 0; i < 16; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, Math.random() * 512);
    ctx.lineTo(Math.random() * 512, Math.random() * 512);
    ctx.stroke();
  }

  // Costras de roca basáltica oscura
  for (let i = 0; i < 50; i++) {
    const rx = Math.random() * 512, ry = Math.random() * 512, rad = 15 + Math.random() * 30;
    ctx.fillStyle = '#1e0804';
    ctx.beginPath();
    ctx.arc(rx, ry, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 25);
  return t;
}
const texLava = generarTexturaLava();

const largoPista = 140;
const anchoPista = 10;
const sueloGeo = new THREE.PlaneGeometry(anchoPista, largoPista);
const sueloMat = new THREE.MeshStandardMaterial({
  map: texDojo,
  roughness: 0.8,
  metalness: 0.1
});
const suelo = new THREE.Mesh(sueloGeo, sueloMat);
suelo.rotation.x = -Math.PI / 2;
suelo.position.set(0, 0, -35);
suelo.receiveShadow = true;
scene.add(suelo);

// Paredes / Muros laterales
const muroGeo = new THREE.BoxGeometry(0.8, 5, largoPista);
const muroMat = new THREE.MeshStandardMaterial({ color: 0x2b2218, roughness: 0.9 });
const muroIzq = new THREE.Mesh(muroGeo, muroMat);
muroIzq.position.set(-anchoPista / 2 - 0.4, 2.5, -35);
muroIzq.receiveShadow = true;
scene.add(muroIzq);

const muroDer = new THREE.Mesh(muroGeo, muroMat);
muroDer.position.set(anchoPista / 2 + 0.4, 2.5, -35);
muroDer.receiveShadow = true;
scene.add(muroDer);

// Columnas y Pilares Ambientales (Torii / Neón / Magma)
const listaColumnas = [];
const colGeo = new THREE.BoxGeometry(0.6, 6, 0.6);
const colMat = new THREE.MeshStandardMaterial({ color: 0x8b1a1a, roughness: 0.5 });

for (let z = 15; z > -95; z -= 14) {
  const cI = new THREE.Mesh(colGeo, colMat);
  cI.position.set(-anchoPista / 2, 3, z);
  cI.castShadow = true;
  scene.add(cI);
  listaColumnas.push(cI);

  const cD = new THREE.Mesh(colGeo, colMat);
  cD.position.set(anchoPista / 2, 3, z);
  cD.castShadow = true;
  scene.add(cD);
  listaColumnas.push(cD);
}

let escenarioActual = 'dojo';

function aplicarEscenario(esc) {
  escenarioActual = esc;

  if (esc === 'noche' || esc === 'ciudad') {
    // Escenario 2: Asfalto de Noche (Ciudad Cyberpunk)
    scene.background = new THREE.Color(0x050814);
    scene.fog.color.setHex(0x060c18);
    scene.fog.density = 0.014;

    sueloMat.map = texAsfalto;
    sueloMat.color.setHex(0xffffff);
    sueloMat.roughness = 0.3;
    sueloMat.metalness = 0.4;
    sueloMat.needsUpdate = true;

    muroMat.color.setHex(0x0c1424);
    colMat.color.setHex(0x00e5ff); // Postes de luz neón cian
    colMat.emissive = new THREE.Color(0x004488);

    luzAmbiental.color.setHex(0x5c7cfa);
    luzAmbiental.intensity = 1.1;
    luzFocal.color.setHex(0x00e5ff);
  } else if (esc === 'lava' || esc === 'volcan') {
    // Escenario 3: Volcán de Fuego (Lava incandescente)
    scene.background = new THREE.Color(0x200502);
    scene.fog.color.setHex(0x280602);
    scene.fog.density = 0.018;

    sueloMat.map = texLava;
    sueloMat.color.setHex(0xffffff);
    sueloMat.roughness = 0.6;
    sueloMat.metalness = 0.3;
    sueloMat.needsUpdate = true;

    muroMat.color.setHex(0x1a0604);
    colMat.color.setHex(0xff3d00); // Pilares de basalto con magma
    colMat.emissive = new THREE.Color(0x661100);

    luzAmbiental.color.setHex(0xff5722);
    luzAmbiental.intensity = 1.4;
    luzFocal.color.setHex(0xff9100);
  } else {
    // Escenario 1: Tatami Tradicional (Dojo Japonés)
    scene.background = new THREE.Color(0x141820);
    scene.fog.color.setHex(0x141820);
    scene.fog.density = 0.012;

    sueloMat.map = texDojo;
    sueloMat.color.setHex(0xffffff);
    sueloMat.roughness = 0.8;
    sueloMat.metalness = 0.1;
    sueloMat.needsUpdate = true;

    muroMat.color.setHex(0x2b2218);
    colMat.color.setHex(0x8b1a1a); // Columnas rojas Torii tradicionales
    colMat.emissive = new THREE.Color(0x000000);

    luzAmbiental.color.setHex(0xffecc4);
    luzAmbiental.intensity = 1.2;
    luzFocal.color.setHex(0xffffff);
  }
}

// =============================================================
// 5. CARGA DE MODELOS OBJ ORIGINALES DE GITHUB (Ninja y Shuriken)
// =============================================================
const texTraje = textureLoader.load('models/ninja/textures/ninja_suit.png');
const texAcento = textureLoader.load('models/ninja/textures/ninja_accent.png');
const texMetal = textureLoader.load('models/shuriken/textures/shuriken_metal.png');

let plantillaNinja = null;
let plantillaShuriken = null;

function crearModeloKatana() {
  const grupoKatana = new THREE.Group();
  
  const hojaGeo = new THREE.BoxGeometry(0.04, 1.1, 0.08);
  const hojaMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.95,
    roughness: 0.15,
    emissive: 0x224466,
    emissiveIntensity: 0.2
  });
  const hoja = new THREE.Mesh(hojaGeo, hojaMat);
  hoja.position.y = 0.55;
  hoja.castShadow = true;
  grupoKatana.add(hoja);

  const tsubaGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12);
  const tsubaMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });
  const tsuba = new THREE.Mesh(tsubaGeo, tsubaMat);
  tsuba.position.y = 0.015;
  grupoKatana.add(tsuba);

  const tsukaGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8);
  const tsukaMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const tsuka = new THREE.Mesh(tsukaGeo, tsukaMat);
  tsuka.position.y = -0.16;
  grupoKatana.add(tsuka);

  return grupoKatana;
}

function cargarNinja() {
  return new Promise((resolve, reject) => {
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('models/ninja/');
    mtlLoader.load('ninja_walk.mtl', (materials) => {
      materials.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath('models/ninja/');
      objLoader.load('ninja.obj', (obj) => {
        const box = new THREE.Box3().setFromObject(obj);
        obj.position.set(-box.getCenter(new THREE.Vector3()).x, -box.min.y, -box.getCenter(new THREE.Vector3()).z);
        const grupo = new THREE.Group();
        grupo.add(obj);
        obj.traverse((child) => {
          if (child.isMesh && child.material) {
            child.castShadow = true;
            child.receiveShadow = true;
            const m = Array.isArray(child.material) ? child.material[0] : child.material;
            if (m) {
              m.map = texTraje;
              m.roughness = 0.65;
              m.metalness = 0.15;
              m.needsUpdate = true;
            }
          }
        });
        plantillaNinja = grupo;
        resolve(grupo);
      }, undefined, reject);
    }, undefined, reject);
  });
}

function cargarShuriken() {
  return new Promise((resolve, reject) => {
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('models/shuriken/');
    mtlLoader.load('shuriken.mtl', (materials) => {
      materials.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath('models/shuriken/');
      objLoader.load('shuriken.obj', (shuriken) => {
        const box = new THREE.Box3().setFromObject(shuriken);
        shuriken.position.sub(box.getCenter(new THREE.Vector3()));
        const grupo = new THREE.Group();
        grupo.add(shuriken);
        grupo.scale.set(1.2, 1.2, 2.4);
        shuriken.traverse((child) => {
          if (child.isMesh && child.material) {
            child.castShadow = true;
            const m = Array.isArray(child.material) ? child.material[0] : child.material;
            if (m) {
              m.map = texMetal;
              m.metalness = 0.95;
              m.roughness = 0.2;
              m.needsUpdate = true;
            }
          }
        });
        plantillaShuriken = grupo;
        resolve(grupo);
      }, undefined, reject);
    }, undefined, reject);
  });
}

// Fallback temporal en caso de retraso en red
function crearNinjaFallback(colorRopa = 0x153b54) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: colorRopa, roughness: 0.7 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.5), mat);
  torso.position.y = 1.1;
  const cabeza = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat);
  cabeza.position.y = 1.85;
  g.add(torso, cabeza);
  return g;
}

// =============================================================
// 6. CLASE JUGADOR NINJA (CON MODELO ORIGINAL OBJ)
// =============================================================
class JugadorNinja {
  constructor(datos, esLocal = false) {
    this.id = datos.id;
    this.nombre = datos.nombre || 'Ninja';
    this.esLocal = esLocal;
    this.color = datos.color || { hex: 0x2980b9, ropa: 0x153b54, cinta: 0xffffff };
    this.root = new THREE.Group();
    this.root.position.set(datos.x || 0, datos.y || 0, datos.z || 0);
    this.root.rotation.y = Math.PI; // En Three.js, Math.PI orienta al ninja corriendo hacia adelante (-Z)

    this.modelo = null;
    this.asignarModelo();

    // Katana para la animación de parry
    this.katana = crearModeloKatana();
    this.katana.position.set(0.4, 0.9, 0.4);
    this.katana.rotation.set(-0.3, 0, -0.4);
    this.root.add(this.katana);

    // Esfera de Escudo Sagrado
    const geoEscudo = new THREE.SphereGeometry(1.6, 16, 16);
    const matEscudo = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.35, wireframe: true });
    this.escudoMesh = new THREE.Mesh(geoEscudo, matEscudo);
    this.escudoMesh.visible = false;
    this.root.add(this.escudoMesh);

    // Etiqueta flotante con nombre
    this.etiqueta = this.crearEtiqueta(this.esLocal ? `${this.nombre} (Tú)` : this.nombre);
    this.root.add(this.etiqueta);

    this.walkTimer = 0;
    this.targetPos = new THREE.Vector3(datos.x || 0, datos.y || 0, datos.z || 0);
    this.parryTimer = 0;
    scene.add(this.root);
  }

  asignarModelo() {
    if (this.modelo) this.root.remove(this.modelo);
    if (plantillaNinja) {
      this.modelo = plantillaNinja.clone(true);
      this.pintarColor();
    } else {
      this.modelo = crearNinjaFallback(this.color.ropa);
    }
    this.root.add(this.modelo);
  }

  crearEtiqueta(texto) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(10, 10, 236, 44);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, 128, 32);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
    sprite.scale.set(2, 0.5, 1);
    sprite.position.y = 2.4;
    return sprite;
  }

  pintarColor() {
    if (!this.modelo) return;
    this.modelo.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m) => {
            const matClon = m.clone();
            if (matClon && matClon.color) matClon.color.setHex(this.color.ropa || 0x222225);
            return matClon;
          });
        } else {
          child.material = child.material.clone();
          if (child.material && child.material.color) child.material.color.setHex(this.color.ropa || 0x222225);
        }
      }
    });
  }

  actualizar(delta, enMovimiento = false) {
    if (!this.modelo) return;

    if (enMovimiento) {
      this.walkTimer += delta * 14;
      this.modelo.position.y = Math.abs(Math.sin(this.walkTimer)) * 0.16;
      this.modelo.rotation.z = Math.sin(this.walkTimer * 0.5) * 0.05;
    } else {
      this.modelo.position.y = 0;
      this.modelo.rotation.z = 0;
    }

    // Animación de la katana durante el parry
    if (this.parryTimer > 0) {
      this.parryTimer -= delta;
      const progreso = 1 - Math.max(0, this.parryTimer / 0.28);
      const anguloSlash = Math.sin(progreso * Math.PI) * 2.2;
      this.katana.position.set(0.2 - progreso * 0.8, 1.0, 0.6);
      this.katana.rotation.set(0.6, 0.4, -0.6 - anguloSlash);
    } else {
      this.katana.position.set(0.35, 0.85 + (this.modelo.position.y * 0.2), 0.2);
      this.katana.rotation.set(-0.35, 0, -0.35);
    }

    if (escudoTimer > 0 && this.esLocal) {
      this.escudoMesh.visible = true;
      this.escudoMesh.rotation.y += 3.5 * delta;
    } else {
      this.escudoMesh.visible = false;
    }

    if (!this.esLocal) {
      this.root.position.lerp(this.targetPos, 0.2);
    }
  }

  destruir() {
    scene.remove(this.root);
  }
}

// Instanciar jugador local y enemigo IA con el modelo original
const jugador = new JugadorNinja({
  id: 'jugador_local',
  nombre: 'Ninja Shinobi',
  x: 0, y: 0, z: 0,
  color: { hex: 0x2980b9, ropa: 0x153b54, cinta: 0xffffff }
}, true);

// =============================================================
// 7. INTELIGENCIA ARTIFICIAL (SEGUIMIENTO CON CAMPO DE VISIÓN)
// Cumple: "Inteligencia Artificial (seguimiento de enemigos al personaje principal
// cuándo se encuentre en su campo de visión)"
// =============================================================
const enemigoIA = new JugadorNinja({
  id: 'ia_rival',
  nombre: 'Ninja Rival (IA)',
  x: 0, y: 0, z: -28,
  color: { hex: 0xe74c3c, ropa: 0x881111, cinta: 0xff1744 }
}, false);

const RANGO_VISION_IA = 26.0;
const VELOCIDAD_IA = 4.5;

function actualizarIA(delta) {
  if (!juegoActivo || juegoPausado) return;

  const distanciaZ = jugador.root.position.z - enemigoIA.root.position.z;
  const distanciaX = jugador.root.position.x - enemigoIA.root.position.x;

  // Campo de visión frontal (+Z mirando hacia el jugador)
  if (distanciaZ > 0 && distanciaZ <= RANGO_VISION_IA) {
    if (Math.abs(distanciaX) > 0.15) {
      const dir = Math.sign(distanciaX);
      enemigoIA.targetPos.x += dir * VELOCIDAD_IA * delta;
      enemigoIA.targetPos.x = Math.max(-4.2, Math.min(4.2, enemigoIA.targetPos.x));
    }
    enemigoIA.actualizar(delta, true);
  } else {
    // Fuera de visión: patrulla horizontal
    enemigoIA.targetPos.x = Math.sin(clock.getElapsedTime() * 1.5) * 3.2;
    enemigoIA.actualizar(delta, true);
  }
}

// =============================================================
// 8. MULTIJUGADOR EN TIEMPO REAL (SOCKET.IO + P2P WEBRTC / BROADCASTCHANNEL)
// Funciona tanto localmente (Node.js) como en Vercel (P2P entre navegadores)
// =============================================================
class RedDojo {
  constructor() {
    this.socket = null;
    this.socketConectado = false;
    this.peer = null;
    this.peerConexiones = new Map();
    this.peerHostConn = null;
    this.broadcastChannel = null;
    this.isHost = false;
    this.codigoSala = 'GLOBAL';
    this.miId = 'ninja_' + Math.random().toString(36).substring(2, 8);
    this.miNombre = 'Ninja';
    this.jugadores = {};
    this.anfitrionId = null;
    this.listeners = {};
    this.timerUnirse = null;

    if (typeof io === 'function') {
      try {
        this.socket = io({ timeout: 2500, reconnectionAttempts: 2 });
        this.socket.on('connect', () => {
          this.socketConectado = true;
          this.miId = this.socket.id;
          console.log('[RedDojo] Conectado por Socket.io:', this.miId);
        });
        this.socket.on('disconnect', () => {
          this.socketConectado = false;
        });
        this.socket.on('connect_error', () => {
          this.socketConectado = false;
        });

        const eventos = [
          'joinedLobby', 'lobbyUpdate', 'roomError', 'matchStarted',
          'jugadoresActuales', 'nuevoJugador', 'jugadorMovido', 'jugadorSalio'
        ];
        eventos.forEach((evt) => {
          this.socket.on(evt, (datos) => this.disparar(evt, datos));
        });
      } catch (e) {
        console.warn('[RedDojo] Socket.io no disponible:', e);
      }
    }
  }

  on(evento, cb) {
    if (!this.listeners[evento]) this.listeners[evento] = [];
    this.listeners[evento].push(cb);
  }

  disparar(evento, datos) {
    if (this.listeners[evento]) {
      this.listeners[evento].forEach((cb) => {
        try { cb(datos); } catch (e) { console.error(e); }
      });
    }
  }

  generarCodigo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let cod = '';
    for (let i = 0; i < 4; i++) {
      cod += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return cod;
  }

  crearSala(nombre) {
    this.miNombre = nombre || 'Ninja';
    if (this.socket && this.socketConectado) {
      this.socket.emit('createRoom', { userName: this.miNombre });
      return;
    }

    // Modo P2P (Vercel / navegadores)
    this.cerrarCanales();
    this.isHost = true;
    this.codigoSala = this.generarCodigo();
    this.anfitrionId = this.miId;
    this.jugadores = {
      [this.miId]: {
        id: this.miId,
        nombre: this.miNombre,
        x: 0, y: 0, z: 0,
        esAnfitrion: true
      }
    };

    this.iniciarCanalesHost(this.codigoSala);

    this.disparar('joinedLobby', {
      codigoSala: this.codigoSala,
      esAnfitrion: true,
      anfitrionId: this.anfitrionId,
      jugadorLocal: this.jugadores[this.miId],
      todosJugadores: this.jugadores,
      jugadores: this.jugadores
    });
  }

  iniciarCanalesHost(codigo) {
    const canalNombre = 'dojo3d_room_' + codigo.toLowerCase();

    // 1. BroadcastChannel (mismo navegador / distintas pestañas en Vercel)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(canalNombre);
        this.broadcastChannel.onmessage = (e) => this.procesarMensajeHost(e.data);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // 2. PeerJS WebRTC (distintos dispositivos / redes)
    if (typeof Peer !== 'undefined') {
      try {
        const peerId = 'dojoninja-' + codigo.toLowerCase();
        this.peer = new Peer(peerId);
        this.peer.on('connection', (conn) => {
          this.peerConexiones.set(conn.peer, conn);
          conn.on('data', (data) => this.procesarMensajeHost(data, conn));
          conn.on('close', () => {
            this.peerConexiones.delete(conn.peer);
          });
        });
        this.peer.on('error', (err) => {
          console.warn('PeerJS host info:', err.type || err);
        });
      } catch (e) {
        console.warn('PeerJS host error:', e);
      }
    }
  }

  procesarMensajeHost(msg, connDirecta = null) {
    if (!msg || !this.isHost) return;

    if (msg.tipo === 'JOIN_REQUEST') {
      const gId = msg.guestId;
      const gNombre = msg.nombre || 'Ninja Aliado';
      this.jugadores[gId] = {
        id: gId,
        nombre: gNombre,
        x: 0, y: 0, z: 0,
        esAnfitrion: false
      };

      const respuesta = {
        tipo: 'LOBBY_UPDATE',
        codigoSala: this.codigoSala,
        anfitrionId: this.anfitrionId,
        jugadores: this.jugadores,
        targetGuestId: gId
      };

      this.enviarAClientes(respuesta);
      this.disparar('lobbyUpdate', respuesta);
    } else if (msg.tipo === 'PLAYER_MOVED') {
      if (this.jugadores[msg.id]) {
        this.jugadores[msg.id].x = msg.x;
        this.jugadores[msg.id].y = msg.y;
        this.jugadores[msg.id].z = msg.z;
      }
      this.disparar('jugadorMovido', { id: msg.id, x: msg.x, y: msg.y, z: msg.z });
      this.enviarAClientes(msg, msg.id);
    } else if (msg.tipo === 'PLAYER_LEFT') {
      delete this.jugadores[msg.id];
      this.disparar('jugadorSalio', msg.id);
      const update = {
        tipo: 'LOBBY_UPDATE',
        codigoSala: this.codigoSala,
        anfitrionId: this.anfitrionId,
        jugadores: this.jugadores
      };
      this.enviarAClientes(update);
      this.disparar('lobbyUpdate', update);
    }
  }

  unirseASala(codigo, nombre) {
    this.miNombre = nombre || 'Ninja';
    const cod = (codigo || '').trim().toUpperCase();
    if (!cod) {
      this.disparar('roomError', 'Por favor escribe el código de la sala.');
      return;
    }

    if (this.socket && this.socketConectado) {
      this.socket.emit('joinRoom', { userName: this.miNombre, roomCode: cod });
      return;
    }

    // Modo P2P en Vercel
    this.cerrarCanales();
    this.isHost = false;
    this.codigoSala = cod;

    const canalNombre = 'dojo3d_room_' + cod.toLowerCase();
    const req = {
      tipo: 'JOIN_REQUEST',
      guestId: this.miId,
      nombre: this.miNombre
    };

    let conectado = false;

    if (this.timerUnirse) clearTimeout(this.timerUnirse);
    this.timerUnirse = setTimeout(() => {
      if (!conectado) {
        this.disparar('roomError', `No se encontró la sala "${cod}". Verifica que el código sea correcto y el anfitrión esté en el lobby.`);
        this.cerrarCanales();
      }
    }, 4500);

    // 1. BroadcastChannel (para pestañas en el mismo navegador)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(canalNombre);
        this.broadcastChannel.onmessage = (e) => {
          const msg = e.data;
          if (msg && (msg.tipo === 'LOBBY_UPDATE' || msg.tipo === 'MATCH_STARTED' || msg.tipo === 'PLAYER_MOVED' || msg.tipo === 'PLAYER_LEFT')) {
            conectado = true;
            if (this.timerUnirse) clearTimeout(this.timerUnirse);
            this.procesarMensajeGuest(msg);
          }
        };
        this.broadcastChannel.postMessage(req);
        // Reintentos rápidos por si el host tardó unos milisegundos en inicializar
        setTimeout(() => { if (!conectado && this.broadcastChannel) this.broadcastChannel.postMessage(req); }, 300);
        setTimeout(() => { if (!conectado && this.broadcastChannel) this.broadcastChannel.postMessage(req); }, 800);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // 2. PeerJS WebRTC (para distintos navegadores / dispositivos)
    if (typeof Peer !== 'undefined') {
      try {
        this.peer = new Peer();
        this.peer.on('open', () => {
          const targetId = 'dojoninja-' + cod.toLowerCase();
          const conn = this.peer.connect(targetId);
          this.peerHostConn = conn;
          conn.on('open', () => {
            conn.send(req);
          });
          conn.on('data', (data) => {
            conectado = true;
            if (this.timerUnirse) clearTimeout(this.timerUnirse);
            this.procesarMensajeGuest(data);
          });
        });
        this.peer.on('error', (err) => {
          console.warn('PeerJS guest info:', err.type || err);
        });
      } catch (e) {
        console.warn('PeerJS guest error:', e);
      }
    }
  }

  procesarMensajeGuest(msg) {
    if (!msg) return;

    if (msg.tipo === 'LOBBY_UPDATE') {
      this.anfitrionId = msg.anfitrionId;
      this.jugadores = msg.jugadores || {};
      this.disparar('joinedLobby', {
        codigoSala: this.codigoSala,
        esAnfitrion: false,
        anfitrionId: this.anfitrionId,
        jugadorLocal: this.jugadores[this.miId] || { id: this.miId, nombre: this.miNombre },
        todosJugadores: this.jugadores,
        jugadores: this.jugadores
      });
      this.disparar('lobbyUpdate', msg);
    } else if (msg.tipo === 'MATCH_STARTED') {
      this.jugadores = msg.todosJugadores || this.jugadores;
      this.disparar('matchStarted', msg);
      this.disparar('jugadoresActuales', this.jugadores);
    } else if (msg.tipo === 'PLAYER_MOVED') {
      if (msg.id !== this.miId) {
        this.disparar('jugadorMovido', { id: msg.id, x: msg.x, y: msg.y, z: msg.z });
      }
    } else if (msg.tipo === 'PLAYER_LEFT') {
      if (msg.id !== this.miId) {
        this.disparar('jugadorSalio', msg.id);
      }
    }
  }

  iniciarPartidaLobby() {
    if (this.socket && this.socketConectado) {
      this.socket.emit('startLobbyMatch');
      return;
    }

    if (this.isHost) {
      const msg = {
        tipo: 'MATCH_STARTED',
        codigoSala: this.codigoSala,
        todosJugadores: this.jugadores
      };
      this.enviarAClientes(msg);
      this.disparar('matchStarted', msg);
      this.disparar('jugadoresActuales', this.jugadores);
    }
  }

  entrarJuego(datos) {
    if (this.socket && this.socketConectado) {
      this.socket.emit('entrarJuego', datos);
    }
  }

  enviarMovimiento(pos) {
    if (this.socket && this.socketConectado) {
      this.socket.emit('mover', pos);
      return;
    }

    const msg = {
      tipo: 'PLAYER_MOVED',
      id: this.miId,
      x: pos.x,
      y: pos.y,
      z: pos.z
    };

    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.broadcastChannel) this.broadcastChannel.postMessage(msg);
      if (this.peerHostConn && this.peerHostConn.open) {
        this.peerHostConn.send(msg);
      }
    }
  }

  enviarAClientes(msg, remitenteId = null) {
    if (this.broadcastChannel) {
      try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
    this.peerConexiones.forEach((conn, id) => {
      if (remitenteId && id === remitenteId) return;
      if (conn && conn.open) {
        try { conn.send(msg); } catch (e) {}
      }
    });
  }

  salir() {
    if (this.timerUnirse) clearTimeout(this.timerUnirse);
    if (this.socket && this.socketConectado) {
      this.socket.emit('leaveGame');
    }
    const msg = { tipo: 'PLAYER_LEFT', id: this.miId };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
      if (this.peerHostConn && this.peerHostConn.open) try { this.peerHostConn.send(msg); } catch (e) {}
    }
    this.cerrarCanales();
  }

  cerrarCanales() {
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch (e) {}
      this.broadcastChannel = null;
    }
    this.peerConexiones.forEach((conn) => {
      try { conn.close(); } catch (e) {}
    });
    this.peerConexiones.clear();
    if (this.peerHostConn) {
      try { this.peerHostConn.close(); } catch (e) {}
      this.peerHostConn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    this.isHost = false;
  }
}

let otrosJugadores = {};
let codigoSalaActual = 'GLOBAL';
const red = new RedDojo();

function renderizarLobby(datos) {
  const pantallaLobby = document.getElementById('pantalla-lobby');
  if (!pantallaLobby) return;

  const errEl = document.getElementById('error-unirse-sala');
  if (errEl) errEl.style.display = 'none';

  const menuInicio = document.getElementById('menu-inicio');
  if (menuInicio) menuInicio.style.display = 'none';

  const modalUnirse = document.getElementById('modal-unirse-sala');
  if (modalUnirse) modalUnirse.style.display = 'none';

  const pantallaGameOver = document.getElementById('pantalla-gameover');
  if (pantallaGameOver) pantallaGameOver.style.display = 'none';

  const hudJuego = document.getElementById('hud-juego');
  if (hudJuego) hudJuego.style.display = 'none';

  pantallaLobby.style.display = 'flex';

  codigoSalaActual = datos.codigoSala || 'GLOBAL';
  const lobbyCodigo = document.getElementById('lobby-codigo-sala');
  if (lobbyCodigo) lobbyCodigo.textContent = codigoSalaActual;

  const jugadoresObj = datos.jugadores || {};
  const listaIds = Object.keys(jugadoresObj);
  const lobbyContador = document.getElementById('lobby-contador-jugadores');
  if (lobbyContador) lobbyContador.textContent = `${listaIds.length} ninja(s)`;

  const lobbyLista = document.getElementById('lobby-lista-jugadores');
  if (lobbyLista) {
    lobbyLista.innerHTML = '';
    listaIds.forEach((id) => {
      const j = jugadoresObj[id];
      const esAnf = id === datos.anfitrionId;
      const esYo = id === red.miId;

      const div = document.createElement('div');
      div.style.cssText = 'background: #222222; border: 1px solid #444444; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-size: 13px;';
      div.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-block; width:8px; height:8px; background:#4caf50;"></span>
          <span style="${esYo ? 'color:#64b5f6; font-weight:bold;' : 'color:#ffffff;'}">${j.nombre || 'Ninja'} ${esYo ? '(Tú)' : ''}</span>
        </div>
        ${esAnf ? '<span style="background:#ff9800; color:#000000; font-size:10px; font-weight:bold; padding:2px 6px;">ANFITRIÓN</span>' : '<span style="color:#888888; font-size:11px;">Listo</span>'}
      `;
      lobbyLista.appendChild(div);
    });
  }

  const soyAnfitrion = (datos.anfitrionId === red.miId || red.isHost);
  const btnIniciarLobby = document.getElementById('btn-iniciar-partida-lobby');
  if (btnIniciarLobby) btnIniciarLobby.style.display = soyAnfitrion ? 'block' : 'none';

  const lobbyAvisoEspera = document.getElementById('lobby-aviso-espera');
  if (lobbyAvisoEspera) lobbyAvisoEspera.style.display = soyAnfitrion ? 'none' : 'block';
}

red.on('joinedLobby', (datos) => {
  renderizarLobby(datos);
});

red.on('lobbyUpdate', (datos) => {
  renderizarLobby(datos);
});

red.on('roomError', (msg) => {
  const errEl = document.getElementById('error-unirse-sala');
  if (errEl) {
    errEl.textContent = msg;
    errEl.style.color = '#ff5252';
    errEl.style.display = 'block';
  } else {
    alert(msg);
  }
});

red.on('matchStarted', (datos) => {
  const pantallaLobby = document.getElementById('pantalla-lobby');
  if (pantallaLobby) pantallaLobby.style.display = 'none';
  if (datos && datos.codigoSala) codigoSalaActual = datos.codigoSala;
  empezarPartida();
});

red.on('jugadoresActuales', (lista) => {
  Object.keys(lista).forEach(id => {
    if (id !== red.miId && !otrosJugadores[id]) {
      otrosJugadores[id] = new JugadorNinja({
        id,
        nombre: lista[id].nombre || 'Ninja Aliado',
        x: lista[id].x || 0,
        y: 0,
        z: lista[id].z || 0,
        color: { hex: 0xf39c12, ropa: 0x8c2a2a, cinta: 0xffb74d }
      }, false);
    }
  });
});

red.on('nuevoJugador', (datos) => {
  if (datos.id !== red.miId && !otrosJugadores[datos.id]) {
    otrosJugadores[datos.id] = new JugadorNinja({
      id: datos.id,
      nombre: datos.nombre || 'Ninja Aliado',
      x: datos.x || 0,
      y: 0,
      z: datos.z || 0,
      color: { hex: 0xf39c12, ropa: 0x8c2a2a, cinta: 0xffb74d }
    }, false);
  }
});

red.on('jugadorMovido', (datos) => {
  if (otrosJugadores[datos.id]) {
    otrosJugadores[datos.id].targetPos.x = datos.x;
  }
});

red.on('jugadorSalio', (id) => {
  if (otrosJugadores[id]) {
    otrosJugadores[id].destruir();
    delete otrosJugadores[id];
  }
});

// =============================================================
// 9. ÍTEMS ESPECIALES PROCEDURALES (3 Ítems)
// Cumple: "Uso de 'ítems' (objetos especiales) (3 como mínimo)"
// =============================================================
// ÍTEM 1: Pergamino Sagrado (+100 Puntos)
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
  const corcho = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.15, 10), new THREE.MeshStandardMaterial({ color: 0x8d6e63 }));
  corcho.position.y = 0.62;
  g.add(cuerpo, cuello, corcho);
  g.scale.set(1.1, 1.1, 1.1);
  return g;
}

// ÍTEM 3: Escudo Sagrado (Absorbe impactos)
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
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.04, 8, 24), new THREE.MeshBasicMaterial({ color: 0x80d8ff, wireframe: true }));
  anillo.rotation.x = Math.PI / 4;
  g.add(esfera, anillo);
  g.anillo = anillo;
  g.scale.set(1.1, 1.1, 1.1);
  return g;
}

function crearShurikenMesh() {
  if (plantillaShuriken) {
    const s = plantillaShuriken.clone(true);
    s.rotation.set(Math.PI / 2, 0, 0);
    return s;
  }
  // Fallback procedural
  const g = new THREE.Group();
  const matMetal = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.95, roughness: 0.2 });
  const centro = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 8), matMetal);
  centro.rotation.x = Math.PI / 2;
  g.add(centro);
  for (let i = 0; i < 4; i++) {
    const hoja = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 4), matMetal);
    const ang = (i * Math.PI) / 2;
    hoja.position.set(Math.cos(ang) * 0.7, Math.sin(ang) * 0.7, 0);
    hoja.rotation.z = ang - Math.PI / 2;
    g.add(hoja);
  }
  g.scale.set(1.1, 1.1, 1.1);
  return g;
}

// =============================================================
// 10. ESTADO DEL JUEGO Y CONTROLES (CON TECLA ESCAPE PARA PAUSA)
// =============================================================
let juegoActivo = false;
let juegoPausado = false;
let vidas = 3;
let puntos = 0;
let tiempo = 30; // 30 segundos fijos según rúbrica
let modoActual = 'esquivar';
let dificultadActual = 'facil';
let velocidadObstaculos = 18;
let parryTimer = 0;
let escudoTimer = 0;
let intervaloTiempo = null;

const teclas = { izquierda: false, derecha: false };

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') teclas.izquierda = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') teclas.derecha = true;
  if (e.key === ' ' || e.code === 'Space') {
    if (juegoActivo && !juegoPausado && parryTimer <= 0) {
      parryTimer = 0.28;
      jugador.parryTimer = 0.28;
      audio.playParry();
      particulas.emitir(jugador.root.position, 0x64b5f6, 15);
    }
  }
  // PAUSA CON TECLA ESCAPE O P
  if (e.key === 'Escape' || e.key === 'Esc' || e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    alternarPausa();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') teclas.izquierda = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') teclas.derecha = false;
});

// Listener en tiempo real para cambio de escenario en el selector
const selEscenarioEl = document.getElementById('sel-escenario');
if (selEscenarioEl) {
  selEscenarioEl.addEventListener('change', (e) => {
    aplicarEscenario(e.target.value);
  });
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
    const posX = (Math.random() * 8) - 4;
    const rand = Math.random();
    let obj;

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
// 12. DETECCIÓN Y USO DE COLISIONES
// =============================================================
function procesarColisiones() {
  const localPos = jugador.root.position;
  const esParry = parryTimer > 0;
  const conEscudo = escudoTimer > 0;

  for (let i = obstaculos.length - 1; i >= 0; i--) {
    const obj = obstaculos[i];
    const dx = Math.abs(obj.position.x - localPos.x);
    const dz = obj.position.z - localPos.z;

    // Colisión física
    if (dx < 1.15 && Math.abs(dz) < 1.0) {
      scene.remove(obj);
      obstaculos.splice(i, 1);

      if (obj.tipo === 'item_pocion') {
        vidas = Math.min(3, vidas + 1);
        puntos += 30;
        audio.playItem();
        particulas.emitir(localPos, 0xff1744, 25);
        mostrarAviso('hud-aviso-cerca', '❤️ +1 VIDA');
        actualizarHUD();
        continue;
      }

      if (obj.tipo === 'item_escudo') {
        escudoTimer = 6.0;
        audio.playItem();
        particulas.emitir(localPos, 0x00e5ff, 30);
        mostrarAviso('hud-aviso-parry', '🛡️ ESCUDO ACTIVO (6s)');
        actualizarHUD();
        continue;
      }

      if (obj.tipo === 'item_pergamino') {
        puntos += 200;
        audio.playItem();
        particulas.emitir(localPos, 0xffd54f, 35);
        mostrarAviso('hud-aviso-parry', '📜 PERGAMINO +200');
        actualizarHUD();
        continue;
      }

      if (obj.tipo === 'shuriken') {
        if (esParry && dz >= -1.8 && dz <= 0.4) {
          puntos += 150;
          audio.playParry();
          particulas.emitir(localPos, 0x64b5f6, 30);
          mostrarAviso('hud-aviso-parry', '⚔️ PARRY KATANA +150');
        } else if (conEscudo) {
          audio.playParry();
          particulas.emitir(localPos, 0x00e5ff, 20);
          mostrarAviso('hud-aviso-cerca', '🛡️ ¡ESCUDO ABSORBIÓ!');
        } else {
          vidas--;
          audio.playGolpe();
          particulas.emitir(localPos, 0xe53935, 25);
          flashImpacto();
          actualizarHUD();
          if (vidas <= 0) {
            terminarJuego('¡Has caído en batalla!');
          }
        }
      } else if (obj.tipo === 'pergamino') {
        puntos += 50;
        audio.playItem();
        particulas.emitir(localPos, 0xffb300, 20);
        mostrarAviso('hud-aviso-cerca', '+50 PERGAMINO');
        actualizarHUD();
      }
      continue;
    }

    // Pasó de largo
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
    let seMueve = false;
    if (teclas.izquierda && jugador.root.position.x > -4.2) {
      jugador.root.position.x -= 8.5 * delta;
      seMueve = true;
    }
    if (teclas.derecha && jugador.root.position.x < 4.2) {
      jugador.root.position.x += 8.5 * delta;
      seMueve = true;
    }

    if (parryTimer > 0) parryTimer -= delta;
    if (escudoTimer > 0) escudoTimer -= delta;

    jugador.actualizar(delta, seMueve);
    luzFocal.target = jugador.root;

    // Multijugador
    red.enviarMovimiento({ x: jugador.root.position.x, y: 0, z: 0 });

    // Inteligencia Artificial enemiga
    actualizarIA(delta);

    // Obstáculos
    generarElemento(delta);
    for (let i = 0; i < obstaculos.length; i++) {
      const obs = obstaculos[i];
      obs.position.z += velocidadObstaculos * delta;
      if (obs.tipo === 'shuriken') {
        obs.rotation.z += 25 * delta;
      } else if (obs.anillo) {
        obs.anillo.rotation.z += 4 * delta;
        obs.rotation.y += 2 * delta;
      } else {
        obs.rotation.y += 3 * delta;
      }
    }

    procesarColisiones();
  }

  particulas.actualizar(delta);
  renderer.render(scene, camera);
}

// =============================================================
// 14. CONTROL DE MENÚS Y FLUJO DE PARTIDA
// =============================================================
function actualizarHUD() {
  document.getElementById('hud-puntos').textContent = puntos;
  document.getElementById('hud-tiempo').textContent = `TIEMPO 00:${tiempo < 10 ? '0' : ''}${tiempo}`;
  const tagSala = document.getElementById('hud-sala-tag');
  if (tagSala) {
    tagSala.textContent = codigoSalaActual === 'GLOBAL' ? `MODO: ${modoActual.toUpperCase()}` : `SALA: ${codigoSalaActual} | ${modoActual.toUpperCase()}`;
  }
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`vida-${i}`);
    if (el) el.classList.toggle('perdida', i > vidas);
  }
}

function empezarPartida() {
  const lobby = document.getElementById('pantalla-lobby');
  if (lobby) lobby.style.display = 'none';
  const modalUnirse = document.getElementById('modal-unirse-sala');
  if (modalUnirse) modalUnirse.style.display = 'none';

  modoActual = (document.getElementById('sel-modo') || document.getElementById('modo-juego')).value;
  dificultadActual = (document.getElementById('sel-dificultad') || document.getElementById('dificultad-juego')).value;
  const esc = (document.getElementById('sel-escenario') || document.getElementById('escenario-juego')).value;
  aplicarEscenario(esc);

  velocidadObstaculos = dificultadActual === 'dificil' ? 24 : 17;
  vidas = 3;
  puntos = 0;
  tiempo = 30; // 30s fijos
  juegoActivo = true;
  juegoPausado = false;
  jugador.root.position.set(0, 0, 0);

  obstaculos.forEach(o => scene.remove(o));
  obstaculos = [];

  document.getElementById('menu-inicio').style.display = 'none';
  document.getElementById('pantalla-gameover').style.display = 'none';
  document.getElementById('menu-pausa').style.display = 'none';
  document.getElementById('hud-juego').style.display = 'block';

  actualizarHUD();
  audio.iniciarBGM();

  const nombre = ((document.getElementById('input-nombre') || document.getElementById('nombre-jugador')).value) || 'Ninja';
  red.entrarJuego({ nombre, codigoSala: codigoSalaActual });

  if (red.jugadores) {
    Object.keys(red.jugadores).forEach(id => {
      if (id !== red.miId && !otrosJugadores[id]) {
        otrosJugadores[id] = new JugadorNinja({
          id,
          nombre: red.jugadores[id].nombre || 'Ninja Aliado',
          x: red.jugadores[id].x || 0,
          y: 0,
          z: red.jugadores[id].z || 0,
          color: { hex: 0xf39c12, ropa: 0x8c2a2a, cinta: 0xffb74d }
        }, false);
      }
    });
  }

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
  document.getElementById('gameover-stats').textContent = `Dificultad: ${dificultadActual.toUpperCase()} | Modo: ${modoActual.toUpperCase()} | Escenario: ${escenarioActual.toUpperCase()}`;
  document.getElementById('pantalla-gameover').style.display = 'flex';

  const nombre = ((document.getElementById('input-nombre') || document.getElementById('nombre-jugador')).value) || 'Ninja Anónimo';
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

  red.salir();
  Object.keys(otrosJugadores).forEach(id => {
    if (otrosJugadores[id]) otrosJugadores[id].destruir();
  });
  otrosJugadores = {};

  const pantallaLobby = document.getElementById('pantalla-lobby');
  if (pantallaLobby) pantallaLobby.style.display = 'none';
  const modalUnirse = document.getElementById('modal-unirse-sala');
  if (modalUnirse) modalUnirse.style.display = 'none';
  const modalPunt = document.getElementById('modal-puntuaciones');
  if (modalPunt) modalPunt.style.display = 'none';
  const modalOpc = document.getElementById('modal-opciones');
  if (modalOpc) modalOpc.style.display = 'none';

  document.getElementById('menu-inicio').style.display = 'flex';
  document.getElementById('menu-pausa').style.display = 'none';
  document.getElementById('pantalla-gameover').style.display = 'none';
  document.getElementById('hud-juego').style.display = 'none';
}

// =============================================================
// 15. LISTENERS DE BOTONES Y MENÚS
// =============================================================
function vincularClick(id, fn) {
  const el = document.getElementById(id);
  if (el) el.onclick = fn;
}

vincularClick('btn-jugar', () => {
  codigoSalaActual = 'GLOBAL';
  empezarPartida();
});
vincularClick('btn-comenzar', () => {
  codigoSalaActual = 'GLOBAL';
  empezarPartida();
});
vincularClick('btn-reintentar', empezarPartida);
vincularClick('btn-pausa-hud', pausarJuego);
vincularClick('btn-reanudar', reanudarJuego);
vincularClick('btn-salir-menu', volverAlMenu);
vincularClick('btn-pausa-salir', volverAlMenu);
vincularClick('btn-gameover-salir', volverAlMenu);

// BOTONES DE SALA Y LOBBY
vincularClick('btn-crear-sala', () => {
  const nombre = ((document.getElementById('input-nombre') || document.getElementById('nombre-jugador')).value) || 'Ninja Shinobi';
  red.crearSala(nombre);
});

vincularClick('btn-unirse-sala', () => {
  const errEl = document.getElementById('error-unirse-sala');
  if (errEl) errEl.style.display = 'none';
  const inputCod = document.getElementById('input-codigo-sala');
  if (inputCod) inputCod.value = '';
  const modal = document.getElementById('modal-unirse-sala');
  if (modal) modal.style.display = 'flex';
});

vincularClick('btn-cancelar-unirse', () => {
  if (red.timerUnirse) clearTimeout(red.timerUnirse);
  const modal = document.getElementById('modal-unirse-sala');
  if (modal) modal.style.display = 'none';
});

vincularClick('btn-confirmar-unirse', () => {
  const inputCod = document.getElementById('input-codigo-sala');
  const codigo = inputCod ? inputCod.value.trim().toUpperCase() : '';
  const errEl = document.getElementById('error-unirse-sala');
  if (!codigo) {
    if (errEl) {
      errEl.textContent = 'Por favor escribe el código de la sala.';
      errEl.style.color = '#ff5252';
      errEl.style.display = 'block';
    }
    return;
  }
  if (errEl) {
    errEl.textContent = 'Buscando sala ' + codigo + '...';
    errEl.style.color = '#ffb74d';
    errEl.style.display = 'block';
  }
  const nombre = ((document.getElementById('input-nombre') || document.getElementById('nombre-jugador')).value) || 'Ninja Shinobi';
  red.unirseASala(codigo, nombre);
});

vincularClick('btn-iniciar-partida-lobby', () => {
  red.iniciarPartidaLobby();
});

vincularClick('btn-salir-lobby', () => {
  red.salir();
  volverAlMenu();
});

const btnSonido = document.getElementById('btn-sonido-toggle');
if (btnSonido) {
  btnSonido.onclick = () => {
    const sonando = audio.alternarBGM();
    btnSonido.textContent = sonando ? '🔊 MÚSICA' : '🔇 MÚSICA';
  };
}

function abrirConfig() {
  const m = document.getElementById('modal-opciones');
  if (m) m.style.display = 'flex';
}
vincularClick('btn-configuracion', abrirConfig);
vincularClick('btn-opciones', abrirConfig);
vincularClick('btn-pausa-opciones', abrirConfig);

vincularClick('btn-cerrar-opciones', () => {
  const m = document.getElementById('modal-opciones');
  if (m) m.style.display = 'none';
});

const cfgFocal = document.getElementById('cfg-luz-focal') || document.getElementById('sel-color-luz');
if (cfgFocal) {
  cfgFocal.onchange = (e) => {
    const val = e.target.value;
    luzFocal.color.set(val.startsWith('0x') ? parseInt(val) : val);
  };
}

const cfgAmb = document.getElementById('cfg-luz-ambiental') || document.getElementById('sel-luz-ambiente');
if (cfgAmb) {
  cfgAmb.oninput = (e) => {
    luzAmbiental.intensity = parseFloat(e.target.value);
  };
  cfgAmb.onchange = (e) => {
    luzAmbiental.intensity = parseFloat(e.target.value);
  };
}

const cfgSombras = document.getElementById('cfg-sombras') || document.getElementById('sel-sombras');
if (cfgSombras) {
  cfgSombras.onchange = (e) => {
    const v = e.target.value;
    renderer.shadowMap.enabled = (v === 'none' ? false : (e.target.checked !== undefined ? e.target.checked : true));
  };
}

vincularClick('btn-puntuaciones', () => {
  const modal = document.getElementById('modal-puntuaciones');
  if (modal) modal.style.display = 'flex';
  const lista = document.getElementById('lista-puntuaciones-tabla');
  if (lista) lista.innerHTML = 'Consultando servicio web...';

  fetch('/api/puntuaciones')
    .then(r => r.json())
    .then(datos => {
      if (!lista) return;
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
      if (lista) lista.innerHTML = 'Error al consultar el servicio web.';
    });
});

vincularClick('btn-cerrar-puntuaciones', () => {
  const m = document.getElementById('modal-puntuaciones');
  if (m) m.style.display = 'none';
});

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

vincularClick('btn-share-whatsapp', compartirWhatsApp);
vincularClick('btn-share-twitter', compartirTwitter);
vincularClick('btn-share-facebook', compartirFacebook);
vincularClick('btn-share-instagram', compartirInstagram);

vincularClick('btn-gameover-whatsapp', compartirWhatsApp);
vincularClick('btn-gameover-twitter', compartirTwitter);
vincularClick('btn-gameover-facebook', compartirFacebook);
vincularClick('btn-gameover-instagram', compartirInstagram);

// =============================================================
// 17. INICIALIZACIÓN CON CARGA DE MODELOS OBJ
// =============================================================
async function init() {
  try {
    await Promise.all([cargarNinja(), cargarShuriken()]);
    // Asignar el modelo OBJ cargado al jugador, rival IA y multijugador
    if (jugador) jugador.asignarModelo();
    if (enemigoIA) enemigoIA.asignarModelo();
    Object.values(otrosJugadores).forEach(j => j.asignarModelo());
    console.log('Modelos OBJ originales del Ninja y Shuriken cargados con éxito!');
  } catch (err) {
    console.warn('Carga asíncrona completada con fallback activo:', err);
  }

  // Ocultar pantalla de carga
  const pCarga = document.getElementById('pantalla-carga');
  if (pCarga) pCarga.style.display = 'none';

  animate();
}

init();
