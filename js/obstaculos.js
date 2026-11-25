import * as THREE from 'three';
import { plantillas } from './modelos.js';

export const obstaculos = [];
export let spawnTimer = 0;
export let iaShurikenTimer = 3.5;

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

export function mostrarAviso(elemId, texto, duracion = 650) {
  const el = document.getElementById(elemId);
  if (!el) return;
  if (texto) el.textContent = texto;
  el.classList.add('mostrar');
  setTimeout(() => el.classList.remove('mostrar'), duracion);
}

export function flashImpacto() {
  const imp = document.getElementById('impacto-rojo');
  if (imp) {
    imp.classList.add('activo');
    setTimeout(() => imp.classList.remove('activo'), 180);
  }
}

export function limpiarObstaculos(scene) {
  obstaculos.forEach(o => {
    if (scene) scene.remove(o);
  });
  obstaculos.length = 0;
  spawnTimer = 0;
  iaShurikenTimer = 3.5;
}

export function generarObstaculos(delta, ctx) {
  const { scene, red, jugador, otrosJugadores, juegoActivo, juegoPausado, dificultadActual, modoActual } = ctx;

  if (red.codigoSala && !red.isHost) return;
  if (!juegoActivo || juegoPausado) return;

  const numJugadoresConectados = 1 + Object.keys(otrosJugadores).length;

  iaShurikenTimer += delta;
  const baseIntervaloPerseguidor = dificultadActual === 'dificil' ? 6.5 : 8.5;
  const intervaloPerseguidor = numJugadoresConectados > 1 ? (baseIntervaloPerseguidor * 0.75) : baseIntervaloPerseguidor;

  if (iaShurikenTimer >= intervaloPerseguidor) {
    iaShurikenTimer = 0;
    const objetivo = obtenerObjetivoVivoParaIA(jugador, otrosJugadores, red);
    if (objetivo) {
      const posX = (Math.random() * 6) - 3;
      const idObs = 'obs_carmesi_' + (++red.obstacleSeq);
      const elem = crearElementoPorTipo('shuriken_ia', posX, idObs, objetivo.id, objetivo.nombre);
      scene.add(elem);
      obstaculos.push(elem);

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
        posX = (s === 0) ? (-0.5 - (Math.random() * 3.3)) : (0.5 + (Math.random() * 3.3));
      } else {
        posX = (Math.random() * 8) - 4;
      }

      const rand = Math.random();
      let tipo = 'shuriken';
      if (rand < 0.08) tipo = 'item_pocion';
      else if (rand < 0.16) tipo = 'item_escudo';
      else if (rand < 0.24) tipo = 'item_pergamino';
      else tipo = (modoActual === 'esquivar') ? 'shuriken' : 'pergamino';

      const idObs = 'obs_' + (++red.obstacleSeq);
      const elem = crearElementoPorTipo(tipo, posX, idObs);
      scene.add(elem);
      obstaculos.push(elem);

      red.enviarObstaculo({ id: idObs, tipo, posX });
    }
  }
}

export function actualizarObstaculos(delta, ctx) {
  const { velocidadObstaculos, particulas, red, jugador, otrosJugadores } = ctx;

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
}

