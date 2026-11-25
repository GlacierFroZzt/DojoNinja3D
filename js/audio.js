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

export function iniciarControlesAudio(audioInst = audio) {
  const btnSonido = document.getElementById('btn-sonido-toggle');
  if (btnSonido) {
    btnSonido.onclick = () => {
      const sonando = audioInst.alternarBGM();
      btnSonido.textContent = sonando ? 'MÚSICA: ON' : 'MÚSICA: OFF';
    };
  }

  const sliderMusica = document.getElementById('slider-vol-musica');
  const valMusica = document.getElementById('val-vol-musica');
  const sliderSFX = document.getElementById('slider-vol-sfx');
  const valSFX = document.getElementById('val-vol-sfx');
  const btnProbarKatana = document.getElementById('btn-probar-katana');

  function sincronizar() {
    const pMus = Math.round(audioInst.volumenMusica * 100);
    const pSFX = Math.round(audioInst.volumenSFX * 100);
    if (sliderMusica) sliderMusica.value = pMus;
    if (valMusica) valMusica.textContent = `${pMus}%`;
    if (sliderSFX) sliderSFX.value = pSFX;
    if (valSFX) valSFX.textContent = `${pSFX}%`;
  }

  if (sliderMusica) {
    sliderMusica.addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      audioInst.setVolumenMusica(v / 100);
      if (valMusica) valMusica.textContent = `${v}%`;
    });
  }

  if (sliderSFX) {
    sliderSFX.addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      audioInst.setVolumenSFX(v / 100);
      if (valSFX) valSFX.textContent = `${v}%`;
    });
  }

  if (btnProbarKatana) {
    btnProbarKatana.addEventListener('click', () => {
      audioInst.playEspadazo();
    });
  }

  sincronizar();
  return sincronizar;
}
