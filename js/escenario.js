import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const container = document.getElementById('canvas-container');
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141820);
scene.fog = new THREE.FogExp2(0x141820, 0.012);

export const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 4.2, 8.5);
camera.lookAt(0, 1.2, 0);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
if (container) {
  container.appendChild(renderer.domElement);
}

export const luzAmbiental = new THREE.AmbientLight(0xffecc4, 1.2);
scene.add(luzAmbiental);

export const luzDireccional = new THREE.DirectionalLight(0xfff0dd, 1.4);
luzDireccional.position.set(6, 18, 12);
luzDireccional.castShadow = true;
luzDireccional.shadow.mapSize.width = 1024;
luzDireccional.shadow.mapSize.height = 1024;
luzDireccional.shadow.camera.near = 0.5;
luzDireccional.shadow.camera.far = 60;
luzDireccional.shadow.camera.left = -12;
luzDireccional.shadow.camera.right = 12;
luzDireccional.shadow.camera.top = 25;
luzDireccional.shadow.camera.bottom = -25;
scene.add(luzDireccional);

export const luzFocal = new THREE.SpotLight(0x00e5ff, 14.0, 40, Math.PI / 4, 0.35, 1.0);
luzFocal.position.set(0, 8, 3);
luzFocal.castShadow = true;
luzFocal.shadow.mapSize.width = 1024;
luzFocal.shadow.mapSize.height = 1024;
luzFocal.target.position.set(0, 0, 0);
scene.add(luzFocal.target);
scene.add(luzFocal);

const textureLoader = new THREE.TextureLoader();

export const texDojo = textureLoader.load('models/ninja/textures/dojo_floor.png');
texDojo.wrapS = THREE.RepeatWrapping;
texDojo.wrapT = THREE.RepeatWrapping;
texDojo.repeat.set(6, 40);

