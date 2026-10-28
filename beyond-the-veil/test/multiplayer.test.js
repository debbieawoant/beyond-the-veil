import assert from 'node:assert/strict';
import test from 'node:test';
import { createRoomClient, ROOM_STORAGE_KEY, validateRoomInput, realtimeFailure } from '../src/multiplayer.js';
import { validatePing } from '../src/pings.js';
import { createInteractions } from '../src/interactions.js';

const clone = value => structuredClone(value);
const makeSnapshot = (revision = 0, generation = 0) => ({
  room: { id: 'room-id', code: 'A1B2C3D4', hostId: 'host', revision, generation },
  state: { chartDiscovered: false, activated: [], unlocked: false, completed: false },
  members: [{ id: 'host', name: '<img src=x onerror=alert(1)>', slot: 0 }]
});

function harness(saved = null) {
  let snapshot = makeSnapshot();
  const storageMap = new Map(saved ? [[ROOM_STORAGE_KEY, JSON.stringify(saved)]] : []);
  const storage = { getItem: key => storageMap.get(key) ?? null,
    setItem: (key, value) => storageMap.set(key, value), removeItem: key => storageMap.delete(key) };
  const events = {};
  const statuses = [];
  const received = [];
  const pings = [];
  const errors = [];
  const calls = [];
  let statusCallback;
  let tick;
  let cancelled = false;
  let session = { user: { id: 'host' }, access_token: 'test-token' };
  const channel = {
    on(_kind, { event }, callback) { events[event] = callback; return this; },
    subscribe(callback) { statusCallback = callback; queueMicrotask(() => callback('SUBSCRIBED')); return this; }
  };
  const api = {
    auth: {
      async getSession() { return { data: { session } }; },
      async signInAnonymously() { calls.push('sign-in'); session = { user: { id: 'host' }, access_token: 'test-token' }; return { data: { session } }; }
    },
    realtime: { async setAuth() {} },
    channel(topic, options) {
      assert.equal(topic, 'btv:room-id');
      assert.equal(options.config.private, true);
      return channel;
    },
    async removeChannel() { calls.push('remove-channel'); },
    async rpc(name, args) {
      calls.push({ name, args });
      if (name === 'btv_act') {
        if (args.p_revision !== snapshot.room.revision) return { data: { type: 'stale', snapshot: clone(snapshot) } };
        snapshot.room.revision++;
        snapshot.state.chartDiscovered = true;
        return { data: { type: 'chart-discovered', snapshot: clone(snapshot) } };
      }
      if (name === 'btv_ping') return { data: { id: 'ping-id', generation: args.p_generation } };
      return { data: clone(snapshot) };
    }
  };
  const room = createRoomClient({ client: api, storage,
    onSnapshot: (next, previous) => received.push([clone(next), previous && clone(previous)]),
    onStatus: (text, connected) => statuses.push({ text, connected }),
    onPing: payload => pings.push(payload), onError: error => errors.push(error),
    schedule(callback, delay) { assert.equal(delay, 15000); tick = callback; return 42; },
    cancel(id) { assert.equal(id, 42); cancelled = true; }
  });
  return { room, api, channel, calls, storageMap, statuses, received, pings, errors, events,
    input: { name: 'Host', characterClass: 'Mage' },
    setSession(value) { session = value; },
    setSnapshot(value) { snapshot = value; },
    status(value, error) { statusCallback(value, error); },
    tick: () => tick(), cancelled: () => cancelled };
}

test('room input trims names/codes and rejects invalid classes, empty names, and malformed codes', () => {
  assert.deepEqual(validateRoomInput({ name: ' Host ', characterClass: 'Mage', code: ' a1b2c3d4 ' }, true),
    { name: 'Host', characterClass: 'Mage', code: 'A1B2C3D4' });
  for (const input of [
    { name: '', characterClass: 'Mage' }, { name: 'x'.repeat(25), characterClass: 'Mage' },
    { name: 'x\n', characterClass: 'Mage' }, { name: 'Guest', characterClass: 'Admin' }
  ]) {
    // Trailing whitespace is intentionally trimmed, embedded controls are not.
    if (input.name === 'x\n') input.name = 'x\ny';
    assert.throws(() => validateRoomInput(input));
  }
  assert.throws(() => validateRoomInput({ name: 'Guest', characterClass: 'Mage', code: '<script>' }, true));
});

test('create reuses a guest session, subscribes privately, and snapshots after subscription', async () => {
  const h = harness();
  await h.room.connect('create', h.input);
  assert.equal(h.room.isConnected(), true);
  assert.equal(h.room.getUserId(), 'host');
  assert.equal(h.calls.includes('sign-in'), false);
  assert.ok(h.calls.some(call => call.name === 'btv_snapshot'));
  assert.deepEqual(JSON.parse(h.storageMap.get(ROOM_STORAGE_KEY)), { roomId: 'room-id', userId: 'host' });
});

