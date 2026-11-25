import * as THREE from 'three';
import { audio } from './js/audio.js';
import { particulas } from './js/particulas.js';
import { scene, camera, renderer, luzAmbiental, luzFocal, aplicarEscenario, escenarioActual } from './js/escenario.js';
import { cargarNinja, cargarShuriken } from './js/modelos.js';
import { JugadorNinja } from './js/jugador.js';
import { RedDojo } from './js/red.js';
import { crearElementoPorTipo, obtenerObjetivoVivoParaIA } from './js/obstaculos.js';
import {
  obtenerPuntuacionesLocales,
  guardarPuntuacionesLocales,
  normalizarYCombinarPuntuaciones,
  agregarPuntuacionLocal,
  gestorPuntuacionesNube
} from './js/puntuaciones.js';

const jugador = new JugadorNinja({
  id: 'jugador_propio',
  nombre: 'Ninja Shinobi',
  x: 0, y: 0, z: 0,
  color: { hex: 0x2980b9, ropa: 0x153b54, cinta: 0xffffff }
}, true);

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
    agregarPuntuacionLocal(nuevoScore);
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
    const elem = crearElementoPorTipo(datos.tipo, datos.posX, datos.id, datos.targetId, datos.targetNombre);
    scene.add(elem);
    obstaculos.push(elem);

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

let juegoActivo = false;
let juegoPausado = false;
let vidas = 3;
let puntos = 0;
let tiempo = 30;
let modoActual = 'esquivar';
let dificultadActual = 'facil';
let velocidadObstaculos = 18;
let parryTimer = 0;
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

function puedeGenerarObstaculos() {
  if (red.codigoSala) {
    return red.isHost;
  }
  return true;
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
      const elem = crearElementoPorTipo(tipo, posX, idObs);
      scene.add(elem);
      obstaculos.push(elem);

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
  red.iniciarPartidaLobby({
    modo: modoActual,
    dificultad: dificultadActual,
    escenario: escenarioActual,
    velocidad: velocidadObstaculos
  });
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
