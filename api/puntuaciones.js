const fs = require('fs');
const path = require('path');

const DB_FILE = process.env.VERCEL ? '/tmp/puntuaciones.json' : path.join(__dirname, 'puntuaciones_db.json');

const DEFAULT_SCORES = [
  { nombre: 'Sensei Ryu', puntos: 520, dificultad: 'Dificil', escenario: 'Noche' },
  { nombre: 'Kunoichi Sakura', puntos: 430, dificultad: 'Dificil', escenario: 'Lava' },
  { nombre: 'Shadow Shinobi', puntos: 350, dificultad: 'Facil', escenario: 'Dia' }
];

function cargarPuntuaciones() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}
  return [...DEFAULT_SCORES];
}

function guardarPuntuaciones(lista) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(lista.slice(0, 50), null, 2), 'utf8');
  } catch (e) {}
}

let puntuaciones = cargarPuntuaciones();

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const b = req.body || {};
    puntuaciones = cargarPuntuaciones();
    puntuaciones.push({
      nombre: b.nombre || 'Anonimo',
      puntos: Number(b.puntos) || 0,
      dificultad: b.dificultad || 'Facil',
      escenario: b.escenario || 'Dia',
      fecha: b.fecha || Date.now()
    });

    const mapa = new Map();
    puntuaciones.forEach(item => {
      const k = `${item.nombre}_${item.puntos}_${item.dificultad}`;
      if (!mapa.has(k)) mapa.set(k, item);
    });
    puntuaciones = Array.from(mapa.values()).sort((a, b) => b.puntos - a.puntos).slice(0, 50);
    guardarPuntuaciones(puntuaciones);

    return res.status(200).json({ ok: true, mensaje: 'Guardado con exito', total: puntuaciones.length });
  }

  puntuaciones = cargarPuntuaciones();
  return res.status(200).json(puntuaciones);
};
