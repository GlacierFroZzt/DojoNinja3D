import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

class SistemaSonido {
  constructor() {
    this.ctx = null;
    this.musicaActiva = false;
    this.volumenMusica = 0.7;
    this.volumenSFX = 0.8;
    this.katanaBuffer = null;

    try {
      const vm = localStorage.getItem('dojo_vol_musica');
      if (vm !== null) this.volumenMusica = parseFloat(vm);
      const vs = localStorage.getItem('dojo_vol_sfx');
      if (vs !== null) this.volumenSFX = parseFloat(vs);
    } catch (e) {}

    this.bgmAudio = new Audio('audio/musica.mp3');
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = this.volumenMusica;
  }

  iniciar() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.cargarKatanaAudio();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  cargarKatanaAudio() {
    if (this.katanaBuffer || !this.ctx) return;
    fetch('audio/katana.mp3')
      .then(res => res.arrayBuffer())
      .then(ab => this.ctx.decodeAudioData(ab))
      .then(buf => { this.katanaBuffer = buf; })
      .catch(() => {});
  }

  playEspadazo() {
    this.iniciar();
    if (this.volumenSFX <= 0) return;

    if (this.ctx && this.katanaBuffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.katanaBuffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.volumenSFX, this.ctx.currentTime);
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(0);
        return;
      } catch (e) {}
    }

    try {
      const a = new Audio('audio/katana.mp3');
      a.volume = this.volumenSFX;
      a.play().catch(() => {});
    } catch (e) {}
  }

  playParry() {
    this.playEspadazo();
  }

  playItem() {
    this.iniciar();
    if (!this.ctx || this.volumenSFX <= 0) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.25 * this.volumenSFX, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  playGolpe() {
    this.iniciar();
    if (!this.ctx || this.volumenSFX <= 0) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.4 * this.volumenSFX, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  iniciarBGM(desdeInicio = false) {
    this.iniciar();
    this.musicaActiva = true;
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.volumenMusica;
      this.bgmAudio.loop = true;
      if (desdeInicio) {
        try { this.bgmAudio.currentTime = 0; } catch (e) {}
      }
      this.bgmAudio.play().catch(() => {});
    }
  }

  detenerBGM() {
    this.musicaActiva = false;
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }

  reanudarBGM() {
    if (this.musicaActiva && this.bgmAudio && this.bgmAudio.paused) {
      this.bgmAudio.play().catch(() => {});
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

  setVolumenMusica(vol) {
    this.volumenMusica = Math.max(0, Math.min(1, vol));
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.volumenMusica;
    }
    try { localStorage.setItem('dojo_vol_musica', this.volumenMusica.toString()); } catch (e) {}
  }

  setVolumenSFX(vol) {
    this.volumenSFX = Math.max(0, Math.min(1, vol));
    try { localStorage.setItem('dojo_vol_sfx', this.volumenSFX.toString()); } catch (e) {}
  }
}

const audio = new SistemaSonido();

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

const luzAmbiental = new THREE.AmbientLight(0xffecc4, 1.2);
scene.add(luzAmbiental);

const luzFocal = new THREE.SpotLight(0xffffff, 3.5, 35, Math.PI / 4, 0.4, 1.2);
luzFocal.position.set(0, 8, 4);
luzFocal.castShadow = true;
luzFocal.shadow.mapSize.width = 1024;
luzFocal.shadow.mapSize.height = 1024;
scene.add(luzFocal);

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

const textureLoader = new THREE.TextureLoader();

const texDojo = textureLoader.load('models/ninja/textures/dojo_floor.png');
texDojo.wrapS = THREE.RepeatWrapping;
texDojo.wrapT = THREE.RepeatWrapping;
texDojo.repeat.set(6, 40);

function generarTexturaAsfalto() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111317';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 2000; i++) {
    const rx = Math.random() * 512, ry = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? '#1a1f26' : '#0a0c0e';
    ctx.fillRect(rx, ry, 2, 2);
  }

  ctx.fillStyle = '#00e5ff';
  for (let y = 0; y < 512; y += 64) {
    ctx.fillRect(250, y + 10, 12, 40);
  }

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

function generarTexturaLava() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ff3d00';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#ffee55';
  ctx.lineWidth = 6;
  for (let i = 0; i < 16; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, Math.random() * 512);
    ctx.lineTo(Math.random() * 512, Math.random() * 512);
    ctx.stroke();
  }

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

    scene.background = new THREE.Color(0x050814);
    scene.fog.color.setHex(0x060c18);
    scene.fog.density = 0.014;

    sueloMat.map = texAsfalto;
    sueloMat.color.setHex(0xffffff);
    sueloMat.roughness = 0.3;
    sueloMat.metalness = 0.4;
    sueloMat.needsUpdate = true;

    muroMat.color.setHex(0x0c1424);
    colMat.color.setHex(0x00e5ff);
    colMat.emissive = new THREE.Color(0x004488);

    luzAmbiental.color.setHex(0x5c7cfa);
    luzAmbiental.intensity = 1.1;
    luzFocal.color.setHex(0x00e5ff);
  } else if (esc === 'lava' || esc === 'volcan') {

    scene.background = new THREE.Color(0x200502);
    scene.fog.color.setHex(0x280602);
    scene.fog.density = 0.018;

    sueloMat.map = texLava;
    sueloMat.color.setHex(0xffffff);
    sueloMat.roughness = 0.6;
    sueloMat.metalness = 0.3;
    sueloMat.needsUpdate = true;

    muroMat.color.setHex(0x1a0604);
    colMat.color.setHex(0xff3d00);
    colMat.emissive = new THREE.Color(0x661100);

    luzAmbiental.color.setHex(0xff5722);
    luzAmbiental.intensity = 1.4;
    luzFocal.color.setHex(0xff9100);
  } else {

    scene.background = new THREE.Color(0x141820);
    scene.fog.color.setHex(0x141820);
    scene.fog.density = 0.012;

    sueloMat.map = texDojo;
    sueloMat.color.setHex(0xffffff);
    sueloMat.roughness = 0.8;
    sueloMat.metalness = 0.1;
    sueloMat.needsUpdate = true;

    muroMat.color.setHex(0x2b2218);
    colMat.color.setHex(0x8b1a1a);
    colMat.emissive = new THREE.Color(0x000000);

    luzAmbiental.color.setHex(0xffecc4);
    luzAmbiental.intensity = 1.2;
    luzFocal.color.setHex(0xffffff);
  }
}

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

class JugadorNinja {
  constructor(datos, esPropio = false) {
    this.id = datos.id;
    this.nombre = datos.nombre || 'Ninja';
    this.esPropio = esPropio;
    this.color = datos.color || { hex: 0x2980b9, ropa: 0x153b54, cinta: 0xffffff };
    this.root = new THREE.Group();
    this.root.position.set(datos.x || 0, datos.y || 0, datos.z || 0);
    this.root.rotation.y = Math.PI;

    this.modelo = null;
    this.asignarModelo();

    this.katana = crearModeloKatana();
    this.katana.position.set(0.4, 0.9, 0.4);
    this.katana.rotation.set(-0.3, 0, -0.4);
    this.root.add(this.katana);

    const geoEscudo = new THREE.SphereGeometry(1.6, 16, 16);
    const matEscudo = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.35, wireframe: true });
    this.escudoMesh = new THREE.Mesh(geoEscudo, matEscudo);
    this.escudoMesh.visible = false;
    this.root.add(this.escudoMesh);

    this.escudoTimer = 0;
    this.estaMuerto = false;

    this.etiqueta = this.crearEtiqueta(this.esPropio ? `${this.nombre} (Tú)` : this.nombre);
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
    c.width = 360; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(6, 6, 348, 52);
    const bordeHex = (this.color && this.color.ropa) ? '#' + (this.color.ropa).toString(16).padStart(6, '0') : '#64b5f6';
    ctx.strokeStyle = bordeHex;
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, 348, 52);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, 180, 32);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
    sprite.scale.set(3.0, 0.55, 1);
    sprite.position.y = 2.4;
    return sprite;
  }

  actualizarEtiqueta(texto) {
    if (this.etiqueta) this.root.remove(this.etiqueta);
    this.etiqueta = this.crearEtiqueta(texto);
    this.root.add(this.etiqueta);
  }

  cambiarColor(colorRopa) {
    this.color.ropa = colorRopa;
    if (this.modelo) {
      if (plantillaNinja) {
        this.pintarColor();
      } else {
        this.asignarModelo();
      }
    }
  }

  morir() {
    this.estaMuerto = true;
    this.escudoTimer = 0;
    if (this.escudoMesh) this.escudoMesh.visible = false;
    if (this.modelo) {
      this.modelo.rotation.x = -Math.PI / 2;
      this.modelo.position.y = 0.25;
      this.modelo.rotation.z = 0;
    }
    if (this.katana) {
      this.katana.position.set(0.6, 0.1, 0.3);
      this.katana.rotation.set(0, 0, 1.4);
    }
    this.actualizarEtiqueta(`${this.nombre} (DERROTADO)`);
    particulas.emitir(this.root.position, 0xff1744, 45);
    audio.playGolpe();
  }

  revivir(nombre, colorRopa, posX) {
    this.estaMuerto = false;
    this.escudoTimer = 0;
    this.parryTimer = 0;
    if (this.modelo) {
      this.modelo.rotation.set(0, 0, 0);
      this.modelo.position.set(0, 0, 0);
    }
    if (this.katana) {
      this.katana.position.set(0.4, 0.9, 0.4);
      this.katana.rotation.set(-0.3, 0, -0.4);
    }
    this.cambiarColor(colorRopa);
    this.root.position.set(posX, 0, 0);
    this.targetPos.set(posX, 0, 0);
    this.actualizarEtiqueta(nombre);
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

    if (this.estaMuerto) {
      this.modelo.position.y = 0.25;
      this.modelo.rotation.x = -Math.PI / 2;
      this.modelo.rotation.z = 0;
      this.katana.position.set(0.6, 0.1, 0.3);
      this.katana.rotation.set(0, 0, 1.4);
      this.escudoMesh.visible = false;
      return;
    }

    if (enMovimiento) {
      this.walkTimer += delta * 14;
      this.modelo.position.y = Math.abs(Math.sin(this.walkTimer)) * 0.16;
      this.modelo.rotation.z = Math.sin(this.walkTimer * 0.5) * 0.05;
    } else {
      this.modelo.position.y = 0;
      this.modelo.rotation.z = 0;
    }

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

    if (this.escudoTimer > 0) {
      this.escudoTimer -= delta;
      this.escudoMesh.visible = true;
      this.escudoMesh.rotation.y += 3.5 * delta;
    } else {
      this.escudoMesh.visible = false;
    }

    if (!this.esPropio) {
      this.root.position.lerp(this.targetPos, 0.25);
    }
  }

  destruir() {
    scene.remove(this.root);
  }
}

