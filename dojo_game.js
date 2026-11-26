import * as THREE from 'three';
import { audio, iniciarControlesAudio } from './js/audio.js';
import { particulas } from './js/particulas.js';
import { scene, camera, renderer, luzAmbiental, luzFocal, aplicarEscenario, escenarioActual, iniciarControlesLuces, cargarModelosEscenarios } from './js/escenario.js';
import { cargarNinja, cargarShuriken } from './js/modelos.js';
import { JugadorNinja } from './js/jugador.js';
import { red, renderizarLobby, iniciarBotonesSalas } from './js/red.js';
import {
  obstaculos,
  generarObstaculos,
  actualizarObstaculos,
  procesarColisiones,
  limpiarObstaculos,
  mostrarAviso,
  crearElementoPorTipo
} from './js/obstaculos.js';
import {
  obtenerPuntuacionesLocales,
  guardarPuntuacionesLocales,
  normalizarYCombinarPuntuaciones,
  agregarPuntuacionLocal,
  gestorPuntuacionesNube,
  iniciarModalPuntuaciones,
  configurarCompartirRedes
} from './js/puntuaciones.js';

const jugador = new JugadorNinja({
  id: 'jugador_propio',
  nombre: 'Ninja Shinobi',
  x: 0, y: 0, z: 0,
  color: { hex: 0x2980b9, ropa: 0x153b54, cinta: 0xffffff }
}, true);

let otrosJugadores = {};
let codigoSalaActual = 'GLOBAL';

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

  limpiarObstaculos(scene);

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
      if (red.codigoSala && !red.isHost) return;
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

function pausarJuego(desdeRed = false, remitenteNombre = null) {
  if (!juegoActivo) return;
  juegoPausado = true;
  audio.detenerBGM();

  const mPausa = document.getElementById('menu-pausa');
  if (mPausa) {
    mPausa.style.display = 'flex';
    const titPausa = document.getElementById('titulo-menu-pausa');
    if (titPausa) {
      titPausa.textContent = (desdeRed && remitenteNombre) ? `Pausado por ${remitenteNombre}` : 'Dojo en Pausa';
    }
  }

  if (!desdeRed) {
    red.enviarPausa(true);
  }
}

function reanudarJuego(desdeRed = false) {
  if (!juegoActivo) return;
  juegoPausado = false;
  audio.reanudarBGM();

  const mPausa = document.getElementById('menu-pausa');
  if (mPausa) {
    mPausa.style.display = 'none';
  }

  if (!desdeRed) {
    red.enviarPausa(false);
  }
}

function alternarPausa() {
  if (juegoPausado) reanudarJuego(false);
  else pausarJuego(false);
}

function volverAlMenu() {
  juegoActivo = false;
  juegoPausado = false;
  clearInterval(intervaloTiempo);
  audio.detenerBGM();
  limpiarObstaculos(scene);

  const elEsp = document.getElementById('hud-espectador');
  if (elEsp) elEsp.style.display = 'none';

  red.salir();
  Object.keys(otrosJugadores).forEach(id => {
    if (otrosJugadores[id]) otrosJugadores[id].destruir();
  });
  otrosJugadores = {};

  const nombre = ((document.getElementById('input-nombre') || document.getElementById('nombre-jugador')).value) || 'Ninja Shinobi';
  jugador.revivir(`${nombre} (Tú)`, 0x153b54, 0);

  ['pantalla-lobby', 'modal-unirse-sala', 'modal-puntuaciones', 'modal-opciones'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  document.getElementById('menu-inicio').style.display = 'flex';
  document.getElementById('menu-pausa').style.display = 'none';
  document.getElementById('pantalla-gameover').style.display = 'none';
  document.getElementById('hud-juego').style.display = 'none';
}

red.on('joinedLobby', (datos) => renderizarLobby(datos, red));
red.on('lobbyUpdate', (datos) => renderizarLobby(datos, red));

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
  const lobby = document.getElementById('pantalla-lobby');
  if (lobby) lobby.style.display = 'none';
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
      const posX = esHostRemoto ? -1.5 : 1.5;
      const nombreRemoto = lista[id].nombre || (esHostRemoto ? 'Anfitrión' : 'Invitado');

      otrosJugadores[id] = new JugadorNinja({
        id, nombre: nombreRemoto, x: posX, y: 0, z: 0,
        color: { hex: esHostRemoto ? 0x2980b9 : 0xe74c3c, ropa: colorRopa, cinta: esHostRemoto ? 0xffffff : 0xff1744 }
      }, false);
      otrosJugadores[id].actualizarEtiqueta(`${nombreRemoto} (${esHostRemoto ? 'Anfitrión' : 'Invitado'})`);
    }
  });
});

