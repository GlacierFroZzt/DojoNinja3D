process.on('uncaughtException', (err) => {
  console.error('[Error no capturado]:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Rechazo no manejado]:', reason);
});

const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PUERTO = process.env.PORT || 3002;

app.use(express.static(__dirname));
app.use('/node_modules', express.static(join(__dirname, 'node_modules')));

app.get('/', (req, res) => {
  try {
    res.sendFile(join(__dirname, 'index.html'));
  } catch (error) {
    console.error('[Error al cargar index.html]:', error);
    res.status(500).send('Error al cargar la página.');
  }
});

app.get('/colision', (req, res) => {
  try {
    res.sendFile(join(__dirname, 'colision.html'));
  } catch (error) {
    console.error('[Error al cargar colision.html]:', error);
    res.status(500).send('Error al cargar la página.');
  }
});

// Estructura de salas:
// salas[codigoSala] = { codigo, anfitrionId, jugadores: {}, contador: 0, tiempoRestante: 60, estado: 'lobby' | 'jugando' | 'terminado', timerIntervalo: null, spawnerIntervalo: null }
const salas = {};

const coloresNinja = [
  { nombre: 'Negro', hex: 0x222225, ropa: 0x151518, cinta: 0xcc2222 },
  { nombre: 'Rojo', hex: 0xbb2222, ropa: 0x441111, cinta: 0xf1c40f },
  { nombre: 'Verde', hex: 0x27ae60, ropa: 0x0e4422, cinta: 0xffffff },
  { nombre: 'Azul', hex: 0x2980b9, ropa: 0x153b54, cinta: 0x88ccff },
  { nombre: 'Morado', hex: 0x8e44ad, ropa: 0x3d174d, cinta: 0xffaaee },
  { nombre: 'Amarillo', hex: 0xf39c12, ropa: 0x5a3907, cinta: 0xffffff }
];

function generarCodigoSala() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 4; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

function iniciarJuegoEnSala(codigoSala) {
  const sala = salas[codigoSala];
  if (!sala) return;

  // Si ya había intervalos corriendo de una partida previa, limpiarlos para reiniciar limpio
  if (sala.timerIntervalo) {
    clearInterval(sala.timerIntervalo);
    sala.timerIntervalo = null;
  }
  if (sala.spawnerIntervalo) {
    clearInterval(sala.spawnerIntervalo);
    sala.spawnerIntervalo = null;
  }

  sala.estado = 'jugando';
  sala.tiempoRestante = 60; // 1 minuto

  // Reiniciar stats de todos los jugadores de la sala
  Object.keys(sala.jugadores).forEach(id => {
    sala.jugadores[id].vidas = 3;
    sala.jugadores[id].puntos = 0;
  });

  io.to(codigoSala).emit('matchStarted', {
    tiempoRestante: sala.tiempoRestante,
    todosJugadores: sala.jugadores
  });

  // Notificar gameStarted a cada socket de la sala para que inicialice el canvas 3D
  const socketsEnSala = io.sockets.adapter.rooms.get(codigoSala);
  if (socketsEnSala) {
    for (const sid of socketsEnSala) {
      const sock = io.sockets.sockets.get(sid);
      if (sock && sala.jugadores[sid]) {
        sock.emit('gameStarted', {
          codigoSala: codigoSala,
          jugadorLocal: sala.jugadores[sid],
          todosJugadores: sala.jugadores,
          tiempoRestante: sala.tiempoRestante,
          estado: sala.estado
        });
      }
    }
  }

  // Temporizador de 60 segundos
  sala.timerIntervalo = setInterval(() => {
    sala.tiempoRestante--;
    io.to(codigoSala).emit('timeUpdate', { tiempoRestante: sala.tiempoRestante });

    if (sala.tiempoRestante <= 0) {
      finalizarPartidaEnSala(codigoSala, 'tiempo');
    }
  }, 1000);

  // Spawner de Shurikens por sala (cada 550 ms constante mientras estado sea jugando)
  sala.spawnerIntervalo = setInterval(() => {
    try {
      const cantJugadores = Object.keys(sala.jugadores).length;
      if (cantJugadores === 0 || sala.estado !== 'jugando') return;

      const carriles = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
      const alturas = [0.7, 0.7, 1.8, 1.8];

      const cantidad = Math.random() < 0.45 ? 2 : 1;
      const carrilesUsados = new Set();

      for (let i = 0; i < cantidad; i++) {
        let carrilX;
        let intentos = 0;
        do {
          carrilX = carriles[Math.floor(Math.random() * carriles.length)];
          intentos++;
        } while (carrilesUsados.has(carrilX) && intentos < 8);
        carrilesUsados.add(carrilX);

        const posY = alturas[Math.floor(Math.random() * alturas.length)];
        const obstaculo = {
          id: `shuriken_${Date.now()}_${i}_${Math.floor(Math.random()*1000)}`,
          x: carrilX,
          y: posY,
          z: -95,
          velocidad: 36,
          escala: 1.1
        };
        io.to(codigoSala).emit('spawnObstacle', obstaculo);
      }
    } catch (err) {
      console.error('[Error Spawner Sala]:', err);
    }
  }, 550);
}

