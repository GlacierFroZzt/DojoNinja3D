import * as THREE from 'three';
import { scene } from './escenario.js';
import { crearModeloKatana, crearNinjaFallback, plantillas } from './modelos.js';
import { particulas } from './particulas.js';
import { audio } from './audio.js';

export class JugadorNinja {
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
    if (plantillas.ninja) {
      this.modelo = plantillas.ninja.clone(true);
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
      if (plantillas.ninja) {
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
