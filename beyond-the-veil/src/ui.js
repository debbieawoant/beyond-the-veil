const classes = [
  ['Mage', 'Aether Lens', 'Reveal hidden magical traces'],
  ['Paladin', 'Oathbound Shield', 'Stabilize enchanted mechanisms'],
  ['Warrior', 'Runebreaker Gauntlet', 'Operate heavy mechanisms'],
  ['Rogue', 'Whisperpick', 'Discover concealed catches']
];

export function createUI(app) {
  app.innerHTML = `
  <canvas id="world"></canvas>
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
    <strong>Find a way out of the chamber</strong>
    <span id="hint">Look around and inspect the glowing objects.</span>
  </section>
  <div id="notice" class="hidden"></div>
  <section id="start">
    <div class="start-card">
      <div class="muted">A COOPERATIVE FANTASY ESCAPE ROOM</div>
      <h1>Beyond the Veil</h1>
      <p>You awaken beneath an unfamiliar sky. A celestial mechanism hums in the darkness. Somewhere beyond this chamber lies the path home.</p>
      <p>Choose a class, enter the chamber, and investigate the ancient artifacts.</p>
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

  function setHint(text) {
    hint.textContent = text;
  }

  return {
    canvas: app.querySelector('#world'),
    setHint,
    setClues(text) {
      clues.textContent = text;
    },
    showNotice(title, description) {
      notice.innerHTML = `<strong>${title}</strong><br><br>${description}<br><br><span class="muted">Press E to continue exploring</span>`;
      notice.classList.remove('hidden');
    },
    hideNotice() {
      notice.classList.add('hidden');
    },
    isNoticeOpen() {
      return !notice.classList.contains('hidden');
    },
    onEnter(callback) {
      app.querySelector('#enter').addEventListener('click', () => {
        app.querySelector('#start').classList.add('hidden');
        setHint(`${selectedClass} selected. Explore the chamber and inspect the artifacts.`);
        callback();
      });
    }
  };
}
