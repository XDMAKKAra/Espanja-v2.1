#!/usr/bin/env node
/**
 * capture.mjs — capture real Puheo screens with Playwright.
 *
 * v2: real auth (TEST_PRO_EMAILS / TEST_PRO_PASSWORD / TEST_FREE_EMAILS / TEST_FREE_PASSWORD),
 *     1920×1080 desktop viewport, real writing-feedback recording, paywall capture.
 *
 * Outputs to marketing/preview/public/captures/{mobile,desktop}/
 * Writes manifest.json describing every asset.
 *
 * Resilient: each screen is wrapped in try/catch; failures log + continue.
 *
 * Usage: from repo root, `node marketing/preview/scripts/capture.mjs`
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, stat, access, readdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_ROOT = resolve(__dirname, '..');
const REPO_ROOT = resolve(PREVIEW_ROOT, '..', '..');
const CAPTURES_ROOT = join(PREVIEW_ROOT, 'public', 'captures');
const PORT = 3000;
const ORIGIN = `http://localhost:${PORT}`;

// ─── tiny env parser ───────────────────────────────────────────
async function readEnv() {
  try {
    const raw = await readFile(join(REPO_ROOT, '.env'), 'utf8');
    const out = {};
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return out;
  } catch {
    return {};
  }
}

// ─── port probe / server lifecycle ─────────────────────────────
function probePort(port) {
  return new Promise((res) => {
    const s = net.createConnection({ port, host: '127.0.0.1' }, () => { s.end(); res(true); });
    s.on('error', () => res(false));
    s.setTimeout(800, () => { s.destroy(); res(false); });
  });
}
async function waitForPort(port, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await probePort(port)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}
let serverProc = null;
async function ensureServer() {
  if (await probePort(PORT)) {
    console.log(`[capture] dev server already running on ${PORT}`);
    return false;
  }
  console.log('[capture] starting dev server (npm run dev)…');
  serverProc = spawn('npm', ['run', 'dev'], {
    cwd: REPO_ROOT, shell: true, detached: false,
    stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env },
  });
  serverProc.stdout?.on('data', (d) => process.stdout.write(`[server] ${d}`));
  serverProc.stderr?.on('data', (d) => process.stderr.write(`[server!] ${d}`));
  const ok = await waitForPort(PORT, 30_000);
  if (!ok) throw new Error(`server failed to listen on ${PORT}`);
  console.log('[capture] dev server up');
  return true;
}
function killServer() {
  if (!serverProc) return;
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(serverProc.pid), '/T', '/F'], { shell: true });
    } else { serverProc.kill('SIGTERM'); }
  } catch {}
  serverProc = null;
}
process.on('exit', killServer);
process.on('SIGINT', () => { killServer(); process.exit(130); });
process.on('SIGTERM', () => { killServer(); process.exit(143); });

// ─── ffmpeg ────────────────────────────────────────────────────
function ffmpegAvailable() {
  return new Promise((res) => {
    const p = spawn('ffmpeg', ['-version'], { shell: true });
    p.on('error', () => res(false));
    p.on('exit', (code) => res(code === 0));
  });
}
function convertWebmToMp4(inPath, outPath) {
  return new Promise((res) => {
    const p = spawn('ffmpeg', ['-y', '-i', inPath, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', outPath], { shell: true, stdio: 'ignore' });
    p.on('exit', (code) => res(code === 0));
    p.on('error', () => res(false));
  });
}

// ─── viewports ─────────────────────────────────────────────────
const VIEWPORTS = {
  mobile:  { width: 390,  height: 844,  deviceScaleFactor: 2, isMobile: true,  hasTouch: true,  name: 'mobile'  },
  // v2: 1920×1080 for desktop — was 1440×900
  desktop: { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false, name: 'desktop' },
};

const GATE_INIT = `try { localStorage.setItem('puheo_gate_ok_v1','1'); } catch(e) {}`;
const HIDE_CHROME = `
  *::-webkit-scrollbar { display: none !important; }
  * { scrollbar-width: none !important; }
  html, body { cursor: none !important; }
`;

// ─── login helper ──────────────────────────────────────────────
/**
 * Walks through the actual login form: #auth-email / #auth-password / #btn-auth-submit.
 * Resolves once the auth screen has gone away (i.e. #screen-auth no longer .active)
 * or 8s timeout hits. Logs success/failure but does NOT throw — caller decides what
 * to do with a partial login (we still get *something* in the screenshot either way).
 */
