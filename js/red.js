export class RelayWebSocket {
  constructor(roomCode, onMessage, onReady) {
    this.roomCode = roomCode.toLowerCase();
    this.onMessage = onMessage;
    this.onReady = onReady;
    this.topic = 'dojoninja3d_sala_' + this.roomCode;
    this.ws = null;
    this.pingInterval = null;
    this.ultimoEnvioMov = 0;
    this.serverIndex = 0;
    this.servers = [
      'wss://broker.emqx.io:8084/mqtt',
      'wss://broker.hivemq.com:8884/mqtt'
    ];
    this.conectar();
  }

  conectar() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
    const url = this.servers[this.serverIndex % this.servers.length];
    try {
      this.ws = new WebSocket(url, ['mqtt']);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.enviarConnect();
      };

      this.ws.onmessage = (e) => {
        const buf = new Uint8Array(e.data);
        const tipo = buf[0] >> 4;
        if (tipo === 2) {
          this.enviarSubscribe(this.topic);
          if (this.onReady) this.onReady();
          if (this.pingInterval) clearInterval(this.pingInterval);
          this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(new Uint8Array([0xC0, 0x00]));
            }
          }, 25000);
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
            const jsonStr = new TextDecoder().decode(payloadBytes);
            const data = JSON.parse(jsonStr);
            if (this.onMessage) this.onMessage(data);
          } catch (err) {}
        }
      };

      this.ws.onerror = (e) => {
        console.warn('RelayWS connection error on ' + url + ', probando servidor alterno...');
        if (this.serverIndex < this.servers.length - 1) {
          this.serverIndex++;
          setTimeout(() => this.conectar(), 500);
        }
      };

      this.ws.onclose = () => {
        if (this.pingInterval) clearInterval(this.pingInterval);
      };
    } catch (e) {
      console.warn('RelayWS init error:', e);
    }
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
    const cId = this.encStr('ninja_' + Math.random().toString(36).substring(2, 9));
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
    const topicArr = this.encStr(topic);
    const subBody = new Uint8Array(2 + topicArr.length + 1);
    subBody[0] = 0;
    subBody[1] = 1;
    subBody.set(topicArr, 2);
    subBody[subBody.length - 1] = 0;

    const packet = new Uint8Array(2 + subBody.length);
    packet[0] = 0x82;
    packet[1] = subBody.length;
    packet.set(subBody, 2);
    this.ws.send(packet);
  }

  publicar(obj, topicPersonalizado = null, retain = false) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (obj.tipo === 'PLAYER_MOVED') {
      const ahora = performance.now();
      if (ahora - this.ultimoEnvioMov < 40) return;
      this.ultimoEnvioMov = ahora;
    }
    try {
      const top = topicPersonalizado || this.topic;
      const topicArr = this.encStr(top);
      const payload = new TextEncoder().encode(JSON.stringify(obj));
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
      packet[0] = retain ? 0x31 : 0x30;
      packet.set(lenBytes, 1);
      packet.set(topicArr, 1 + lenBytes.length);
      packet.set(payload, 1 + lenBytes.length + topicArr.length);
      this.ws.send(packet);
    } catch (e) {
      console.warn('Error publicando en relay:', e);
    }
  }

  cerrar() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
  }
}

export class RedDojo {
  constructor() {
    this.relay = null;
    this.broadcastChannel = null;
    this.peer = null;
    this.peerConexiones = new Map();
    this.peerHostConn = null;
    this.isHost = false;
    this.codigoSala = '';
    this.miId = 'ninja_' + Math.random().toString(36).substring(2, 8);
    this.miNombre = 'Ninja';
    this.jugadores = {};
    this.anfitrionId = null;
    this.listeners = {};
    this.timerUnirse = null;
    this.obstacleSeq = 0;
  }

  on(evento, cb) {
    if (!this.listeners[evento]) this.listeners[evento] = [];
    this.listeners[evento].push(cb);
  }

  disparar(evento, datos) {
    if (this.listeners[evento]) {
      this.listeners[evento].forEach((cb) => {
        try { cb(datos); } catch (e) { console.error(e); }
      });
    }
  }