test('first connection creates an anonymous identity only when needed', async () => {
  const h = harness();
  h.setSession(null);
  await h.room.connect('create', h.input);
  assert.equal(h.calls.filter(call => call === 'sign-in').length, 1);
});

test('failed private channel joins surface the SDK server reason and preserve the room for reconnect', async () => {
  const h = harness();
  h.channel.subscribe = callback => {
    queueMicrotask(() => callback('CHANNEL_ERROR', new Error('Unable to subscribe', {
      cause: { reason: 'Authorization policy denied this channel' }
    })));
    return h.channel;
  };
  await assert.rejects(h.room.connect('create', h.input), /CHANNEL_ERROR.*Authorization policy denied/);
  assert.equal(h.room.isConnected(), false);
  assert.ok(h.storageMap.has(ROOM_STORAGE_KEY));
  assert.match(h.statuses.at(-1).text, /Authorization policy denied/);
});

test('Realtime diagnostics distinguish timeouts and redact credentials without serializing socket objects', () => {
  assert.match(realtimeFailure('TIMED_OUT').message, /join timed out/);
  const failure = realtimeFailure('CHANNEL_ERROR', {
    message: 'Failed wss://example.test/?apikey=sb_publishable_test&access_token=eyJabc.def.ghi',
    cause: { reason: 'Permission denied' }, socket: { privateKey: 'do-not-display' }
  });
  assert.match(failure.message, /Permission denied/);
  assert.doesNotMatch(failure.message, /sb_publishable_test|eyJabc|do-not-display/);
});

test('reconnect failures update the visible diagnostic and CLOSED preserves the original reason', async () => {
  const h = harness();
  await h.room.connect('create', h.input);
  h.status('CHANNEL_ERROR', new Error('Server rejected room authorization'));
  assert.match(h.errors.at(-1), /Server rejected room authorization/);
  h.status('CLOSED');
  assert.match(h.errors.at(-1), /Server rejected room authorization/);
});

test('missing database setup gives an actionable error and does not create local puzzle progress', async () => {
  const h = harness();
  h.api.rpc = async () => ({ error: { code: 'PGRST202', message: 'Function not found' } });
  await assert.rejects(h.room.connect('create', h.input), /Run the supplied Supabase migration/);
  assert.equal(h.room.getSnapshot(), null);
  assert.equal(h.room.isBusy(), false);
});

test('joining submits the normalized code and never sends an identity supplied by the form', async () => {
  const h = harness();
  await h.room.connect('join', { ...h.input, code: ' a1b2c3d4 ', userId: 'someone-else' });
  const call = h.calls.find(item => item.name === 'btv_join_room');
  assert.deepEqual(call.args, { p_name: 'Host', p_class: 'Mage', p_code: 'A1B2C3D4' });
});

test('actions use server revisions, do not optimistically update, and expose stale conflicts', async () => {
  const h = harness();
  await h.room.connect('create', h.input);
  const next = makeSnapshot(2);
  h.setSnapshot(next);
  const result = await h.room.act({ type: 'read-chart' });
  assert.equal(result.type, 'stale');
  assert.equal(h.room.getSnapshot().room.revision, 2);
  assert.equal(h.room.getSnapshot().state.chartDiscovered, false);
  const success = await h.room.act({ type: 'read-chart' });
  assert.equal(success.type, 'chart-discovered');
  assert.equal(h.room.getSnapshot().state.chartDiscovered, true);
});

test('pending actions cannot overlap with another action or leave', async () => {
  const h = harness();
  await h.room.connect('create', h.input);
  const original = h.api.rpc;
  let release;
  h.api.rpc = (name, args) => name === 'btv_act'
    ? new Promise(resolve => { release = () => original(name, args).then(resolve); })
    : original(name, args);
  const pending = h.room.act({ type: 'read-chart' });
  await assert.rejects(h.room.act({ type: 'read-chart' }), /previous action/);
  await assert.rejects(h.room.leave(), /pending request/);
  assert.equal(h.room.getSnapshot().state.chartDiscovered, false);
  release();
  await pending;
  assert.equal(h.room.isBusy(), false);
});

test('older snapshots cannot roll back progress', async () => {
  const h = harness();
  await h.room.connect('create', h.input);
  await h.room.act({ type: 'read-chart' });
  h.setSnapshot(makeSnapshot(0));
  await h.room.refresh();
  assert.equal(h.room.getSnapshot().room.revision, 1);
  assert.equal(h.room.getSnapshot().state.chartDiscovered, true);
});

test('a notification during an in-flight snapshot forces another fetch, closing the subscribe race', async () => {
  const h = harness();
  await h.room.connect('create', h.input);
  const original = h.api.rpc;
  let release;
  let requests = 0;
  h.api.rpc = async (name, args) => {
    if (name === 'btv_snapshot' && requests++ === 0) return new Promise(resolve => { release = resolve; });
    return original(name, args);
  };
  const refresh = h.room.refresh();
  h.setSnapshot(makeSnapshot(4));
  h.events.refresh({ payload: { revision: 4 } });
  release({ data: makeSnapshot(1) });
  await refresh;
  assert.equal(h.room.getSnapshot().room.revision, 4);
  assert.equal(requests, 2);
});