red.on('nuevoJugador', (datos) => {
  if (datos.id !== red.miId && !otrosJugadores[datos.id]) {
    const esHostRemoto = (red.anfitrionId === datos.id);
    const colorRopa = esHostRemoto ? 0x153b54 : 0x881111;
    const posX = esHostRemoto ? -1.5 : 1.5;
    const nombreRemoto = datos.nombre || (esHostRemoto ? 'Anfitrión' : 'Invitado');

    otrosJugadores[datos.id] = new JugadorNinja({
      id: datos.id, nombre: nombreRemoto, x: posX, y: 0, z: 0,
      color: { hex: esHostRemoto ? 0x2980b9 : 0xe74c3c, ropa: colorRopa, cinta: esHostRemoto ? 0xffffff : 0xff1744 }
    }, false);
    otrosJugadores[datos.id].actualizarEtiqueta(`${nombreRemoto} (${esHostRemoto ? 'Anfitrión' : 'Invitado'})`);
  }
});

red.on('jugadorMovido', (datos) => {
  if (datos.id === red.miId) return;
  if (!otrosJugadores[datos.id] && juegoActivo) {
    const esHostRemoto = (red.anfitrionId === datos.id);
    const posX = esHostRemoto ? -1.5 : 1.5;
    const nombreRemoto = (red.jugadores && red.jugadores[datos.id] && red.jugadores[datos.id].nombre) || (esHostRemoto ? 'Anfitrión' : 'Invitado');

    otrosJugadores[datos.id] = new JugadorNinja({
      id: datos.id, nombre: nombreRemoto, x: datos.x !== undefined ? datos.x : posX, y: 0, z: 0,
      color: { hex: esHostRemoto ? 0x2980b9 : 0xe74c3c, ropa: esHostRemoto ? 0x153b54 : 0x881111, cinta: esHostRemoto ? 0xffffff : 0xff1744 }
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
    scene.remove(obstaculos[idx]);
    obstaculos.splice(idx, 1);
  }
  const pos = new THREE.Vector3(datos.x || 0, 1.2, datos.z || 0);
  if (datos.tipo === 'parry') { particulas.emitir(pos, 0x64b5f6, 30); audio.playParry(); }
  else if (datos.tipo === 'parry_ia') { particulas.emitir(pos, 0xffd700, 50); audio.playParry(); mostrarAviso('hud-aviso-parry', '¡ALIADO PARREÓ AL SHURIKEN CARMESÍ!', 1300); }
  else if (datos.tipo === 'golpe_ia' || datos.tipo === 'golpe') { particulas.emitir(pos, 0xff1744, 35); audio.playGolpe(); }
  else if (datos.tipo === 'escudo' || datos.tipo === 'escudo_bloqueo') { particulas.emitir(pos, 0x00e5ff, 25); audio.playParry(); }
  else if (datos.tipo === 'pocion') { particulas.emitir(pos, 0xff1744, 25); audio.playItem(); }
  else if (datos.tipo === 'pergamino') { particulas.emitir(pos, 0xffd54f, 25); audio.playItem(); }
});

red.on('poderActivado', (datos) => {
  if (datos.id === red.miId) return;
  const p = otrosJugadores[datos.id];
  if (!p) return;
  if (datos.tipo === 'parry') { p.parryTimer = 0.28; audio.playParry(); particulas.emitir(p.root.position, 0x64b5f6, 15); }
  else if (datos.tipo === 'escudo') { p.escudoTimer = datos.duracion || 6.0; audio.playItem(); particulas.emitir(p.root.position, 0x00e5ff, 25); }
  else if (datos.tipo === 'pocion') { audio.playItem(); particulas.emitir(p.root.position, 0xff1744, 25); }
});

red.on('muerteJugador', (datos) => {
  if (datos.id === red.miId) return;
  if (otrosJugadores[datos.id]) otrosJugadores[datos.id].morir();
  const vivo = !jugador.estaMuerto || Object.values(otrosJugadores).some(p => !p.estaMuerto);
  if (!vivo) {
    terminarJuego('¡Todos los ninjas han caído!');
    red.enviarFinPartida({ motivo: '¡Todos los ninjas han caído!' });
  } else {
    mostrarAviso('hud-aviso-cerca', `¡${datos.nombre || 'El aliado'} ha caído! ¡Resiste!`, 3000);
  }
});

red.on('tiempoSincronizado', (t) => {
  if (juegoActivo && !red.isHost) {
    tiempo = t;
    actualizarHUD();
    if (tiempo <= 0) {
      const vivo = !jugador.estaMuerto || Object.values(otrosJugadores).some(p => !p.estaMuerto);
      terminarJuego(vivo ? '¡Tiempo cumplido! ¡Misión superada!' : '¡Todos los ninjas han caído!');
    }
  }
});

red.on('partidaTerminada', (datos) => {
  if (juegoActivo) terminarJuego(datos.motivo || '¡Fin de la partida!');
});

red.on('juegoPausadoRed', (datos) => {
  if (datos.pausado) {
    pausarJuego(true, datos.nombre);
  } else {
    reanudarJuego(true);
  }
});

window.addEventListener('keydown', (e) => {
  const tag = e.target && e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') teclas.izquierda = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') teclas.derecha = true;
  if (e.key === ' ' || e.code === 'Space' || e.key === 'f' || e.key === 'F' || e.key === 'e' || e.key === 'E') ejecutarEspadazo();
  if (e.key === 'Escape' || e.key === 'Esc' || e.key === 'p' || e.key === 'P') { e.preventDefault(); alternarPausa(); }
});

window.addEventListener('keyup', (e) => {
  const tag = e.target && e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') teclas.izquierda = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') teclas.derecha = false;
});

