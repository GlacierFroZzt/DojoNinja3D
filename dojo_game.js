import * as THREE from 'three';

// -------------------------------------------------------------
// VARIABLES PRINCIPALES Y CONFIGURACIÓN THREE.JS
// -------------------------------------------------------------
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141820);
scene.fog = new THREE.FogExp2(0x141820, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 4.2, 8.5);
camera.lookAt(0, 1.2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
container.appendChild(renderer.domElement);

// ILUMINACIÓN AMBIENTAL (Requisito Rúbrica)
const luzAmbiental = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(luzAmbiental);

// ILUMINACIÓN FOCAL / LINTERNA (SpotLight) (Requisito Rúbrica)
const luzFocal = new THREE.SpotLight(0x00e5ff, 4.5);
luzFocal.position.set(0, 9, 4);
luzFocal.angle = Math.PI / 4.2;
luzFocal.penumbra = 0.6;
luzFocal.castShadow = true;
scene.add(luzFocal);

// Luz direccional de apoyo cenital
const luzDir = new THREE.DirectionalLight(0xffffff, 1.5);
luzDir.position.set(5, 25, 5);
luzDir.castShadow = true;
luzDir.shadow.mapSize.width = 1024;
luzDir.shadow.mapSize.height = 1024;
scene.add(luzDir);

// -------------------------------------------------------------
// PISTA Y SUELO CON TEXTURA DE TATAMI PROCEDURAL CANVAS
// -------------------------------------------------------------
function generarTexturaTatami() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  // Fondo madera oscura
  ctx.fillStyle = '#261c14';
  ctx.fillRect(0, 0, 512, 512);
  // Líneas de tatami / tablones japoneses
  ctx.fillStyle = '#3a2b1f';
  for (let i = 0; i < 512; i += 64) {
    ctx.fillRect(i, 0, 30, 512);
  }
  ctx.strokeStyle = '#150f0a';
  ctx.lineWidth = 4;
  for (let i = 0; i <= 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0); ctx.lineTo(i, 512);
    ctx.stroke();
  }
  // Bordes tradicionales
  ctx.fillStyle = '#5c432d';
  ctx.fillRect(0, 0, 16, 512);
  ctx.fillRect(496, 0, 16, 512);

  const texture = new THREE.CanvasTexture(c);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 30);
  return texture;
}

const texturaSueloDojo = generarTexturaTatami();
const largoPista = 140;
const anchoPista = 10;

const sueloGeo = new THREE.PlaneGeometry(anchoPista, largoPista);
const sueloMat = new THREE.MeshStandardMaterial({
  map: texturaSueloDojo,
  roughness: 0.85,
  metalness: 0.1
});
const suelo = new THREE.Mesh(sueloGeo, sueloMat);
suelo.rotation.x = -Math.PI / 2;
suelo.position.set(0, 0, -35);
suelo.receiveShadow = true;
scene.add(suelo);

// Muros laterales del dojo
const muroMat = new THREE.MeshStandardMaterial({ color: 0x24201c, roughness: 0.9 });
const muroGeo = new THREE.BoxGeometry(0.6, 1.4, largoPista);
const muroIzq = new THREE.Mesh(muroGeo, muroMat);
muroIzq.position.set(-anchoPista / 2, 0.7, -35);
muroIzq.castShadow = true;
muroIzq.receiveShadow = true;
const muroDer = new THREE.Mesh(muroGeo, muroMat);
muroDer.position.set(anchoPista / 2, 0.7, -35);
muroDer.castShadow = true;
muroDer.receiveShadow = true;
scene.add(muroIzq, muroDer);

// -------------------------------------------------------------
// CONSTRUCCIÓN DEL NINJA SHINOBI (MODELO COMPLETO Y ARTICULADO)
// -------------------------------------------------------------
function crearKatana() {
  const g = new THREE.Group();
  const hoja = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 1.1, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0xeeeeee, metalness: 0.95, roughness: 0.15, emissive: 0x224466, emissiveIntensity: 0.2
    })
  );
  hoja.position.y = 0.55;
  hoja.castShadow = true;
  const tsuba = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 })
  );
  tsuba.position.y = 0.015;
  const tsuka = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
  );
  tsuka.position.y = -0.16;
  g.add(hoja, tsuba, tsuka);
  return g;
}

