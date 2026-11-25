import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

const textureLoader = new THREE.TextureLoader();

export const texTraje = textureLoader.load('models/ninja/textures/ninja_suit.png');
export const texAcento = textureLoader.load('models/ninja/textures/ninja_accent.png');
export const texMetal = textureLoader.load('models/shuriken/textures/shuriken_metal.png');

export const plantillas = {
  ninja: null,
  shuriken: null
};

export function crearModeloKatana() {
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

export function cargarNinja() {
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
        plantillas.ninja = grupo;
        resolve(grupo);
      }, undefined, reject);
    }, undefined, reject);
  });
}

export function cargarShuriken() {
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
        plantillas.shuriken = grupo;
        resolve(grupo);
      }, undefined, reject);
    }, undefined, reject);
  });
}

export function crearNinjaFallback(colorRopa = 0x153b54) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: colorRopa, roughness: 0.7 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.5), mat);
  torso.position.y = 1.1;
  const cabeza = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat);
  cabeza.position.y = 1.85;
  g.add(torso, cabeza);
  return g;
}