window.addEventListener('pointerdown', (e) => {
  if (e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.closest('#modal-opciones') || e.target.closest('#menu-inicio') || e.target.closest('#pantalla-gameover') || e.target.closest('#menu-pausa') || e.target.closest('#pantalla-lobby') || e.target.closest('#modal-unirse-sala') || e.target.closest('#modal-puntuaciones'))) return;
  ejecutarEspadazo();
});

window.addEventListener('click', () => audio.iniciar(), { passive: true });

function vincular(id, fn) {
  const el = document.getElementById(id);
  if (el) el.onclick = fn;
}

vincular('btn-reintentar', empezarPartida);
vincular('btn-pausa-hud', () => pausarJuego(false));
vincular('btn-reanudar', () => reanudarJuego(false));
vincular('btn-salir-menu', volverAlMenu);
vincular('btn-pausa-salir', volverAlMenu);
vincular('btn-gameover-salir', volverAlMenu);
vincular('btn-iniciar-partida-lobby', () => red.iniciarPartidaLobby({ modo: modoActual, dificultad: dificultadActual, escenario: escenarioActual, velocidad: velocidadObstaculos }));
vincular('btn-salir-lobby', () => { red.salir(); volverAlMenu(); });

function abrirConfig() {
  const m = document.getElementById('modal-opciones');
  if (m) m.style.display = 'flex';
}
vincular('btn-configuracion', abrirConfig);
vincular('btn-opciones', abrirConfig);
vincular('btn-pausa-opciones', abrirConfig);
vincular('btn-cerrar-opciones', () => {
  const m = document.getElementById('modal-opciones');
  if (m) m.style.display = 'none';
});

iniciarBotonesSalas(red);
iniciarControlesAudio(audio);
iniciarControlesLuces(luzAmbiental, luzFocal, renderer);
iniciarModalPuntuaciones(gestorPuntuacionesNube);
configurarCompartirRedes(() => puntos);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (juegoActivo && !juegoPausado) {
    let seMueve = false;
    if (!jugador.estaMuerto) {
      if (teclas.izquierda && jugador.root.position.x > -4.2) { jugador.root.position.x -= 8.5 * delta; seMueve = true; }
      if (teclas.derecha && jugador.root.position.x < 4.2) { jugador.root.position.x += 8.5 * delta; seMueve = true; }
      if (parryTimer > 0) parryTimer -= delta;
    }
    jugador.actualizar(delta, seMueve);

    const compVivo = Object.values(otrosJugadores).find(p => !p.estaMuerto);
    luzFocal.target = (jugador.estaMuerto && compVivo) ? compVivo.root : jugador.root;

    red.enviarMovimiento({ x: jugador.root.position.x, y: 0, z: 0 });

    Object.values(otrosJugadores).forEach(p => {
      if (p) p.actualizar(delta, Math.abs(p.targetPos.x - p.root.position.x) > 0.04);
    });

    generarObstaculos(delta, { scene, red, jugador, otrosJugadores, juegoActivo, juegoPausado, dificultadActual, modoActual });
    actualizarObstaculos(delta, { velocidadObstaculos, particulas, red, jugador, otrosJugadores });

    procesarColisiones({ jugador, otrosJugadores, audio, particulas, red, scene, parryTimer }, {
      alSumarVida: (v) => { vidas = Math.min(3, vidas + v); },
      alRestarVida: (v) => { vidas -= v; },
      alSumarPuntos: (p) => { puntos += p; },
      getVidas: () => vidas,
      actualizarHUD,
      terminarJuego
    });
  }

  particulas.actualizar(delta);
  renderer.render(scene, camera);
}

async function init() {
  try {
    await Promise.all([cargarNinja(), cargarShuriken(), cargarModelosEscenarios()]);
    if (jugador) jugador.asignarModelo();
    Object.values(otrosJugadores).forEach(j => j.asignarModelo());
    aplicarEscenario(escenarioActual || 'dojo');
    console.log('Modelos OBJ y escenarios GLB cargados con éxito!');
  } catch (err) {
    console.warn('Carga asíncrona completada con fallback activo:', err);
  }

  const pCarga = document.getElementById('pantalla-carga');
  if (pCarga) pCarga.style.display = 'none';

  animate();
}

init();
