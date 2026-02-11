/**
 * Game Audio System — procedural sounds via Web Audio API.
 * No external audio files needed.
 *
 * Provides sound effects for game events:
 *   - sfxCorrect()     — bright ascending chime for correct answers
 *   - sfxWrong()       — soft descending buzz for wrong answers
 *   - sfxClick()       — subtle UI tap
 *   - sfxCombo(streak) — escalating sparkle that rises with streak
 *   - sfxLevelUp()     — triumphant brass-like fanfare
 *   - sfxGameOver()    — gentle somber resolution
 *   - sfxHeart()       — warm harp chime (lives/hearts)
 *   - sfxAchievement() — celebratory jingle cascade
 *   - sfxCountdown()   — steady metronome tick
 *   - sfxCountdownGo() — punchy "go!" burst
 *   - sfxStreakLost()   — deflating whoosh when streak breaks
 *   - sfxPerfect()     — shimmering perfect-round fanfare
 *   - sfxTick()        — clock-like tick for timers
 */

// ── Storage ──

const SFX_KEY = "games_sfx_enabled";

// ── Singleton AudioContext ──

let _ctx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

// ── SFX Preference ──

export function isSfxEnabled(): boolean {
  try { return localStorage.getItem(SFX_KEY) !== "false"; } catch { return true; }
}

export function setSfxEnabled(v: boolean) {
  try { localStorage.setItem(SFX_KEY, String(v)); } catch { /* */ }
}

// ── Utility: play a tone with ADSR envelope ──

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.12,
  destination?: AudioNode,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // ADSR-style envelope
  const attack = Math.min(0.015, duration * 0.1);
  const release = Math.min(0.05, duration * 0.2);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + attack);
  gain.gain.setValueAtTime(volume, startTime + duration - release);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.connect(gain);
  gain.connect(destination || ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

// ── Utility: play noise burst (for percussive sounds) ──

function playNoise(
  ctx: AudioContext,
  startTime: number,
  duration: number,
  volume = 0.05,
  filterFreq = 4000,
) {
  const bufSize = Math.ceil(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFreq, startTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(startTime);
  src.stop(startTime + duration + 0.01);
}

// ── Sound Effects ──

/** Bright ascending chime — correct answer */
export function sfxCorrect() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  // C5 → E5 → G5 major arpeggio with sparkle
  playTone(ctx, 523.25, t, 0.1, "sine", 0.14);
  playTone(ctx, 659.25, t + 0.07, 0.1, "sine", 0.12);
  playTone(ctx, 783.99, t + 0.14, 0.15, "sine", 0.10);
  // Soft high shimmer
  playTone(ctx, 1567.98, t + 0.14, 0.08, "sine", 0.03);
  // Tiny click transient
  playNoise(ctx, t, 0.015, 0.04, 6000);
}

/** Soft descending buzz — wrong answer */
export function sfxWrong() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  // Two-note descending minor with slight detuning
  playTone(ctx, 233, t, 0.18, "triangle", 0.08);
  playTone(ctx, 185, t + 0.12, 0.22, "triangle", 0.06);
  // Low thud
  playTone(ctx, 80, t, 0.08, "sine", 0.06);
}

/** Subtle UI tap */
export function sfxClick() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  playTone(ctx, 1200, t, 0.03, "sine", 0.05);
  playNoise(ctx, t, 0.01, 0.02, 8000);
}

/** Escalating sparkle — pitch rises with streak */
export function sfxCombo(streak: number) {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  const base = 600 + Math.min(streak, 25) * 30;
  const steps = Math.min(3 + Math.floor(streak / 5), 6);
  for (let i = 0; i < steps; i++) {
    const freq = base * Math.pow(1.2, i);
    playTone(ctx, freq, t + i * 0.05, 0.08, "sine", 0.08 - i * 0.005);
  }
  // Shimmer noise at the end
  playNoise(ctx, t + steps * 0.05, 0.06, 0.03, 10000);
}