  generarCodigo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let cod = '';
    for (let i = 0; i < 4; i++) {
      cod += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return cod;
  }

  crearSala(nombre) {
    this.miNombre = nombre || 'Ninja';
    this.cerrarCanales();
    this.isHost = true;
    this.codigoSala = this.generarCodigo();
    this.anfitrionId = this.miId;
    this.obstacleSeq = 0;
    this.jugadores = {
      [this.miId]: {
        id: this.miId,
        nombre: this.miNombre,
        x: -1.5, y: 0, z: 0,
        esAnfitrion: true
      }
    };

    this.iniciarCanalesHost(this.codigoSala);

    this.disparar('joinedLobby', {
      codigoSala: this.codigoSala,
      esAnfitrion: true,
      anfitrionId: this.anfitrionId,
      jugadorLocal: this.jugadores[this.miId],
      todosJugadores: this.jugadores,
      jugadores: this.jugadores
    });
  }

  iniciarCanalesHost(codigo) {
    const canalNombre = 'dojo3d_room_' + codigo.toLowerCase();

    this.relay = new RelayWebSocket(codigo, (msg) => {
      this.procesarMensajeHost(msg);
    }, () => {
      console.log('[Relay Host] Sala lista en la nube con código:', codigo);
      const estadoEl = document.getElementById('lobby-estado-red');
      if (estadoEl) {
        estadoEl.textContent = 'En línea — Código listo para compartir';
        estadoEl.style.color = '#a5d6a7';
      }
    });

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(canalNombre);
        this.broadcastChannel.onmessage = (e) => this.procesarMensajeHost(e.data);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  }

  procesarMensajeHost(msg, connDirecta = null) {
    if (!msg || !this.isHost) return;
    if (msg.remitenteId && msg.remitenteId === this.miId) return;

    if (msg.tipo === 'JOIN_REQUEST') {
      const gId = msg.guestId;
      const gNombre = msg.nombre || 'Ninja Aliado';
      this.jugadores[gId] = {
        id: gId,
        nombre: gNombre,
        x: 1.5, y: 0, z: 0,
        esAnfitrion: false
      };

      const respuesta = {
        tipo: 'LOBBY_UPDATE',
        codigoSala: this.codigoSala,
        anfitrionId: this.anfitrionId,
        jugadores: this.jugadores,
        targetGuestId: gId,
        remitenteId: this.miId
      };

      if (connDirecta) {
        try { connDirecta.send(respuesta); } catch (e) {}
      }
      this.enviarAClientes(respuesta);
      this.disparar('lobbyUpdate', respuesta);
    } else if (msg.tipo === 'PLAYER_MOVED') {
      if (this.jugadores[msg.id]) {
        this.jugadores[msg.id].x = msg.x;
        this.jugadores[msg.id].y = msg.y;
        this.jugadores[msg.id].z = msg.z;
      }
      this.disparar('jugadorMovido', { id: msg.id, x: msg.x, y: msg.y, z: msg.z });
      this.enviarAClientes(msg, msg.id);
    } else if (msg.tipo === 'IMPACT_OBSTACLE') {
      this.disparar('impactoObstaculo', { id: msg.id, tipo: msg.tipoImpacto, x: msg.x, z: msg.z });
      this.enviarAClientes(msg, msg.remitenteId);
    } else if (msg.tipo === 'PLAYER_POWER') {
      this.disparar('poderActivado', { id: msg.id, tipo: msg.poder, duracion: msg.duracion });
      this.enviarAClientes(msg, msg.id);
    } else if (msg.tipo === 'GAME_PAUSE') {
      this.disparar('juegoPausadoRed', { pausado: msg.pausado, nombre: msg.nombre });
      this.enviarAClientes(msg, msg.remitenteId);
    } else if (msg.tipo === 'PLAYER_DEATH') {
      this.disparar('muerteJugador', { id: msg.id, nombre: msg.nombre });
      this.enviarAClientes(msg, msg.id);
    } else if (msg.tipo === 'MATCH_OVER') {
      this.disparar('partidaTerminada', { motivo: msg.motivo });
      this.enviarAClientes(msg);
    } else if (msg.tipo === 'PLAYER_SCORE') {
      if (msg.score) {
        this.disparar('puntuacionRecibida', msg.score);
        this.enviarAClientes(msg, msg.remitenteId);
      }
    } else if (msg.tipo === 'PLAYER_LEFT') {
      delete this.jugadores[msg.id];
      this.disparar('jugadorSalio', msg.id);
      const update = {
        tipo: 'LOBBY_UPDATE',
        codigoSala: this.codigoSala,
        anfitrionId: this.anfitrionId,
        jugadores: this.jugadores,
        remitenteId: this.miId
      };
      this.enviarAClientes(update);
      this.disparar('lobbyUpdate', update);
    }
  }