const jugador = new JugadorNinja({
  id: 'jugador_propio',
  nombre: 'Ninja Shinobi',
  x: 0, y: 0, z: 0,
  color: { hex: 0x2980b9, ropa: 0x153b54, cinta: 0xffffff }
}, true);

class RelayWebSocket {
  constructor(roomCode, onMessage, onReady) {
    this.roomCode = roomCode.toLowerCase();
    this.onMessage = onMessage;
    this.onReady = onReady;
    this.topic = 'dojoninja3d_sala_' + this.roomCode;
    this.ws = null;
    this.pingInterval = null;
    this.ultimoEnvioMov = 0;
    this.serverIndex = 0;
    this.servers = [
      'wss://broker.emqx.io:8084/mqtt',
      'wss://broker.hivemq.com:8884/mqtt'
    ];
    this.conectar();
  }

  conectar() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
    const url = this.servers[this.serverIndex % this.servers.length];
    try {
      this.ws = new WebSocket(url, ['mqtt']);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.enviarConnect();
      };

      this.ws.onmessage = (e) => {
        const buf = new Uint8Array(e.data);
        const tipo = buf[0] >> 4;
        if (tipo === 2) {
          this.enviarSubscribe(this.topic);
          if (this.onReady) this.onReady();
          if (this.pingInterval) clearInterval(this.pingInterval);
          this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(new Uint8Array([0xC0, 0x00]));
            }
          }, 25000);
        } else if (tipo === 3) {
          let pos = 1;
          let multiplier = 1;
          let remainingLength = 0;
          let digit;
          do {
            digit = buf[pos++];
            remainingLength += (digit & 127) * multiplier;
            multiplier *= 128;
          } while ((digit & 128) !== 0);

          const topicLen = (buf[pos] << 8) | buf[pos + 1];
          pos += 2 + topicLen;
          const payloadBytes = buf.subarray(pos);
          try {
            const jsonStr = new TextDecoder().decode(payloadBytes);
            const data = JSON.parse(jsonStr);
            if (this.onMessage) this.onMessage(data);
          } catch (err) {}
        }
      };

      this.ws.onerror = (e) => {
        console.warn('RelayWS connection error on ' + url + ', probando servidor alterno...');
        if (this.serverIndex < this.servers.length - 1) {
          this.serverIndex++;
          setTimeout(() => this.conectar(), 500);
        }
      };

      this.ws.onclose = () => {
        if (this.pingInterval) clearInterval(this.pingInterval);
      };
    } catch (e) {
      console.warn('RelayWS init error:', e);
    }
  }

  encStr(s) {
    const bytes = new TextEncoder().encode(s);
    const arr = new Uint8Array(2 + bytes.length);
    arr[0] = bytes.length >> 8;
    arr[1] = bytes.length & 0xff;
    arr.set(bytes, 2);
    return arr;
  }

  enviarConnect() {
    const cId = this.encStr('ninja_' + Math.random().toString(36).substring(2, 9));
    const proto = this.encStr('MQTT');
    const varHeader = new Uint8Array(proto.length + 4 + cId.length);
    varHeader.set(proto, 0);
    varHeader[proto.length] = 4;
    varHeader[proto.length + 1] = 2;
    varHeader[proto.length + 2] = 0;
    varHeader[proto.length + 3] = 60;
    varHeader.set(cId, proto.length + 4);

    const packet = new Uint8Array(2 + varHeader.length);
    packet[0] = 0x10;
    packet[1] = varHeader.length;
    packet.set(varHeader, 2);
    this.ws.send(packet);
  }

  enviarSubscribe(topic) {
    const topicArr = this.encStr(topic);
    const subBody = new Uint8Array(2 + topicArr.length + 1);
    subBody[0] = 0;
    subBody[1] = 1;
    subBody.set(topicArr, 2);
    subBody[subBody.length - 1] = 0;

    const packet = new Uint8Array(2 + subBody.length);
    packet[0] = 0x82;
    packet[1] = subBody.length;
    packet.set(subBody, 2);
    this.ws.send(packet);
  }

  publicar(obj, topicPersonalizado = null, retain = false) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (obj.tipo === 'PLAYER_MOVED') {
      const ahora = performance.now();
      if (ahora - this.ultimoEnvioMov < 40) return;
      this.ultimoEnvioMov = ahora;
    }
    try {
      const top = topicPersonalizado || this.topic;
      const topicArr = this.encStr(top);
      const payload = new TextEncoder().encode(JSON.stringify(obj));
      const remLen = topicArr.length + payload.length;

      const lenBytes = [];
      let x = remLen;
      do {
        let encodedByte = x % 128;
        x = Math.floor(x / 128);
        if (x > 0) encodedByte = encodedByte | 128;
        lenBytes.push(encodedByte);
      } while (x > 0);

      const packet = new Uint8Array(1 + lenBytes.length + remLen);
      packet[0] = retain ? 0x31 : 0x30;
      packet.set(lenBytes, 1);
      packet.set(topicArr, 1 + lenBytes.length);
      packet.set(payload, 1 + lenBytes.length + topicArr.length);
      this.ws.send(packet);
    } catch (e) {
      console.warn('Error publicando en relay:', e);
    }
  }

  cerrar() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
  }
}