function crearNinja(colorTraje = 0x1a2430, colorCinta = 0xffffff) {
  const grupo = new THREE.Group();
  const matTraje = new THREE.MeshStandardMaterial({ color: colorTraje, roughness: 0.7 });
  const matPiel = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.8 });
  const matCinta = new THREE.MeshStandardMaterial({ color: colorCinta, roughness: 0.5 });
  const matOjos = new THREE.MeshBasicMaterial({ color: 0x050505 });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.45), matTraje);
  torso.position.y = 1.1;
  torso.castShadow = true;
  grupo.add(torso);

  // Faja/Cinturón ninja
  const faja = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 0.47), matCinta);
  faja.position.y = 0.75;
  grupo.add(faja);

  // Cabeza y pasamontañas
  const cabeza = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), matTraje);
  cabeza.position.y = 1.82;
  cabeza.castShadow = true;
  grupo.add(cabeza);

  // Visor de piel para ojos
  const piel = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.12), matPiel);
  piel.position.set(0, 1.84, 0.245);
  grupo.add(piel);

  const ojo1 = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.03), matOjos);
  ojo1.position.set(-0.08, 1.84, 0.248);
  const ojo2 = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.03), matOjos);
  ojo2.position.set(0.08, 1.84, 0.248);
  grupo.add(ojo1, ojo2);

  // Cinta con nudo
  const cinta = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), matCinta);
  cinta.position.y = 1.95;
  grupo.add(cinta);

  const cola1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.02), matCinta);
  cola1.position.set(-0.1, 1.8, -0.26);
  cola1.rotation.set(-0.3, 0, 0.25);
  const cola2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.02), matCinta);
  cola2.position.set(0.06, 1.75, -0.26);
  cola2.rotation.set(-0.35, 0, -0.2);
  grupo.add(cola1, cola2);

  // Brazos
  const brazoIzq = new THREE.Group();
  brazoIzq.position.set(-0.48, 1.45, 0);
  const mallaBI = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22), matTraje);
  mallaBI.position.y = -0.32;
  mallaBI.castShadow = true;
  brazoIzq.add(mallaBI);
  grupo.add(brazoIzq);

  const brazoDer = new THREE.Group();
  brazoDer.position.set(0.48, 1.45, 0);
  const mallaBD = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22), matTraje);
  mallaBD.position.y = -0.32;
  mallaBD.castShadow = true;
  brazoDer.add(mallaBD);
  grupo.add(brazoDer);

  // Piernas
  const piernaIzq = new THREE.Group();
  piernaIzq.position.set(-0.2, 0.68, 0);
  const mallaPI = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.72, 0.26), matTraje);
  mallaPI.position.y = -0.36;
  mallaPI.castShadow = true;
  piernaIzq.add(mallaPI);
  grupo.add(piernaIzq);

  const piernaDer = new THREE.Group();
  piernaDer.position.set(0.2, 0.68, 0);
  const mallaPD = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.72, 0.26), matTraje);
  mallaPD.position.y = -0.36;
  mallaPD.castShadow = true;
  piernaDer.add(mallaPD);
  grupo.add(piernaDer);

  // Katana de combate
  const katana = crearKatana();
  katana.position.set(0.35, 0.85, 0.2);
  katana.rotation.set(-0.35, 0, -0.35);
  grupo.add(katana);

  grupo.brazoIzq = brazoIzq;
  grupo.brazoDer = brazoDer;
  grupo.piernaIzq = piernaIzq;
  grupo.piernaDer = piernaDer;
  grupo.katana = katana;

  return grupo;
}

// -------------------------------------------------------------
// GENERADOR DE SHURIKENS Y PERGAMINOS (ITEMS DEL JUEGO)
// -------------------------------------------------------------
function crearShurikenMesh() {
  const g = new THREE.Group();
  const matMetal = new THREE.MeshStandardMaterial({
    color: 0x99aab5, metalness: 0.95, roughness: 0.2, flatShading: true
  });
  const centro = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 8), matMetal);
  centro.rotation.x = Math.PI / 2;
  g.add(centro);

  const orificio = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.09, 8), new THREE.MeshBasicMaterial({ color: 0x050505 }));
  orificio.rotation.x = Math.PI / 2;
  g.add(orificio);

  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI) / 2;
    const punta = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.95, 4), matMetal);
    punta.position.set(Math.cos(ang) * 0.65, Math.sin(ang) * 0.65, 0);
    punta.rotation.z = ang - Math.PI / 2;
    punta.scale.set(0.6, 1, 0.15);
    punta.castShadow = true;
    g.add(punta);
  }
  g.scale.set(1.1, 1.1, 1.1);
  return g;
}