  unirseASala(codigo, nombre) {
    this.miNombre = nombre || 'Ninja';
    const cod = (codigo || '').trim().toUpperCase();
    if (!cod) {
      this.disparar('roomError', 'Por favor escribe el código de la sala.');
      return;
    }

    this.cerrarCanales();
    this.isHost = false;
    this.codigoSala = cod;

    const canalNombre = 'dojo3d_room_' + cod.toLowerCase();
    const req = {
      tipo: 'JOIN_REQUEST',
      guestId: this.miId,
      nombre: this.miNombre,
      remitenteId: this.miId
    };

    let conectado = false;

    if (this.timerUnirse) clearTimeout(this.timerUnirse);
    this.timerUnirse = setTimeout(() => {
      if (!conectado) {
        this.disparar('roomError', `No se encontró la sala "${cod}". Verifica que el código sea correcto y el anfitrión esté en el lobby.`);
        this.cerrarCanales();
      }
    }, 10000);

    this.relay = new RelayWebSocket(cod, (msg) => {
      if (!msg) return;
      if (msg.remitenteId && msg.remitenteId === this.miId) return;
      if (msg.tipo === 'LOBBY_UPDATE' || msg.tipo === 'MATCH_STARTED') {
        conectado = true;
        if (this.timerUnirse) clearTimeout(this.timerUnirse);
      }
      this.procesarMensajeGuest(msg);
    }, () => {
      console.log('[Relay Guest] Conectado a la sala en la nube, enviando petición de entrada...');
      this.relay.publicar(req);
      setTimeout(() => { if (!conectado && this.relay) this.relay.publicar(req); }, 400);
      setTimeout(() => { if (!conectado && this.relay) this.relay.publicar(req); }, 1200);
      setTimeout(() => { if (!conectado && this.relay) this.relay.publicar(req); }, 2500);
    });

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(canalNombre);
        this.broadcastChannel.onmessage = (e) => {
          const msg = e.data;
          if (msg && msg.tipo) {
            conectado = true;
            if (this.timerUnirse) clearTimeout(this.timerUnirse);
            this.procesarMensajeGuest(msg);
          }
        };
        this.broadcastChannel.postMessage(req);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  }

