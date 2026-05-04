#!/usr/bin/env node
/**
 * analyze-audio.mjs — extract beat timestamps from public/audio/bed.mp3.
 *
 * Tries (in order):
 *   1. ffmpeg + onset detection via ebur128/silencedetect heuristic
 *   2. Fallback: tempo-grid generated from a manually specified BPM
 *
 * Outputs: marketing/preview/public/audio/beats.json
 *   { bpm: number, beats: number[], source: 'ffmpeg'|'fallback', durationSec: number }
 *
 * Designed to be tolerant: never fails the build. Reports clearly so you know
 * which path it took and whether the result is trustworthy.
 *
 * Usage: from repo root, `node marketing/preview/scripts/analyze-audio.mjs`
 *        Optional: `--bpm 120` to force a fallback grid.
 */
import { spawn } from 'node:child_process';
import { writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_ROOT = resolve(__dirname, '..');
const AUDIO_PATH = resolve(PREVIEW_ROOT, 'public', 'audio', 'bed.mp3');
const BEATS_PATH = resolve(PREVIEW_ROOT, 'public', 'audio', 'beats.json');

const argv = process.argv.slice(2);
const forceBpmIdx = argv.indexOf('--bpm');
const FORCED_BPM = forceBpmIdx >= 0 ? Number(argv[forceBpmIdx + 1]) : null;

function ffmpegAvailable() {
  return new Promise((res) => {
    const p = spawn('ffmpeg', ['-version'], { shell: true });
    p.on('error', () => res(false));
    p.on('exit', (code) => res(code === 0));
  });
}

function ffprobeDuration(path) {
  return new Promise((res) => {
    const p = spawn('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', path], { shell: true });
    let out = '';
    p.stdout?.on('data', (d) => { out += d.toString(); });
    p.on('exit', () => {
      const v = parseFloat(out.trim());
      res(Number.isFinite(v) ? v : null);
    });
    p.on('error', () => res(null));
  });
}

/**
 * Use ffmpeg's astats to detect onsets via RMS-energy spikes.
 * This is a heuristic; for serious beat-tracking, prefer aubio.
 * We sample RMS at 100 Hz, find peaks above 1.6× rolling mean, then dedupe
 * to a min interval based on the implied tempo.
 */
function ffmpegRmsCurve(path) {
  return new Promise((res) => {
    // ffmpeg astats with metric_period=10 (10ms windows), no audio output
    const p = spawn('ffmpeg', [
      '-hide_banner', '-loglevel', 'info',
      '-i', path,
      '-af', 'astats=metadata=1:reset=0.01,ametadata=print:key=lavfi.astats.Overall.RMS_level',
      '-f', 'null', '-',
    ], { shell: true });
    let buf = '';
    p.stderr?.on('data', (d) => { buf += d.toString(); });
    p.stdout?.on('data', (d) => { buf += d.toString(); });
    p.on('exit', () => {
      // Lines look like: lavfi.astats.Overall.RMS_level=-23.456
      // Combined with: pts_time:0.01
      const samples = [];
      let curT = 0;
      const re = /pts_time:([0-9.]+).*?RMS_level=(-?[0-9.inf]+)/gs;
      let m;
      while ((m = re.exec(buf)) !== null) {
        const t = parseFloat(m[1]);
        const v = parseFloat(m[2]);
        if (Number.isFinite(t) && Number.isFinite(v)) samples.push({ t, v });
      }
      res(samples);
    });
    p.on('error', () => res([]));
  });
}

function detectBeats(samples) {
  if (!samples.length) return null;
  // Convert dB to linear-ish energy for peak detection
  const energy = samples.map((s) => Math.pow(10, s.v / 20));
  // Rolling mean over ~0.5s (50 samples)
  const window = 50;
  const peaks = [];
  for (let i = window; i < energy.length - 1; i++) {
    let sum = 0;
    for (let j = i - window; j < i; j++) sum += energy[j];
    const mean = sum / window;
    if (energy[i] > mean * 1.6 && energy[i] > energy[i - 1] && energy[i] >= energy[i + 1]) {
      peaks.push(samples[i].t);
    }
  }
  if (peaks.length < 8) return null;
  // Dedupe peaks closer than 250ms (240 BPM upper bound)
  const cleaned = [];
  for (const t of peaks) {
    if (!cleaned.length || t - cleaned[cleaned.length - 1] > 0.25) cleaned.push(t);
  }
  // Estimate BPM from median inter-peak interval
  const ivs = [];
  for (let i = 1; i < cleaned.length; i++) ivs.push(cleaned[i] - cleaned[i - 1]);
  ivs.sort((a, b) => a - b);
  const median = ivs[Math.floor(ivs.length / 2)] || 0.5;
  const bpm = Math.round(60 / median);
  return { bpm, beats: cleaned };
}

function fallbackGrid(durationSec, bpm) {
  const interval = 60 / bpm;
  const beats = [];
  for (let t = 0; t < durationSec; t += interval) beats.push(Number(t.toFixed(3)));
  return { bpm, beats };
}

async function main() {
  try {
    await access(AUDIO_PATH);
  } catch {
    console.log(`[analyze-audio] no audio at ${AUDIO_PATH} — skipping. Drop bed.mp3 first.`);
    return;
  }

  const hasFfmpeg = await ffmpegAvailable();
  const duration = hasFfmpeg ? await ffprobeDuration(AUDIO_PATH) : null;

  let result = null;
  let source = 'fallback';

  if (FORCED_BPM && Number.isFinite(FORCED_BPM)) {
    console.log(`[analyze-audio] using forced BPM=${FORCED_BPM}`);
    result = fallbackGrid(duration ?? 30, FORCED_BPM);
    source = 'fallback-forced';
  } else if (hasFfmpeg) {
    console.log('[analyze-audio] running ffmpeg RMS analysis…');
    const samples = await ffmpegRmsCurve(AUDIO_PATH);
    const detected = detectBeats(samples);
    if (detected) {
      result = detected;
      source = 'ffmpeg';
      console.log(`[analyze-audio] detected BPM=${result.bpm} (${result.beats.length} beats)`);
    } else {
      console.warn('[analyze-audio] detection inconclusive — falling back to 120 BPM grid');
      result = fallbackGrid(duration ?? 30, 120);
      source = 'fallback-auto';
    }
  } else {
    console.warn('[analyze-audio] ffmpeg not on PATH — falling back to 120 BPM grid');
    result = fallbackGrid(duration ?? 30, 120);
    source = 'fallback-no-ffmpeg';
  }

  const out = {
    bpm: result.bpm,
    beats: result.beats,
    source,
    durationSec: duration ?? null,
    generatedAt: new Date().toISOString(),
  };
  await writeFile(BEATS_PATH, JSON.stringify(out, null, 2));
  console.log(`[analyze-audio] wrote ${BEATS_PATH} (source=${source}, ${result.beats.length} beats)`);
}

main().catch((e) => {
  console.error('[analyze-audio] FATAL:', e);
  process.exit(1);
});
