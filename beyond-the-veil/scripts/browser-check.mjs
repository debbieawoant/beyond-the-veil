// Optional Firefox/WebGL acceptance check. Uses the real UI and SQL migration,
// but a local test transport instead of hosted Supabase Auth/WebSocket services.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { PGlite } from '@electric-sql/pglite';

const root = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = process.env.BTV_TEST_TMP || (process.env.OPENCODE ? '/tmp/opencode' : tmpdir());
await mkdir(tempRoot, { recursive: true });
const profile = await mkdtemp(`${tempRoot}/btv-firefox-`);
const db = new PGlite();
let server;
let firefox;
let socket;
let queue = Promise.resolve();
const serial = task => { const next = queue.then(task); queue = next.catch(() => {}); return next; };

const sdk = `
export function createClient() {
  let id = sessionStorage.getItem('btv.test.identity');
  const session = () => id ? { user: { id }, access_token: 'local-test-only' } : null;
  const request = async (path, body) => {
    const response = await fetch('/@btv-test/' + path, body ? {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    } : {});
    return response.json();
  };
  return {
    auth: {
      async getSession() { return { data: { session: session() } }; },
      async signInAnonymously() {
        id = crypto.randomUUID(); sessionStorage.setItem('btv.test.identity', id);
        return { data: { session: session() } };
      }
    },
    realtime: { async setAuth() {} },
    async rpc(name, args) { return request('rpc', { name, args, userId: id }); },
    channel(topic) {
      const handlers = {}; let timer; let cursor = 0;
      return {
        on(_type, { event }, callback) { handlers[event] = callback; return this; },
        subscribe(callback) {
          request('events?since=0').then(events => {
            cursor = events.at(-1)?.id ?? 0;
            callback('SUBSCRIBED');
            timer = setInterval(async () => {
              const events = await request('events?since=' + cursor);
              for (const event of events) {
                cursor = Math.max(cursor, event.id);
                if (event.topic === topic) handlers[event.event]?.({ payload: event.payload });
              }
            }, 75);
          });
          return this;
        },
        close() { clearInterval(timer); }
      };
    },
    async removeChannel(channel) { channel.close(); }
  };
}
`;