export function procesarColisiones(ctx, callbacks) {
  const { jugador, otrosJugadores, audio, particulas, red, scene } = ctx;
  const localPos = jugador.root.position;
  const esParry = ctx.parryTimer > 0;
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
        callbacks.alSumarVida(1);
        callbacks.alSumarPuntos(30);
        audio.playItem();
        particulas.emitir(localPos, 0xff1744, 25);
        mostrarAviso('hud-aviso-cerca', '+1 VIDA');
        callbacks.actualizarHUD();
        red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'pocion', x: obj.position.x, z: obj.position.z });
        red.enviarPoder({ tipo: 'pocion' });
        continue;
      }

      if (obj.tipo === 'item_escudo') {
        jugador.escudoTimer = 6.0;
        audio.playItem();
        particulas.emitir(localPos, 0x00e5ff, 30);
        mostrarAviso('hud-aviso-parry', 'ESCUDO ACTIVO (6s)');
        callbacks.actualizarHUD();
        red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'escudo', x: obj.position.x, z: obj.position.z });
        red.enviarPoder({ tipo: 'escudo', duracion: 6.0 });
        continue;
      }

      if (obj.tipo === 'item_pergamino') {
        callbacks.alSumarPuntos(200);
        audio.playItem();
        particulas.emitir(localPos, 0xffd54f, 35);
        mostrarAviso('hud-aviso-parry', 'PERGAMINO +200');
        callbacks.actualizarHUD();
        red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'pergamino', x: obj.position.x, z: obj.position.z });
        continue;
      }

      if (obj.tipo === 'shuriken_ia') {
        if (esParry && dz >= -1.8 && dz <= 0.5) {
          callbacks.alSumarPuntos(300);
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
            callbacks.alRestarVida(1);
            audio.playGolpe();
            particulas.emitir(localPos, 0xff1744, 45);
            flashImpacto();
            callbacks.actualizarHUD();
            mostrarAviso('hud-aviso-cerca', '¡FALLASTE EL PARRY OBLIGATORIO!', 1800);
          }
          red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'golpe_ia', x: obj.position.x, z: obj.position.z });
          if (callbacks.getVidas() <= 0) {
            const elNom = document.getElementById('input-nombre') || document.getElementById('nombre-jugador');
            const nombreJug = (elNom && elNom.value) ? elNom.value : 'Ninja';
            jugador.morir();
            red.enviarMuerte({ id: red.miId, nombre: nombreJug });

            const hayCompaneroVivo = Object.values(otrosJugadores).some(p => !p.estaMuerto);
            if (hayCompaneroVivo) {
              mostrarAviso('hud-aviso-cerca', '¡HAS CAÍDO! Modo Espectador — Apoyando a tu compañero...', 4000);
              const elEsp = document.getElementById('hud-espectador');
              if (elEsp) elEsp.style.display = 'block';
            } else {
              callbacks.terminarJuego('¡Todos los ninjas han caído!');
              red.enviarFinPartida({ motivo: '¡Todos los ninjas han caído!' });
            }
          }
        }
        continue;
      }

      if (obj.tipo === 'shuriken') {
        if (esParry && dz >= -1.8 && dz <= 0.4) {
          callbacks.alSumarPuntos(150);
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
          callbacks.alRestarVida(1);
          audio.playGolpe();
          particulas.emitir(localPos, 0xe53935, 25);
          flashImpacto();
          callbacks.actualizarHUD();
          red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'golpe', x: obj.position.x, z: obj.position.z });
          if (callbacks.getVidas() <= 0) {
            const elNom = document.getElementById('input-nombre') || document.getElementById('nombre-jugador');
            const nombreJug = (elNom && elNom.value) ? elNom.value : 'Ninja';
            jugador.morir();
            red.enviarMuerte({ id: red.miId, nombre: nombreJug });

            const hayCompaneroVivo = Object.values(otrosJugadores).some(p => !p.estaMuerto);
            if (hayCompaneroVivo) {
              mostrarAviso('hud-aviso-cerca', '¡HAS CAÍDO! Modo Espectador — Apoyando a tu compañero...', 4000);
              const elEsp = document.getElementById('hud-espectador');
              if (elEsp) elEsp.style.display = 'block';
            } else {
              callbacks.terminarJuego('¡Todos los ninjas han caído!');
              red.enviarFinPartida({ motivo: '¡Todos los ninjas han caído!' });
            }
          }
        }
      } else if (obj.tipo === 'pergamino') {
        callbacks.alSumarPuntos(50);
        audio.playItem();
        particulas.emitir(localPos, 0xffb300, 20);
        mostrarAviso('hud-aviso-cerca', '+50 PERGAMINO');
        callbacks.actualizarHUD();
        red.enviarImpactoObstaculo({ id: obj.idObstaculo, tipo: 'pergamino', x: obj.position.x, z: obj.position.z });
      }
      continue;
    }

    if (obj.position.z > 6) {
      scene.remove(obj);
      obstaculos.splice(i, 1);
      if (obj.tipo === 'shuriken' && !jugador.estaMuerto) {
        callbacks.alSumarPuntos(20);
        mostrarAviso('hud-aviso-cerca', 'CERCA +20');
        callbacks.actualizarHUD();
      }
    }
  }
}
