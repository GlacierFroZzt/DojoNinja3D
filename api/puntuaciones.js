let puntuaciones = [
  { nombre: 'Juan', puntos: 120, dificultad: 'Facil', escenario: 'Dia' },
  { nombre: 'Maria', puntos: 90, dificultad: 'Dificil', escenario: 'Noche' },
  { nombre: 'Pedro', puntos: 50, dificultad: 'Facil', escenario: 'Lava' }
];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'POST') {
    const b = req.body || {};
    puntuaciones.push({
      nombre: b.nombre || 'Anonimo',
      puntos: Number(b.puntos) || 0,
      dificultad: b.dificultad || 'Facil',
      escenario: b.escenario || 'Dia'
    });
    puntuaciones.sort((a, b) => b.puntos - a.puntos);
    return res.status(200).json({ ok: true, mensaje: 'Guardado con exito' });
  }
  return res.status(200).json(puntuaciones);
};
