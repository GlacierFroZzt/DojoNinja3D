const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PUERTO = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// ==========================================
// 1. SERVICIO WEB (API REST SIMPLE)
// ==========================================
let puntuaciones = [
  { nombre: 'Juan', puntos: 120, dificultad: 'Facil', escenario: 'Dia' },
  { nombre: 'Maria', puntos: 90, dificultad: 'Dificil', escenario: 'Noche' },
  { nombre: 'Pedro', puntos: 50, dificultad: 'Facil', escenario: 'Lava' }
];

// GET: Consultar puntuaciones (Servicio Web)
app.get('/api/puntuaciones', (req, res) => {
  res.json(puntuaciones);
});

// POST: Guardar nueva puntuacion (Servicio Web)
app.post('/api/puntuaciones', (req, res) => {
  const nueva = {
    nombre: req.body.nombre || 'Anonimo',
    puntos: Number(req.body.puntos) || 0,
    dificultad: req.body.dificultad || 'Facil',
    escenario: req.body.escenario || 'Dia'
  };
  puntuaciones.push(nueva);
  // Ordenar de mayor a menor
  puntuaciones.sort((a, b) => b.puntos - a.puntos);
  res.json({ ok: true, mensaje: 'Guardado con exito' });
});

// ==========================================
// 2. SOCKET.IO (JUEGO MULTIJUGADOR SIMPLE)
// ==========================================
let jugadores = {};

io.on('connection', (socket) => {
  console.log('Jugador conectado:', socket.id);

  socket.on('entrarJuego', (datos) => {
    jugadores[socket.id] = {
      id: socket.id,
      nombre: datos.nombre || 'Jugador',
      x: 0,
      y: 0,
      z: 0
    };
    // Avisar al jugador actual y a los demas
    socket.emit('jugadoresActuales', jugadores);
    socket.broadcast.emit('nuevoJugador', jugadores[socket.id]);
  });

  socket.on('mover', (pos) => {
    if (jugadores[socket.id]) {
      jugadores[socket.id].x = pos.x;
      jugadores[socket.id].y = pos.y;
      jugadores[socket.id].z = pos.z;
      socket.broadcast.emit('jugadorMovido', jugadores[socket.id]);
    }
  });

  socket.on('disconnect', () => {
    delete jugadores[socket.id];
    io.emit('jugadorSalio', socket.id);
  });
});

server.listen(PUERTO, () => {
  console.log('Servidor corriendo en http://localhost:' + PUERTO);
});
