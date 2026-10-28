export const ROOM_STORAGE_KEY = 'btv.room.v1';

function storedRoom(storage) {
  try { return JSON.parse(storage?.getItem(ROOM_STORAGE_KEY) ?? 'null'); }
  catch { return null; }
}

function browserStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

export function validateRoomInput({ name, characterClass, code }, joining = false) {
  const input = { name: name.trim(), characterClass, code: code?.trim().toUpperCase() };
  if (!input.name || input.name.length > 24 || /[\x00-\x1f\x7f]/.test(input.name)) {
    throw new Error('Enter a display name of 1–24 characters.');
  }
  if (!['Mage', 'Paladin', 'Warrior', 'Rogue'].includes(characterClass)) throw new Error('Choose a class.');
  if (joining && !/^[A-F0-9]{8}$/.test(input.code ?? '')) throw new Error('Enter the eight-character room code.');
  return input;
}

export function realtimeFailure(status, error) {
  const details = [];
  function collect(value, depth = 0) {
    if (!value || depth > 2) return;
    if (typeof value === 'string') { if (!details.includes(value)) details.push(value); return; }
    // Don't serialize the full socket/error object: it may contain credentials.
    for (const field of ['message', 'reason', 'error', 'code', 'cause']) collect(value[field], depth + 1);
  }
  collect(error);
  const detail = details.join(' · ')
    .replace(/([?&](?:apikey|access_token|token)=)[^\s&#]+/gi, '$1[redacted]')
    .replace(/\bsb_(?:publishable|secret)_[\w-]+/g, '[redacted]')
    .replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[redacted]')
    .slice(0, 600);
  const hint = status === 'TIMED_OUT' ? 'The channel join timed out. Check the connection and retry.'
    : 'No server reason was supplied. Check the browser connection and Realtime logs.';
  return new Error(`Realtime connection failed (${status}): ${detail || hint}`);
}

// Transport only: the database is authoritative; no optimistic puzzle updates.
export function createRoomClient({
  client, storage = browserStorage(), onSnapshot = () => {},
  onStatus = () => {}, onPing = () => {}, onError = () => {},
  schedule = setInterval, cancel = clearInterval
}) {
  let snapshot = null;
  let userId = null;
  let channel = null;
  let heartbeat = null;
  let connected = false;
  let subscribed = false;
  let busy = false;
  let syncing = null;
  let refreshAgain = false;
  let sessionEpoch = 0;

  function remember(value) {
    try {
      if (value) storage?.setItem(ROOM_STORAGE_KEY, JSON.stringify(value));
      else storage?.removeItem(ROOM_STORAGE_KEY);
    } catch { /* Browser storage may be unavailable; in-session play still works. */ }
  }

  async function rpc(name, args) {
    const { data, error } = await client.rpc(name, args);
    if (error) {
      if (error.code === 'PGRST202') throw new Error('Database setup is missing. Run the supplied Supabase migration first.');
      throw new Error(error.message || 'Supabase request failed.');
    }
    if (data?.error) throw new Error(data.error);
    return data;
  }

  function apply(next) {
    if (!next?.room || !next.state || !Array.isArray(next.members)) throw new Error('Invalid room response.');
    if (snapshot && (next.room.id !== snapshot.room.id || next.room.revision < snapshot.room.revision)) return false;
    const previous = snapshot;
    snapshot = next;
    onSnapshot(next, previous);
    return true;
  }

  async function refresh() {
    if (syncing) { refreshAgain = true; return syncing; }
    if (!snapshot) return;
    const epoch = sessionEpoch;
    const roomId = snapshot.room.id;
    syncing = (async () => {
      do {
        refreshAgain = false;
        const next = await rpc('btv_snapshot', { p_room: roomId });
        if (epoch !== sessionEpoch) return;
        apply(next);
      } while (refreshAgain);
    })().finally(() => { if (epoch === sessionEpoch) syncing = null; });
    return syncing;
  }

  async function attach(next, session) {
    const epoch = ++sessionEpoch;
    snapshot = null;
    userId = session.user.id;
    apply(next);
    remember({ roomId: next.room.id, userId });
    onStatus('Connecting to room…', false);
    await client.realtime.setAuth(session.access_token);
    heartbeat = schedule(() => refresh().then(() => {
      if (epoch !== sessionEpoch) return;
      connected = subscribed;
      onStatus(connected ? 'Connected' : 'Reconnecting — shared actions paused', connected);
    }).catch(error => {
      if (epoch !== sessionEpoch) return;
      connected = false;
      onStatus('Connection lost — shared actions paused', false);
      onError(error.message);
    }), 15_000);
    channel = client.channel(`btv:${next.room.id}`, { config: { private: true } })
      .on('broadcast', { event: 'refresh' }, () => {
        if (epoch === sessionEpoch) refresh().catch(error => {
          if (epoch === sessionEpoch) {
            connected = false;
            onStatus('Connection lost — shared actions paused', false);
            onError(error.message);
          }
        });
      })
      .on('broadcast', { event: 'ping' }, ({ payload }) => {
        if (epoch === sessionEpoch && payload.generation === snapshot.room.generation) onPing(payload);
      });
    // Fetch after SUBSCRIBED to cover changes between the initial RPC and join.
    await new Promise((resolve, reject) => {
      let settled = false;
      let lastFailure = null;
      channel.subscribe((status, error) => {
        if (epoch !== sessionEpoch) return;
        subscribed = status === 'SUBSCRIBED';
        connected = false;
        onStatus('Reconnecting — shared actions paused', false);
        if (subscribed) {
          refresh().then(() => {
            if (epoch !== sessionEpoch || !subscribed) return;
            connected = true;
            lastFailure = null;
            onStatus('Connected', true);
            settled = true; resolve();
          }).catch(error => {
            if (epoch !== sessionEpoch) return;
            onError(error.message);
            if (!settled) { settled = true; reject(error); }
          });
        } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
          // A CLOSED event often follows the useful server error. Preserve it.
          const failure = status === 'CLOSED' && lastFailure ? lastFailure : realtimeFailure(status, error);
          lastFailure = failure;
          onStatus(failure.message, false);
          if (!settled) { settled = true; reject(failure); }
          else onError(failure.message);
        }
      });
    });
  }

  async function detach() {
    sessionEpoch++;
    if (heartbeat !== null) cancel(heartbeat);
    heartbeat = null;
    connected = false;
    subscribed = false;
    syncing = null;
    const previousChannel = channel;
    channel = null;
    snapshot = null;
    userId = null;
    if (previousChannel) await client.removeChannel(previousChannel);
  }

  async function connect(kind, rawInput) {
    if (busy || snapshot) throw new Error('Leave the current room or reload before connecting again.');
    const input = validateRoomInput(rawInput, kind === 'join');
    busy = true;
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      let session = data.session;
      if (!session) {
        const result = await client.auth.signInAnonymously();
        if (result.error) throw new Error(`Guest sign-in failed: ${result.error.message}`);
        session = result.data.session;
      }
      const args = { p_name: input.name, p_class: input.characterClass };
      if (kind === 'join') args.p_code = input.code;
      const next = await rpc(kind === 'join' ? 'btv_join_room' : 'btv_create_room', args);
      await attach(next, session);
      return snapshot;
    } finally { busy = false; }
  }

  async function resume() {
    const saved = storedRoom(storage);
    if (!saved?.roomId || !saved.userId) return false;
    busy = true;
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session || data.session.user.id !== saved.userId) { remember(null); return false; }
      const next = await rpc('btv_snapshot', { p_room: saved.roomId });
      await attach(next, data.session);
      return true;
    } catch (error) {
      // Retain the room hint for temporary network/Realtime errors, not a dead membership.
      if (/Room unavailable/.test(error.message)) remember(null);
      throw error;
    } finally { busy = false; }
  }

  async function act(action) {
    if (!snapshot || !connected) throw new Error('Reconnect before changing the shared puzzle.');
    if (busy) throw new Error('Wait for the previous action.');
    busy = true;
    const epoch = sessionEpoch;
    try {
      const result = await rpc('btv_act', {
        p_room: snapshot.room.id, p_revision: snapshot.room.revision,
        p_action: action.type, p_rune: action.runeId ?? null
      });
      if (epoch !== sessionEpoch) throw new Error('Room changed while the action was pending.');
      const accepted = apply(result.snapshot);
      return { type: accepted ? result.type : 'stale', state: snapshot.state };
    } finally { busy = false; }
  }

  async function ping({ position, target }) {
    if (!snapshot || !connected) throw new Error('Reconnect before pinging.');
    const epoch = sessionEpoch;
    const payload = await rpc('btv_ping', { p_room: snapshot.room.id,
      p_generation: snapshot.room.generation, p_x: position[0], p_y: position[1],
      p_z: position[2], p_target: target ?? null });
    // Show locally too; the marker layer deduplicates the server broadcast.
    if (epoch === sessionEpoch) onPing(payload);
  }

  async function leave() {
    if (busy) throw new Error('Wait for the pending request before leaving.');
    if (snapshot) await rpc('btv_leave_room', { p_room: snapshot.room.id });
    remember(null);
    await detach();
  }

  return { connect, resume, act, ping, leave, refresh,
    getSnapshot: () => snapshot, getUserId: () => userId,
    isConnected: () => connected, isBusy: () => busy };
}