function crearPergaminoMesh() {
  const g = new THREE.Group();
  // Pergamino dorado místico (CylinderGeometry + SphereGeometry decorativa)
  const matPergamino = new THREE.MeshStandardMaterial({
    color: 0xffd700, emissive: 0x996515, emissiveIntensity: 0.35, roughness: 0.4
  });
  const rollo = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.9, 12), matPergamino);
  rollo.rotation.z = Math.PI / 2;
  g.add(rollo);

  const cintaRoja = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 0.22, 12),
    new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.5 })
  );
  cintaRoja.rotation.z = Math.PI / 2;
  g.add(cintaRoja);

  // Esfera brillante de aura
  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffaa, wireframe: true, transparent: true, opacity: 0.35 })
  );
  g.add(aura);
  g.scale.set(1.1, 1.1, 1.1);
  return g;
}

// -------------------------------------------------------------
// JUGADOR Y MULTIJUGADOR SIMPLE
// -------------------------------------------------------------
const jugador = crearNinja(0x1a2430, 0x64b5f6);
scene.add(jugador);

let otrosNinjas = {};
const socket = io();

socket.on('jugadoresActuales', (lista) => {
  Object.keys(lista).forEach(id => {
    if (id !== socket.id && !otrosNinjas[id]) {
      const otro = crearNinja(0x8c2a2a, 0xffb74d);
      otro.position.set(lista[id].x || 0, 0, lista[id].z || 0);
      scene.add(otro);
      otrosNinjas[id] = otro;
    }
  });
});

socket.on('nuevoJugador', (datos) => {
  if (datos.id !== socket.id && !otrosNinjas[datos.id]) {
    const otro = crearNinja(0x8c2a2a, 0xffb74d);
    otro.position.set(datos.x || 0, 0, datos.z || 0);
    scene.add(otro);
    otrosNinjas[datos.id] = otro;
  }
});

socket.on('jugadorMovido', (datos) => {
  if (otrosNinjas[datos.id]) {
    otrosNinjas[datos.id].position.x = datos.x;
  }
});

socket.on('jugadorSalio', (id) => {
  if (otrosNinjas[id]) {
    scene.remove(otrosNinjas[id]);
    delete otrosNinjas[id];
  }
});

// -------------------------------------------------------------
// ESTADO DEL JUEGO Y CONTROLES
// -------------------------------------------------------------
let juegoActivo = false;
let juegoPausado = false;
let puntos = 0;
let vidas = 3;
let tiempo = 30; // 30s fijos para todas las dificultades
let timerInterval = null;
let velocidadObstaculos = 20;
let modoActual = 'esquivar';
let dificultadActual = 'facil';
let escenarioActual = 'dojo';

let parryTimer = 0;
let walkTimer = 0;
const teclas = { izquierda: false, derecha: false };

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') teclas.izquierda = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') teclas.derecha = true;
  if (e.key === ' ' || e.key === 'Spacebar') {
    // Katana Parry
    if (juegoActivo && !juegoPausado && parryTimer <= 0) {
      parryTimer = 0.28;
    }
  }
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    if (juegoActivo) alternarPausa();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') teclas.izquierda = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') teclas.derecha = false;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// -------------------------------------------------------------
// GESTOR DE ESCENARIOS (3 Escenarios Distintos)
// -------------------------------------------------------------
function aplicarEscenario(esc) {
  escenarioActual = esc;
  if (esc === 'dojo') {
    scene.background = new THREE.Color(0x141820);
    scene.fog = new THREE.FogExp2(0x141820, 0.015);
    suelo.material.map = texturaSueloDojo;
    suelo.material.color.setHex(0xffffff);
    muroMat.color.setHex(0x24201c);
    luzAmbiental.color.setHex(0xffffff);
  } else if (esc === 'noche') {
    scene.background = new THREE.Color(0x060912);
    scene.fog = new THREE.FogExp2(0x060912, 0.018);
    suelo.material.map = null;
    suelo.material.color.setHex(0x1e242b); // Asfalto gris oscuro
    muroMat.color.setHex(0x0d1520);
    luzAmbiental.color.setHex(0x3f51b5); // Luz azulada nocturna
  } else if (esc === 'lava') {
    scene.background = new THREE.Color(0x2b0600);
    scene.fog = new THREE.FogExp2(0x2b0600, 0.018);
    suelo.material.map = null;
    suelo.material.color.setHex(0xb71c1c); // Suelo volcánico candente
    muroMat.color.setHex(0x420000);
    luzAmbiental.color.setHex(0xff5722); // Luz incandescente roja/naranja
  }
}

