// Sends an ExtendScript file to the live AE CEP panel via DevTools (port 7742)
// and prints the string result. Usage: node run-es.mjs <path-to-jsx>
import http from 'node:http';
import fs from 'node:fs';
import WebSocket from 'ws';

const esPath = process.argv[2];
if (!esPath) { console.error('usage: node run-es.mjs <file.jsx>'); process.exit(1); }
const es = fs.readFileSync(esPath, 'utf8');

const getJSON = (url) => new Promise((resolve, reject) => {
  http.get(url, (res) => { let d = ''; res.on('data', (c) => (d += c)); res.on('end', () => resolve(JSON.parse(d))); }).on('error', reject);
});

const wrap = (code) =>
  `new Promise(function(resolve){ try { var cs = new CSInterface(); cs.evalScript(${JSON.stringify(code)}, function(r){ resolve(String(r)); }); } catch(e){ resolve('WRAP_ERR:'+e); } })`;

const targets = await getJSON('http://127.0.0.1:7742/json/list');
const page = targets.find((t) => t.url && t.url.indexOf('cep-panel.html') !== -1) || targets[0];
const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
let id = 0; const pending = new Map();
const send = (method, params) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.on('message', (raw) => { const m = JSON.parse(raw.toString()); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
ws.on('open', async () => {
  await send('Runtime.enable', {});
  const r = await send('Runtime.evaluate', { expression: wrap(es), awaitPromise: true, returnByValue: true });
  if (r.result && r.result.exceptionDetails) { console.error('CDP EXC:', JSON.stringify(r.result.exceptionDetails)); }
  console.log(r.result?.result?.value ?? JSON.stringify(r.result, null, 2));
  ws.close(); process.exit(0);
});
ws.on('error', (e) => { console.error('WS ERR', e.message); process.exit(1); });
setTimeout(() => { console.error('timeout'); process.exit(2); }, 20000);