function finalizarPartidaEnSala(codigoSala, motivo = 'tiempo') {
  const sala = salas[codigoSala];
  if (!sala) return;

  sala.estado = 'terminado';
  if (sala.timerIntervalo) {
    clearInterval(sala.timerIntervalo);
    sala.timerIntervalo = null;
  }
  if (sala.spawnerIntervalo) {
    clearInterval(sala.spawnerIntervalo);
    sala.spawnerIntervalo = null;
  }

  io.to(codigoSala).emit('matchEnded', {
    motivo: motivo,
    jugadores: sala.jugadores
  });
}

function eliminarJugadorDeSala(socket) {
  const codigoSala = socket.codigoSala;
  const idJugador = socket.id;

  if (codigoSala && salas[codigoSala]) {
    const sala = salas[codigoSala];
    if (sala.jugadores[idJugador]) {
      delete sala.jugadores[idJugador];
      socket.leave(codigoSala);
      io.to(codigoSala).emit('playerDisconnected', idJugador);
      console.log(`[Sala ${codigoSala}] Jugador ${idJugador} salió. Restantes: ${Object.keys(sala.jugadores).length}`);

      // Si el anfitrión sale, transferir el rol al siguiente jugador
      if (sala.anfitrionId === idJugador) {
        const ids = Object.keys(sala.jugadores);
        if (ids.length > 0) {
          sala.anfitrionId = ids[0];
        }
      }

      if (Object.keys(sala.jugadores).length === 0) {
        if (sala.timerIntervalo) clearInterval(sala.timerIntervalo);
        if (sala.spawnerIntervalo) clearInterval(sala.spawnerIntervalo);
        delete salas[codigoSala];
        console.log(`[Sala ${codigoSala}] Sala eliminada por estar vacía.`);
      } else {
        // Notificar actualización de lobby a los demás
        io.to(codigoSala).emit('lobbyUpdate', {
          codigoSala: codigoSala,
          anfitrionId: sala.anfitrionId,
          jugadores: sala.jugadores,
          estado: sala.estado
        });
      }
    }
  }
  socket.codigoSala = null;
}