// -------------------------------------------------------------
// POOL DE OBSTÁCULOS Y RECOLECTABLES
// -------------------------------------------------------------
let obstaculos = [];
let spawnTimer = 0;

function generarElemento(delta) {
  spawnTimer += delta;
  const frecuencia = dificultadActual === 'dificil' ? 0.65 : 0.85;
  if (spawnTimer >= frecuencia) {
    spawnTimer = 0;
    const posX = (Math.random() * 8) - 4; // Entre -4 y 4

    let obj;
    if (modoActual === 'esquivar') {
      obj = crearShurikenMesh();
      obj.tipo = 'shuriken';
      obj.position.set(posX, 1.2, -45);
    } else {
      obj = crearPergaminoMesh();
      obj.tipo = 'pergamino';
      obj.position.set(posX, 1.2, -45);
    }
    scene.add(obj);
    obstaculos.push(obj);
  }
}

function mostrarAviso(elemId, texto) {
  const el = document.getElementById(elemId);
  if (!el) return;
  if (texto) el.textContent = texto;
  el.classList.add('mostrar');
  setTimeout(() => el.classList.remove('mostrar'), 650);
}

function flashImpacto() {
  const imp = document.getElementById('impacto-rojo');
  if (imp) {
    imp.classList.add('activo');
    setTimeout(() => imp.classList.remove('activo'), 180);
  }
}

// -------------------------------------------------------------
// DETECCIÓN Y USO DE COLISIONES CON BOX3
// -------------------------------------------------------------
function procesarColisiones() {
  const boxJugador = new THREE.Box3().setFromObject(jugador);
  const esParry = parryTimer > 0;

  for (let i = obstaculos.length - 1; i >= 0; i--) {
    const obj = obstaculos[i];
    const boxObj = new THREE.Box3().setFromObject(obj);

    // Si hay colisión física
    if (boxJugador.intersectsBox(boxObj)) {
      scene.remove(obj);
      obstaculos.splice(i, 1);

      if (obj.tipo === 'shuriken') {
        if (esParry) {
          // Mecánica de Parry con la Katana
          puntos += 150;
          mostrarAviso('hud-aviso-parry', '¡PARRY KATANA +150!');
        } else {
          // Daño recibido
          vidas--;
          flashImpacto();
          actualizarHUD();
          if (vidas <= 0) {
            terminarJuego('¡Has caído en batalla!');
          }
        }
      } else if (obj.tipo === 'pergamino') {
        puntos += 50;
        mostrarAviso('hud-aviso-cerca', '+50 PERGAMINO');
        actualizarHUD();
      }
      continue;
    }

    // Si pasó de largo
    if (obj.position.z > 6) {
      scene.remove(obj);
      obstaculos.splice(i, 1);
      if (obj.tipo === 'shuriken') {
        puntos += 20;
        mostrarAviso('hud-aviso-cerca', 'CERCA +20');
        actualizarHUD();
      }
    }
  }
}

