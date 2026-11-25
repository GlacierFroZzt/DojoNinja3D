export class SistemaSonido {
  constructor() {
    this.ctx = null;
    this.musicaActiva = false;
    this.volumenMusica = 0.7;
    this.volumenSFX = 0.8;
    this.katanaBuffer = null;

    try {
      const vm = localStorage.getItem('dojo_vol_musica');
      if (vm !== null) this.volumenMusica = parseFloat(vm);
      const vs = localStorage.getItem('dojo_vol_sfx');
      if (vs !== null) this.volumenSFX = parseFloat(vs);
    } catch (e) {}

    this.bgmAudio = new Audio('audio/musica.mp3');
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = this.volumenMusica;
  }

  iniciar() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.cargarKatanaAudio();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  cargarKatanaAudio() {
    if (this.katanaBuffer || !this.ctx) return;
    fetch('audio/katana.mp3')
      .then(res => res.arrayBuffer())
      .then(ab => this.ctx.decodeAudioData(ab))
      .then(buf => { this.katanaBuffer = buf; })
      .catch(() => {});
  }

  playEspadazo() {
    this.iniciar();
    if (this.volumenSFX <= 0) return;

    if (this.ctx && this.katanaBuffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.katanaBuffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.volumenSFX, this.ctx.currentTime);
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(0);
        return;
      } catch (e) {}
    }

    try {
      const a = new Audio('audio/katana.mp3');
      a.volume = this.volumenSFX;
      a.play().catch(() => {});
    } catch (e) {}
  }

  playParry() {
    this.playEspadazo();
  }

  playItem() {
    this.iniciar();
    if (!this.ctx || this.volumenSFX <= 0) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.25 * this.volumenSFX, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  playGolpe() {
    this.iniciar();
    if (!this.ctx || this.volumenSFX <= 0) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.4 * this.volumenSFX, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  iniciarBGM(desdeInicio = false) {
    this.iniciar();
    this.musicaActiva = true;
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.volumenMusica;
      this.bgmAudio.loop = true;
      if (desdeInicio) {
        try { this.bgmAudio.currentTime = 0; } catch (e) {}
      }
      this.bgmAudio.play().catch(() => {});
    }
  }

  detenerBGM() {
    this.musicaActiva = false;
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }

  reanudarBGM() {
    if (this.musicaActiva && this.bgmAudio && this.bgmAudio.paused) {
      this.bgmAudio.play().catch(() => {});
    }
  }

  alternarBGM() {
    if (this.musicaActiva) {
      this.detenerBGM();
      return false;
    } else {
      this.iniciarBGM();
      return true;
    }
  }

  setVolumenMusica(vol) {
    this.volumenMusica = Math.max(0, Math.min(1, vol));
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.volumenMusica;
    }
    try { localStorage.setItem('dojo_vol_musica', this.volumenMusica.toString()); } catch (e) {}
  }

  setVolumenSFX(vol) {
    this.volumenSFX = Math.max(0, Math.min(1, vol));
    try { localStorage.setItem('dojo_vol_sfx', this.volumenSFX.toString()); } catch (e) {}
  }
}

export const audio = new SistemaSonido();
