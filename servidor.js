const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PUERTO = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const DB_LOCAL_FILE = path.join(__dirname, 'puntuaciones_db.json');
const DEFAULT_SCORES_SRV = [
  { nombre: 'Sensei Ryu', puntos: 520, dificultad: 'Dificil', escenario: 'Noche' },
  { nombre: 'Kunoichi Sakura', puntos: 430, dificultad: 'Dificil', escenario: 'Lava' },
  { nombre: 'Shadow Shinobi', puntos: 350, dificultad: 'Facil', escenario: 'Dia' }
];

function cargarPuntServidor() {
  const fs = require('fs');
  try {
    if (fs.existsSync(DB_LOCAL_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_LOCAL_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}
  return [...DEFAULT_SCORES_SRV];
}

function guardarPuntServidor(lista) {
  const fs = require('fs');
  try {
    fs.writeFileSync(DB_LOCAL_FILE, JSON.stringify(lista.slice(0, 50), null, 2), 'utf8');
  } catch (e) {}
}

let puntuaciones = cargarPuntServidor();

app.get('/api/puntuaciones', (req, res) => {
  puntuaciones = cargarPuntServidor();
  res.json(puntuaciones);
});

app.post('/api/puntuaciones', (req, res) => {
  puntuaciones = cargarPuntServidor();
  const nueva = {
    nombre: req.body.nombre || 'Anonimo',
    puntos: Number(req.body.puntos) || 0,
    dificultad: req.body.dificultad || 'Facil',
    escenario: req.body.escenario || 'Dia',
    fecha: req.body.fecha || Date.now()
  };
  puntuaciones.push(nueva);
  const mapa = new Map();
  puntuaciones.forEach(item => {
    const k = `${item.nombre}_${item.puntos}_${item.dificultad}`;
    if (!mapa.has(k)) mapa.set(k, item);
  });
  puntuaciones = Array.from(mapa.values()).sort((a, b) => b.puntos - a.puntos).slice(0, 50);
  guardarPuntServidor(puntuaciones);
  res.json({ ok: true, mensaje: 'Guardado con exito' });
});

const salas = {};

function generarCodigoSala() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 4; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

function eliminarJugadorDeSala(socket) {
  const codigoSala = socket.codigoSala;
  const idJugador = socket.id;

  if (codigoSala && salas[codigoSala]) {
    const sala = salas[codigoSala];
    if (sala.jugadores[idJugador]) {
      delete sala.jugadores[idJugador];
      socket.leave(codigoSala);
      io.to(codigoSala).emit('jugadorSalio', idJugador);
      console.log(`[Sala ${codigoSala}] Jugador ${idJugador} salió. Restantes: ${Object.keys(sala.jugadores).length}`);

      const ids = Object.keys(sala.jugadores);
      if (ids.length === 0) {
        if (codigoSala !== 'GLOBAL') {
          delete salas[codigoSala];
          console.log(`[Sala ${codigoSala}] Sala eliminada por estar vacía.`);
        }
      } else {
        if (sala.anfitrionId === idJugador) {
          sala.anfitrionId = ids[0];
          console.log(`[Sala ${codigoSala}] Nuevo anfitrión asignado: ${sala.anfitrionId}`);
        }
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

    if (!salas[codigoSala]) {
      salas[codigoSala] = {
        codigo: codigoSala,
        anfitrionId: idJugador,
        jugadores: {},
        estado: entrarEnLobby ? 'lobby' : 'jugando'
      };
    }

    const sala = salas[codigoSala];
    socket.codigoSala = codigoSala;
    socket.join(codigoSala);

    sala.jugadores[idJugador] = {
      id: idJugador,
      nombre: nombreUsuario || 'Ninja ' + idJugador.substring(0, 4),
      x: 0,
      y: 0,
      z: 0
    };

    console.log(`[Sala ${codigoSala}] Jugador ${idJugador} (${nombreUsuario}) entró. Total: ${Object.keys(sala.jugadores).length}`);

    if (entrarEnLobby || sala.estado === 'lobby') {
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
      socket.emit('jugadoresActuales', sala.jugadores);
      socket.to(codigoSala).emit('nuevoJugador', sala.jugadores[idJugador]);
    }
  }

  socket.on('entrarJuego', (datos) => {
    const nombre = datos ? (datos.nombre || datos.userName) : null;
    const salaPedida = datos && datos.codigoSala ? datos.codigoSala : 'GLOBAL';
    unirASala(salaPedida, nombre, false);
  });

  socket.on('createRoom', (datos) => {
    let codigo = generarCodigoSala();
    while (salas[codigo]) {
      codigo = generarCodigoSala();
    }
    const nombre = datos ? (datos.userName || datos.nombre) : null;
    unirASala(codigo, nombre, true);
  });

  socket.on('joinRoom', (datos) => {
    const rawCodigo = datos && datos.roomCode ? datos.roomCode.trim().toUpperCase() : '';
    const nombre = datos ? (datos.userName || datos.nombre) : null;
    if (!rawCodigo) {
      socket.emit('roomError', 'Debes escribir el código de sala.');
      return;
    }
    if (!salas[rawCodigo]) {
      socket.emit('roomError', `La sala "${rawCodigo}" no existe o ya no está disponible.`);
      return;
    }
    const sala = salas[rawCodigo];
    const entrarEnLobby = sala.estado === 'lobby';
    unirASala(rawCodigo, nombre, entrarEnLobby);
  });

  socket.on('startLobbyMatch', () => {
    const codigoSala = socket.codigoSala;
    if (codigoSala && salas[codigoSala]) {
      const sala = salas[codigoSala];
      if (sala.anfitrionId === idJugador) {
        sala.estado = 'jugando';
        io.to(codigoSala).emit('matchStarted', {
          codigoSala: codigoSala,
          todosJugadores: sala.jugadores
        });
      }
    }
  });

  socket.on('mover', (pos) => {
    const codigoSala = socket.codigoSala;
    if (codigoSala && salas[codigoSala] && salas[codigoSala].jugadores[idJugador]) {
      salas[codigoSala].jugadores[idJugador].x = pos.x;
      salas[codigoSala].jugadores[idJugador].y = pos.y;
      salas[codigoSala].jugadores[idJugador].z = pos.z;
      socket.to(codigoSala).emit('jugadorMovido', {
        id: idJugador,
        x: pos.x,
        y: pos.y,
        z: pos.z
      });
    }
  });

  socket.on('pausarJuego', (datos) => {
    const codigoSala = socket.codigoSala;
    if (codigoSala) {
      socket.to(codigoSala).emit('juegoPausadoRed', datos);
    }
  });

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
    console.log(`  Dojo Ninja 3D - Servidor Activo                  `);
    console.log(`  URL: http://localhost:${PUERTO}                   `);
    console.log(`  Salas y Lobby de Espera Multijugador Habilitados `);
    console.log(`====================================================`);
  });
}

module.exports = server;

