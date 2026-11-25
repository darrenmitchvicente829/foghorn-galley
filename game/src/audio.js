// Every sound of the galley, made here with the Web Audio API: knife strokes, the sizzle, the
// pass bell, the foghorn that opens a shift and a slow concertina tune. No sound file is loaded.

let context = null;
let master = null;
let muted = false;
let tuneTimer = null;

export function wakeAudio() {
  if (context) {
    if (context.state === 'suspended') context.resume();
    return;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  context = new AudioContextClass();
  master = context.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(context.destination);
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(frequency, seconds, type = 'sine', volume = 0.3, slideTo = null, delay = 0) {
  if (!context) return;
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  oscillator.connect(gain).connect(master);
  oscillator.start(start);
  oscillator.stop(start + seconds + 0.02);
}

function noise(seconds, volume = 0.25, cutoff = 3000, delay = 0) {
  if (!context) return;
  const start = context.currentTime + delay;
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = cutoff;
  const gain = context.createGain();
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(master);
  source.start(start);
}

export function playChop() {
  noise(0.05, 0.5, 1800);
  tone(190, 0.06, 'triangle', 0.25, 90);
}

export function playChopped() {
  tone(660, 0.09, 'triangle', 0.25);
  tone(990, 0.14, 'triangle', 0.22, null, 0.08);
}

export function playSizzle() {
  noise(0.7, 0.2, 5200);
}

export function playTake() {
  tone(420, 0.06, 'sine', 0.2, 560);
}

export function playPlate() {
  tone(880, 0.05, 'sine', 0.2);
  noise(0.03, 0.2, 4000);
}

export function playDone() {
  tone(784, 0.12, 'sine', 0.25);
  tone(1047, 0.2, 'sine', 0.25, null, 0.1);
}

export function playBurnt() {
  tone(180, 0.35, 'sawtooth', 0.22, 70);
}

export function playDeny() {
  tone(150, 0.12, 'square', 0.12);
}

export function playPassBell() {
  tone(1568, 0.7, 'sine', 0.3);
  tone(2093, 0.5, 'sine', 0.18, null, 0.02);
  tone(1568, 0.6, 'sine', 0.22, null, 0.22);
}

export function playOrderIn() {
  tone(520, 0.08, 'triangle', 0.2);
  tone(390, 0.12, 'triangle', 0.2, null, 0.09);
}

export function playLostOrder() {
  tone(220, 0.5, 'sawtooth', 0.2, 110);
}

export function playFoghorn() {
  tone(110, 1.4, 'sawtooth', 0.22, 98);
  tone(165, 1.4, 'sine', 0.2, 147);
}

const TUNE = [294, 370, 440, 370, 330, 392, 494, 392, 294, 370, 440, 587, 494, 440, 370, 330];

/** The background tune: a slow figure whose pace follows the rush (0 calm to 1 storm). */
export function startTune(readRush) {
  stopTune();
  let beat = 0;
  const playBeat = () => {
    const rush = readRush();
    const note = TUNE[beat % TUNE.length];
    tone(note / 2, 0.42, 'triangle', 0.1);
    if (beat % 2 === 0) tone(note, 0.3, 'sine', 0.06, null, 0.02);
    if (rush > 0.6 && beat % 4 === 2) noise(0.04, 0.08, 7000);
    beat += 1;
    tuneTimer = setTimeout(playBeat, 460 - rush * 190);
  };
  playBeat();
}

export function stopTune() {
  if (tuneTimer) clearTimeout(tuneTimer);
  tuneTimer = null;
}

const SOUND_FOR_EVENT = {
  chop: playChop, chopped: playChopped, sizzle: playSizzle, take: playTake, place: playTake,
  plate: playPlate, ready: playDone, done: playDone, perfect: playDone, burnt: playBurnt,
  deny: playDeny, serve: playPassBell, order: playOrderIn, lost: playLostOrder, scrap: playTake,
  close: playFoghorn,
};

export function playEventSounds(events) {
  for (const event of events) SOUND_FOR_EVENT[event.type]?.();
}
