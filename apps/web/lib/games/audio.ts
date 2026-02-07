/**
 * Game Audio System — procedural sounds via Web Audio API.
 * No external audio files needed.
 *
 * Provides:
 *   - Background music (ambient loop)
 *   - Sound effects (correct, wrong, combo, levelUp, gameOver, click, heart, achievement)
 *   - localStorage-persisted toggles for music & SFX
 */

// ── Storage keys ──

const MUSIC_KEY = "games_music_enabled";
const SFX_KEY = "games_sfx_enabled";

// ── Singleton AudioContext ──

let _ctx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

// ── Preferences ──

export function isMusicEnabled(): boolean {
  try { return localStorage.getItem(MUSIC_KEY) !== "false"; } catch { return true; }
}

export function isSfxEnabled(): boolean {
  try { return localStorage.getItem(SFX_KEY) !== "false"; } catch { return true; }
}

export function setMusicEnabled(v: boolean) {
  try { localStorage.setItem(MUSIC_KEY, String(v)); } catch { /* */ }
  if (!v) stopMusic();
}

export function setSfxEnabled(v: boolean) {
  try { localStorage.setItem(SFX_KEY, String(v)); } catch { /* */ }
}

// ── Utility: play a note ──

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.12,
  destination?: AudioNode
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.linearRampToValueAtTime(volume * 0.6, startTime + duration * 0.7);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(destination || ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

// ── Sound Effects ──

export function sfxCorrect() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Bright ascending arpeggio: C5 → E5 → G5
  playTone(ctx, 523, now, 0.1, "sine", 0.15);
  playTone(ctx, 659, now + 0.08, 0.1, "sine", 0.13);
  playTone(ctx, 784, now + 0.16, 0.15, "sine", 0.1);
}

export function sfxWrong() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Low descending buzz
  playTone(ctx, 220, now, 0.15, "sawtooth", 0.08);
  playTone(ctx, 185, now + 0.1, 0.2, "sawtooth", 0.06);
}

export function sfxClick() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Short soft tick
  playTone(ctx, 880, now, 0.04, "sine", 0.06);
}

export function sfxCombo(streak: number) {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Rising sparkle — pitch goes up with streak
  const base = 600 + Math.min(streak, 20) * 30;
  playTone(ctx, base, now, 0.08, "sine", 0.1);
  playTone(ctx, base * 1.25, now + 0.06, 0.08, "sine", 0.1);
  playTone(ctx, base * 1.5, now + 0.12, 0.08, "sine", 0.1);
  playTone(ctx, base * 2, now + 0.18, 0.12, "triangle", 0.08);
}

export function sfxLevelUp() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Triumphant fanfare: C5 → E5 → G5 → C6
  playTone(ctx, 523, now, 0.12, "triangle", 0.12);
  playTone(ctx, 659, now + 0.1, 0.12, "triangle", 0.12);
  playTone(ctx, 784, now + 0.2, 0.12, "triangle", 0.12);
  playTone(ctx, 1047, now + 0.3, 0.25, "triangle", 0.14);
}

export function sfxGameOver() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Somber descending: G4 → Eb4 → C4
  playTone(ctx, 392, now, 0.3, "sine", 0.1);
  playTone(ctx, 311, now + 0.25, 0.3, "sine", 0.08);
  playTone(ctx, 262, now + 0.5, 0.5, "sine", 0.06);
}

export function sfxHeart() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Warm chime
  playTone(ctx, 440, now, 0.15, "sine", 0.1);
  playTone(ctx, 554, now + 0.1, 0.15, "sine", 0.1);
  playTone(ctx, 659, now + 0.2, 0.2, "sine", 0.12);
}

export function sfxAchievement() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Celebratory jingle
  const notes = [523, 659, 784, 1047, 784, 1047, 1319];
  notes.forEach((f, i) => {
    playTone(ctx, f, now + i * 0.08, 0.12, "sine", 0.1);
  });
}

export function sfxCountdown() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  playTone(ctx, 440, now, 0.12, "sine", 0.1);
}

export function sfxCountdownGo() {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  playTone(ctx, 880, now, 0.15, "sine", 0.14);
  playTone(ctx, 1047, now + 0.1, 0.2, "sine", 0.12);
}

// ── Background Music (ambient loop) ──

let _musicGain: GainNode | null = null;
let _musicOscs: OscillatorNode[] = [];
let _musicPlaying = false;
let _musicInterval: ReturnType<typeof setInterval> | null = null;

// Ambient pad: layered slow-evolving sine waves
const MUSIC_CHORDS = [
  [220, 277, 330],   // Am
  [196, 247, 294],   // G
  [175, 220, 262],   // F
  [196, 247, 330],   // Em/G
];

function startMusicLoop() {
  if (_musicPlaying) return;
  if (!isMusicEnabled()) return;
  const ctx = getCtx();
  _musicGain = ctx.createGain();
  _musicGain.gain.setValueAtTime(0, ctx.currentTime);
  _musicGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2); // very quiet
  _musicGain.connect(ctx.destination);

  let chordIdx = 0;

  function playChord() {
    // Stop previous oscillators
    _musicOscs.forEach((o) => { try { o.stop(); } catch { /* */ } });
    _musicOscs = [];

    if (!_musicGain || !isMusicEnabled()) return;

    const ctx2 = getCtx();
    const now = ctx2.currentTime;
    const chord = MUSIC_CHORDS[chordIdx % MUSIC_CHORDS.length];
    chordIdx++;

    chord.forEach((freq, i) => {
      const osc = ctx2.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      // Slow vibrato
      const lfo = ctx2.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.3 + i * 0.1, now);
      const lfoGain = ctx2.createGain();
      lfoGain.gain.setValueAtTime(1.5, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);

      osc.connect(_musicGain!);
      osc.start(now);
      _musicOscs.push(osc);

      // Clean up LFO after chord duration
      lfo.stop(now + 4.5);
    });

    // Add a soft high pad note
    const pad = ctx2.createOscillator();
    pad.type = "sine";
    pad.frequency.setValueAtTime(chord[2] * 2, now);
    const padGain = ctx2.createGain();
    padGain.gain.setValueAtTime(0, now);
    padGain.gain.linearRampToValueAtTime(0.015, now + 1);
    padGain.gain.linearRampToValueAtTime(0, now + 3.8);
    pad.connect(padGain);
    padGain.connect(_musicGain!);
    pad.start(now);
    pad.stop(now + 4.5);
    _musicOscs.push(pad);
  }

  playChord();
  _musicInterval = setInterval(playChord, 4000);
  _musicPlaying = true;
}

export function startMusic() {
  if (typeof window === "undefined") return;
  startMusicLoop();
}

export function stopMusic() {
  _musicPlaying = false;
  if (_musicInterval) { clearInterval(_musicInterval); _musicInterval = null; }
  _musicOscs.forEach((o) => { try { o.stop(); } catch { /* */ } });
  _musicOscs = [];
  if (_musicGain) {
    try {
      const ctx = getCtx();
      _musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    } catch { /* */ }
    _musicGain = null;
  }
}

export function isMusicPlaying(): boolean {
  return _musicPlaying;
}