try {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated;
    create schema realtime; create table realtime.messages(topic text);
    alter table realtime.messages enable row level security;
    create table public.test_events(id serial primary key, topic text, event text, payload jsonb);
    create function realtime.topic() returns text language sql stable as $$ select ''::text $$;
    create function realtime.send(payload jsonb, event text, topic text, private boolean)
      returns void language sql as $$ insert into public.test_events(topic,event,payload) values(topic,event,payload) $$;
  `);
  await db.exec(await readFile(new URL('../../supabase/migrations/202610270001_rooms.sql', import.meta.url), 'utf8'));
  const rpcArgs = {
    btv_create_room: ['p_name', 'p_class'], btv_join_room: ['p_code', 'p_name', 'p_class'],
    btv_snapshot: ['p_room'], btv_act: ['p_room', 'p_revision', 'p_action', 'p_rune'],
    btv_ping: ['p_room', 'p_generation', 'p_x', 'p_y', 'p_z', 'p_target'], btv_leave_room: ['p_room']
  };
  server = await createServer({ root, configFile: false,
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://local-test.supabase.co'),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('sb_publishable_local_test_only')
    },
    server: { host: '127.0.0.1', port: 5189, strictPort: true },
    plugins: [{ name: 'btv-browser-fixture', enforce: 'pre',
      resolveId(id) { if (id === '/@btv-test-sdk') return '\0btv-test-sdk'; },
      load(id) { if (id === '\0btv-test-sdk') return sdk; },
      transform(code, id) {
        if (!id.endsWith('/src/main.js')) return;
        return code.replace("import('@supabase/supabase-js')", "import('/@btv-test-sdk')")
          + '\nglobalThis.__game = { camera, controls, interactions, ui, room: () => room };';
      },
      configureServer(vite) {
        vite.middlewares.use(async (req, res, next) => {
          if (!req.url.startsWith('/@btv-test/')) return next();
          res.setHeader('Content-Type', 'application/json');
          try {
            if (req.method === 'GET') {
              const since = Number(new URL(req.url, 'http://localhost').searchParams.get('since')) || 0;
              const result = await serial(async () => {
                await db.exec('reset role');
                return db.query('select * from public.test_events where id > $1 order by id', [since]);
              });
              res.end(JSON.stringify(result.rows)); return;
            }
            let body = '';
            for await (const chunk of req) body += chunk;
            const { name, args, userId } = JSON.parse(body);
            if (!rpcArgs[name] || !/^[\da-f-]{36}$/.test(userId)) throw new Error('Invalid test request');
            const result = await serial(async () => {
              await db.exec('reset role');
              await db.query('insert into auth.users values($1) on conflict do nothing', [userId]);
              await db.exec('set role authenticated');
              await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
              try {
                const placeholders = rpcArgs[name].map((_, i) => '$' + (i + 1)).join(',');
                const data = await db.query('select public.' + name + '(' + placeholders + ') as data', rpcArgs[name].map(key => args[key]));
                return { data: data.rows[0].data };
              } catch (error) { return { error: { message: error.message } }; }
            });
            res.end(JSON.stringify(result));
          } catch (error) { res.end(JSON.stringify({ error: { message: error.message } })); }
        });
      }
    }]
  });
  await server.listen();
  await writeFile(`${profile}/user.js`, [
    'user_pref("webgl.force-enabled", true);',
    'user_pref("gfx.webrender.software", true);',
    'user_pref("webgl.disable-fail-if-major-performance-caveat", true);'
  ].join('\n'));
  firefox = spawn(process.env.FIREFOX_BIN || 'firefox', [
    '--headless', '--no-remote', '--profile', profile, '--remote-debugging-port', '9239', 'about:blank'
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error(`Firefox startup timed out: ${output}`)), 20000);
    firefox.once('error', reject);
    firefox.once('exit', code => { clearTimeout(timeout); reject(new Error(`Firefox exited (${code}): ${output}`)); });
    const capture = chunk => {
      output += chunk.toString();
      const match = output.match(/WebDriver BiDi listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    };
    firefox.stderr.on('data', capture);
    firefox.stdout.on('data', capture);
  });
  socket = new WebSocket(`${endpoint}/session`);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const jsErrors = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'log.entryAdded' && message.params.type === 'javascript') jsErrors.push(message.params.text);
    const call = pending.get(message.id);
    if (!call) return;
    pending.delete(message.id); clearTimeout(call.timeout);
    if (message.type === 'error') call.reject(new Error(message.message)); else call.resolve(message.result);
  };
  function command(method, params = {}) {
    return new Promise((resolve, reject) => {
      const callId = ++id;
      const timeout = setTimeout(() => { pending.delete(callId); reject(new Error(`${method} timed out`)); }, 20000);
      pending.set(callId, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id: callId, method, params }));
    });
  }
  await command('session.new', { capabilities: { alwaysMatch: { acceptInsecureCerts: true } } });
  await command('session.subscribe', { events: ['log.entryAdded'] });
  await command('script.addPreloadScript', { functionDeclaration: `() => {
    globalThis.__frames = [];
    globalThis.requestAnimationFrame = cb => { __frames.push(cb); return __frames.length; };
    let now = performance.now();
    globalThis.__step = (count = 1) => { for (let i = 0; i < count; i++) {
      now += 1000 / 60; const callbacks = __frames.splice(0); for (const cb of callbacks) cb(now);
    }};
    let locked = null;
    Object.defineProperty(document, 'pointerLockElement', { get: () => locked });
    HTMLCanvasElement.prototype.requestPointerLock = function() { locked = this; };
    document.exitPointerLock = () => { locked = null; };
    globalThis.__press = code => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
    };
    globalThis.__walk = (code, frames) => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
      __step(frames); document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
    };
  }` });
  async function evaluate(context, code) {
    const result = await command('script.evaluate', {
      expression: `(async () => { ${code} })()`, target: { context }, awaitPromise: true,
      resultOwnership: 'none'
    });
    if (result.type === 'exception') throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }
  async function wait(context, condition) {
    await evaluate(context, `const start = Date.now(); while (!(${condition})) {
      if (Date.now() - start > 10000) throw new Error('Condition timed out: ' + ${JSON.stringify(condition)});
      await new Promise(resolve => setTimeout(resolve, 40));
    } return true;`);
  }
  async function tab() {
    const user = await command('browser.createUserContext');
    const { context } = await command('browsingContext.create', { type: 'tab', userContext: user.userContext });
    await command('browsingContext.navigate', { context, url: 'http://127.0.0.1:5189', wait: 'complete' });
    await wait(context, `globalThis.__game && !document.querySelector('#create-room').disabled`);
    return context;
  }
  const host = await tab();
  const guest = await tab();
  assert.equal(await evaluate(host, `return document.querySelector('.start-card').getBoundingClientRect().top >= 0;`), true);
  await evaluate(host, `document.querySelector('#player-name').value = 'Host'; document.querySelector('#create-room').click(); return true;`);
  await wait(host, `__game.room()?.isConnected()`);
  const code = await evaluate(host, 'return __game.room().getSnapshot().room.code;');
  await evaluate(guest, `document.querySelector('#player-name').value = '<img onerror=alert(1)>';
    document.querySelector('#room-code').value = ${JSON.stringify(code)};
    document.querySelector('#join-room').click(); return true;`);
  await wait(guest, `__game.room()?.isConnected()`);
  await wait(host, `document.querySelectorAll('#members .member').length === 2`);
  assert.equal(await evaluate(host, `return document.querySelector('#members img') === null;`), true);
  for (const context of [host, guest]) await evaluate(context, `document.querySelector('#enter').click(); __step(); return true;`);
  console.log('PASS: create/join, two independent identities, safe roster, entry');

  async function inspect(context, type, runeId) {
    // Positions target the actual rendered objects; E uses real scene raycasts.
    const positions = {
      chart: [[-3, 1.65, -2.5], [-5.72, 1.65, -2.5]],
      crown: [[3, 1.65, 3], [5.72, 1.65, 3]],
      river: [[3, 1.65, -3], [5.72, 1.65, -3]],
      gate: [[3, 1.65, 0], [5.72, 1.65, 0]],
      orrery: [[0, 1.65, 3], [0, 1.65, 0]]
    };
    const [position, target] = positions[runeId || type];
    await evaluate(context, `__game.camera.position.set(...${JSON.stringify(position)});
      __game.camera.lookAt(...${JSON.stringify(target)}); __step(); __press('KeyE'); return true;`);
    await wait(context, `__game.ui.isNoticeOpen() && !__game.ui.isBusy()`);
    await evaluate(context, `__press('KeyE'); __step(); return true;`);
  }
  await inspect(host, 'chart');
  await wait(guest, `document.querySelector('#clues').textContent.includes('Crown → River → Gate')`);
  await inspect(guest, 'rune', 'gate');
  await inspect(guest, 'rune', 'crown');
  await wait(host, `__game.interactions.getState().activated.length === 1`);
  await inspect(host, 'rune', 'river');
  await wait(guest, `__game.interactions.getState().activated.length === 2`);
  await inspect(guest, 'rune', 'gate');
  await wait(host, `__game.interactions.getState().activated.length === 3`);
  console.log('PASS: shared journal, wrong-order retry, alternating rune actions');
  await evaluate(guest, `__press('KeyQ'); return true;`);
  await wait(host, `document.querySelectorAll('.ping-marker').length === 1`);
  assert.match(await evaluate(host, `__step(); return document.querySelector('.ping-marker').textContent;`), /Gate Rune/);
  await evaluate(host, `__game.camera.lookAt(0,1.65,6); __step(); return true;`);
  assert.equal(await evaluate(host, `return document.querySelector('.ping-marker strong').textContent;`), '➤');
  console.log('PASS: contextual Q ping and off-screen indicator');
  await wait(host, `(__step(), document.querySelectorAll('.ping-marker').length === 0)`);
  console.log('PASS: ping expires automatically');
  await inspect(host, 'orrery');
  await wait(guest, `__game.interactions.getState().unlocked`);
  await evaluate(host, `__game.camera.position.set(0,1.65,-5.3); __game.camera.rotation.set(0,0,0); __walk('KeyW',30); return true;`);
  await wait(host, `__game.ui.isComplete()`);
  assert.equal(await evaluate(guest, 'return __game.ui.isComplete();'), false);
  console.log('PASS: shared unlock and per-player walk-through completion');
  await command('browsingContext.reload', { context: guest, wait: 'complete' });
  await wait(guest, `globalThis.__game?.room()?.isConnected()`);
  assert.equal(await evaluate(guest, 'return __game.interactions.getState().unlocked;'), true);
  await evaluate(guest, `document.querySelector('#enter').click(); __step(); return true;`);
  await evaluate(host, `globalThis.confirm = () => true; document.querySelector('#restart').click(); return true;`);
  for (const context of [host, guest]) {
    await wait(context, `__game.room().getSnapshot().room.generation === 1`);
    assert.equal(await evaluate(context, 'return __game.interactions.getState().unlocked;'), false);
    assert.equal(await evaluate(context, 'return __game.ui.isComplete();'), false);
    assert.equal(await evaluate(context, `return document.querySelectorAll('.ping-marker').length;`), 0);
    assert.equal(await evaluate(context, 'return __game.camera.position.z;'), 5);
  }
  console.log('PASS: reload/rejoin and host reset restore both players');
  await evaluate(guest, `document.querySelector('#leave-room').click(); return true;`);
  await wait(guest, `__game.room().getSnapshot() === null`);
  assert.equal(await evaluate(guest, `return document.querySelector('#start').classList.contains('hidden');`), false);
  assert.deepEqual(jsErrors, []);
  console.log('PASS: leave returns to lobby; no JavaScript exceptions');
  console.log('Hosted Supabase and real pointer-lock permission still need manual testing.');
} finally {
  socket?.close();
  firefox?.kill('SIGTERM');
  await server?.close();
  await queue;
  await db.close();
}
