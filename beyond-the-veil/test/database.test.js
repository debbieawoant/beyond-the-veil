import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { createRoomClient } from '../src/multiplayer.js';

// Real embedded PostgreSQL, with only Supabase's Auth/Realtime infrastructure
// stubbed. This does not replace a hosted Realtime/two-device acceptance test.
test('Supabase migration: database rules, permissions, isolation, and replay', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  const ids = Array.from({ length: 8 }, (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`);
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    create schema realtime;
    create table realtime.messages(topic text, event text, payload jsonb, private boolean);
    alter table realtime.messages enable row level security;
    grant usage on schema realtime to authenticated;
    grant select, insert on realtime.messages to authenticated;
    create function realtime.topic() returns text language sql stable as
      $$ select current_setting('test.topic', true) $$;
    create function realtime.send(payload jsonb, event text, topic text, private boolean)
      returns void language sql as
      $$ insert into realtime.messages values(topic,event,payload,private) $$;
  `);
  for (const id of ids) await db.query('insert into auth.users values($1)', [id]);
  const migration = await readFile(new URL('../../supabase/migrations/202610270001_rooms.sql', import.meta.url), 'utf8');
  await db.exec(migration);

  async function asUser(index, role = 'authenticated') {
    await db.exec(`reset role; set role ${role};`);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [index === null ? '' : ids[index]]);
  }
  async function rpc(name, args = []) {
    const params = args.map((_, i) => `$${i + 1}`).join(',');
    return (await db.query(`select public.${name}(${params}) as result`, args)).rows[0].result;
  }
  async function admin(sql, args = []) { await db.exec('reset role'); return db.query(sql, args); }

  let room;
  let revision;
  await t.test('anonymous API role cannot call room RPCs', async () => {
    await asUser(null, 'anon');
    await assert.rejects(rpc('btv_create_room', ['Guest', 'Mage']), /permission denied/);
  });
  await t.test('create returns membership, code, host, and initial state', async () => {
    await asUser(0);
    room = await rpc('btv_create_room', ['Host', 'Mage']);
    revision = room.room.revision;
    assert.match(room.room.code, /^[A-F0-9]{8}$/);
    assert.equal(room.room.hostId, ids[0]);
    assert.deepEqual(room.state, { chartDiscovered: false, activated: [], unlocked: false, completed: false });
    assert.equal(room.members[0].slot, 0);
    await assert.rejects(db.query('select * from btv_private.rooms'), /permission denied/);
    await assert.rejects(db.query('select btv_private.snapshot($1)', [room.room.id]), /permission denied/);
  });
  await t.test('creation is rate-limited and invalid names/classes are rejected', async () => {
    assert.match((await rpc('btv_create_room', ['Host', 'Mage'])).error, /Wait 10 seconds/);
    await assert.rejects(rpc('btv_create_room', [' ', 'Mage']), /Enter a name/);
    await assert.rejects(rpc('btv_create_room', ['Guest', 'Admin']), /Enter a name/);
  });
  await t.test('outsiders cannot fetch, act, ping, or subscribe to another room', async () => {
    await asUser(1);
    await assert.rejects(rpc('btv_snapshot', [room.room.id]), /Room unavailable/);
    await assert.rejects(rpc('btv_act', [room.room.id, revision, 'read-chart', null]), /not a member/);
    await assert.rejects(rpc('btv_ping', [room.room.id, 0, 0, 1, 0, null]), /not a member/);
    assert.equal(await rpc('btv_can_receive', [`btv:${room.room.id}`]), false);
  });
  await t.test('failed room guesses consume the join cooldown', async () => {
    assert.match((await rpc('btv_join_room', ['INVALID!', 'Guest', 'Rogue'])).error, /not found/);
    assert.match((await rpc('btv_join_room', [room.room.code, 'Guest', 'Rogue'])).error, /Wait a second/);
    await admin("update btv_private.guests set last_join = clock_timestamp() - interval '2 seconds'");
  });
  await t.test('joining assigns identity/slot and permits receiving but not forging broadcasts', async () => {
    await asUser(1);
    const joined = await rpc('btv_join_room', [room.room.code.toLowerCase(), '<img onerror=alert(1)>', 'Rogue']);
    assert.equal(joined.members.length, 2);
    assert.equal(joined.members[1].id, ids[1]);
    revision = joined.room.revision;
    assert.equal(await rpc('btv_can_receive', [`btv:${room.room.id}`]), true);
    await db.query("select set_config('test.topic', $1, false)", [`btv:${room.room.id}`]);
    assert.ok((await db.query('select * from realtime.messages')).rows.length > 0);
    await assert.rejects(db.query("insert into realtime.messages values($1,'ping','{}',true)", [`btv:${room.room.id}`]), /row-level security/);
    await db.query("select set_config('test.topic', 'btv:other', false)");
    // The real realtime.messages policy is evaluated for the requested topic;
    // with an unauthorized topic it must grant no rows at all.
    assert.equal((await db.query('select * from realtime.messages')).rows.length, 0);
  });
  async function action(index, type, rune = null, expected = revision) {
    await asUser(index);
    const result = await rpc('btv_act', [room.room.id, expected, type, rune]);
    revision = Math.max(revision, result.snapshot.room.revision);
    return result;
  }
  await t.test('prerequisites and stale simultaneous input are validated atomically', async () => {
    assert.equal((await action(0, 'activate-rune', 'crown')).type, 'need-chart');
    const old = revision;
    assert.equal((await action(0, 'read-chart')).type, 'chart-discovered');
    const stale = await action(1, 'activate-rune', 'crown', old);
    assert.equal(stale.type, 'stale');
    assert.deepEqual(stale.snapshot.state.activated, []);
  });
  await t.test('wrong order resets runes, duplicate activation is safe, and both players share the clue', async () => {
    assert.equal((await action(1, 'activate-rune', 'gate')).type, 'wrong-order');
    assert.equal((await action(0, 'activate-rune', 'crown')).type, 'rune-activated');
    assert.equal((await action(1, 'activate-rune', 'crown')).type, 'already-active');
    assert.equal((await action(1, 'align-orrery')).type, 'not-ready');
    assert.equal((await action(1, 'activate-rune', 'river')).type, 'rune-activated');
    assert.equal((await action(0, 'activate-rune', 'gate')).type, 'ready');
    const aligned = await action(1, 'align-orrery');
    assert.equal(aligned.type, 'unlocked');
    assert.equal(aligned.snapshot.state.chartDiscovered, true);
  });
  await t.test('completion belongs to the individual player, not the entire room', async () => {
    assert.equal((await action(0, 'exit')).snapshot.state.completed, true);
    await asUser(1);
    const guest = await rpc('btv_snapshot', [room.room.id]);
    assert.equal(guest.state.completed, false);
    assert.equal(guest.members[0].completed, true);
    assert.equal(guest.state.unlocked, true);
  });
  await t.test('room capacity is four and late joins receive the current unlocked state', async () => {
    for (const index of [2, 3]) {
      await asUser(index);
      const joined = await rpc('btv_join_room', [room.room.code, `Player ${index}`, 'Paladin']);
      revision = joined.room.revision;
      assert.equal(joined.state.unlocked, true);
      assert.equal(joined.state.completed, false);
    }
    await asUser(4);
    assert.match((await rpc('btv_join_room', [room.room.code, 'Fifth', 'Warrior'])).error, /full/);
  });
  await t.test('ping sender is derived from Auth, validated, private and rate-limited', async () => {
    await asUser(1);
    await assert.rejects(rpc('btv_ping', [room.room.id, 0, 100, 1, 0, null]), /Invalid ping/);
    await assert.rejects(rpc('btv_ping', [room.room.id, 0, 0, 1, 0, 'script']), /Invalid ping/);
    await assert.rejects(rpc('btv_ping', [room.room.id, 0, 'NaN', 1, 0, null]), /Invalid ping/);
    const ping = await rpc('btv_ping', [room.room.id, 0, 5.7, 1.65, 3, 'crown']);
    assert.equal(ping.senderId, ids[1]);
    assert.equal(ping.target, 'crown');
    await assert.rejects(rpc('btv_ping', [room.room.id, 0, 0, 1, 0, null]), /cooldown/);
    const events = await admin("select * from realtime.messages where event = 'ping'");
    assert.equal(events.rows.at(-1).private, true);
    assert.equal(events.rows.at(-1).topic, `btv:${room.room.id}`);
  });
  await t.test('only host can reset; reset clears completions and invalidates in-flight input/pings', async () => {
    await assert.rejects(action(1, 'reset'), /Only the host/);
    const oldRevision = revision;
    const reset = await action(0, 'reset');
    assert.equal(reset.snapshot.room.generation, 1);
    assert.deepEqual(reset.snapshot.state, { chartDiscovered: false, activated: [], unlocked: false, completed: false });
    assert.ok(reset.snapshot.members.every(member => !member.completed));
    assert.equal((await action(1, 'read-chart', null, oldRevision)).type, 'stale');
    await assert.rejects(rpc('btv_ping', [room.room.id, 0, 0, 1, 0, null]), /restarted/);
    assert.equal((await action(1, 'exit')).type, 'locked');
  });
  await t.test('leaving transfers host and revokes membership authorization', async () => {
    await asUser(0);
    await rpc('btv_leave_room', [room.room.id]);
    assert.equal(await rpc('btv_can_receive', [`btv:${room.room.id}`]), false);
    await assert.rejects(rpc('btv_snapshot', [room.room.id]), /Room unavailable/);
    await asUser(1);
    const next = await rpc('btv_snapshot', [room.room.id]);
    assert.equal(next.room.hostId, ids[1]);
    assert.equal(next.members.length, 3);
  });
  await t.test('expired rooms cannot be fetched, joined or subscribed to', async () => {
    await admin("update btv_private.rooms set expires_at = clock_timestamp() - interval '1 second' where id = $1", [room.room.id]);
    await asUser(1);
    await assert.rejects(rpc('btv_snapshot', [room.room.id]), /Room unavailable/);
    assert.equal(await rpc('btv_can_receive', [`btv:${room.room.id}`]), false);
    await asUser(5);
    assert.match((await rpc('btv_join_room', [room.room.code, 'Late', 'Mage'])).error, /expired/);
  });

  await t.test('two independent room clients cooperate through the real SQL RPCs and broadcasts', async () => {
    let queue = Promise.resolve();
    let seen = (await admin('select * from realtime.messages')).rows.length;
    const subscriptions = new Set();
    const deliveries = [];

    function makeClient(index) {
      let subscription;
      const api = {
        auth: { async getSession() { return { data: { session: { user: { id: ids[index] }, access_token: 'test' } } }; } },
        realtime: { async setAuth() {} },
        channel(topic) {
          const handlers = {};
          subscription = { topic, handlers };
          return {
            on(_kind, { event }, callback) { handlers[event] = callback; return this; },
            subscribe(callback) { subscriptions.add(subscription); queueMicrotask(() => callback('SUBSCRIBED')); }
          };
        },
        async removeChannel() { subscriptions.delete(subscription); },
        async rpc(name, args) {
          const request = queue.then(async () => {
            await asUser(index);
            let data;
            const ordered = {
              btv_create_room: ['p_name', 'p_class'], btv_join_room: ['p_code', 'p_name', 'p_class'],
              btv_snapshot: ['p_room'], btv_act: ['p_room', 'p_revision', 'p_action', 'p_rune'],
              btv_ping: ['p_room', 'p_generation', 'p_x', 'p_y', 'p_z', 'p_target'], btv_leave_room: ['p_room']
            }[name];
            try { data = await rpc(name, ordered.map(key => args[key])); }
            catch (error) { return { error: { message: error.message } }; }
            const events = (await admin('select * from realtime.messages')).rows;
            const added = events.slice(seen);
            seen = events.length;
            queueMicrotask(() => {
              for (const event of added) for (const sub of subscriptions) {
                if (event.topic === sub.topic) sub.handlers[event.event]?.({ payload: event.payload });
              }
            });
            return { data };
          });
          queue = request.catch(() => {});
          return request;
        }
      };
      return createRoomClient({ client: api, storage: null,
        schedule: () => 0, cancel() {}, onPing: ping => deliveries.push({ index, ping }) });
    }

    const host = makeClient(6);
    const guest = makeClient(7);
    const created = await host.connect('create', { name: 'Host', characterClass: 'Mage' });
    await guest.connect('join', { name: 'Guest', characterClass: 'Rogue', code: created.room.code });
    await host.refresh();
    assert.equal(host.getSnapshot().members.length, 2);
    await host.act({ type: 'read-chart' });
    await guest.refresh();
    assert.equal(guest.getSnapshot().state.chartDiscovered, true);
    for (const [player, runeId] of [[guest, 'crown'], [host, 'river'], [guest, 'gate']]) {
      await player.refresh();
      assert.notEqual((await player.act({ type: 'activate-rune', runeId })).type, 'stale');
    }
    await host.refresh();
    await host.act({ type: 'align-orrery' });
    await guest.refresh();
    assert.equal(guest.getSnapshot().state.unlocked, true);
    await guest.ping({ position: [0, 1.65, -5.7], target: 'exit' });
    assert.ok(deliveries.some(item => item.index === 6 && item.ping.senderId === ids[7]));
    await guest.act({ type: 'exit' });
    await host.refresh();
    assert.equal(host.getSnapshot().state.completed, false);
    assert.equal(guest.getSnapshot().state.completed, true);
    await host.act({ type: 'reset' });
    await guest.refresh();
    assert.equal(guest.getSnapshot().room.generation, 1);
    assert.equal(guest.getSnapshot().state.completed, false);
    assert.equal(guest.getSnapshot().state.unlocked, false);
    await guest.leave();
    await host.leave();
  });
});