async function loginAs(page, email, password, label) {
  try {
    await page.goto(`${ORIGIN}/app.html#kirjaudu`, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForSelector('#auth-email', { timeout: 6_000 });
    await page.fill('#auth-email', email);
    await page.fill('#auth-password', password);
    await page.click('#btn-auth-submit');
    // Auth resolves async via Supabase; wait for #screen-auth to go inactive,
    // OR for #screen-dashboard / any other authed screen to become active.
    await page.waitForFunction(() => {
      const auth = document.getElementById('screen-auth');
      if (!auth) return true;
      return !auth.classList.contains('active');
    }, { timeout: 12_000 });
    console.log(`  [auth] ✓ logged in as ${label} (${email})`);
    return true;
  } catch (e) {
    console.warn(`  [auth] ✗ login as ${label} (${email}): ${e.message}`);
    return false;
  }
}

// ─── stub overlay (only if real screen failed to render) ───────
const POLISH_STUB = ({ id, screen }) => `
  (function () {
    const FAFAFA='#fafafa', ACCENT='#2DD4BF', BG='#0a0a0a', ELEV='#141414', MUTED='#a1a1aa';
    function injectOverlay(content) {
      const root = document.createElement('div');
      root.id = '__capture_overlay__';
      root.style.cssText = [
        'position:fixed','inset:0','z-index:2147483646',
        'display:flex','align-items:center','justify-content:center',
        'flex-direction:column','padding:32px 24px','gap:20px',
        'background:radial-gradient(ellipse at top, #1a1a2e 0%, ' + BG + ' 60%)',
        'color:' + FAFAFA, 'font-family:Geist, Inter, system-ui, sans-serif',
        'text-align:center','box-sizing:border-box'
      ].join(';') + ';';
      root.innerHTML = content;
      document.documentElement.appendChild(root);
    }
    function ready() {
      const auth = document.getElementById('screen-auth');
      const looksAuthLocked = auth && auth.classList.contains('active');
      const screen = ${JSON.stringify(screen)};
      const targetMap = {
        'vocab':'screen-mode-vocab','vocab-success':'screen-exercise',
        'grammar':'screen-mode-grammar','reading':'screen-mode-reading',
        'writing':'screen-mode-writing','writing-feedback':'screen-results',
        'dashboard':'screen-dashboard'
      };
      const wantId = targetMap[screen];
      if (wantId) {
        const el = document.getElementById(wantId);
        if (el && el.classList.contains('active')) return; // real screen rendered
      }
      if (!looksAuthLocked && !wantId) return;

      const stubs = {
        'vocab':
          '<p style="color:'+ACCENT+';font-family:ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;font-size:13px;margin:0">Sanasto · 12/20</p>'
          + '<h1 style="font-size:42px;margin:8px 0 0;font-weight:700;letter-spacing:-.02em">¿Qué significa <em style="color:'+ACCENT+';font-style:normal">«el estrés»</em>?</h1>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:32px;width:min(560px,90vw)">'
          + '<div style="padding:18px 20px;border-radius:14px;background:'+ELEV+';border:1px solid rgba(255,255,255,.06);font-size:18px">stressi</div>'
          + '<div style="padding:18px 20px;border-radius:14px;background:'+ELEV+';border:1px solid rgba(255,255,255,.06);font-size:18px">väsymys</div>'
          + '<div style="padding:18px 20px;border-radius:14px;background:'+ELEV+';border:1px solid rgba(255,255,255,.06);font-size:18px">onnellisuus</div>'
          + '<div style="padding:18px 20px;border-radius:14px;background:'+ELEV+';border:1px solid rgba(255,255,255,.06);font-size:18px">rohkeus</div>'
          + '</div>',
        'vocab-success':
          '<p style="color:'+ACCENT+';font-family:ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;font-size:13px;margin:0">Sanasto · 13/20</p>'
          + '<h1 style="font-size:42px;margin:8px 0 0;font-weight:700;letter-spacing:-.02em">¿Qué significa <em style="color:'+ACCENT+';font-style:normal">«el estrés»</em>?</h1>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:32px;width:min(560px,90vw)">'
          + '<div style="padding:18px 20px;border-radius:14px;background:rgba(45,212,191,.16);border:2px solid '+ACCENT+';color:#fff;font-size:18px;font-weight:600">stressi ✓</div>'
          + '<div style="padding:18px 20px;border-radius:14px;background:'+ELEV+';border:1px solid rgba(255,255,255,.06);font-size:18px;opacity:.5">väsymys</div>'
          + '<div style="padding:18px 20px;border-radius:14px;background:'+ELEV+';border:1px solid rgba(255,255,255,.06);font-size:18px;opacity:.5">onnellisuus</div>'
          + '<div style="padding:18px 20px;border-radius:14px;background:'+ELEV+';border:1px solid rgba(255,255,255,.06);font-size:18px;opacity:.5">rohkeus</div>'
          + '</div>'
          + '<div style="margin-top:24px;color:'+ACCENT+';font-weight:700;font-size:24px">+10 XP</div>',
        'grammar':
          '<p style="color:'+ACCENT+';font-family:ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;font-size:13px;margin:0">Kielioppi · preteriti</p>'
          + '<h1 style="font-size:38px;margin:8px 0 0;font-weight:700;letter-spacing:-.02em;line-height:1.2;max-width:600px">Ayer nosotros <span style="color:'+ACCENT+';border-bottom:2px dashed '+ACCENT+'">______</span> al cine.</h1>'
          + '<div style="display:flex;gap:12px;margin-top:32px;flex-wrap:wrap;justify-content:center">'
          + '<span style="padding:14px 22px;border-radius:999px;background:rgba(45,212,191,.16);border:1px solid '+ACCENT+';font-weight:600">fuimos</span>'
          + '<span style="padding:14px 22px;border-radius:999px;background:'+ELEV+';border:1px solid rgba(255,255,255,.06)">íbamos</span>'
          + '<span style="padding:14px 22px;border-radius:999px;background:'+ELEV+';border:1px solid rgba(255,255,255,.06)">vamos</span>'
          + '</div>',
        'reading':
          '<p style="color:'+ACCENT+';font-family:ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;font-size:13px;margin:0">Luetun ymmärtäminen · YO-taso</p>'
          + '<div style="max-width:640px;text-align:left;background:'+ELEV+';padding:28px 32px;border-radius:18px;border:1px solid rgba(255,255,255,.06);margin-top:14px">'
          + '<h2 style="margin:0 0 14px;font-size:24px">El viaje de Marta a Madrid</h2>'
          + '<p style="color:'+MUTED+';line-height:1.6;font-size:17px;margin:0">El verano pasado, Marta y su familia decidieron visitar la capital española. Llegaron en tren al amanecer y caminaron por la Gran Vía…</p>'
          + '</div>',
        'writing':
          '<p style="color:'+ACCENT+';font-family:ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;font-size:13px;margin:0">Kirjoitus · sähköposti ystävälle</p>'
          + '<div style="max-width:560px;width:90vw;background:'+ELEV+';padding:24px 28px;border-radius:16px;border:1px solid rgba(255,255,255,.06);margin-top:14px;text-align:left">'
          + '<p style="color:'+MUTED+';font-size:13px;margin:0 0 12px">160–240 merkkiä</p>'
          + '<p style="margin:0;line-height:1.6;font-size:17px">Hola Marta,<br><br>Estoy escribiendo para invitarte a mi cumpleaños. Va a ser el viernes próximo en mi casa.<span style="display:inline-block;width:8px;height:20px;background:'+ACCENT+';margin-left:2px;vertical-align:middle"></span></p>'
          + '</div>',
        'writing-feedback':
          '<p style="color:'+ACCENT+';font-family:ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;font-size:13px;margin:0">YTL-arviointi</p>'
          + '<div style="max-width:600px;width:90vw;background:'+ELEV+';padding:24px 28px;border-radius:16px;border:1px solid rgba(255,255,255,.06);margin-top:14px;text-align:left">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><span style="color:'+MUTED+';font-size:13px">Sähköposti ystävälle</span><span style="background:'+ACCENT+';color:#0a0a0a;padding:6px 12px;border-radius:999px;font-weight:700;font-size:14px">YTL · 13/20</span></div>'
          + '<p style="margin:0;line-height:1.7;font-size:16px">Hola Marta,<br><br>Estoy escribiendo para invitarte… Espero que <span style="background:rgba(255,196,0,.25);border-bottom:2px solid #FFC400">vengas</span> con tu hermano.</p>'
          + '<div style="margin-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px"><span>Viestinnällisyys <strong style="color:'+ACCENT+'">4/5</strong></span><span>Rakenteet <strong style="color:'+ACCENT+'">2/5</strong></span><span>Sanasto <strong style="color:'+ACCENT+'">4/5</strong></span><span>Kokonaisuus <strong style="color:'+ACCENT+'">3/5</strong></span></div>'
          + '</div>',
        'dashboard':
          '<p style="color:'+ACCENT+';font-family:ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;font-size:13px;margin:0">Hyvää iltaa, Marcel</p>'
          + '<h1 style="font-size:38px;margin:8px 0 0;font-weight:700;letter-spacing:-.02em">Tänään: 10 min harjoitus</h1>'
          + '<div style="display:flex;gap:14px;margin-top:24px"><span style="padding:14px 22px;border-radius:999px;background:rgba(45,212,191,.16);border:1px solid '+ACCENT+';font-weight:600">🔥 23 pv putki</span>'
          + '<span style="padding:14px 22px;border-radius:999px;background:'+ELEV+';border:1px solid rgba(255,255,255,.06)">YO-valmius 64%</span></div>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:24px;width:min(560px,90vw)">'
          + '<div style="padding:22px 20px;border-radius:14px;background:'+ELEV+';border:1px solid rgba(255,255,255,.06);text-align:left"><p style="margin:0;color:'+MUTED+';font-size:13px">Sanasto</p><p style="margin:6px 0 0;font-size:24px;font-weight:700">120/2000</p></div>'
          + '<div style="padding:22px 20px;border-radius:14px;background:'+ELEV+';border:1px solid rgba(255,255,255,.06);text-align:left"><p style="margin:0;color:'+MUTED+';font-size:13px">Tavoite</p><p style="margin:6px 0 0;font-size:24px;font-weight:700">C → M</p></div>'
          + '</div>',
        'paywall':
          '<p style="color:'+ACCENT+';font-family:ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;font-size:13px;margin:0">Puheo Pro</p>'
          + '<h1 style="font-size:38px;margin:8px 0 0;font-weight:700;letter-spacing:-.02em;max-width:540px">Avaa kaikki YO-aiheet ja AI-palaute.</h1>'
          + '<div style="margin-top:24px;display:flex;gap:14px;flex-wrap:wrap;justify-content:center">'
          + '<span style="padding:14px 22px;border-radius:999px;background:rgba(45,212,191,.16);border:1px solid '+ACCENT+';font-weight:600">8,90 €/kk</span>'
          + '</div>'
      };
      const html = stubs[screen];
      if (html) injectOverlay(html);
    }
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(ready, 250);
    } else {
      window.addEventListener('DOMContentLoaded', () => setTimeout(ready, 250));
    }
  })();
`;

// ─── targets ──────────────────────────────────────────────────
// Public (no-auth) screens — always reachable.
const PUBLIC_SCREENS = [
  { id: 'landing', screen: 'landing', url: '/', wait: 700, public: true },
  { id: 'auth',    screen: 'auth',    url: '/app.html#kirjaudu', wait: 700, public: true },
];
// Authed screens — require login. Captured per-account.
const AUTHED_SCREENS = [
  { id: 'vocab-question',   screen: 'vocab',            url: '/app.html#mode-vocab',   wait: 1500 },
  { id: 'vocab-success',    screen: 'vocab-success',    url: '/app.html#mode-vocab',   wait: 1700 },
  { id: 'grammar',          screen: 'grammar',          url: '/app.html#mode-grammar', wait: 1500 },
  { id: 'reading',          screen: 'reading',          url: '/app.html#mode-reading', wait: 1500 },
  { id: 'writing-input',    screen: 'writing',          url: '/app.html#mode-writing', wait: 1500 },
  { id: 'dashboard',        screen: 'dashboard',        url: '/app.html#dashboard',    wait: 1500 },
];

// ─── core capture loop ────────────────────────────────────────
async function snapScreen(ctx, target, vp) {
  const outDir = join(CAPTURES_ROOT, vp.name);
  const outPath = join(outDir, `${target.id}.png`);
  const page = await ctx.newPage();
  try {
    await page.addInitScript(GATE_INIT);
    await page.addInitScript(POLISH_STUB(target));
    const url = ORIGIN + target.url;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.addStyleTag({ content: HIDE_CHROME }).catch(() => {});
    try { await page.waitForLoadState('networkidle', { timeout: 8_000 }); } catch {}
    await page.evaluate(() => (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve()).catch(() => {});
    await page.waitForTimeout(target.wait || 600);
    await page.screenshot({ path: outPath, fullPage: false });
    const st = await stat(outPath);
    return { ok: true, bytes: st.size, path: `captures/${vp.name}/${target.id}.png` };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    await page.close().catch(() => {});
  }
}

// ─── main ─────────────────────────────────────────────────────
async function main() {
  await mkdir(join(CAPTURES_ROOT, 'mobile'), { recursive: true });
  await mkdir(join(CAPTURES_ROOT, 'desktop'), { recursive: true });

  const env = await readEnv();
  const PRO_EMAIL    = env.TEST_PRO_EMAILS?.split(',')[0]?.trim();
  const PRO_PASSWORD = env.TEST_PRO_PASSWORD;
  const FREE_EMAIL   = env.TEST_FREE_EMAILS?.split(',')[0]?.trim();
  const FREE_PASSWORD= env.TEST_FREE_PASSWORD;

  if (!PRO_EMAIL || !PRO_PASSWORD) {
    console.error('[capture] FATAL: TEST_PRO_EMAILS or TEST_PRO_PASSWORD missing from .env');
    process.exit(2);
  }
  if (!FREE_EMAIL || !FREE_PASSWORD) {
    console.warn('[capture] WARN: TEST_FREE_EMAILS / TEST_FREE_PASSWORD missing — paywall capture will be skipped');
  }

  const startedServer = await ensureServer();

  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { ({ chromium } = await import(resolve(REPO_ROOT, 'node_modules', 'playwright', 'index.js'))); }

  const manifest = { generatedAt: new Date().toISOString(), assets: [], audioAvailable: false };
  try { await access(join(PREVIEW_ROOT, 'public', 'audio', 'bed.mp3')); manifest.audioAvailable = true; } catch {}

  const hasFfmpeg = await ffmpegAvailable();
  if (!hasFfmpeg) console.log('[capture] ffmpeg not found on PATH — webm clips kept as-is');

  const browser = await chromium.launch({ headless: true });

  for (const vp of Object.values(VIEWPORTS)) {
    console.log(`\n[capture] ── viewport ${vp.name} (${vp.width}×${vp.height}) ──`);

    // PRO context — captures all authed screens
    const proCtx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor,
      isMobile: vp.isMobile, hasTouch: vp.hasTouch,
      colorScheme: 'dark', locale: 'fi-FI',
    });
    await proCtx.addInitScript(GATE_INIT);

    // Public screens
    for (const target of PUBLIC_SCREENS) {
      const r = await snapScreen(proCtx, target, vp);
      if (r.ok) {
        manifest.assets.push({ id: target.id, path: r.path, viewport: vp.name, type: 'image', screen: target.screen, bytes: r.bytes });
        console.log(`  ✓ ${target.id} (${(r.bytes/1024).toFixed(1)} KB)`);
      } else {
        console.warn(`  ✗ ${target.id}: ${r.error}`);
      }
    }

    // Login as Pro on a single page, then visit authed screens via that
    // session. Each subsequent page in the same context inherits cookies.
    const loginPage = await proCtx.newPage();
    await loginPage.addInitScript(GATE_INIT);
    const proOk = await loginAs(loginPage, PRO_EMAIL, PRO_PASSWORD, 'PRO');
    await loginPage.close();

    if (proOk) {
      for (const target of AUTHED_SCREENS) {
        const r = await snapScreen(proCtx, target, vp);
        if (r.ok) {
          manifest.assets.push({ id: target.id, path: r.path, viewport: vp.name, type: 'image', screen: target.screen, bytes: r.bytes });
          console.log(`  ✓ ${target.id} (${(r.bytes/1024).toFixed(1)} KB)`);
        } else {
          console.warn(`  ✗ ${target.id}: ${r.error}`);
        }
      }
    } else {
      console.warn('  [auth] PRO login failed — authed screens fall back to stub overlay');
      for (const target of AUTHED_SCREENS) {
        const r = await snapScreen(proCtx, target, vp);
        if (r.ok) {
          manifest.assets.push({ id: target.id, path: r.path, viewport: vp.name, type: 'image', screen: target.screen, bytes: r.bytes });
          console.log(`  ✓ ${target.id} (stub, ${(r.bytes/1024).toFixed(1)} KB)`);
        }
      }
    }

    await proCtx.close();

    // FREE context — captures paywall / upgrade prompt
    if (FREE_EMAIL && FREE_PASSWORD) {
      const freeCtx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.deviceScaleFactor,
        isMobile: vp.isMobile, hasTouch: vp.hasTouch,
        colorScheme: 'dark', locale: 'fi-FI',
      });
      await freeCtx.addInitScript(GATE_INIT);
      const freePage = await freeCtx.newPage();
      await freePage.addInitScript(GATE_INIT);
      const freeOk = await loginAs(freePage, FREE_EMAIL, FREE_PASSWORD, 'FREE');
      await freePage.close();
      if (freeOk) {
        // The paywall typically surfaces on settings or when starting an unlocked
        // mode. Capture both attempts.
        const paywallTarget = { id: 'paywall', screen: 'paywall', url: '/app.html#asetukset', wait: 1400 };
        const r = await snapScreen(freeCtx, paywallTarget, vp);
        if (r.ok) {
          manifest.assets.push({ id: paywallTarget.id, path: r.path, viewport: vp.name, type: 'image', screen: paywallTarget.screen, bytes: r.bytes });
          console.log(`  ✓ paywall (${(r.bytes/1024).toFixed(1)} KB)`);
        }
      }
      await freeCtx.close();
    }
  }

  // ─── recorded videos for hero interactions ────────────────────
  // The writing-feedback clip is the hero shot. We type a *real* short Spanish
  // answer, submit, and record video of the AI feedback rendering.
  console.log('\n[capture] ── recorded clips (mobile + desktop) ──');

  const RECORDINGS = [
    // (mobile) vocab success — dwell on the success state
    { id: 'vocab-success-clip',     vp: 'mobile',  size: { width: 780, height: 1688 },  url: '/app.html#mode-vocab',   durationMs: 2200, screen: 'vocab',          requiresAuth: true,  interactions: 'none' },
    // (mobile) writing AI grade — hero. Types Spanish, submits, captures feedback.
    { id: 'writing-feedback-clip', vp: 'mobile',  size: { width: 780, height: 1688 },  url: '/app.html#mode-writing', durationMs: 9000, screen: 'writing-feedback', requiresAuth: true,  interactions: 'writing' },
    // (mobile) dashboard idle — for streak panning
    { id: 'dashboard-clip',         vp: 'mobile',  size: { width: 780, height: 1688 },  url: '/app.html#dashboard',    durationMs: 2500, screen: 'dashboard',       requiresAuth: true,  interactions: 'none' },
    // (desktop) writing AI grade — hero again, in browser frame
    { id: 'writing-feedback-desktop-clip', vp: 'desktop', size: { width: 1920, height: 1080 }, url: '/app.html#mode-writing', durationMs: 9000, screen: 'writing-feedback', requiresAuth: true, interactions: 'writing' },
    // (desktop) dashboard scroll — for parallax
    { id: 'dashboard-desktop-clip', vp: 'desktop', size: { width: 1920, height: 1080 }, url: '/app.html#dashboard',    durationMs: 3500, screen: 'dashboard',       requiresAuth: true,  interactions: 'scroll' },
    // (desktop) landing scroll
    { id: 'landing-desktop-clip',   vp: 'desktop', size: { width: 1920, height: 1080 }, url: '/',                       durationMs: 3500, screen: 'landing',         requiresAuth: false, interactions: 'scroll' },
  ];

  for (const rec of RECORDINGS) {
    const tmpDir = join(CAPTURES_ROOT, rec.vp, '_videos');
    await mkdir(tmpDir, { recursive: true });
    const ctx = await browser.newContext({
      viewport: { width: rec.vp === 'mobile' ? 390 : 1920, height: rec.vp === 'mobile' ? 844 : 1080 },
      deviceScaleFactor: rec.vp === 'mobile' ? 2 : 1,
      isMobile: rec.vp === 'mobile',
      hasTouch: rec.vp === 'mobile',
      recordVideo: { dir: tmpDir, size: rec.size },
      colorScheme: 'dark', locale: 'fi-FI',
    });
    await ctx.addInitScript(GATE_INIT);

    let page;
    try {
      // Login first if required (separate page within the same context)
      if (rec.requiresAuth) {
        const loginPage = await ctx.newPage();
        await loginPage.addInitScript(GATE_INIT);
        await loginAs(loginPage, PRO_EMAIL, PRO_PASSWORD, 'PRO/clip');
        await loginPage.close();
      }

      page = await ctx.newPage();
      await page.addInitScript(GATE_INIT);
      await page.addInitScript(POLISH_STUB({ id: rec.id, screen: rec.screen }));
      await page.goto(ORIGIN + rec.url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.addStyleTag({ content: HIDE_CHROME }).catch(() => {});
      try { await page.waitForLoadState('networkidle', { timeout: 6_000 }); } catch {}

      if (rec.interactions === 'writing') {
        // Try to find the writing input and type a real short Spanish answer.
        // Selector candidates — covers a few likely shapes.
        const writingSelectors = [
          'textarea#writing-input', 'textarea.writing-input',
          'textarea[name="writing"]', '#screen-mode-writing textarea',
          'textarea',
        ];
        let typed = false;
        for (const sel of writingSelectors) {
          try {
            const el = await page.$(sel);
            if (!el) continue;
            await el.click();
            await page.keyboard.type(
              'Hola Marta,\n\nEstoy escribiendo para invitarte a mi cumpleaños. Va a ser el viernes próximo en mi casa. Mi madre cocina mucha comida y tendremos también música. Espero que vengas con tu hermano.',
              { delay: 35 }
            );
            typed = true;
            break;
          } catch {}
        }
        if (typed) {
          // Find a submit button — try a few likely labels
          const submitSelectors = [
            'button#writing-submit', 'button.writing-submit',
            '#screen-mode-writing button[type="submit"]',
            '#screen-mode-writing button:has-text("Lähetä")',
            'button:has-text("Lähetä arvioitavaksi")',
            'button:has-text("Arvioi")',
          ];
          for (const sel of submitSelectors) {
            try { const b = await page.$(sel); if (b) { await b.click(); break; } } catch {}
          }
          // Wait up to 7s for the feedback screen
          try {
            await page.waitForFunction(() => {
              const r = document.getElementById('screen-results');
              return r && r.classList.contains('active');
            }, { timeout: 7000 });
          } catch {}
        }
      } else if (rec.interactions === 'scroll') {
        // Smooth scroll partway down then back, gentle parallax
        await page.evaluate(() => {
          const total = document.documentElement.scrollHeight;
          const target = Math.min(total, window.innerHeight * 1.2);
          let cur = 0;
          const step = target / 60;
          const i = setInterval(() => {
            cur += step;
            window.scrollTo({ top: cur, behavior: 'instant' });
            if (cur >= target) clearInterval(i);
          }, 50);
        });
      }

      await page.waitForTimeout(rec.durationMs);
      await page.close();
      await ctx.close();

      const entries = await readdir(tmpDir);
      const webms = entries.filter((e) => e.endsWith('.webm')).map((e) => join(tmpDir, e));
      if (webms.length === 0) throw new Error('no webm produced');
      let newest = webms[0]; let newestT = 0;
      for (const w of webms) { const s = await stat(w); if (s.mtimeMs > newestT) { newestT = s.mtimeMs; newest = w; } }
      const finalRel = `captures/${rec.vp}/${rec.id}`;
      let finalPath = newest, finalExt = 'webm';
      if (hasFfmpeg) {
        const mp4 = join(CAPTURES_ROOT, rec.vp, `${rec.id}.mp4`);
        if (await convertWebmToMp4(newest, mp4)) { finalPath = mp4; finalExt = 'mp4'; }
      }
      const st = await stat(finalPath);
      manifest.assets.push({
        id: rec.id, path: `${finalRel}.${finalExt}`,
        viewport: rec.vp, type: 'video', screen: rec.screen, bytes: st.size,
      });
      if (finalExt === 'webm') {
        const target = join(CAPTURES_ROOT, rec.vp, `${rec.id}.webm`);
        if (target !== finalPath) {
          const buf = await readFile(finalPath);
          await writeFile(target, buf);
        }
      }
      console.log(`  ✓ ${rec.id}.${finalExt} (${(st.size/1024).toFixed(1)} KB)`);
    } catch (e) {
      console.warn(`  ✗ ${rec.id}: ${e.message}`);
      try { await page?.close(); } catch {}
      try { await ctx.close(); } catch {}
    }
  }

  await browser.close();
  await writeFile(join(CAPTURES_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n[capture] manifest written → ${manifest.assets.length} assets`);

  if (startedServer) killServer();
}

main().catch((e) => {
  console.error('[capture] FATAL:', e);
  killServer();
  process.exit(1);
});