class RedDojo {
  constructor() {
    this.relay = null;
    this.broadcastChannel = null;
    this.peer = null;
    this.peerConexiones = new Map();
    this.peerHostConn = null;
    this.isHost = false;
    this.codigoSala = '';
    this.miId = 'ninja_' + Math.random().toString(36).substring(2, 8);
    this.miNombre = 'Ninja';
    this.jugadores = {};
    this.anfitrionId = null;
    this.listeners = {};
    this.timerUnirse = null;
    this.obstacleSeq = 0;
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
    this.cerrarCanales();
    this.isHost = true;
    this.codigoSala = this.generarCodigo();
    this.anfitrionId = this.miId;
    this.obstacleSeq = 0;
    this.jugadores = {
      [this.miId]: {
        id: this.miId,
        nombre: this.miNombre,
        x: -1.5, y: 0, z: 0,
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

    this.relay = new RelayWebSocket(codigo, (msg) => {
      this.procesarMensajeHost(msg);
    }, () => {
      console.log('[Relay Host] Sala lista en la nube con código:', codigo);
      const estadoEl = document.getElementById('lobby-estado-red');
      if (estadoEl) {
        estadoEl.textContent = 'En línea — Código listo para compartir';
        estadoEl.style.color = '#a5d6a7';
      }
    });

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(canalNombre);
        this.broadcastChannel.onmessage = (e) => this.procesarMensajeHost(e.data);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  }

  procesarMensajeHost(msg, connDirecta = null) {
    if (!msg || !this.isHost) return;
    if (msg.remitenteId && msg.remitenteId === this.miId) return;

    if (msg.tipo === 'JOIN_REQUEST') {
      const gId = msg.guestId;
      const gNombre = msg.nombre || 'Ninja Aliado';
      this.jugadores[gId] = {
        id: gId,
        nombre: gNombre,
        x: 1.5, y: 0, z: 0,
        esAnfitrion: false
      };

      const respuesta = {
        tipo: 'LOBBY_UPDATE',
        codigoSala: this.codigoSala,
        anfitrionId: this.anfitrionId,
        jugadores: this.jugadores,
        targetGuestId: gId,
        remitenteId: this.miId
      };

      if (connDirecta) {
        try { connDirecta.send(respuesta); } catch (e) {}
      }
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
    } else if (msg.tipo === 'IMPACT_OBSTACLE') {
      this.disparar('impactoObstaculo', { id: msg.id, tipo: msg.tipoImpacto, x: msg.x, z: msg.z });
      this.enviarAClientes(msg, msg.remitenteId);
    } else if (msg.tipo === 'PLAYER_POWER') {
      this.disparar('poderActivado', { id: msg.id, tipo: msg.poder, duracion: msg.duracion });
      this.enviarAClientes(msg, msg.id);
    } else if (msg.tipo === 'PLAYER_DEATH') {
      this.disparar('muerteJugador', { id: msg.id, nombre: msg.nombre });
      this.enviarAClientes(msg, msg.id);
    } else if (msg.tipo === 'MATCH_OVER') {
      this.disparar('partidaTerminada', { motivo: msg.motivo });
      this.enviarAClientes(msg);
    } else if (msg.tipo === 'PLAYER_SCORE') {
      if (msg.score) {
        this.disparar('puntuacionRecibida', msg.score);
        this.enviarAClientes(msg, msg.remitenteId);
      }
    } else if (msg.tipo === 'PLAYER_LEFT') {
      delete this.jugadores[msg.id];
      this.disparar('jugadorSalio', msg.id);
      const update = {
        tipo: 'LOBBY_UPDATE',
        codigoSala: this.codigoSala,
        anfitrionId: this.anfitrionId,
        jugadores: this.jugadores,
        remitenteId: this.miId
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

    this.cerrarCanales();
    this.isHost = false;
    this.codigoSala = cod;

    const canalNombre = 'dojo3d_room_' + cod.toLowerCase();
    const req = {
      tipo: 'JOIN_REQUEST',
      guestId: this.miId,
      nombre: this.miNombre,
      remitenteId: this.miId
    };

    let conectado = false;

    if (this.timerUnirse) clearTimeout(this.timerUnirse);
    this.timerUnirse = setTimeout(() => {
      if (!conectado) {
        this.disparar('roomError', `No se encontró la sala "${cod}". Verifica que el código sea correcto y el anfitrión esté en el lobby.`);
        this.cerrarCanales();
      }
    }, 10000);

    this.relay = new RelayWebSocket(cod, (msg) => {
      if (!msg) return;
      if (msg.remitenteId && msg.remitenteId === this.miId) return;
      if (msg.tipo === 'LOBBY_UPDATE' || msg.tipo === 'MATCH_STARTED') {
        conectado = true;
        if (this.timerUnirse) clearTimeout(this.timerUnirse);
      }
      this.procesarMensajeGuest(msg);
    }, () => {
      console.log('[Relay Guest] Conectado a la sala en la nube, enviando petición de entrada...');
      this.relay.publicar(req);
      setTimeout(() => { if (!conectado && this.relay) this.relay.publicar(req); }, 400);
      setTimeout(() => { if (!conectado && this.relay) this.relay.publicar(req); }, 1200);
      setTimeout(() => { if (!conectado && this.relay) this.relay.publicar(req); }, 2500);
    });

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(canalNombre);
        this.broadcastChannel.onmessage = (e) => {
          const msg = e.data;
          if (msg && msg.tipo) {
            conectado = true;
            if (this.timerUnirse) clearTimeout(this.timerUnirse);
            this.procesarMensajeGuest(msg);
          }
        };
        this.broadcastChannel.postMessage(req);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
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
      if (msg.anfitrionId) this.anfitrionId = msg.anfitrionId;
      this.jugadores = msg.todosJugadores || this.jugadores;
      this.disparar('matchStarted', msg);
      this.disparar('jugadoresActuales', this.jugadores);
    } else if (msg.tipo === 'PLAYER_MOVED') {
      if (msg.id !== this.miId) {
        this.disparar('jugadorMovido', { id: msg.id, x: msg.x, y: msg.y, z: msg.z });
      }
    } else if (msg.tipo === 'SPAWN_OBSTACLE') {
      this.disparar('obstaculoGenerado', {
        id: msg.id,
        tipo: msg.tipoObj,
        posX: msg.posX,
        targetId: msg.targetId,
        targetNombre: msg.targetNombre
      });
    } else if (msg.tipo === 'IMPACT_OBSTACLE') {
      this.disparar('impactoObstaculo', { id: msg.id, tipo: msg.tipoImpacto, x: msg.x, z: msg.z });
    } else if (msg.tipo === 'PLAYER_POWER') {
      if (msg.id !== this.miId) {
        this.disparar('poderActivado', { id: msg.id, tipo: msg.poder, duracion: msg.duracion });
      }
    } else if (msg.tipo === 'PLAYER_DEATH') {
      if (msg.id !== this.miId) {
        this.disparar('muerteJugador', { id: msg.id, nombre: msg.nombre });
      }
    } else if (msg.tipo === 'TIME_SYNC') {
      this.disparar('tiempoSincronizado', msg.tiempo);
    } else if (msg.tipo === 'MATCH_OVER') {
      this.disparar('partidaTerminada', { motivo: msg.motivo });
    } else if (msg.tipo === 'PLAYER_SCORE') {
      if (msg.score) {
        this.disparar('puntuacionRecibida', msg.score);
      }
    } else if (msg.tipo === 'PLAYER_LEFT') {
      if (msg.id !== this.miId) {
        this.disparar('jugadorSalio', msg.id);
      }
    }
  }

  iniciarPartidaLobby() {
    if (this.isHost) {
      const msg = {
        tipo: 'MATCH_STARTED',
        codigoSala: this.codigoSala,
        anfitrionId: this.miId,
        todosJugadores: this.jugadores,
        remitenteId: this.miId,
        modo: modoActual,
        dificultad: dificultadActual,
        escenario: escenarioActual,
        velocidad: velocidadObstaculos
      };
      this.enviarAClientes(msg);
      this.disparar('matchStarted', msg);
      this.disparar('jugadoresActuales', this.jugadores);
    }
  }

  enviarPuntuacion(datos) {
    const msg = {
      tipo: 'PLAYER_SCORE',
      remitenteId: this.miId,
      score: datos
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarObstaculo(datos) {
    this.obstacleSeq++;
    const msg = {
      tipo: 'SPAWN_OBSTACLE',
      id: datos.id || ('obs_' + this.obstacleSeq),
      tipoObj: datos.tipo,
      posX: datos.posX,
      targetId: datos.targetId,
      targetNombre: datos.targetNombre,
      remitenteId: this.miId
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarImpactoObstaculo(datos) {
    const msg = {
      tipo: 'IMPACT_OBSTACLE',
      remitenteId: this.miId,
      id: datos.id,
      tipoImpacto: datos.tipo,
      x: datos.x,
      z: datos.z
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarPoder(datos) {
    const msg = {
      tipo: 'PLAYER_POWER',
      remitenteId: this.miId,
      id: this.miId,
      poder: datos.tipo,
      duracion: datos.duracion
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarMuerte(datos) {
    const msg = {
      tipo: 'PLAYER_DEATH',
      remitenteId: this.miId,
      id: this.miId,
      nombre: datos.nombre
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarTiempo(t) {
    const msg = {
      tipo: 'TIME_SYNC',
      tiempo: t,
      remitenteId: this.miId
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarFinPartida(datos) {
    const msg = {
      tipo: 'MATCH_OVER',
      remitenteId: this.miId,
      motivo: (datos && datos.motivo) || '¡Fin de la partida!'
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  entrarJuego(datos) {

  }

  enviarMovimiento(pos) {
    const msg = {
      tipo: 'PLAYER_MOVED',
      remitenteId: this.miId,
      id: this.miId,
      x: pos.x,
      y: pos.y,
      z: pos.z
    };

    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarAClientes(msg, remitenteId = null) {
    if (!msg.remitenteId) msg.remitenteId = this.miId;
    if (this.relay) {
      this.relay.publicar(msg);
    }
    if (this.broadcastChannel) {
      try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  salir() {
    if (this.timerUnirse) clearTimeout(this.timerUnirse);
    const msg = { tipo: 'PLAYER_LEFT', id: this.miId, remitenteId: this.miId };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
    this.cerrarCanales();
  }

  cerrarCanales() {
    if (this.relay) {
      this.relay.cerrar();
      this.relay = null;
    }
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch (e) {}
      this.broadcastChannel = null;
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
  const lobbyEstadoRed = document.getElementById('lobby-estado-red');
  if (lobbyEstadoRed) {
    if (datos.esAnfitrion) {
      lobbyEstadoRed.textContent = (red.peer && red.peer.open)
        ? 'En línea — Código listo para compartir'
        : 'Conectando a red P2P... Espera un momento';
      lobbyEstadoRed.style.color = (red.peer && red.peer.open) ? '#a5d6a7' : '#ffb74d';
    } else {
      lobbyEstadoRed.textContent = 'Conectado a la sala del anfitrión';
      lobbyEstadoRed.style.color = '#a5d6a7';
    }
  }

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
  if (datos && datos.dificultad) dificultadActual = datos.dificultad;
  if (datos && datos.modo) modoActual = datos.modo;
  if (datos && datos.escenario) aplicarEscenario(datos.escenario);
  if (datos && datos.velocidad) velocidadObstaculos = datos.velocidad;
  empezarPartida();
});

red.on('puntuacionRecibida', (nuevoScore) => {
  if (nuevoScore && nuevoScore.nombre && nuevoScore.puntos !== undefined) {
    if (typeof agregarPuntuacionLocal === 'function') {
      agregarPuntuacionLocal(nuevoScore);
    }
    mostrarAviso('hud-aviso-cerca', `${nuevoScore.nombre}: ${nuevoScore.puntos} pts`, 2500);
  }
});

red.on('jugadoresActuales', (lista) => {
  Object.keys(lista).forEach(id => {
    if (id !== red.miId && !otrosJugadores[id]) {
      const esHostRemoto = (red.anfitrionId === id);
      const colorRopa = esHostRemoto ? 0x153b54 : 0x881111;
      const colorHex = esHostRemoto ? 0x2980b9 : 0xe74c3c;
      const cintaHex = esHostRemoto ? 0xffffff : 0xff1744;
      const posX = esHostRemoto ? -1.5 : 1.5;
      const nombreRemoto = lista[id].nombre || (esHostRemoto ? 'Anfitrión' : 'Invitado');

      otrosJugadores[id] = new JugadorNinja({
        id,
        nombre: nombreRemoto,
        x: posX,
        y: 0,
        z: 0,
        color: { hex: colorHex, ropa: colorRopa, cinta: cintaHex }
      }, false);
      otrosJugadores[id].actualizarEtiqueta(`${nombreRemoto} (${esHostRemoto ? 'Anfitrión' : 'Invitado'})`);
    }
  });
});

red.on('nuevoJugador', (datos) => {
  if (datos.id !== red.miId && !otrosJugadores[datos.id]) {
    const esHostRemoto = (red.anfitrionId === datos.id);
    const colorRopa = esHostRemoto ? 0x153b54 : 0x881111;
    const colorHex = esHostRemoto ? 0x2980b9 : 0xe74c3c;
    const cintaHex = esHostRemoto ? 0xffffff : 0xff1744;
    const posX = esHostRemoto ? -1.5 : 1.5;
    const nombreRemoto = datos.nombre || (esHostRemoto ? 'Anfitrión' : 'Invitado');

    otrosJugadores[datos.id] = new JugadorNinja({
      id: datos.id,
      nombre: nombreRemoto,
      x: posX,
      y: 0,
      z: 0,
      color: { hex: colorHex, ropa: colorRopa, cinta: cintaHex }
    }, false);
    otrosJugadores[datos.id].actualizarEtiqueta(`${nombreRemoto} (${esHostRemoto ? 'Anfitrión' : 'Invitado'})`);
  }
});

red.on('jugadorMovido', (datos) => {
  if (datos.id === red.miId) return;

  if (!otrosJugadores[datos.id] && juegoActivo) {
    const esHostRemoto = (red.anfitrionId === datos.id);
    const colorRopa = esHostRemoto ? 0x153b54 : 0x881111;
    const colorHex = esHostRemoto ? 0x2980b9 : 0xe74c3c;
    const cintaHex = esHostRemoto ? 0xffffff : 0xff1744;
    const posX = esHostRemoto ? -1.5 : 1.5;
    const nombreRemoto = (red.jugadores && red.jugadores[datos.id] && red.jugadores[datos.id].nombre) || (esHostRemoto ? 'Anfitrión' : 'Invitado');

    otrosJugadores[datos.id] = new JugadorNinja({
      id: datos.id,
      nombre: nombreRemoto,
      x: datos.x !== undefined ? datos.x : posX,
      y: 0,
      z: 0,
      color: { hex: colorHex, ropa: colorRopa, cinta: cintaHex }
    }, false);
    otrosJugadores[datos.id].actualizarEtiqueta(`${nombreRemoto} (${esHostRemoto ? 'Anfitrión' : 'Invitado'})`);
  }

  if (otrosJugadores[datos.id]) {
    otrosJugadores[datos.id].targetPos.x = datos.x;
  }
});

red.on('jugadorSalio', (id) => {
  if (otrosJugadores[id]) {
    otrosJugadores[id].destruir();
    delete otrosJugadores[id];
  }
  mostrarAviso('hud-aviso-cerca', '¡Un ninja ha salido!');
});

let ultimoObstaculoSeq = -1;
red.on('obstaculoGenerado', (datos) => {
  if (datos.id && obstaculos.some(o => o.idObstaculo === datos.id)) return;
  if (juegoActivo && !juegoPausado) {
    crearElementoPorTipo(datos.tipo, datos.posX, datos.id, datos.targetId, datos.targetNombre);

    if (datos.tipo === 'shuriken_ia') {
      if (datos.targetId === red.miId) {
        mostrarAviso('hud-aviso-cerca', '¡SHURIKEN CARMESÍ TE PERSIGUE! ¡PARRY OBLIGATORIO!', 2600);
      } else if (datos.targetNombre) {
        mostrarAviso('hud-aviso-cerca', `Shuriken Carmesí persigue a ${datos.targetNombre}`, 2200);
      }
    }
  }
});

red.on('impactoObstaculo', (datos) => {
  if (!datos || !datos.id) return;
  const idx = obstaculos.findIndex(o => o.idObstaculo === datos.id);
  if (idx !== -1) {
    const obs = obstaculos[idx];
    scene.remove(obs);
    obstaculos.splice(idx, 1);
  }
  const posImpacto = new THREE.Vector3(datos.x || 0, 1.2, datos.z || 0);
  if (datos.tipo === 'parry') {
    particulas.emitir(posImpacto, 0x64b5f6, 30);
    audio.playParry();
  } else if (datos.tipo === 'parry_ia') {
    particulas.emitir(posImpacto, 0xffd700, 50);
    audio.playParry();
    mostrarAviso('hud-aviso-parry', '¡ALIADO PARREÓ AL SHURIKEN CARMESÍ!', 1300);
  } else if (datos.tipo === 'golpe_ia') {
    particulas.emitir(posImpacto, 0xff1744, 40);
    audio.playGolpe();
  } else if (datos.tipo === 'escudo' || datos.tipo === 'escudo_bloqueo') {
    particulas.emitir(posImpacto, 0x00e5ff, 25);
    audio.playParry();
  } else if (datos.tipo === 'golpe') {
    particulas.emitir(posImpacto, 0xe53935, 30);
    audio.playGolpe();
  } else if (datos.tipo === 'pocion') {
    particulas.emitir(posImpacto, 0xff1744, 25);
    audio.playItem();
  } else if (datos.tipo === 'pergamino') {
    particulas.emitir(posImpacto, 0xffd54f, 25);
    audio.playItem();
  }
});

red.on('poderActivado', (datos) => {
  if (datos.id === red.miId) return;
  const p = otrosJugadores[datos.id];
  if (!p) return;

  if (datos.tipo === 'parry') {
    p.parryTimer = 0.28;
    audio.playParry();
    particulas.emitir(p.root.position, 0x64b5f6, 15);
  } else if (datos.tipo === 'escudo') {
    p.escudoTimer = datos.duracion || 6.0;
    audio.playItem();
    particulas.emitir(p.root.position, 0x00e5ff, 25);
  } else if (datos.tipo === 'pocion') {
    audio.playItem();
    particulas.emitir(p.root.position, 0xff1744, 25);
  }
});

red.on('muerteJugador', (datos) => {
  if (datos.id === red.miId) return;
  if (otrosJugadores[datos.id]) {
    otrosJugadores[datos.id].morir();
  }

  const quedaAlguienVivo = !jugador.estaMuerto || Object.values(otrosJugadores).some(p => !p.estaMuerto);
  if (!quedaAlguienVivo) {
    const motivo = '¡Todos los ninjas han caído!';
    terminarJuego(motivo);
    red.enviarFinPartida({ motivo });
  } else {
    mostrarAviso('hud-aviso-cerca', `¡${datos.nombre || 'El aliado'} ha caído! ¡Resiste!`, 3000);
  }
});

red.on('tiempoSincronizado', (t) => {
  if (juegoActivo && !red.isHost) {
    tiempo = t;
    actualizarHUD();
    if (tiempo <= 0) {
      const sobrevivido = !jugador.estaMuerto || Object.values(otrosJugadores).some(p => !p.estaMuerto);
      const motivo = sobrevivido ? '¡Tiempo cumplido! ¡Misión superada!' : '¡Todos los ninjas han caído!';
      terminarJuego(motivo);
    }
  }
});

red.on('partidaTerminada', (datos) => {
  if (juegoActivo) {
    terminarJuego(datos.motivo || '¡Fin de la partida!');
  }
});

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

function crearShurikenIAMesh(targetNombre = '') {
  const g = new THREE.Group();

  const matMetalCarmesi = new THREE.MeshStandardMaterial({
    color: 0xff1744,
    emissive: 0xff1744,
    emissiveIntensity: 1.6,
    metalness: 0.85,
    roughness: 0.15
  });

  let shurikenMesh;
  if (plantillaShuriken) {
    shurikenMesh = plantillaShuriken.clone(true);
    shurikenMesh.rotation.set(Math.PI / 2, 0, 0);
    shurikenMesh.traverse((child) => {
      if (child.isMesh) {
        child.material = matMetalCarmesi;
      }
    });
  } else {
    shurikenMesh = new THREE.Group();
    const centro = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.1, 10), matMetalCarmesi);
    centro.rotation.x = Math.PI / 2;
    shurikenMesh.add(centro);
    for (let i = 0; i < 4; i++) {
      const hoja = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.05, 4), matMetalCarmesi);
      const ang = (i * Math.PI) / 2;
      hoja.position.set(Math.cos(ang) * 0.8, Math.sin(ang) * 0.8, 0);
      hoja.rotation.z = ang - Math.PI / 2;
      shurikenMesh.add(hoja);
    }
  }
  g.add(shurikenMesh);
  g.shurikenMesh = shurikenMesh;

  const luzCarmesi = new THREE.PointLight(0xff1744, 3.8, 9);
  luzCarmesi.position.set(0, 0.2, 0);
  g.add(luzCarmesi);

  const canvasEtiqueta = document.createElement('canvas');
  canvasEtiqueta.width = 320; canvasEtiqueta.height = 64;
  const ctx = canvasEtiqueta.getContext('2d');
  ctx.fillStyle = 'rgba(180, 0, 20, 0.9)';
  ctx.fillRect(4, 4, 312, 56);
  ctx.strokeStyle = '#ff5252';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 312, 56);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 19px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textoTag = targetNombre ? `🎯 -> ${targetNombre}` : 'SHURIKEN CARMESÍ';
  ctx.fillText(textoTag, 160, 32);

  const spriteTag = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvasEtiqueta),
    depthTest: false
  }));
  spriteTag.scale.set(2.4, 0.5, 1);
  spriteTag.position.set(0, 1.1, 0);
  g.add(spriteTag);
  g.spriteTag = spriteTag;

  g.scale.set(1.3, 1.3, 1.3);
  return g;
}

let juegoActivo = false;
let juegoPausado = false;
let vidas = 3;
let puntos = 0;
let tiempo = 30;
let modoActual = 'esquivar';
let dificultadActual = 'facil';
let velocidadObstaculos = 18;
let parryTimer = 0;
let escudoTimer = 0;
let intervaloTiempo = null;

const teclas = { izquierda: false, derecha: false };

function ejecutarEspadazo() {
  if (juegoActivo && !juegoPausado && parryTimer <= 0 && !jugador.estaMuerto) {
    parryTimer = 0.28;
    jugador.parryTimer = 0.28;
    audio.playEspadazo();
    particulas.emitir(jugador.root.position, 0x64b5f6, 15);
    red.enviarPoder({ tipo: 'parry' });
  }
}

window.addEventListener('keydown', (e) => {
  const tag = e.target && e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return;
  }
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') teclas.izquierda = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') teclas.derecha = true;
  if (e.key === ' ' || e.code === 'Space' || e.key === 'f' || e.key === 'F' || e.key === 'e' || e.key === 'E') {
    ejecutarEspadazo();
  }

  if (e.key === 'Escape' || e.key === 'Esc' || e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    alternarPausa();
  }
});

window.addEventListener('pointerdown', (e) => {
  if (e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.closest('#modal-opciones') || e.target.closest('#menu-inicio') || e.target.closest('#pantalla-gameover') || e.target.closest('#menu-pausa') || e.target.closest('#pantalla-lobby') || e.target.closest('#modal-unirse-sala') || e.target.closest('#modal-puntuaciones'))) {
    return;
  }
  ejecutarEspadazo();
});

window.addEventListener('click', () => {
  audio.iniciar();
}, { passive: true });

window.addEventListener('keyup', (e) => {
  const tag = e.target && e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return;
  }
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') teclas.izquierda = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') teclas.derecha = false;
});

const selEscenarioEl = document.getElementById('sel-escenario');
if (selEscenarioEl) {
  selEscenarioEl.addEventListener('change', (e) => {
    aplicarEscenario(e.target.value);
  });
}

let obstaculos = [];
let spawnTimer = 0;
let iaShurikenTimer = 3.5;

function crearElementoPorTipo(tipo, posX, idObstaculo = null, targetId = null, targetNombre = '') {
  let obj;
  if (tipo === 'item_pocion') {
    obj = crearPocionMesh();
    obj.tipo = 'item_pocion';
    obj.position.set(posX, 1.2, -45);
  } else if (tipo === 'item_escudo') {
    obj = crearEscudoItemMesh();
    obj.tipo = 'item_escudo';
    obj.position.set(posX, 1.2, -45);
  } else if (tipo === 'item_pergamino') {
    obj = crearPergaminoMesh();
    obj.tipo = 'item_pergamino';
    obj.position.set(posX, 1.2, -45);
  } else if (tipo === 'shuriken_ia') {
    obj = crearShurikenIAMesh(targetNombre);
    obj.tipo = 'shuriken_ia';
    obj.targetId = targetId;
    obj.targetNombre = targetNombre;
    obj.position.set(posX, 1.2, -45);
  } else if (tipo === 'shuriken') {
    obj = crearShurikenMesh();
    obj.tipo = 'shuriken';
    obj.position.set(posX, 1.2, -45);
  } else {
    obj = crearPergaminoMesh();
    obj.tipo = 'pergamino';
    obj.position.set(posX, 1.2, -45);
  }
  obj.idObstaculo = idObstaculo || ('obs_' + (++red.obstacleSeq));
  scene.add(obj);
  obstaculos.push(obj);
  return obj;
}

function puedeGenerarObstaculos() {
  if (red.codigoSala) {
    return red.isHost;
  }
  return true;
}

function obtenerObjetivoVivoParaIA() {
  const candidatos = [];
  if (!jugador.estaMuerto) {
    const miNombre = ((document.getElementById('input-nombre') || document.getElementById('nombre-jugador')).value) || 'Ninja';
    candidatos.push({ id: red.miId, nombre: miNombre });
  }
  Object.keys(otrosJugadores).forEach((id) => {
    const p = otrosJugadores[id];
    if (p && !p.estaMuerto) {
      candidatos.push({ id, nombre: p.nombre });
    }
  });
  if (candidatos.length === 0) return null;
  return candidatos[Math.floor(Math.random() * candidatos.length)];
}

function generarElemento(delta) {

  if (!puedeGenerarObstaculos() || !juegoActivo || juegoPausado) {
    return;
  }

  const numJugadoresConectados = 1 + Object.keys(otrosJugadores).length;

  iaShurikenTimer += delta;
  const baseIntervaloPerseguidor = dificultadActual === 'dificil' ? 6.5 : 8.5;
  const intervaloPerseguidor = numJugadoresConectados > 1 ? (baseIntervaloPerseguidor * 0.75) : baseIntervaloPerseguidor;
  if (iaShurikenTimer >= intervaloPerseguidor) {
    iaShurikenTimer = 0;
    const objetivo = obtenerObjetivoVivoParaIA();
    if (objetivo) {
      const posX = (Math.random() * 6) - 3;
      const idObs = 'obs_carmesi_' + (++red.obstacleSeq);
      crearElementoPorTipo('shuriken_ia', posX, idObs, objetivo.id, objetivo.nombre);
      red.enviarObstaculo({
        id: idObs,
        tipo: 'shuriken_ia',
        posX,
        targetId: objetivo.id,
        targetNombre: objetivo.nombre
      });

      if (objetivo.id === red.miId) {
        mostrarAviso('hud-aviso-cerca', '¡SHURIKEN CARMESÍ TE PERSIGUE! ¡PARRY OBLIGATORIO!', 2600);
      } else {
        mostrarAviso('hud-aviso-cerca', `Shuriken Carmesí persigue a ${objetivo.nombre}`, 2200);
      }
    }
  }

  spawnTimer += delta;

  const baseFreq = dificultadActual === 'dificil' ? 0.6 : 0.85;
  const factorMulti = numJugadoresConectados > 1 ? 0.6 : 1.0;
  const frecuencia = baseFreq * factorMulti;

  if (spawnTimer >= frecuencia) {
    spawnTimer = 0;

    const cantidadASpawnear = numJugadoresConectados > 1 ? 2 : 1;

    for (let s = 0; s < cantidadASpawnear; s++) {
      let posX;
      if (numJugadoresConectados > 1) {
        if (s === 0) {
          posX = -0.5 - (Math.random() * 3.3);
        } else {
          posX = 0.5 + (Math.random() * 3.3);
        }
      } else {
        posX = (Math.random() * 8) - 4;
      }

      const rand = Math.random();
      let tipo = 'shuriken';

      if (rand < 0.08) {
        tipo = 'item_pocion';
      } else if (rand < 0.16) {
        tipo = 'item_escudo';
      } else if (rand < 0.24) {
        tipo = 'item_pergamino';
      } else {
        tipo = (modoActual === 'esquivar') ? 'shuriken' : 'pergamino';
      }

      const idObs = 'obs_' + (++red.obstacleSeq);
      crearElementoPorTipo(tipo, posX, idObs);
      red.enviarObstaculo({ id: idObs, tipo, posX });
    }
  }
}

function mostrarAviso(elemId, texto, duracion = 650) {
  const el = document.getElementById(elemId);
  if (!el) return;
  if (texto) el.textContent = texto;
  el.classList.add('mostrar');
  setTimeout(() => el.classList.remove('mostrar'), duracion);
}

function flashImpacto() {
  const imp = document.getElementById('impacto-rojo');
  if (imp) {
    imp.classList.add('activo');
    setTimeout(() => imp.classList.remove('activo'), 180);
  }
}

function procesarColisiones() {
  const localPos = jugador.root.position;
  const esParry = parryTimer > 0;
  const conEscudo = jugador.escudoTimer > 0;

  for (let i = obstaculos.length - 1; i >= 0; i--) {
    const obj = obstaculos[i];
    if (!obj) continue;

    const dx = Math.abs(obj.position.x - localPos.x);
    const dz = obj.position.z - localPos.z;

    if (!jugador.estaMuerto && dx < 1.15 && Math.abs(dz) < 1.0) {
      scene.remove(obj);
      obstaculos.splice(i, 1);

      if (obj.tipo === 'item_pocion') {
        vidas = Math.min(3, vidas + 1);
        puntos += 30;
        audio.playItem();
        particulas.emitir(localPos, 0xff1744, 25);
        mostrarAviso('hud-aviso-cerca', '+1 VIDA');
        actualizarHUD();
        red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'pocion', x: obj.position.x, z: obj.position.z });
        red.enviarPoder({ tipo: 'pocion' });
        continue;
      }

      if (obj.tipo === 'item_escudo') {
        jugador.escudoTimer = 6.0;
        audio.playItem();
        particulas.emitir(localPos, 0x00e5ff, 30);
        mostrarAviso('hud-aviso-parry', 'ESCUDO ACTIVO (6s)');
        actualizarHUD();
        red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'escudo', x: obj.position.x, z: obj.position.z });
        red.enviarPoder({ tipo: 'escudo', duracion: 6.0 });
        continue;
      }

      if (obj.tipo === 'item_pergamino') {
        puntos += 200;
        audio.playItem();
        particulas.emitir(localPos, 0xffd54f, 35);
        mostrarAviso('hud-aviso-parry', 'PERGAMINO +200');
        actualizarHUD();
        red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'pergamino', x: obj.position.x, z: obj.position.z });
        continue;
      }

      if (obj.tipo === 'shuriken_ia') {
        if (esParry && dz >= -1.8 && dz <= 0.5) {
          puntos += 300;
          audio.playParry();
          particulas.emitir(localPos, 0xffd700, 50);
          mostrarAviso('hud-aviso-parry', '¡PARRY PERFECTO AL SHURIKEN! +300', 1400);
          red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'parry_ia', x: obj.position.x, z: obj.position.z });
        } else {

          if (conEscudo) {
            jugador.escudoTimer = 0;
            if (jugador.escudoMesh) jugador.escudoMesh.visible = false;
            audio.playGolpe();
            particulas.emitir(localPos, 0xff1744, 35);
            flashImpacto();
            mostrarAviso('hud-aviso-cerca', '¡DEBÍAS PARREAR!', 1800);
          } else {
            vidas--;
            audio.playGolpe();
            particulas.emitir(localPos, 0xff1744, 45);
            flashImpacto();
            actualizarHUD();
            mostrarAviso('hud-aviso-cerca', '¡FALLASTE EL PARRY OBLIGATORIO!', 1800);
          }
          red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'golpe_ia', x: obj.position.x, z: obj.position.z });
          if (vidas <= 0) {
            const nombreJug = ((document.getElementById('input-nombre') || document.getElementById('nombre-jugador')).value) || 'Ninja';
            jugador.morir();
            red.enviarMuerte({ id: red.miId, nombre: nombreJug });

            const hayCompaneroVivo = Object.values(otrosJugadores).some(p => !p.estaMuerto);
            if (hayCompaneroVivo) {
              mostrarAviso('hud-aviso-cerca', '¡HAS CAÍDO! Modo Espectador — Apoyando a tu compañero...', 4000);
              const elEsp = document.getElementById('hud-espectador');
              if (elEsp) elEsp.style.display = 'block';
            } else {
              const motivo = '¡Todos los ninjas han caído!';
              terminarJuego(motivo);
              red.enviarFinPartida({ motivo });
            }
          }
        }
        continue;
      }

      if (obj.tipo === 'shuriken') {
        if (esParry && dz >= -1.8 && dz <= 0.4) {
          puntos += 150;
          audio.playParry();
          particulas.emitir(localPos, 0x64b5f6, 30);
          mostrarAviso('hud-aviso-parry', 'PARRY KATANA +150');
          red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'parry', x: obj.position.x, z: obj.position.z });
        } else if (conEscudo) {
          audio.playParry();
          particulas.emitir(localPos, 0x00e5ff, 20);
          mostrarAviso('hud-aviso-cerca', '¡ESCUDO ABSORBIÓ!');
          red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'escudo_bloqueo', x: obj.position.x, z: obj.position.z });
        } else {
          vidas--;
          audio.playGolpe();
          particulas.emitir(localPos, 0xe53935, 25);
          flashImpacto();
          actualizarHUD();
          red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'golpe', x: obj.position.x, z: obj.position.z });
          if (vidas <= 0) {
            const nombreJug = ((document.getElementById('input-nombre') || document.getElementById('nombre-jugador')).value) || 'Ninja';
            jugador.morir();
            red.enviarMuerte({ id: red.miId, nombre: nombreJug });

            const hayCompaneroVivo = Object.values(otrosJugadores).some(p => !p.estaMuerto);
            if (hayCompaneroVivo) {
              mostrarAviso('hud-aviso-cerca', '¡HAS CAÍDO! Modo Espectador — Apoyando a tu compañero...', 4000);
              const elEsp = document.getElementById('hud-espectador');
              if (elEsp) elEsp.style.display = 'block';
            } else {
              const motivo = '¡Todos los ninjas han caído!';
              terminarJuego(motivo);
              red.enviarFinPartida({ motivo });
            }
          }
        }
      } else if (obj.tipo === 'pergamino') {
        puntos += 50;
        audio.playItem();
        particulas.emitir(localPos, 0xffb300, 20);
        mostrarAviso('hud-aviso-cerca', '+50 PERGAMINO');
        actualizarHUD();
        red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'pergamino', x: obj.position.x, z: obj.position.z });
      }
      continue;
    }

    if (obj.position.z > 6) {
      scene.remove(obj);
      obstaculos.splice(i, 1);
      if (obj.tipo === 'shuriken' && !jugador.estaMuerto) {
        puntos += 20;
        mostrarAviso('hud-aviso-cerca', 'CERCA +20');
        actualizarHUD();
      }
    }
  }
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (juegoActivo && !juegoPausado) {
    let seMueve = false;
    if (!jugador.estaMuerto) {
      if (teclas.izquierda && jugador.root.position.x > -4.2) {
        jugador.root.position.x -= 8.5 * delta;
        seMueve = true;
      }
      if (teclas.derecha && jugador.root.position.x < 4.2) {
        jugador.root.position.x += 8.5 * delta;
        seMueve = true;
      }
      if (parryTimer > 0) parryTimer -= delta;
    }

    jugador.actualizar(delta, seMueve);

    if (jugador.estaMuerto) {
      const companeroVivo = Object.values(otrosJugadores).find(p => !p.estaMuerto);
      if (companeroVivo) {
        luzFocal.target = companeroVivo.root;
      } else {
        luzFocal.target = jugador.root;
      }
    } else {
      luzFocal.target = jugador.root;
    }

    red.enviarMovimiento({ x: jugador.root.position.x, y: 0, z: 0 });

    Object.values(otrosJugadores).forEach((p) => {
      if (p) {
        const distancia = Math.abs(p.targetPos.x - p.root.position.x);
        const seMueveRemoto = distancia > 0.04;
        p.actualizar(delta, seMueveRemoto);
      }
    });

    generarElemento(delta);
    for (let i = 0; i < obstaculos.length; i++) {
      const obs = obstaculos[i];
      obs.position.z += velocidadObstaculos * delta;
      if (obs.tipo === 'shuriken') {
        obs.rotation.z += 25 * delta;
      } else if (obs.tipo === 'shuriken_ia') {
        if (obs.shurikenMesh) {
          obs.shurikenMesh.rotation.z += 30 * delta;
        } else {
          obs.rotation.z += 30 * delta;
        }
        if (Math.random() < 0.35) {
          particulas.emitir(obs.position, 0xff1744, 2);
        }

        let targetNinja = null;
        if (obs.targetId === red.miId) {
          if (!jugador.estaMuerto) targetNinja = jugador;
        } else if (obs.targetId && otrosJugadores[obs.targetId]) {
          if (!otrosJugadores[obs.targetId].estaMuerto) targetNinja = otrosJugadores[obs.targetId];
        }

        if (!targetNinja) {
          if (!jugador.estaMuerto) {
            targetNinja = jugador;
            obs.targetId = red.miId;
          } else {
            const companero = Object.values(otrosJugadores).find(p => !p.estaMuerto);
            if (companero) {
              targetNinja = companero;
              obs.targetId = companero.id;
            }
          }
        }

        if (targetNinja) {
          const targetX = targetNinja.root.position.x;
          const difX = targetX - obs.position.x;
          const velGiro = 6.2;
          if (Math.abs(difX) > 0.04) {
            obs.position.x += Math.sign(difX) * Math.min(Math.abs(difX), velGiro * delta);
          }
        }
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

function actualizarHUD() {
  document.getElementById('hud-puntos').textContent = puntos;
  document.getElementById('hud-tiempo').textContent = `TIEMPO 00:${tiempo < 10 ? '0' : ''}${tiempo}`;
  const tagSala = document.getElementById('hud-sala-tag');
  if (tagSala) {
    tagSala.textContent = `SALA: ${codigoSalaActual || 'DOJO'} | ${modoActual.toUpperCase()}`;
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
  tiempo = 30;
  juegoActivo = true;
  juegoPausado = false;
  parryTimer = 0;
  ultimoObstaculoSeq = -1;
  iaShurikenTimer = 3.5;

  obstaculos.forEach(o => scene.remove(o));
  obstaculos = [];

  document.getElementById('menu-inicio').style.display = 'none';
  document.getElementById('pantalla-gameover').style.display = 'none';
  document.getElementById('menu-pausa').style.display = 'none';
  document.getElementById('hud-juego').style.display = 'block';
  const elEsp = document.getElementById('hud-espectador');
  if (elEsp) elEsp.style.display = 'none';

  actualizarHUD();
  audio.iniciarBGM(true);

  const nombre = ((document.getElementById('input-nombre') || document.getElementById('nombre-jugador')).value) || 'Ninja';

  Object.keys(otrosJugadores).forEach(id => {
    if (otrosJugadores[id]) otrosJugadores[id].destruir();
  });
  otrosJugadores = {};

  if (red.isHost) {

    jugador.revivir(`${nombre} (Tú - Anfitrión)`, 0x153b54, -1.5);

    const guestId = Object.keys(red.jugadores || {}).find(id => id !== red.miId);
    const guestNombre = (guestId && red.jugadores[guestId] && red.jugadores[guestId].nombre) || 'Invitado';
    if (guestId) {
      otrosJugadores[guestId] = new JugadorNinja({
        id: guestId,
        nombre: guestNombre,
        x: 1.5, y: 0, z: 0,
        color: { hex: 0xe74c3c, ropa: 0x881111, cinta: 0xff1744 }
      }, false);
      otrosJugadores[guestId].actualizarEtiqueta(`${guestNombre} (Invitado)`);
    }
  } else {

    jugador.revivir(`${nombre} (Tú)`, 0x881111, 1.5);

    const hostId = red.anfitrionId || Object.keys(red.jugadores || {}).find(id => id !== red.miId);
    const hostNombre = (hostId && red.jugadores[hostId] && red.jugadores[hostId].nombre) || 'Anfitrión';
    if (hostId) {
      otrosJugadores[hostId] = new JugadorNinja({
        id: hostId,
        nombre: hostNombre,
        x: -1.5, y: 0, z: 0,
        color: { hex: 0x2980b9, ropa: 0x153b54, cinta: 0xffffff }
      }, false);
      otrosJugadores[hostId].actualizarEtiqueta(`${hostNombre} (Anfitrión)`);
    }
  }

  if (intervaloTiempo) clearInterval(intervaloTiempo);
  intervaloTiempo = setInterval(() => {
    if (!juegoPausado && juegoActivo) {
      if (!puedeGenerarObstaculos()) {
        return;
      }
      tiempo--;
      actualizarHUD();
      red.enviarTiempo(tiempo);
      if (tiempo <= 0) {
        const sobrevivido = !jugador.estaMuerto || Object.values(otrosJugadores).some(p => !p.estaMuerto);
        const motivo = sobrevivido ? '¡Tiempo cumplido! ¡Misión superada!' : '¡Todos los ninjas han caído!';
        terminarJuego(motivo);
        red.enviarFinPartida({ motivo });
      }
    }
  }, 1000);
}

function obtenerPuntuacionesLocales() {
  try {
    const raw = localStorage.getItem('dojo_ninja_puntuaciones');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function guardarPuntuacionesLocales(lista) {
  try {
    localStorage.setItem('dojo_ninja_puntuaciones', JSON.stringify(lista.slice(0, 50)));
  } catch (e) {}
}

function normalizarYCombinarPuntuaciones(...listas) {
  const mapa = new Map();
  listas.forEach(lista => {
    if (!Array.isArray(lista)) return;
    lista.forEach(item => {
      if (!item || !item.nombre || item.puntos === undefined) return;
      const puntos = Number(item.puntos) || 0;
      const k = `${item.nombre.trim()}_${puntos}_${item.dificultad || 'facil'}`;
      if (!mapa.has(k)) {
        mapa.set(k, {
          nombre: item.nombre.trim(),
          puntos: puntos,
          dificultad: item.dificultad || 'Facil',
          escenario: item.escenario || 'Dia',
          fecha: item.fecha || Date.now()
        });
      }
    });
  });
  return Array.from(mapa.values()).sort((a, b) => b.puntos - a.puntos).slice(0, 30);
}

function agregarPuntuacionLocal(nuevo) {
  const actuales = obtenerPuntuacionesLocales();
  const combinadas = normalizarYCombinarPuntuaciones(actuales, [nuevo]);
  guardarPuntuacionesLocales(combinadas);
  return combinadas;
}

class GestorPuntuacionesNube {
  constructor() {
    this.scoresGlobales = [];
    this.topic = 'dojoninja3d_global_scores_v2';
    this.ws = null;
    this.conectar();
  }

  conectar() {
    const servers = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
    let idx = 0;
    const intentar = () => {
      try {
        this.ws = new WebSocket(servers[idx % servers.length], ['mqtt']);
        this.ws.binaryType = 'arraybuffer';
        this.ws.onopen = () => {
          this.enviarConnect();
        };
        this.ws.onmessage = (e) => {
          const buf = new Uint8Array(e.data);
          const tipo = buf[0] >> 4;
          if (tipo === 2) {
            this.enviarSubscribe(this.topic);
          } else if (tipo === 3) {
            let pos = 1;
            let multiplier = 1;
            let remainingLength = 0;
            let digit;
            do {
              digit = buf[pos++];
              remainingLength += (digit & 127) * multiplier;
              multiplier *= 128;
            } while ((digit & 128) !== 0);

            const topicLen = (buf[pos] << 8) | buf[pos + 1];
            pos += 2 + topicLen;
            const payloadBytes = buf.subarray(pos);
            try {
              const data = JSON.parse(new TextDecoder().decode(payloadBytes));
              if (Array.isArray(data) && data.length > 0) {
                this.scoresGlobales = data;
                const combinadas = normalizarYCombinarPuntuaciones(obtenerPuntuacionesLocales(), data);
                guardarPuntuacionesLocales(combinadas);
              }
            } catch (err) {}
          }
        };
        this.ws.onerror = () => {
          idx++;
          if (idx < servers.length) setTimeout(intentar, 1000);
        };
      } catch (e) {}
    };
    intentar();
  }

  encStr(s) {
    const bytes = new TextEncoder().encode(s);
    const arr = new Uint8Array(2 + bytes.length);
    arr[0] = bytes.length >> 8;
    arr[1] = bytes.length & 0xff;
    arr.set(bytes, 2);
    return arr;
  }

  enviarConnect() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const cId = this.encStr('ninja_score_' + Math.random().toString(36).substring(2, 8));
    const proto = this.encStr('MQTT');
    const varHeader = new Uint8Array(proto.length + 4 + cId.length);
    varHeader.set(proto, 0);
    varHeader[proto.length] = 4;
    varHeader[proto.length + 1] = 2;
    varHeader[proto.length + 2] = 0;
    varHeader[proto.length + 3] = 60;
    varHeader.set(cId, proto.length + 4);
    const packet = new Uint8Array(2 + varHeader.length);
    packet[0] = 0x10;
    packet[1] = varHeader.length;
    packet.set(varHeader, 2);
    this.ws.send(packet);
  }

  enviarSubscribe(topic) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const topicArr = this.encStr(topic);
    const subBody = new Uint8Array(2 + topicArr.length + 1);
    subBody[0] = 0; subBody[1] = 1;
    subBody.set(topicArr, 2);
    subBody[subBody.length - 1] = 0;
    const packet = new Uint8Array(2 + subBody.length);
    packet[0] = 0x82;
    packet[1] = subBody.length;
    packet.set(subBody, 2);
    this.ws.send(packet);
  }

  publicarScores(lista) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      const topicArr = this.encStr(this.topic);
      const payload = new TextEncoder().encode(JSON.stringify(lista.slice(0, 30)));
      const remLen = topicArr.length + payload.length;
      const lenBytes = [];
      let x = remLen;
      do {
        let encodedByte = x % 128;
        x = Math.floor(x / 128);
        if (x > 0) encodedByte = encodedByte | 128;
        lenBytes.push(encodedByte);
      } while (x > 0);

      const packet = new Uint8Array(1 + lenBytes.length + remLen);
      packet[0] = 0x31;
      packet.set(lenBytes, 1);
      packet.set(topicArr, 1 + lenBytes.length);
      packet.set(payload, 1 + lenBytes.length + topicArr.length);
      this.ws.send(packet);
    } catch (e) {
      console.warn('Error publicando scores en nube:', e);
    }
  }
}

const gestorPuntuacionesNube = new GestorPuntuacionesNube();

function terminarJuego(motivo) {
  juegoActivo = false;
  clearInterval(intervaloTiempo);
  audio.detenerBGM();

  const elEsp = document.getElementById('hud-espectador');
  if (elEsp) elEsp.style.display = 'none';

  document.getElementById('gameover-titulo').textContent = motivo.includes('superada') ? '¡MISIÓN CUMPLIDA!' : '¡GAME OVER!';
  document.getElementById('gameover-subtitulo').textContent = motivo;
  document.getElementById('gameover-puntos').textContent = puntos;
  document.getElementById('gameover-stats').textContent = `Dificultad: ${dificultadActual.toUpperCase()} | Modo: ${modoActual.toUpperCase()} | Escenario: ${escenarioActual.toUpperCase()}`;
  document.getElementById('pantalla-gameover').style.display = 'flex';

  const nombre = ((document.getElementById('input-nombre') || document.getElementById('nombre-jugador')).value) || 'Ninja Shinobi';
  const nuevoScore = {
    nombre,
    puntos,
    dificultad: dificultadActual,
    escenario: escenarioActual,
    fecha: Date.now()
  };

  const listaCombinada = agregarPuntuacionLocal(nuevoScore);

  red.enviarPuntuacion(nuevoScore);

  gestorPuntuacionesNube.publicarScores(listaCombinada);

  fetch('/api/puntuaciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevoScore)
  }).catch(() => {});
}

function pausarJuego() {
  if (!juegoActivo) return;
  juegoPausado = true;
  audio.detenerBGM();
  document.getElementById('menu-pausa').style.display = 'flex';
}

function reanudarJuego() {
  if (!juegoActivo) return;
  juegoPausado = false;
  audio.reanudarBGM();
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
  audio.detenerBGM();
  obstaculos.forEach(o => scene.remove(o));
  obstaculos = [];

  const elEsp = document.getElementById('hud-espectador');
  if (elEsp) elEsp.style.display = 'none';

  red.salir();
  Object.keys(otrosJugadores).forEach(id => {
    if (otrosJugadores[id]) otrosJugadores[id].destruir();
  });
  otrosJugadores = {};

  const nombre = ((document.getElementById('input-nombre') || document.getElementById('nombre-jugador')).value) || 'Ninja Shinobi';
  jugador.revivir(`${nombre} (Tú)`, 0x153b54, 0);
  ultimoObstaculoSeq = -1;

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

function vincularClick(id, fn) {
  const el = document.getElementById(id);
  if (el) el.onclick = fn;
}

vincularClick('btn-reintentar', empezarPartida);
vincularClick('btn-pausa-hud', pausarJuego);
vincularClick('btn-reanudar', reanudarJuego);
vincularClick('btn-salir-menu', volverAlMenu);
vincularClick('btn-pausa-salir', volverAlMenu);
vincularClick('btn-gameover-salir', volverAlMenu);

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
    errEl.textContent = 'Conectando a sala ' + codigo + '...';
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
    btnSonido.textContent = sonando ? 'MÚSICA: ON' : 'MÚSICA: OFF';
  };
}