  procesarMensajeGuest(msg) {
    if (!msg) return;

    if (msg.tipo === 'LOBBY_UPDATE') {
      this.anfitrionId = msg.anfitrionId;
      this.jugadores = msg.jugadores || {};
      this.disparar('joinedLobby', {
        codigoSala: this.codigoSala,
        esAnfitrion: false,
        anfitrionId: this.anfitrionId,
        jugadorLocal: this.jugadores[this.miId] || { id: this.miId, nombre: this.miNombre },
        todosJugadores: this.jugadores,
        jugadores: this.jugadores
      });
      this.disparar('lobbyUpdate', msg);
    } else if (msg.tipo === 'MATCH_STARTED') {
      if (msg.anfitrionId) this.anfitrionId = msg.anfitrionId;
      this.jugadores = msg.todosJugadores || this.jugadores;
      this.disparar('matchStarted', msg);
      this.disparar('jugadoresActuales', this.jugadores);
    } else if (msg.tipo === 'PLAYER_MOVED') {
      if (msg.id !== this.miId) {
        this.disparar('jugadorMovido', { id: msg.id, x: msg.x, y: msg.y, z: msg.z });
      }
    } else if (msg.tipo === 'SPAWN_OBSTACLE') {
      this.disparar('obstaculoGenerado', {
        id: msg.id,
        tipo: msg.tipoObj,
        posX: msg.posX,
        targetId: msg.targetId,
        targetNombre: msg.targetNombre
      });
    } else if (msg.tipo === 'IMPACT_OBSTACLE') {
      this.disparar('impactoObstaculo', { id: msg.id, tipo: msg.tipoImpacto, x: msg.x, z: msg.z });
    } else if (msg.tipo === 'PLAYER_POWER') {
      if (msg.id !== this.miId) {
        this.disparar('poderActivado', { id: msg.id, tipo: msg.poder, duracion: msg.duracion });
      }
    } else if (msg.tipo === 'GAME_PAUSE') {
      if (msg.remitenteId !== this.miId) {
        this.disparar('juegoPausadoRed', { pausado: msg.pausado, nombre: msg.nombre });
      }
    } else if (msg.tipo === 'PLAYER_DEATH') {
      if (msg.id !== this.miId) {
        this.disparar('muerteJugador', { id: msg.id, nombre: msg.nombre });
      }
    } else if (msg.tipo === 'TIME_SYNC') {
      this.disparar('tiempoSincronizado', msg.tiempo);
    } else if (msg.tipo === 'MATCH_OVER') {
      this.disparar('partidaTerminada', { motivo: msg.motivo });
    } else if (msg.tipo === 'PLAYER_SCORE') {
      if (msg.score) {
        this.disparar('puntuacionRecibida', msg.score);
      }
    } else if (msg.tipo === 'PLAYER_LEFT') {
      if (msg.id !== this.miId) {
        this.disparar('jugadorSalio', msg.id);
      }
    }
  }

  iniciarPartidaLobby(configPartida = {}) {
    if (this.isHost) {
      const msg = {
        tipo: 'MATCH_STARTED',
        codigoSala: this.codigoSala,
        anfitrionId: this.miId,
        todosJugadores: this.jugadores,
        remitenteId: this.miId,
        modo: configPartida.modo || 'esquivar',
        dificultad: configPartida.dificultad || 'facil',
        escenario: configPartida.escenario || 'dojo',
        velocidad: configPartida.velocidad || 18
      };
      this.enviarAClientes(msg);
      this.disparar('matchStarted', msg);
      this.disparar('jugadoresActuales', this.jugadores);
    }
  }

