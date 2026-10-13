// Optional local QA. This script uses a separate headless Chrome profile.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, init, save, plan, select, sample, directions, readJSON, styles, json } from '../src/engine.js';
import { symbolSVG } from '../src/geometry.js';

const executable = process.env.VIRAX_CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find(existsSync);
if (!executable) throw Error('Set VIRAX_CHROME to a Chromium browser executable.');
const qaDir = join(root, '.data/qa');
mkdirSync(qaDir, { recursive: true });
const browser = spawn(executable, ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${join(qaDir, `browser-${Date.now()}`)}`], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    let text = '';
    const timer = setTimeout(() => reject(Error('Browser start timed out.')), 15000);
    browser.stderr.on('data', data => {
      text += data;
      const match = text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    browser.once('error', reject);
  });
  const origin = endpoint.replace(/^ws:/, 'http:').split('/devtools/')[0];
  const target = await (await fetch(`${origin}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let serial = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    const callback = pending.get(data.id);
    if (!callback) return;
    pending.delete(data.id);
    if (data.error) callback.reject(Error(data.error.message)); else callback.resolve(data.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
    return result.result.value;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  let profile = init('Fieldwork Coffee');
  profile = save(profile.id, readJSON(join(root, 'examples/fieldwork-answers.json')));
  profile = plan(profile.id, { ...readJSON(join(root, 'examples/coffee-design-plan.json')), expectedVersion: profile.version });
  const board = directions(profile.id);
  profile = select(profile.id, { expectedVersion: profile.version, styleId: 'editorial', reason: 'The fictional cafe needs warm colors and clear type.' });
  const draft = sample(profile.id, profile.version);
  const report = { date: '2026-10-13', fictionalBrandId: profile.id, pages: [], symmetry: [], limits: ['These checks apply to the starter symbols and fictional example.', 'No vector editor, outlined wordmark, print proof, or real owner approval exists.'] };
  for (const [name, path] of [['directions', board.path], ['sample', draft.path]]) {
    for (const width of [1440, 390]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: pathToFileURL(path).href });
      const result = await evaluate(`new Promise(resolve => {
        const check = async () => {
          if (document.readyState !== 'complete') { setTimeout(check, 50); return; }
          await document.fonts.ready;
          await Promise.all(Array.from(document.images, image => image.decode().catch(() => null)));
          resolve({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, fonts: Array.from(document.fonts, font => ({ family: font.family, status: font.status })), images: Array.from(document.images, image => ({ loaded: image.complete && image.naturalWidth > 0 })), cardCount: document.querySelectorAll('.card').length });
        }; check();
      })`);
      if (result.scrollWidth > width) throw Error(`Horizontal overflow: ${name} at ${width}`);
      if (result.fonts.some(font => font.status !== 'loaded') || result.images.some(image => !image.loaded)) throw Error(`An asset did not load: ${name}`);
      const metrics = await send('Page.getLayoutMetrics');
      const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.ceil(metrics.cssContentSize.height), scale: 1 } });
      const screenshotPath = join(qaDir, `${name}-${width}.png`);
      writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
      if (width === 390) {
        for (let y = 0; y < metrics.cssContentSize.height; y += 900) {
          const part = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y, width, height: Math.min(900, Math.ceil(metrics.cssContentSize.height) - y), scale: 1 } });
          writeFileSync(join(qaDir, `${name}-390-part-${y / 900 + 1}.png`), Buffer.from(part.data, 'base64'));
        }
      }
      report.pages.push({ name, ...result, screenshot: screenshotPath });
    }
  }
  for (const style of styles) {
    const svg = symbolSVG(style, { custom: profile.designPlan.concepts.find(concept => concept.styleId === style.id).customSymbol });
    const result = await evaluate(`(async () => {
      const image = new Image();
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(${JSON.stringify(svg)});
      await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0, 512, 512);
      const pixels = context.getImageData(0, 0, 512, 512).data;
      let differences = 0, maximum = 0, binaryDifferences = 0, opaqueDifferences = 0;
      for (let y = 0; y < 512; y++) for (let x = 0; x < 256; x++) {
        const left = pixels[(y*512+x)*4+3], right = pixels[(y*512+511-x)*4+3];
        const delta = Math.abs(left - right);
        if ((left >= 128) !== (right >= 128)) binaryDifferences++;
        if ((left === 255 && right === 0) || (right === 255 && left === 0)) opaqueDifferences++;
        if (delta > 20) differences++; maximum = Math.max(maximum, delta);
      }
      return { differences, maximum, binaryDifferences, opaqueDifferences, checkedPairs: 512*256 };
    })()`);
    if (result.opaqueDifferences !== 0 || result.binaryDifferences / result.checkedPairs > .001) throw Error(`The vertical mirror check failed: ${style.id}. ${JSON.stringify(result)}`);
    report.symmetry.push({ style: style.id, axis: 'vertical', tolerance: 'No opaque/transparent mismatch. At most 0.1 percent of binary alpha pairs differ. Edge alpha can vary.', ...result });
  }
  json(join(qaDir, 'browser-report.json'), report);
  process.stdout.write(`${JSON.stringify({ ok: true, report: join(qaDir, 'browser-report.json'), pages: report.pages.length, symmetryChecks: report.symmetry.length, sample: draft.path, directions: board.path }, null, 2)}\n`);
  await fetch(`${origin}/json/close/${target.id}`);
} finally {
  socket?.close();
  browser.kill();
}