io.on('connection', (socket) => {
  const idJugador = socket.id;
  console.log(`[Conexión] Jugador conectado: ${idJugador}`);

  function unirASala(codigoSala, nombreUsuario, entrarEnLobby = false) {
    eliminarJugadorDeSala(socket);

    const esNueva = !salas[codigoSala];
    if (esNueva) {
      salas[codigoSala] = {
        codigo: codigoSala,
        anfitrionId: idJugador,
        jugadores: {},
        contador: 0,
        tiempoRestante: 60,
        estado: entrarEnLobby ? 'lobby' : 'esperando',
        timerIntervalo: null,
        spawnerIntervalo: null
      };
    }

    const sala = salas[codigoSala];
    socket.codigoSala = codigoSala;
    socket.join(codigoSala);

    sala.contador++;
    const colorData = coloresNinja[sala.contador % coloresNinja.length];
    const carriles = [-3, -1.5, 0, 1.5, 3];
    const posX = carriles[Math.floor(Math.random() * carriles.length)];
    const nombre = (nombreUsuario && nombreUsuario.trim()) ? nombreUsuario.trim() : `Ninja #${sala.contador}`;

    sala.jugadores[idJugador] = {
      id: idJugador,
      nombre: nombre,
      x: posX,
      y: 0,
      z: 0,
      rotY: Math.PI,
      color: colorData,
      vidas: 3,
      puntos: 0
    };

    console.log(`[Sala ${codigoSala}] ${nombre} unido (Lobby: ${entrarEnLobby}). Total: ${Object.keys(sala.jugadores).length}`);

    if (entrarEnLobby || sala.estado === 'lobby') {
      // Entrar en modo Lobby
      socket.emit('joinedLobby', {
        codigoSala: codigoSala,
        esAnfitrion: sala.anfitrionId === idJugador,
        anfitrionId: sala.anfitrionId,
        jugadorLocal: sala.jugadores[idJugador],
        todosJugadores: sala.jugadores
      });
      io.to(codigoSala).emit('lobbyUpdate', {
        codigoSala: codigoSala,
        anfitrionId: sala.anfitrionId,
        jugadores: sala.jugadores,
        estado: sala.estado
      });
    } else {
      // Entrada directa al juego (GLOBAL o sala ya iniciada)
      socket.emit('gameStarted', {
        codigoSala: codigoSala,
        jugadorLocal: sala.jugadores[idJugador],
        todosJugadores: sala.jugadores,
        tiempoRestante: sala.tiempoRestante,
        estado: sala.estado
      });
      socket.to(codigoSala).emit('newPlayer', sala.jugadores[idJugador]);

      if (sala.estado !== 'jugando') {
        iniciarJuegoEnSala(codigoSala);
      }
    }
  }

  // Partida Rápida (Entra directo a GLOBAL)
  socket.on('startGame', (datos) => {
    const nombre = datos ? datos.userName : null;
    unirASala('GLOBAL', nombre, false);
  });

  // Crear Sala Personalizada -> ENTRA EN EL LOBBY
  socket.on('createRoom', (datos) => {
    let codigo = generarCodigoSala();
    while (salas[codigo]) {
      codigo = generarCodigoSala();
    }
    const nombre = datos ? datos.userName : null;
    unirASala(codigo, nombre, true);
  });

  // Unirse a Sala Personalizada -> ENTRA AL LOBBY DE ESA SALA
  socket.on('joinRoom', (datos) => {
    const rawCodigo = datos && datos.roomCode ? datos.roomCode.trim().toUpperCase() : '';
    const nombre = datos ? datos.userName : null;
    if (!rawCodigo) {
      socket.emit('roomError', 'Debes escribir el código de sala.');
      return;
    }
    if (!salas[rawCodigo]) {
      socket.emit('roomError', `La sala "${rawCodigo}" no existe.`);
      return;
    }
    const sala = salas[rawCodigo];
    const entrarEnLobby = sala.estado === 'lobby';
    unirASala(rawCodigo, nombre, entrarEnLobby);
  });

  // El anfitrión inicia la partida desde el lobby
  socket.on('startLobbyMatch', () => {
    const codigoSala = socket.codigoSala;
    if (codigoSala && salas[codigoSala]) {
      const sala = salas[codigoSala];
      if (sala.anfitrionId === idJugador) {
        iniciarJuegoEnSala(codigoSala);
      }
    }
  });

  // Movimiento de jugador
  socket.on('playerMovement', (datosMov) => {
    try {
      const codigoSala = socket.codigoSala;
      if (codigoSala && salas[codigoSala] && salas[codigoSala].jugadores[idJugador]) {
        const p = salas[codigoSala].jugadores[idJugador];
        p.x = datosMov.x;
        p.y = datosMov.y;
        p.z = datosMov.z;
        p.rotY = datosMov.rotY;
        socket.to(codigoSala).emit('playerMoved', p);
      }
    } catch (err) {
      console.error('[Error playerMovement]:', err);
    }
  });

  // Acción de jugador (jump, parry)
  socket.on('playerAction', (datosAccion) => {
    try {
      const codigoSala = socket.codigoSala;
      if (codigoSala && salas[codigoSala]) {
        socket.to(codigoSala).emit('playerActed', {
          id: idJugador,
          tipo: datosAccion.tipo
        });
      }
    } catch (err) {
      console.error('[Error playerAction]:', err);
    }
  });

  // Sincronización de estado del jugador (puntos, vidas)
  socket.on('playerStatsUpdate', (stats) => {
    try {
      const codigoSala = socket.codigoSala;
      if (codigoSala && salas[codigoSala] && salas[codigoSala].jugadores[idJugador]) {
        const p = salas[codigoSala].jugadores[idJugador];
        p.puntos = stats.puntos;
        p.vidas = stats.vidas;
        socket.to(codigoSala).emit('playerStatsChanged', {
          id: idJugador,
          puntos: stats.puntos,
          vidas: stats.vidas
        });
      }
    } catch (err) {
      console.error('[Error playerStatsUpdate]:', err);
    }
  });

  // Reiniciar partida en la sala
  socket.on('restartRoomGame', () => {
    const codigoSala = socket.codigoSala;
    if (codigoSala && salas[codigoSala]) {
      iniciarJuegoEnSala(codigoSala);
    }
  });

  // Salir de la partida o lobby al menú
  socket.on('leaveGame', () => {
    eliminarJugadorDeSala(socket);
  });

  socket.on('disconnect', () => {
    eliminarJugadorDeSala(socket);
    console.log(`[Desconexión] ${idJugador} desconectado.`);
  });
});

if (require.main === module) {
  server.listen(PUERTO, () => {
    console.log(`====================================================`);
    console.log(`  Servidor Didáctico Three.js Activo               `);
    console.log(`  URL: http://localhost:${PUERTO}                   `);
    console.log(`  Soporte de Lobby con código de sala y 1 minuto    `);
    console.log(`====================================================`);
  });
}

module.exports = server;