  enviarPuntuacion(datos) {
    const msg = {
      tipo: 'PLAYER_SCORE',
      remitenteId: this.miId,
      score: datos
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarObstaculo(datos) {
    this.obstacleSeq++;
    const msg = {
      tipo: 'SPAWN_OBSTACLE',
      id: datos.id || ('obs_' + this.obstacleSeq),
      tipoObj: datos.tipo,
      posX: datos.posX,
      targetId: datos.targetId,
      targetNombre: datos.targetNombre,
      remitenteId: this.miId
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarImpactoObstaculo(datos) {
    const msg = {
      tipo: 'IMPACT_OBSTACLE',
      remitenteId: this.miId,
      id: datos.id,
      tipoImpacto: datos.tipo,
      x: datos.x,
      z: datos.z
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarPoder(datos) {
    const msg = {
      tipo: 'PLAYER_POWER',
      remitenteId: this.miId,
      id: this.miId,
      poder: datos.tipo,
      duracion: datos.duracion
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarPausa(pausado) {
    const msg = {
      tipo: 'GAME_PAUSE',
      remitenteId: this.miId,
      nombre: this.miNombre || 'Ninja',
      pausado: Boolean(pausado)
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarMuerte(datos) {
    const msg = {
      tipo: 'PLAYER_DEATH',
      remitenteId: this.miId,
      id: this.miId,
      nombre: datos.nombre
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarTiempo(t) {
    const msg = {
      tipo: 'TIME_SYNC',
      tiempo: t,
      remitenteId: this.miId
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarFinPartida(datos) {
    const msg = {
      tipo: 'MATCH_OVER',
      remitenteId: this.miId,
      motivo: (datos && datos.motivo) || '¡Fin de la partida!'
    };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarMovimiento(pos) {
    const msg = {
      tipo: 'PLAYER_MOVED',
      remitenteId: this.miId,
      id: this.miId,
      x: pos.x,
      y: pos.y,
      z: pos.z
    };

    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  enviarAClientes(msg, remitenteId = null) {
    if (!msg.remitenteId) msg.remitenteId = this.miId;
    if (this.relay) {
      this.relay.publicar(msg);
    }
    if (this.broadcastChannel) {
      try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
  }

  salir() {
    if (this.timerUnirse) clearTimeout(this.timerUnirse);
    const msg = { tipo: 'PLAYER_LEFT', id: this.miId, remitenteId: this.miId };
    if (this.isHost) {
      this.enviarAClientes(msg);
    } else {
      if (this.relay) this.relay.publicar(msg);
      if (this.broadcastChannel) try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
    this.cerrarCanales();
  }

  cerrarCanales() {
    if (this.relay) {
      this.relay.cerrar();
      this.relay = null;
    }
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch (e) {}
      this.broadcastChannel = null;
    }
    this.isHost = false;
  }
}

export const red = new RedDojo();

export function renderizarLobby(datos, redInst = red) {
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

  const codigoSalaActual = datos.codigoSala || 'GLOBAL';
  const lobbyCodigo = document.getElementById('lobby-codigo-sala');
  if (lobbyCodigo) lobbyCodigo.textContent = codigoSalaActual;
  const lobbyEstadoRed = document.getElementById('lobby-estado-red');
  if (lobbyEstadoRed) {
    if (datos.esAnfitrion) {
      lobbyEstadoRed.textContent = (redInst.peer && redInst.peer.open)
        ? 'En línea — Código listo para compartir'
        : 'Conectando a red P2P... Espera un momento';
      lobbyEstadoRed.style.color = (redInst.peer && redInst.peer.open) ? '#a5d6a7' : '#ffb74d';
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
      const esYo = id === redInst.miId;

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

  const soyAnfitrion = (datos.anfitrionId === redInst.miId || redInst.isHost);
  const btnIniciarLobby = document.getElementById('btn-iniciar-partida-lobby');
  if (btnIniciarLobby) btnIniciarLobby.style.display = soyAnfitrion ? 'block' : 'none';

  const lobbyAvisoEspera = document.getElementById('lobby-aviso-espera');
  if (lobbyAvisoEspera) lobbyAvisoEspera.style.display = soyAnfitrion ? 'none' : 'block';
}

export function iniciarBotonesSalas(redInst = red) {
  const btnCrear = document.getElementById('btn-crear-sala');
  if (btnCrear) {
    btnCrear.onclick = () => {
      const el = document.getElementById('input-nombre') || document.getElementById('nombre-jugador');
      const nombre = (el && el.value) ? el.value : 'Ninja Shinobi';
      redInst.crearSala(nombre);
    };
  }

  const btnAbrirUnirse = document.getElementById('btn-unirse-sala');
  if (btnAbrirUnirse) {
    btnAbrirUnirse.onclick = () => {
      const errEl = document.getElementById('error-unirse-sala');
      if (errEl) errEl.style.display = 'none';
      const inputCod = document.getElementById('input-codigo-sala');
      if (inputCod) inputCod.value = '';
      const modal = document.getElementById('modal-unirse-sala');
      if (modal) modal.style.display = 'flex';
    };
  }

  const btnCancelar = document.getElementById('btn-cancelar-unirse');
  if (btnCancelar) {
    btnCancelar.onclick = () => {
      if (redInst.timerUnirse) clearTimeout(redInst.timerUnirse);
      const modal = document.getElementById('modal-unirse-sala');
      if (modal) modal.style.display = 'none';
    };
  }

  const btnConfirmar = document.getElementById('btn-confirmar-unirse');
  if (btnConfirmar) {
    btnConfirmar.onclick = () => {
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
      const el = document.getElementById('input-nombre') || document.getElementById('nombre-jugador');
      const nombre = (el && el.value) ? el.value : 'Ninja Shinobi';
      redInst.unirseASala(codigo, nombre);
    };
  }
}
