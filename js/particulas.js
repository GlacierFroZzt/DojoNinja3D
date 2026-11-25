import * as THREE from 'three';
import { scene } from './escenario.js';

export class SistemaParticulas {
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

export const particulas = new SistemaParticulas();