// -------------------------------------------------------------
// BUCLE DE RENDERIZADO Y ANIMACIÓN
// -------------------------------------------------------------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (juegoActivo && !juegoPausado) {
    // Movimiento lateral
    if (teclas.izquierda && jugador.position.x > -4.2) {
      jugador.position.x -= 8.5 * delta;
    }
    if (teclas.derecha && jugador.position.x < 4.2) {
      jugador.position.x += 8.5 * delta;
    }

    // Animación de correr (balanceo de brazos y piernas)
    walkTimer += delta * 14;
    const anguloPaso = Math.sin(walkTimer) * 0.45;
    jugador.brazoIzq.rotation.x = anguloPaso;
    jugador.brazoDer.rotation.x = -anguloPaso;
    jugador.piernaIzq.rotation.x = -anguloPaso;
    jugador.piernaDer.rotation.x = anguloPaso;
    jugador.position.y = Math.abs(Math.sin(walkTimer)) * 0.12;

    // Animación de Katana Parry
    if (parryTimer > 0) {
      parryTimer -= delta;
      const prog = 1 - Math.max(0, parryTimer / 0.28);
      const slash = Math.sin(prog * Math.PI) * 2.2;
      jugador.katana.position.set(0.1 - prog * 0.6, 1.1, 0.6);
      jugador.katana.rotation.set(0.6, 0.4, -0.6 - slash);
    } else {
      jugador.katana.position.set(0.35, 0.85, 0.2);
      jugador.katana.rotation.set(-0.35, 0, -0.35);
    }

    // Luz focal sigue al ninja
    luzFocal.target = jugador;

    // Notificar posición al servidor multijugador
    socket.emit('mover', { x: jugador.position.x, y: 0, z: 0 });

    // Obstáculos
    generarElemento(delta);
    for (let i = 0; i < obstaculos.length; i++) {
      const obs = obstaculos[i];
      obs.position.z += velocidadObstaculos * delta;
      obs.rotation.z += (obs.tipo === 'shuriken' ? 24 : 3) * delta;
    }

    procesarColisiones();
  }

  renderer.render(scene, camera);
}

// -------------------------------------------------------------
// CONTROL DE MENÚS Y FLUJO DE PARTIDA
// -------------------------------------------------------------
function actualizarHUD() {
  document.getElementById('hud-puntos').textContent = puntos;
  document.getElementById('hud-tiempo').textContent = `TIEMPO 00:${tiempo < 10 ? '0' : ''}${tiempo}`;
  document.getElementById('hud-sala-tag').textContent = `MODO: ${modoActual.toUpperCase()}`;
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`vida-${i}`);
    if (el) {
      if (i <= vidas) el.classList.remove('perdida');
      else el.classList.add('perdida');
    }
  }
}

function empezarPartida() {
  const nombre = document.getElementById('input-nombre').value || 'Ninja';
  modoActual = document.getElementById('sel-modo').value;
  dificultadActual = document.getElementById('sel-dificultad').value;
  const esc = document.getElementById('sel-escenario').value;

  aplicarEscenario(esc);

  // 2 NIVELES DE DIFICULTAD CON EXACTAMENTE EL MISMO TIEMPO (30s)
  tiempo = 30;
  if (dificultadActual === 'dificil') {
    velocidadObstaculos = 32; // Shurikens ultra rápidos
    vidas = 2; // Menos vidas
  } else {
    velocidadObstaculos = 18; // Shurikens velocidad normal
    vidas = 3;
  }

  puntos = 0;
  jugador.position.x = 0;
  obstaculos.forEach(o => scene.remove(o));
  obstaculos = [];

  socket.emit('entrarJuego', { nombre: nombre });

  document.getElementById('menu-inicio').style.display = 'none';
  document.getElementById('pantalla-gameover').style.display = 'none';
  document.getElementById('hud-juego').style.display = 'block';
  actualizarHUD();

  juegoActivo = true;
  juegoPausado = false;

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (juegoActivo && !juegoPausado) {
      tiempo--;
      actualizarHUD();
      if (tiempo <= 0) {
        terminarJuego('¡Tiempo Cumplido! Misión Exitosa');
      }
    }
  }, 1000);
}

function terminarJuego(motivo) {
  juegoActivo = false;
  if (timerInterval) clearInterval(timerInterval);

  document.getElementById('hud-juego').style.display = 'none';
  document.getElementById('pantalla-gameover').style.display = 'flex';
  document.getElementById('gameover-titulo').textContent = motivo;
  document.getElementById('gameover-puntos').textContent = puntos;
  document.getElementById('gameover-stats').textContent = `${modoActual.toUpperCase()} - Dificultad: ${dificultadActual.toUpperCase()}`;

  // CONSUMO AUTOMÁTICO DE SERVICIO WEB (POST /api/puntuaciones)
  const nombre = document.getElementById('input-nombre').value || 'Ninja';
  fetch('/api/puntuaciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: nombre,
      puntos: puntos,
      dificultad: dificultadActual,
      escenario: escenarioActual
    })
  }).catch(() => {});
}

function pausarJuego() {
  if (!juegoActivo) return;
  juegoPausado = true;
  document.getElementById('menu-pausa').style.display = 'flex';
}