const sliderMusica = document.getElementById('slider-vol-musica');
const valMusica = document.getElementById('val-vol-musica');
const sliderSFX = document.getElementById('slider-vol-sfx');
const valSFX = document.getElementById('val-vol-sfx');
const btnProbarKatana = document.getElementById('btn-probar-katana');

function sincronizarControlesVolumen() {
  const pMus = Math.round(audio.volumenMusica * 100);
  const pSFX = Math.round(audio.volumenSFX * 100);
  if (sliderMusica) sliderMusica.value = pMus;
  if (valMusica) valMusica.textContent = `${pMus}%`;
  if (sliderSFX) sliderSFX.value = pSFX;
  if (valSFX) valSFX.textContent = `${pSFX}%`;
}

if (sliderMusica) {
  sliderMusica.addEventListener('input', (e) => {
    const v = parseInt(e.target.value);
    audio.setVolumenMusica(v / 100);
    if (valMusica) valMusica.textContent = `${v}%`;
  });
}

if (sliderSFX) {
  sliderSFX.addEventListener('input', (e) => {
    const v = parseInt(e.target.value);
    audio.setVolumenSFX(v / 100);
    if (valSFX) valSFX.textContent = `${v}%`;
  });
}

if (btnProbarKatana) {
  btnProbarKatana.addEventListener('click', () => {
    audio.playEspadazo();
  });
}