export function generarTexturaAsfalto() {
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
export const texAsfalto = generarTexturaAsfalto();

export function generarTexturaLava() {
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
export const texLava = generarTexturaLava();

export const largoPista = 140;
export const anchoPista = 10;
export const sueloGeo = new THREE.PlaneGeometry(anchoPista, largoPista);
export const sueloMat = new THREE.MeshStandardMaterial({
  map: texDojo,
  roughness: 0.8,
  metalness: 0.1
});
export const suelo = new THREE.Mesh(sueloGeo, sueloMat);
suelo.rotation.x = -Math.PI / 2;
suelo.position.set(0, 0, -35);
suelo.receiveShadow = true;
scene.add(suelo);

export const muroGeo = new THREE.BoxGeometry(0.8, 5, largoPista);
export const muroMat = new THREE.MeshStandardMaterial({ color: 0x2b2218, roughness: 0.9 });
export const muroIzq = new THREE.Mesh(muroGeo, muroMat);
muroIzq.position.set(-anchoPista / 2 - 0.4, 2.5, -35);
muroIzq.receiveShadow = true;
scene.add(muroIzq);

export const muroDer = new THREE.Mesh(muroGeo, muroMat);
muroDer.position.set(anchoPista / 2 + 0.4, 2.5, -35);
muroDer.receiveShadow = true;
scene.add(muroDer);

export const listaColumnas = [];
export const colGeo = new THREE.BoxGeometry(0.6, 6, 0.6);
export const colMat = new THREE.MeshStandardMaterial({ color: 0x8b1a1a, roughness: 0.5 });

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

export const grupoEscenario = new THREE.Group();
scene.add(grupoEscenario);

export const modelosEscenarios = {
  dojo: null,
  ciudad: null,
  volcan: null
};

const gltfLoader = new GLTFLoader();

export function cargarModelosEscenarios() {
  const rutas = {
    dojo: 'models/escenarios/escenario_dojo.glb',
    ciudad: 'models/escenarios/escenario_ciudad.glb',
    volcan: 'models/escenarios/escenario_volcan.glb'
  };

  const promesas = Object.entries(rutas).map(([clave, ruta]) => {
    return new Promise((resolve) => {
      gltfLoader.load(
        ruta,
        (gltf) => {
          const m = gltf.scene;
          m.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          modelosEscenarios[clave] = m;
          resolve();
        },
        undefined,
        (err) => {
          console.warn(`[Escenario] Error al cargar ${ruta}, se usará fallback procedimental.`, err);
          resolve();
        }
      );
    });
  });

  return Promise.all(promesas);
}

export let escenarioActual = 'dojo';

export function aplicarEscenario(esc) {
  escenarioActual = esc;

  let clave = 'dojo';
  if (esc === 'noche' || esc === 'ciudad') clave = 'ciudad';
  if (esc === 'lava' || esc === 'volcan') clave = 'volcan';

  if (modelosEscenarios[clave]) {
    suelo.visible = false;
    muroIzq.visible = false;
    muroDer.visible = false;
    listaColumnas.forEach(c => { c.visible = false; });

    grupoEscenario.clear();
    grupoEscenario.add(modelosEscenarios[clave]);
    grupoEscenario.visible = true;
  } else {
    suelo.visible = true;
    muroIzq.visible = true;
    muroDer.visible = true;
    listaColumnas.forEach(c => { c.visible = true; });
    grupoEscenario.clear();
  }

  if (clave === 'ciudad') {
    scene.background = new THREE.Color(0x0a1020);
    scene.fog.color.setHex(0x0a1224);
    scene.fog.density = 0.009;

    sueloMat.map = texAsfalto;
    sueloMat.color.setHex(0xffffff);
    sueloMat.roughness = 0.3;
    sueloMat.metalness = 0.4;
    sueloMat.needsUpdate = true;

    muroMat.color.setHex(0x0c1424);
    colMat.color.setHex(0x00e5ff);
    colMat.emissive = new THREE.Color(0x004488);

    luzAmbiental.color.setHex(0x7090ff);
  } else if (clave === 'volcan') {
    scene.background = new THREE.Color(0x280804);
    scene.fog.color.setHex(0x300a05);
    scene.fog.density = 0.010;

    sueloMat.map = texLava;
    sueloMat.color.setHex(0xffffff);
    sueloMat.roughness = 0.6;
    sueloMat.metalness = 0.3;
    sueloMat.needsUpdate = true;

    muroMat.color.setHex(0x1a0604);
    colMat.color.setHex(0xff3d00);
    colMat.emissive = new THREE.Color(0x661100);

    luzAmbiental.color.setHex(0xff6633);
  } else {
    scene.background = new THREE.Color(0x161a24);
    scene.fog.color.setHex(0x161c28);
    scene.fog.density = 0.008;

    sueloMat.map = texDojo;
    sueloMat.color.setHex(0xffffff);
    sueloMat.roughness = 0.8;
    sueloMat.metalness = 0.1;
    sueloMat.needsUpdate = true;

    muroMat.color.setHex(0x2b2218);
    colMat.color.setHex(0x8b1a1a);
    colMat.emissive = new THREE.Color(0x000000);

    luzAmbiental.color.setHex(0xffecc4);
  }

  actualizarAjustesLuces();
}

export function actualizarAjustesLuces() {
  const selColor = document.getElementById('sel-color-luz') || document.getElementById('cfg-luz-focal');
  const selAmb = document.getElementById('sel-luz-ambiente') || document.getElementById('cfg-luz-ambiental');
  const selSombras = document.getElementById('sel-sombras') || document.getElementById('cfg-sombras');

  // 1. Color Iluminación Focal (Linterna / Spotlight)
  if (selColor && selColor.value) {
    const val = selColor.value;
    const hex = val.startsWith('0x') ? parseInt(val) : parseInt(val, 16);
    if (!isNaN(hex)) {
      luzFocal.color.setHex(hex);
      const colBaseEsc = (escenarioActual === 'noche' || escenarioActual === 'ciudad') ? new THREE.Color(0x88c0ff) :
                         ((escenarioActual === 'lava' || escenarioActual === 'volcan') ? new THREE.Color(0xff8844) : new THREE.Color(0xfff0dd));
      luzDireccional.color.copy(colBaseEsc).lerp(new THREE.Color(hex), 0.5);
    }
  }

  // 2. Intensidad Luz Ambiental (Normal, Brillante, Penumbra)
  const valAmb = selAmb ? parseFloat(selAmb.value) : 1.2;
  const ambMulti = isNaN(valAmb) ? 1.2 : valAmb;
  luzAmbiental.intensity = ambMulti;
  luzDireccional.intensity = ambMulti * 1.15;

  // 3. Sombras Dinámicas
  const sombrasActivas = selSombras ? (selSombras.value !== 'none') : true;
  renderer.shadowMap.enabled = sombrasActivas;
  luzFocal.castShadow = sombrasActivas;
  luzDireccional.castShadow = sombrasActivas;

  scene.traverse((child) => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => { m.needsUpdate = true; });
      } else {
        child.material.needsUpdate = true;
      }
    }
  });
}

export function iniciarControlesLuces(luzAmb = luzAmbiental, luzFoc = luzFocal, rend = renderer) {
  const cfgFocal = document.getElementById('cfg-luz-focal') || document.getElementById('sel-color-luz');
  if (cfgFocal) {
    cfgFocal.addEventListener('change', actualizarAjustesLuces);
    cfgFocal.addEventListener('input', actualizarAjustesLuces);
  }

  const cfgAmb = document.getElementById('cfg-luz-ambiental') || document.getElementById('sel-luz-ambiente');
  if (cfgAmb) {
    cfgAmb.addEventListener('change', actualizarAjustesLuces);
    cfgAmb.addEventListener('input', actualizarAjustesLuces);
  }

  const cfgSombras = document.getElementById('cfg-sombras') || document.getElementById('sel-sombras');
  if (cfgSombras) {
    cfgSombras.addEventListener('change', actualizarAjustesLuces);
    cfgSombras.addEventListener('input', actualizarAjustesLuces);
  }

  const selEscenarioEl = document.getElementById('sel-escenario');
  if (selEscenarioEl) {
    selEscenarioEl.addEventListener('change', (e) => {
      aplicarEscenario(e.target.value);
    });
  }

  actualizarAjustesLuces();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
