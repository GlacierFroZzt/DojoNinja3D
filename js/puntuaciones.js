export function obtenerPuntuacionesLocales() {
  try {
    const raw = localStorage.getItem('dojo_ninja_puntuaciones');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function guardarPuntuacionesLocales(lista) {
  try {
    localStorage.setItem('dojo_ninja_puntuaciones', JSON.stringify(lista.slice(0, 50)));
  } catch (e) {}
}

export function normalizarYCombinarPuntuaciones(...listas) {
  const mapa = new Map();
  listas.forEach(lista => {
    if (!Array.isArray(lista)) return;
    lista.forEach(item => {
      if (!item || !item.nombre || item.puntos === undefined) return;
      const puntos = Number(item.puntos) || 0;
      const k = `${item.nombre.trim()}_${puntos}_${item.dificultad || 'facil'}`;
      if (!mapa.has(k)) {
        mapa.set(k, {
          nombre: item.nombre.trim(),
          puntos: puntos,
          dificultad: item.dificultad || 'Facil',
          escenario: item.escenario || 'Dia',
          fecha: item.fecha || Date.now()
        });
      }
    });
  });
  return Array.from(mapa.values()).sort((a, b) => b.puntos - a.puntos).slice(0, 30);
}

export function agregarPuntuacionLocal(nuevo) {
  const actuales = obtenerPuntuacionesLocales();
  const combinadas = normalizarYCombinarPuntuaciones(actuales, [nuevo]);
  guardarPuntuacionesLocales(combinadas);
  return combinadas;
}

export class GestorPuntuacionesNube {
  constructor() {
    this.scoresGlobales = [];
    this.topic = 'dojoninja3d_global_scores_v2';
    this.ws = null;
    this.conectar();
  }

  conectar() {
    const servers = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
    let idx = 0;
    const intentar = () => {
      try {
        this.ws = new WebSocket(servers[idx % servers.length], ['mqtt']);
        this.ws.binaryType = 'arraybuffer';
        this.ws.onopen = () => {
          this.enviarConnect();
        };
        this.ws.onmessage = (e) => {
          const buf = new Uint8Array(e.data);
          const tipo = buf[0] >> 4;
          if (tipo === 2) {
            this.enviarSubscribe(this.topic);
          } else if (tipo === 3) {
            let pos = 1;
            let multiplier = 1;
            let remainingLength = 0;
            let digit;
            do {
              digit = buf[pos++];
              remainingLength += (digit & 127) * multiplier;
              multiplier *= 128;
            } while ((digit & 128) !== 0);

            const topicLen = (buf[pos] << 8) | buf[pos + 1];
            pos += 2 + topicLen;
            const payloadBytes = buf.subarray(pos);
            try {
              const data = JSON.parse(new TextDecoder().decode(payloadBytes));
              if (Array.isArray(data) && data.length > 0) {
                this.scoresGlobales = data;
                const combinadas = normalizarYCombinarPuntuaciones(obtenerPuntuacionesLocales(), data);
                guardarPuntuacionesLocales(combinadas);
              }
            } catch (err) {}
          }
        };
        this.ws.onerror = () => {
          idx++;
          if (idx < servers.length) setTimeout(intentar, 1000);
        };
      } catch (e) {}
    };
    intentar();
  }

  encStr(s) {
    const bytes = new TextEncoder().encode(s);
    const arr = new Uint8Array(2 + bytes.length);
    arr[0] = bytes.length >> 8;
    arr[1] = bytes.length & 0xff;
    arr.set(bytes, 2);
    return arr;
  }

  enviarConnect() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const cId = this.encStr('ninja_score_' + Math.random().toString(36).substring(2, 8));
    const proto = this.encStr('MQTT');
    const varHeader = new Uint8Array(proto.length + 4 + cId.length);
    varHeader.set(proto, 0);
    varHeader[proto.length] = 4;
    varHeader[proto.length + 1] = 2;
    varHeader[proto.length + 2] = 0;
    varHeader[proto.length + 3] = 60;
    varHeader.set(cId, proto.length + 4);
    const packet = new Uint8Array(2 + varHeader.length);
    packet[0] = 0x10;
    packet[1] = varHeader.length;
    packet.set(varHeader, 2);
    this.ws.send(packet);
  }

  enviarSubscribe(topic) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const topicArr = this.encStr(topic);
    const subBody = new Uint8Array(2 + topicArr.length + 1);
    subBody[0] = 0; subBody[1] = 1;
    subBody.set(topicArr, 2);
    subBody[subBody.length - 1] = 0;
    const packet = new Uint8Array(2 + subBody.length);
    packet[0] = 0x82;
    packet[1] = subBody.length;
    packet.set(subBody, 2);
    this.ws.send(packet);
  }

  publicarScores(lista) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      const topicArr = this.encStr(this.topic);
      const payload = new TextEncoder().encode(JSON.stringify(lista.slice(0, 30)));
      const remLen = topicArr.length + payload.length;
      const lenBytes = [];
      let x = remLen;
      do {
        let encodedByte = x % 128;
        x = Math.floor(x / 128);
        if (x > 0) encodedByte = encodedByte | 128;
        lenBytes.push(encodedByte);
      } while (x > 0);

      const packet = new Uint8Array(1 + lenBytes.length + remLen);
      packet[0] = 0x31;
      packet.set(lenBytes, 1);
      packet.set(topicArr, 1 + lenBytes.length);
      packet.set(payload, 1 + lenBytes.length + topicArr.length);
      this.ws.send(packet);
    } catch (e) {
      console.warn('Error publicando scores en nube:', e);
    }
  }
}

export const gestorPuntuacionesNube = new GestorPuntuacionesNube();
