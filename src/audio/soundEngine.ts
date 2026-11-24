// Procedural Web Audio sound effects + real-time lip-sync speech envelope

class CompanionSoundEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private timeDomainData: Uint8Array<ArrayBuffer> | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private muted = false;
  private isSpeaking = false;
  private fallbackSpeechLevel = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.6;
      this.timeDomainData = new Uint8Array(
        new ArrayBuffer(this.analyser.frequencyBinCount)
      );
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stopSpeech();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public stopSpeech() {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
      } catch {
        // ignore already stopped
      }
      this.activeSource.disconnect();
      this.activeSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.fallbackSpeechLevel = 0;
  }

  public getMouthAmplitude(): number {
    if (!this.isSpeaking) return 0;
    if (this.analyser && this.timeDomainData && this.activeSource) {
      this.analyser.getByteTimeDomainData(this.timeDomainData);
      let sumSq = 0;
      for (let i = 0; i < this.timeDomainData.length; i++) {
        const centered = (this.timeDomainData[i] - 128) / 128;
        sumSq += centered * centered;
      }
      const rms = Math.sqrt(sumSq / this.timeDomainData.length);
      return Math.min(1, rms * 3.8);
    }
    // Animated syllable pulse when Web Speech fallback is driving speech
    return this.fallbackSpeechLevel;
  }

  public async playWavBase64(base64Wav: string): Promise<void> {
    this.stopSpeech();
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.analyser) return;

    const binary = atob(base64Wav);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.analyser);

    this.activeSource = source;
    this.isSpeaking = true;

    return new Promise<void>((resolve) => {
      source.onended = () => {
        if (this.activeSource === source) {
          this.activeSource = null;
          this.isSpeaking = false;
        }
        resolve();
      };
      source.start(0);
    });
  }

  public speakBrowserFallback(text: string, pitch = 1.05): Promise<void> {
    this.stopSpeech();
    if (this.muted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.pitch = pitch;
      utter.rate = 1.04;
      this.isSpeaking = true;

      const interval = window.setInterval(() => {
        this.fallbackSpeechLevel = 0.25 + Math.random() * 0.65;
      }, 85);

      const done = () => {
        window.clearInterval(interval);
        this.isSpeaking = false;
        this.fallbackSpeechLevel = 0;
        resolve();
      };

      utter.onend = done;
      utter.onerror = done;
      window.speechSynthesis.speak(utter);
    });
  }

  // Classic Talking-Tom style pitch-shifted mimicry using Web Audio
  public async playEchoRecording(blob: Blob, pitchFactor = 1.35): Promise<void> {
    this.stopSpeech();
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.analyser) return;
    const buf = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(buf);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = pitchFactor;
    source.connect(this.analyser);
    this.activeSource = source;
    this.isSpeaking = true;

    return new Promise<void>((resolve) => {
      source.onended = () => {
        if (this.activeSource === source) {
          this.activeSource = null;
          this.isSpeaking = false;
        }
        resolve();
      };
      source.start(0);
    });
  }

  public playBoop() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(860, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.16);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playPurr() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    lfo.frequency.setValueAtTime(22, now);
    lfoGain.gain.setValueAtTime(28, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    osc.connect(gain);
    gain.connect(ctx.destination);
    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.5);
    osc.stop(now + 0.5);
  }

  public playGiggle() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const notes = [520, 660, 580, 740];
    notes.forEach((freq, idx) => {
      const t = ctx.currentTime + idx * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.18, t + 0.055);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.075);
    });
  }

  public playAngryGrowl() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.linearRampToValueAtTime(98, now + 0.28);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playCrunch() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    for (let i = 0; i < 3; i++) {
      const t = ctx.currentTime + i * 0.11;
      const bufferSize = Math.floor(ctx.sampleRate * 0.07);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.35));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1250 + i * 220, t);
      bp.Q.setValueAtTime(1.4, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      noise.connect(bp);
      bp.connect(gain);
      gain.connect(ctx.destination);
      noise.start(t);
    }
  }

  public playUiClick() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.04);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const soundEngine = new CompanionSoundEngine();