test('disconnect blocks writes; resubscription and heartbeat restore current room state', async () => {
  const h = harness();
  await h.room.connect('create', h.input);
  h.status('CHANNEL_ERROR');
  await assert.rejects(h.room.act({ type: 'read-chart' }), /Reconnect/);
  await assert.rejects(h.room.ping({ position: [0, 1, 0] }), /Reconnect/);
  h.setSnapshot(makeSnapshot(9, 1));
  h.status('SUBSCRIBED');
  await h.room.refresh();
  await Promise.resolve();
  assert.equal(h.room.getSnapshot().room.generation, 1);
  assert.equal(h.room.isConnected(), true);
  await h.tick();
});

test('HTTP heartbeat failure pauses actions and recovers after HTTP becomes available', async () => {
  const h = harness();
  await h.room.connect('create', h.input);
  const original = h.api.rpc;
  h.api.rpc = async () => ({ error: { message: 'Network unavailable' } });
  await h.tick();
  assert.equal(h.room.isConnected(), false);
  h.api.rpc = original;
  await h.tick();
  assert.equal(h.room.isConnected(), true);
});

test('reload resumes only the saved identity; missing identity does not silently create a replacement', async () => {
  const h = harness({ roomId: 'room-id', userId: 'host' });
  assert.equal(await h.room.resume(), true);
  const other = harness({ roomId: 'room-id', userId: 'someone-else' });
  assert.equal(await other.room.resume(), false);
  assert.equal(other.storageMap.has(ROOM_STORAGE_KEY), false);
  assert.equal(other.calls.includes('sign-in'), false);
});

test('leave removes saved room and subscription, and stops heartbeat', async () => {
  const h = harness();
  await h.room.connect('create', h.input);
  await h.room.leave();
  assert.equal(h.room.getSnapshot(), null);
  assert.equal(h.room.isConnected(), false);
  assert.equal(h.storageMap.has(ROOM_STORAGE_KEY), false);
  assert.equal(h.cancelled(), true);
  assert.ok(h.calls.includes('remove-channel'));
});

test('ping RPC carries coordinates and current generation; previous-generation broadcasts are ignored', async () => {
  const h = harness();
  await h.room.connect('create', h.input);
  await h.room.ping({ position: [5.7, 1.65, 3], target: 'crown' });
  assert.deepEqual(h.calls.find(item => item.name === 'btv_ping').args,
    { p_room: 'room-id', p_generation: 0, p_x: 5.7, p_y: 1.65, p_z: 3, p_target: 'crown' });
  h.events.ping({ payload: { generation: -1 } });
  assert.equal(h.pings.length, 1);
});

test('ping payload validation rejects outsiders, old markers, unknown targets and invalid coordinates', () => {
  const snapshot = makeSnapshot();
  const now = Date.now();
  const ping = { id: 'id', senderId: 'host', generation: 0, target: 'crown',
    position: [5.7, 1.65, 3], sentAt: new Date(now).toISOString() };
  assert.match(validatePing(ping, snapshot.members, 0, now).label, /Crown Rune/);
  for (const change of [{ senderId: 'outsider' }, { generation: 1 }, { target: '__proto__' },
    { position: [Infinity, 0, 0] }, { position: [7, 0, 0] }, { sentAt: new Date(now - 5001).toISOString() }]) {
    assert.equal(validatePing({ ...ping, ...change }, snapshot.members, 0, now), null);
  }
});

test('remote interactions wait for authoritative state and failures cannot unlock or complete locally', async () => {
  let rendered;
  const ui = {
    busy: false, completed: false,
    setProgress() {}, setClues() {}, setHint(text) { this.hint = text; },
    setBusy(value) { this.busy = value; }, showNotice() {}, showCompletion() { this.completed = true; }
  };
  const interactions = createInteractions({ setPuzzleState: state => { rendered = state; }, ui });
  let resolve;
  interactions.setRemote(() => new Promise(done => { resolve = done; }));
  interactions.applySharedState(makeSnapshot().state);
  const inspection = interactions.inspect({ userData: { type: 'chart', title: 'Chart', description: 'Clue' } });
  assert.equal(ui.busy, true);
  assert.equal(rendered.chartDiscovered, false);
  resolve({ type: 'chart-discovered', state: { ...rendered, chartDiscovered: true } });
  await inspection;
  assert.equal(rendered.chartDiscovered, true);
  assert.equal(ui.busy, false);
  interactions.setRemote(async () => { throw new Error('offline'); });
  assert.equal(await interactions.crossExit(), false);
  assert.equal(ui.completed, false);
  assert.match(ui.hint, /not confirmed.*offline/);
});