function reanudarJuego() {
  juegoPausado = false;
  document.getElementById('menu-pausa').style.display = 'none';
}

function alternarPausa() {
  if (juegoPausado) reanudarJuego();
  else pausarJuego();
}

function volverAlMenu() {
  juegoActivo = false;
  juegoPausado = false;
  if (timerInterval) clearInterval(timerInterval);

  document.getElementById('hud-juego').style.display = 'none';
  document.getElementById('pantalla-gameover').style.display = 'none';
  document.getElementById('menu-pausa').style.display = 'none';
  document.getElementById('modal-opciones').style.display = 'none';
  document.getElementById('modal-puntuaciones').style.display = 'none';
  document.getElementById('menu-inicio').style.display = 'flex';
}

// -------------------------------------------------------------
// VINCULACIÓN DE BOTONES Y MENÚS
// -------------------------------------------------------------
document.getElementById('btn-comenzar').onclick = empezarPartida;
document.getElementById('btn-reintentar').onclick = empezarPartida;
document.getElementById('btn-gameover-salir').onclick = volverAlMenu;
document.getElementById('btn-reanudar').onclick = reanudarJuego;
document.getElementById('btn-pausa-salir').onclick = volverAlMenu;

// Modal Opciones
document.getElementById('btn-opciones').onclick = () => {
  document.getElementById('modal-opciones').style.display = 'flex';
};
document.getElementById('btn-pausa-opciones').onclick = () => {
  document.getElementById('modal-opciones').style.display = 'flex';
};
document.getElementById('btn-cerrar-opciones').onclick = () => {
  document.getElementById('modal-opciones').style.display = 'none';
};

// Configuración de iluminación
document.getElementById('sel-color-luz').onchange = (e) => {
  luzFocal.color.setHex(parseInt(e.target.value));
};
document.getElementById('sel-luz-ambiente').onchange = (e) => {
  luzAmbiental.intensity = parseFloat(e.target.value);
};
document.getElementById('sel-sombras').onchange = (e) => {
  renderer.shadowMap.enabled = e.target.value !== 'none';
};

// Modal Puntuaciones (Consumo de Servicio Web REST)
document.getElementById('btn-puntuaciones').onclick = () => {
  document.getElementById('modal-puntuaciones').style.display = 'flex';
  const lista = document.getElementById('lista-puntuaciones-tabla');
  lista.innerHTML = 'Consultando servicio web REST (/api/puntuaciones)...';

  fetch('/api/puntuaciones')
    .then(r => r.json())
    .then(datos => {
      let h = '';
      datos.forEach((p, idx) => {
        h += `<div style="display:flex; justify-content:space-between; margin:4px 0; border-bottom:1px solid #223; padding-bottom:2px;">
          <span><b>${idx + 1}. ${p.nombre}</b> (${p.dificultad} - ${p.escenario})</span>
          <span style="color:#64b5f6; font-weight:bold;">${p.puntos} pts</span>
        </div>`;
      });
      lista.innerHTML = h || 'No hay puntuaciones registradas.';
    })
    .catch(() => {
      lista.innerHTML = 'Error al consultar el servicio web.';
    });
};

document.getElementById('btn-cerrar-puntuaciones').onclick = () => {
  document.getElementById('modal-puntuaciones').style.display = 'none';
};

// Compartir en Redes Sociales (WhatsApp y Twitter/X)
function compartirWhatsApp() {
  const t = encodeURIComponent(`¡Logré ${puntos} puntos en el Dojo Ninja 3D! ¿Puedes superarme?`);
  window.open(`https://api.whatsapp.com/send?text=${t}`, '_blank');
}
function compartirTwitter() {
  const t = encodeURIComponent(`¡Hice ${puntos} puntos esquivando shurikens en Dojo Ninja 3D con Three.js!`);
  window.open(`https://twitter.com/intent/tweet?text=${t}`, '_blank');
}

document.getElementById('btn-share-whatsapp').onclick = compartirWhatsApp;
document.getElementById('btn-gameover-whatsapp').onclick = compartirWhatsApp;
document.getElementById('btn-share-twitter').onclick = compartirTwitter;

// Iniciar
const pCarga = document.getElementById('pantalla-carga');
if (pCarga) pCarga.style.display = 'none';
animate();