/** Triumphant fanfare — level up / difficulty increase */
export function sfxLevelUp() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  // C5 → E5 → G5 → C6 brass-like triangle wave
  playTone(ctx, 523.25, t, 0.12, "triangle", 0.12);
  playTone(ctx, 659.25, t + 0.10, 0.12, "triangle", 0.12);
  playTone(ctx, 783.99, t + 0.20, 0.12, "triangle", 0.12);
  playTone(ctx, 1046.50, t + 0.30, 0.28, "triangle", 0.14);
  // Sparkle dust
  playTone(ctx, 2093, t + 0.35, 0.08, "sine", 0.03);
  playNoise(ctx, t + 0.30, 0.04, 0.03, 8000);
}

/** Gentle somber resolution — game over */
export function sfxGameOver() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  // G4 → Eb4 → C4 minor descent, sustained
  playTone(ctx, 392, t, 0.35, "sine", 0.10);
  playTone(ctx, 311.13, t + 0.28, 0.35, "sine", 0.08);
  playTone(ctx, 261.63, t + 0.56, 0.50, "sine", 0.06);
  // Soft low pad underneath
  playTone(ctx, 130.81, t + 0.20, 0.70, "sine", 0.03);
}

/** Warm harp chime — lives/hearts */
export function sfxHeart() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  // A4 → C#5 → E5 (A major arpeggio, warm)
  playTone(ctx, 440, t, 0.15, "sine", 0.10);
  playTone(ctx, 554.37, t + 0.10, 0.15, "sine", 0.10);
  playTone(ctx, 659.25, t + 0.20, 0.22, "sine", 0.12);
}

/** Celebratory jingle cascade — achievement unlocked */
export function sfxAchievement() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  // Fast ascending cascade then resolve on high octave
  const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50, 1318.51];
  notes.forEach((f, i) => {
    playTone(ctx, f, t + i * 0.075, 0.12, "sine", 0.09);
  });
  // Final shimmer
  playTone(ctx, 2637, t + notes.length * 0.075, 0.15, "sine", 0.03);
  playNoise(ctx, t + notes.length * 0.075, 0.08, 0.03, 12000);
}

/** Steady metronome tick — countdown "3, 2, 1" */
export function sfxCountdown() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  playTone(ctx, 440, t, 0.10, "sine", 0.10);
  playTone(ctx, 880, t, 0.03, "sine", 0.04); // overtone
}

/** Punchy "go!" burst — countdown finish */
export function sfxCountdownGo() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  playTone(ctx, 880, t, 0.12, "triangle", 0.14);
  playTone(ctx, 1046.50, t + 0.08, 0.18, "triangle", 0.12);
  playTone(ctx, 1318.51, t + 0.16, 0.10, "sine", 0.06);
  playNoise(ctx, t, 0.03, 0.04, 6000);
}

/** Deflating whoosh — streak broken */
export function sfxStreakLost() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  // Descending sweep
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(150, t + 0.3);
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.linearRampToValueAtTime(0, t + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.35);
}

/** Shimmering perfect-round fanfare */
export function sfxPerfect() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  // Fast ascending C major scale to high C, then sparkle
  const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.50];
  scale.forEach((f, i) => {
    playTone(ctx, f, t + i * 0.04, 0.06, "sine", 0.07);
  });
  // Sparkle chord at the top
  playTone(ctx, 1046.50, t + 0.35, 0.30, "sine", 0.08);
  playTone(ctx, 1318.51, t + 0.37, 0.28, "sine", 0.06);
  playTone(ctx, 1567.98, t + 0.39, 0.26, "sine", 0.05);
  playNoise(ctx, t + 0.35, 0.10, 0.03, 12000);
}

/** Clock-like tick — timer warning */
export function sfxTick() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  playTone(ctx, 1600, t, 0.02, "sine", 0.06);
  playNoise(ctx, t, 0.008, 0.03, 10000);
}

// ── Legacy stubs (kept so existing imports don't break) ──

/** @deprecated Music has been removed. This is a no-op. */
export function isMusicEnabled(): boolean { return false; }
/** @deprecated Music has been removed. This is a no-op. */
export function setMusicEnabled(_v: boolean) { /* no-op */ }
/** @deprecated Music has been removed. This is a no-op. */
export function startMusic() { /* no-op */ }
/** @deprecated Music has been removed. This is a no-op. */
export function stopMusic() { /* no-op */ }
/** @deprecated Music has been removed. This is a no-op. */
export function isMusicPlaying(): boolean { return false; }
