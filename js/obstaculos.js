import * as THREE from 'three';
import { plantillas } from './modelos.js';

export function crearPergaminoMesh() {
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

export function crearPocionMesh() {
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

export function crearEscudoItemMesh() {
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

export function crearShurikenMesh() {
  if (plantillas.shuriken) {
    const s = plantillas.shuriken.clone(true);
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

export function crearShurikenIAMesh(targetNombre = '') {
  const g = new THREE.Group();

  const matMetalCarmesi = new THREE.MeshStandardMaterial({
    color: 0xff1744,
    emissive: 0xff1744,
    emissiveIntensity: 1.6,
    metalness: 0.85,
    roughness: 0.15
  });

  let shurikenMesh;
  if (plantillas.shuriken) {
    shurikenMesh = plantillas.shuriken.clone(true);
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

export function crearElementoPorTipo(tipo, posX, idObstaculo = null, targetId = null, targetNombre = '', defaultId = null) {
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
  obj.idObstaculo = idObstaculo || defaultId || ('obs_' + Math.random().toString(36).substring(2, 9));
  return obj;
}

export function obtenerObjetivoVivoParaIA(jugador, otrosJugadores, red) {
  const candidatos = [];
  if (jugador && !jugador.estaMuerto) {
    const elInput = document.getElementById('input-nombre') || document.getElementById('nombre-jugador');
    const miNombre = (elInput && elInput.value) ? elInput.value : (jugador.nombre || 'Ninja');
    candidatos.push({ id: (red && red.miId) ? red.miId : 'propio', nombre: miNombre });
  }
  if (otrosJugadores) {
    Object.keys(otrosJugadores).forEach((id) => {
      const p = otrosJugadores[id];
      if (p && !p.estaMuerto) {
        candidatos.push({ id, nombre: p.nombre });
      }
    });
  }
  if (candidatos.length === 0) return null;
  return candidatos[Math.floor(Math.random() * candidatos.length)];
}
