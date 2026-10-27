import { RUNE_LABELS } from './puzzle.js';

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
  <section class="overlay brand">
    <h1>BEYOND THE VEIL</h1>
    <div class="muted">CHAPTER I · THE THIRTEENTH BELL</div>
  </section>
  <section class="overlay party">
    <h2>YOUR PARTY · DEMO</h2>
    <div id="members"></div>
    <div class="muted">Local prototype — multiplayer comes next.</div>
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
      <p class="muted">Local puzzle playtest · progress is not saved.</p>
    </div>
  </section>
  <section id="start">
    <div class="start-card">
      <div class="muted">A COOPERATIVE FANTASY ESCAPE ROOM</div>
      <h1>Beyond the Veil</h1>
      <p>You awaken beneath an unfamiliar sky. A celestial mechanism hums in the darkness. Somewhere beyond this chamber lies the path home.</p>
      <p>Read the star chart on the west (left-hand) wall. Use its clue to activate the three runes on the east wall in order, then align the central orrery and leave through the northern exit.</p>
      <p class="muted">An incorrect rune resets the sequence; you can retry freely. Repeating an active rune is safe. Classes are cosmetic in this local playtest; multiplayer comes later.</p>
      <div id="classes"></div>
      <button id="enter">Enter the chamber</button>
      <p class="muted">Desktop prototype · WASD to move · Mouse to look · E to inspect</p>
    </div>
  </section>
`;

  let selectedClass = 'Mage';
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

  app.querySelector('#members').innerHTML = classes.map(
    ([name, item]) =>
      `<div class="member"><span>${name}<small>${item}</small></span><span>◇</span></div>`
  ).join('');

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

  return {
    canvas: app.querySelector('#world'),
    setHint,
    setTarget,
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
        : state.unlocked ? 'Leave through the glowing northern doorway (E)'
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
