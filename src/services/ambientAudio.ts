// Web Audio API procedural sound engine for ambient focus sounds

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private currentSourceNodes: { disconnect: () => void }[] = [];
  private isRunning: boolean = false;

  public isAudioPlaying(): boolean {
    return this.isRunning;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number, isMuted: boolean) {
    if (!this.gainNode || !this.ctx) return;
    const targetGain = isMuted ? 0 : Math.max(0, Math.min(1, volume));
    this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(targetGain * 0.4, this.ctx.currentTime + 0.1);
  }

  public stop() {
    this.currentSourceNodes.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        // ignore
      }
    });
    this.currentSourceNodes = [];
    this.isRunning = false;
  }

  public playTrack(trackId: string, volume: number, isMuted: boolean) {
    this.stop();
    this.initContext();
    if (!this.ctx || !this.gainNode) return;

    this.setVolume(volume, isMuted);
    this.isRunning = true;

    switch (trackId) {
      case 'rain':
        this.playRain();
        break;
      case 'waves':
        this.playOceanWaves();
        break;
      case 'whitenoise':
        this.playWhiteNoise();
        break;
      case 'deepfocus':
        this.playDeepFocusDrone();
        break;
      default:
        this.playRain();
        break;
    }
  }

  private playRain() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pinkish noise algorithm
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.1;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start();

    this.currentSourceNodes.push(whiteNoise, filter);
  }

  private playOceanWaves() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    // LFO for tide rise and fall
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec wave period
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);

    lfo.start();
    whiteNoise.start();

    this.currentSourceNodes.push(whiteNoise, filter, lfo, lfoGain);
  }

  private playWhiteNoise() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start();

    this.currentSourceNodes.push(whiteNoise, filter);
  }

  private playDeepFocusDrone() {
    if (!this.ctx || !this.gainNode) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(108, this.ctx.currentTime); // Low A

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(112, this.ctx.currentTime); // 4Hz binaural beat

    oscGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    osc1.connect(oscGain);
    osc2.connect(oscGain);
    oscGain.connect(this.gainNode);

    osc1.start();
    osc2.start();

    this.currentSourceNodes.push(osc1, osc2, oscGain);
  }
}

export const ambientAudio = new AmbientAudioEngine();