sincronizarControlesVolumen();

function abrirConfig() {
  sincronizarControlesVolumen();
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
  if (lista) lista.innerHTML = '<p style="color:#aaa; text-align:center;">Consultando tabla de puntuaciones...</p>';

  const renderTabla = (datos) => {
    if (!lista) return;
    if (!datos || datos.length === 0) {
      lista.innerHTML = '<p style="color:#aaa; text-align:center;">No hay puntuaciones registradas aún.</p>';
      return;
    }
    let html = '<table style="width: 100%; border-collapse: collapse; color: #eee; font-size: 13px;">';
    html += '<tr style="border-bottom: 2px solid #555; background: rgba(255,255,255,0.05);">' +
      '<th style="padding: 6px;">#</th><th style="padding: 6px; text-align: left;">Ninja</th>' +
      '<th style="padding: 6px;">Pts</th><th style="padding: 6px;">Modo</th></tr>';
    datos.slice(0, 15).forEach((p, idx) => {
      const medalla = idx === 0 ? '🥇 ' : (idx === 1 ? '🥈 ' : (idx === 2 ? '🥉 ' : ''));
      const esTop = idx < 3;
      const colorNombre = esTop ? '#ffca28' : '#e0e0e0';
      html += `<tr style="border-bottom: 1px solid #333; text-align: center;">
        <td style="padding: 6px; color: #aaa;">${medalla}${idx + 1}</td>
        <td style="padding: 6px; text-align: left; font-weight: bold; color: ${colorNombre};">${p.nombre || 'Ninja'}</td>
        <td style="padding: 6px; color: #64b5f6; font-weight: bold;">${p.puntos}</td>
        <td style="padding: 6px; font-size: 11px; color: #aaa;">${p.dificultad || 'Fácil'}</td>
      </tr>`;
    });
    html += '</table>';
    lista.innerHTML = html;
  };

  const locales = obtenerPuntuacionesLocales();
  const nube = gestorPuntuacionesNube.scoresGlobales || [];
  let preliminar = normalizarYCombinarPuntuaciones(locales, nube);
  if (preliminar.length > 0) {
    renderTabla(preliminar);
  }

  fetch('/api/puntuaciones')
    .then(r => r.json())
    .then(datosApi => {
      const combinadas = normalizarYCombinarPuntuaciones(locales, nube, Array.isArray(datosApi) ? datosApi : []);
      guardarPuntuacionesLocales(combinadas);
      renderTabla(combinadas);
      gestorPuntuacionesNube.publicarScores(combinadas);
    })
    .catch(() => {
      if (preliminar.length === 0) {
        renderTabla([
          { nombre: 'Sensei Ryu', puntos: 520, dificultad: 'Dificil' },
          { nombre: 'Kunoichi Sakura', puntos: 430, dificultad: 'Dificil' },
          { nombre: 'Shadow Shinobi', puntos: 350, dificultad: 'Facil' }
        ]);
      }
    });
});

vincularClick('btn-cerrar-puntuaciones', () => {
  const m = document.getElementById('modal-puntuaciones');
  if (m) m.style.display = 'none';
});

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

async function init() {
  try {
    await Promise.all([cargarNinja(), cargarShuriken()]);

    if (jugador) jugador.asignarModelo();
    Object.values(otrosJugadores).forEach(j => j.asignarModelo());
    console.log('Modelos OBJ originales del Ninja y Shuriken cargados con éxito!');
  } catch (err) {
    console.warn('Carga asíncrona completada con fallback activo:', err);
  }

  const pCarga = document.getElementById('pantalla-carga');
  if (pCarga) pCarga.style.display = 'none';

  animate();
}

init();

