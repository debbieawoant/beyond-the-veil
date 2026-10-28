import { RUNE_LABELS } from './puzzle.js';
import { PLAYER_COLORS } from './pings.js';

const classes = [
  ['Mage', 'Aether Lens', 'Reveal hidden magical traces'],
  ['Paladin', 'Oathbound Shield', 'Stabilize enchanted mechanisms'],
  ['Warrior', 'Runebreaker Gauntlet', 'Operate heavy mechanisms'],
  ['Rogue', 'Whisperpick', 'Discover concealed catches']
];

export function createUI(app) {
  app.innerHTML = `
  <canvas id="world"></canvas>
  <div id="crosshair" class="hidden" aria-hidden="true">+</div>
  <div id="pings" aria-live="polite"></div>
  <section class="overlay brand">
    <h1>BEYOND THE VEIL</h1>
    <div class="muted">CHAPTER I · THE THIRTEENTH BELL</div>
  </section>
  <section class="overlay party">
    <h2 id="party-title">SOLO PLAYTEST</h2>
    <div id="members"></div>
    <div id="room-code-display"></div>
    <div id="network-status" class="muted">Local puzzle · no connection needed</div>
    <button id="reset-room" class="hidden">Restart shared puzzle</button>
    <button id="leave-room" class="hidden">Leave room</button>
  </section>
  <section class="overlay journal">
    <h2>FIELD JOURNAL</h2>
    <div id="clues">No discoveries yet. Inspect the chamber.</div>
  </section>
  <section class="overlay objective">
    <strong id="objective">Read the star chart on the west wall</strong>
    <div id="progress">Runes: 0 / 3</div>
    <div id="hint" aria-live="polite">Find the glowing brass chart on the left-hand wall.</div>
    <div id="target"></div>
  </section>
  <section id="notice" class="hidden" role="dialog" aria-modal="true" aria-labelledby="notice-title">
    <h2 id="notice-title"></h2>
    <p id="notice-description"></p>
    <button id="close-notice">Continue exploring (E)</button>
  </section>
  <section id="complete" class="hidden" role="dialog" aria-modal="true" aria-labelledby="complete-title">
    <div class="start-card">
      <div class="muted">CHAPTER I · THE THIRTEENTH BELL</div>
      <h1 id="complete-title">Beyond the seal</h1>
      <p>You deciphered the chart, awakened the three signs, and opened the way beyond the veil.</p>
      <p><strong>Chamber complete.</strong> Elarion's remaining mysteries await.</p>
      <button id="restart">Play again</button>
      <p id="completion-status" role="status"></p>
      <p id="completion-note" class="muted">Local puzzle playtest · progress is not saved.</p>
    </div>
  </section>
  <section id="start">
    <div class="start-card">
      <div class="muted">A COOPERATIVE FANTASY ESCAPE ROOM</div>
      <h1>Beyond the Veil</h1>
      <p>You awaken beneath an unfamiliar sky. A celestial mechanism hums in the darkness. Somewhere beyond this chamber lies the path home.</p>
      <p>Read the star chart on the west (left-hand) wall. Use its clue to activate the three runes on the east wall in order, then align the central orrery and walk through the northern exit to complete the chamber.</p>
      <p class="muted">An incorrect rune resets the sequence; you can retry freely. Repeating an active rune is safe. Classes are cosmetic. In rooms, the journal and puzzle are shared; each player walks through the exit.</p>
      <div id="classes"></div>
      <div class="room-setup">
        <label for="player-name">Display name</label>
        <input id="player-name" maxlength="24" autocomplete="nickname" placeholder="Adventurer">
        <button id="create-room">Create room</button>
        <label for="room-code">Room code</label>
        <input id="room-code" maxlength="8" autocomplete="off" spellcheck="false" placeholder="8 characters">
        <button id="join-room">Join room</button>
        <button id="lobby-leave-room" class="hidden">Leave room</button>
        <div id="lobby-status" role="status">Multiplayer configuration is loading…</div>
      </div>
      <button id="enter">Play solo</button>
      <p class="muted">Desktop · WASD to move · Mouse to look · E to inspect · Q / middle mouse to ping</p>
    </div>
  </section>
`;

  let selectedClass = 'Mage';
  let busy = false;
  let multiplayerConfigured = false;
  let roomActive = false;
  let roomConnected = false;
  let lobbyBusy = false;
  const classRoot = app.querySelector('#classes');

  classRoot.innerHTML = `
  <select id="class-choice" aria-label="Choose character class"
    style="padding:12px;width:100%;background:#252b37;color:#eee;border:1px solid #8d754b;border-radius:6px">
    ${classes.map(([name]) =>
      `<option value="${name}">${name}</option>`).join('')}
  </select>
`;

  app.querySelector('#class-choice').addEventListener('change', e => {
    selectedClass = e.target.value;
  });

  app.querySelector('#members').textContent = 'Only you · classes have no special abilities yet.';

  const notice = app.querySelector('#notice');
  const hint = app.querySelector('#hint');
  const clues = app.querySelector('#clues');
  const target = app.querySelector('#target');
  const crosshair = app.querySelector('#crosshair');
  const complete = app.querySelector('#complete');

  function setHint(text) {
    hint.textContent = text;
  }

  function setTarget(text) {
    if (target.textContent !== text) target.textContent = text;
  }

  function hideNotice() {
    notice.classList.add('hidden');
    if (complete.classList.contains('hidden')) crosshair.classList.remove('hidden');
  }

  app.querySelector('#close-notice').addEventListener('click', hideNotice);

  function updateLobbyButtons() {
    for (const id of ['create-room', 'join-room']) {
      app.querySelector(`#${id}`).disabled = !multiplayerConfigured || roomActive || lobbyBusy;
    }
    app.querySelector('#enter').disabled = lobbyBusy || (roomActive && !roomConnected);
  }

  function setRoom(snapshot, userId) {
    roomActive = !!snapshot;
    const me = snapshot?.members.find(member => member.id === userId);
    if (me) {
      selectedClass = me.characterClass;
      app.querySelector('#class-choice').value = selectedClass;
      app.querySelector('#player-name').value = me.name;
      app.querySelector('#room-code').value = snapshot.room.code;
    }
    app.querySelector('#class-choice').disabled = roomActive;
    app.querySelector('#player-name').readOnly = roomActive;
    app.querySelector('#room-code').readOnly = roomActive;
    app.querySelector('#party-title').textContent = snapshot ? 'YOUR PARTY' : 'SOLO PLAYTEST';
    app.querySelector('#room-code-display').textContent = snapshot ? `Room: ${snapshot.room.code}` : '';
    app.querySelector('#enter').textContent = snapshot ? 'Enter room' : 'Play solo';
    app.querySelector('#leave-room').classList.toggle('hidden', !snapshot);
    app.querySelector('#lobby-leave-room').classList.toggle('hidden', !snapshot);
    const isHost = snapshot?.room.hostId === userId;
    app.querySelector('#reset-room').classList.toggle('hidden', !snapshot || !isHost);
    app.querySelector('#restart').disabled = !!snapshot && !isHost;
    app.querySelector('#restart').textContent = snapshot ? (isHost ? 'Restart shared puzzle' : 'Waiting for host to restart') : 'Play again';
    app.querySelector('#completion-note').textContent = snapshot
      ? 'You have finished. Teammates can still cross the exit. Only the host can restart for everyone.'
      : 'Local puzzle playtest · progress is not saved.';
    const members = app.querySelector('#members');
    members.replaceChildren();
    if (!snapshot) members.textContent = 'Only you · classes have no special abilities yet.';
    for (const member of snapshot?.members ?? []) {
      const row = document.createElement('div');
      row.className = 'member';
      row.style.color = PLAYER_COLORS[member.slot];
      const label = document.createElement('span');
      label.textContent = `${member.name}${member.id === userId ? ' (you)' : ''}${member.id === snapshot.room.hostId ? ' · host' : ''}`;
      const detail = document.createElement('small');
      detail.textContent = `${member.characterClass} · ${member.completed ? 'finished' : Date.now() - Date.parse(member.lastSeen) < 45_000 ? 'connected' : 'away'}`;
      label.append(detail);
      row.append(label);
      members.append(row);
    }
    updateLobbyButtons();
  }

  return {
    canvas: app.querySelector('#world'),
    pingRoot: app.querySelector('#pings'),
    setHint,
    setTarget,
    setRoom,
    setBusy(value) { busy = value; },
    setCompletionStatus(text) { app.querySelector('#completion-status').textContent = text; },
    isBusy() { return busy; },
    configureMultiplayer(enabled) {
      multiplayerConfigured = enabled;
      app.querySelector('#lobby-status').textContent = enabled
        ? 'Private testing: create a room or join using a code. Turnstile is deferred.'
        : 'Multiplayer needs .env.local settings. Solo mode is available.';
      updateLobbyButtons();
    },
    setLobbyStatus(text) { app.querySelector('#lobby-status').textContent = text; },
    setLobbyBusy(value) { lobbyBusy = value; updateLobbyButtons(); },
    setConnectionStatus(text, connected) {
      roomConnected = connected;
      app.querySelector('#network-status').textContent = text;
      updateLobbyButtons();
    },
    showStart() {
      app.querySelector('#start').classList.remove('hidden');
      complete.classList.add('hidden');
      notice.classList.add('hidden');
      crosshair.classList.add('hidden');
      document.exitPointerLock?.();
    },
    onConnect(callback) {
      for (const kind of ['create', 'join']) {
        app.querySelector(`#${kind}-room`).addEventListener('click', () => callback(kind, {
          name: app.querySelector('#player-name').value, characterClass: selectedClass,
          code: app.querySelector('#room-code').value
        }));
      }
    },
    onLeave(callback) {
      for (const id of ['leave-room', 'lobby-leave-room']) app.querySelector(`#${id}`).addEventListener('click', callback);
    },
    onRoomReset(callback) { app.querySelector('#reset-room').addEventListener('click', callback); },
    setClues(text) {
      clues.textContent = text;
    },
    showNotice(title, description) {
      app.querySelector('#notice-title').textContent = title;
      app.querySelector('#notice-description').textContent = description;
      notice.classList.remove('hidden');
      crosshair.classList.add('hidden');
      setTarget('');
    },
    hideNotice,
    isNoticeOpen() {
      return !notice.classList.contains('hidden');
    },
    isComplete() {
      return !complete.classList.contains('hidden');
    },
    setProgress(state) {
      const sequence = state.activated.map(id => RUNE_LABELS[id]).join(' → ');
      app.querySelector('#progress').textContent =
        `Runes: ${state.activated.length} / 3${sequence ? ` · ${sequence}` : ''}`;
      app.querySelector('#objective').textContent = state.completed ? 'Chapter I complete'
        : state.unlocked ? 'Walk through the glowing northern doorway'
        : state.activated.length === 3 ? 'Align the central celestial orrery (E)'
        : state.chartDiscovered ? 'Activate the runes in the chart\'s order (E)'
        : 'Read the star chart on the west wall (E)';
    },
    showCompletion() {
      notice.classList.add('hidden');
      complete.classList.remove('hidden');
      crosshair.classList.add('hidden');
      setTarget('');
      document.exitPointerLock?.();
      app.querySelector('#restart').focus();
    },
    resetPuzzle() {
      app.querySelector('#completion-status').textContent = '';
      complete.classList.add('hidden');
      hideNotice();
      clues.textContent = 'No discoveries yet. Inspect the chamber.';
      setHint('Find the glowing brass star chart on the west (left-hand) wall.');
      setTarget('');
    },
    onRestart(callback) {
      app.querySelector('#restart').addEventListener('click', callback);
    },
    onEnter(callback) {
      app.querySelector('#enter').addEventListener('click', () => {
        app.querySelector('#start').classList.add('hidden');
        crosshair.classList.remove('hidden');
        setHint(`${selectedClass} selected. Find and read the glowing star chart on the west (left-hand) wall.`);
        callback();
      });
    }
  };
}
