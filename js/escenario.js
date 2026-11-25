import * as THREE from 'three';

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

export const luzFocal = new THREE.SpotLight(0xffffff, 3.5, 35, Math.PI / 4, 0.4, 1.2);
luzFocal.position.set(0, 8, 4);
luzFocal.castShadow = true;
luzFocal.shadow.mapSize.width = 1024;
luzFocal.shadow.mapSize.height = 1024;
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

export let escenarioActual = 'dojo';

export function aplicarEscenario(esc) {
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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
