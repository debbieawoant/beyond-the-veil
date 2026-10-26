
import * as THREE from 'three';
import './style.css';

const app = document.querySelector('#app');

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

const classes = [
  ['Mage', 'Aether Lens', 'Reveal hidden magical traces'],
  ['Paladin', 'Oathbound Shield', 'Stabilize enchanted mechanisms'],
  ['Warrior', 'Runebreaker Gauntlet', 'Operate heavy mechanisms'],
  ['Rogue', 'Whisperpick', 'Discover concealed catches']
];

let selectedClass = 'Mage';
const classRoot = document.querySelector('#classes');

classRoot.innerHTML = `
  <select id="class-choice" aria-label="Choose character class"
    style="padding:12px;width:100%;background:#252b37;color:#eee;border:1px solid #8d754b;border-radius:6px">
    ${classes.map(([name]) =>
      `<option value="${name}">${name}</option>`).join('')}
  </select>
`;

document.querySelector('#class-choice').addEventListener('change', e => {
  selectedClass = e.target.value;
});

document.querySelector('#members').innerHTML = classes.map(
  ([name, item]) =>
    `<div class="member"><span>${name}<small>${item}</small></span><span>◇</span></div>`
).join('');

const canvas = document.querySelector('#world');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#111722');
scene.fog = new THREE.FogExp2('#111722', 0.035);

const camera = new THREE.PerspectiveCamera(
  75, innerWidth / innerHeight, 0.1, 100
);
camera.position.set(0, 1.65, 5);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

scene.add(new THREE.HemisphereLight('#a7c6e8', '#33251b', 2));

const moonlight = new THREE.DirectionalLight('#9dbdff', 2.5);
moonlight.position.set(4, 8, 5);
moonlight.castShadow = true;
scene.add(moonlight);

function material(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    ...extra
  });
}

const stone = material('#44434a');
const darkStone = material('#242832');
const brass = material('#a9874f', { metalness: 0.75, roughness: 0.3 });
const glow = new THREE.MeshStandardMaterial({
  color: '#5dddf4',
  emissive: '#1bbedf',
  emissiveIntensity: 2.5,
  roughness: 0.25,
  metalness: 0.2
});

function box(name, x, y, z, sx, sy, sz, mat) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz), mat
  );
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// Chamber floor and ceiling
box('floor', 0, -0.15, 0, 12, 0.3, 12, darkStone);
box('ceiling', 0, 5, 0, 12, 0.3, 12, darkStone);

// Four enclosing walls
box('north wall', 0, 2.4, -6, 12, 5, 0.4, stone);
box('south wall', 0, 2.4, 6, 12, 5, 0.4, stone);
box('west wall', -6, 2.4, 0, 0.4, 5, 12, stone);
box('east wall', 6, 2.4, 0, 0.4, 5, 12, stone);

// Architectural pillars
for (const x of [-4.7, 4.7]) {
  for (const z of [-4.7, 4.7]) {
    box('pillar', x, 2.3, z, 0.65, 4.6, 0.65, darkStone);
    box('pillar capital', x, 4.5, z, 0.9, 0.25, 0.9, brass);
  }
}

// Ancient door and surrounding frame
box('sealed door', 0, 2, -5.72, 2.8, 3.8, 0.3, darkStone);
box('door frame left', -1.65, 2.1, -5.5, 0.25, 4.2, 0.5, brass);
box('door frame right', 1.65, 2.1, -5.5, 0.25, 4.2, 0.5, brass);
box('door frame top', 0, 4.2, -5.5, 3.5, 0.25, 0.5, brass);

// Central celestial puzzle pedestal
box('pedestal', 0, 0.55, 0, 1.7, 1.1, 1.7, darkStone);

const interactables = [];

function addInteractable(name, description, x, y, z, mesh) {
  mesh.position.set(x, y, z);
  mesh.userData.interactable = true;
  mesh.userData.title = name;
  mesh.userData.description = description;
  interactables.push(mesh);
  return mesh;
}

// Rotating celestial rings
const ringGroup = new THREE.Group();
ringGroup.position.set(0, 1.65, 0);

for (const radius of [0.42, 0.68, 0.92]) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.035, 10, 64),
    brass
  );
  ring.castShadow = true;
  ringGroup.add(ring);
}

const star = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.22),
  glow
);
star.position.set(0, 0, 0);
ringGroup.add(star);
scene.add(ringGroup);

ringGroup.userData.interactable = true;
ringGroup.userData.title = 'Celestial Orrery';
ringGroup.userData.description =
  'Three brass rings surround a luminous star. The rings seem to respond to touch.';
interactables.push(ringGroup);

// Magical runes
const runes = [];
for (let i = 0; i < 3; i++) {
  const rune = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.24),
    glow
  );
  addInteractable(
    `Rune ${i + 1}`,
    `An ancient rune glows with a faint blue light. Symbol ${i + 1} may be part of a sequence.`,
    -2 + i * 2, 1.6, -4.9, rune
  );
  runes.push(rune);
}

// A hidden clue near the wall
const clue = new THREE.Mesh(
  new THREE.BoxGeometry(0.45, 0.35, 0.06),
  brass
);
addInteractable(
  'Star Chart',
  'A weathered chart shows three constellations: the Crown, the River, and the Gate. Their order may matter.',
  -3.8, 1.5, -4.9, clue
);

// Warm magical lights
for (const [x, z] of [[-4, -2], [4, -2], [-4, 3], [4, 3]]) {
  const lamp = new THREE.PointLight('#e2a75f', 24, 7);
  lamp.position.set(x, 3.4, z);
  scene.add(lamp);

  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 12),
    new THREE.MeshBasicMaterial({ color: '#ffd28b' })
  );
  orb.position.copy(lamp.position);
  scene.add(orb);
}

// First-person movement
let yaw = 0;
let pitch = 0;
const keys = {};
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
let activeObject = null;
let entered = false;
let solvedRunes = 0;
let ringTurns = 0;

const notice = document.querySelector('#notice');
const hint = document.querySelector('#hint');
const clues = document.querySelector('#clues');

function showNotice(title, description) {
  notice.innerHTML = `<strong>${title}</strong><br><br>${description}<br><br><span class="muted">Press E to continue exploring</span>`;
  notice.classList.remove('hidden');
  activeObject = null;
}

function hideNotice() {
  notice.classList.add('hidden');
}

function lookAtCenter() {
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

canvas.addEventListener('click', () => {
  if (!entered || !notice.classList.contains('hidden')) return;
  canvas.requestPointerLock?.();
});

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== canvas) return;
});

document.addEventListener('mousemove', e => {
  if (document.pointerLockElement !== canvas) return;
  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;
  pitch = THREE.MathUtils.clamp(pitch, -1.35, 1.35);
  lookAtCenter();
});

document.addEventListener('keydown', e => {
  keys[e.code] = true;

  if (e.code === 'KeyE' && !notice.classList.contains('hidden')) {
    hideNotice();
    return;
  }

  if (e.code === 'KeyE' && activeObject) {
    interact(activeObject);
  }

  if (e.code === 'KeyE' && !activeObject) {
    hint.textContent = 'Look directly at a glowing object or mechanism.';
  }
});

document.addEventListener('keyup', e => {
  keys[e.code] = false;
});

function interact(object) {
  const title = object.userData.title;
  const description = object.userData.description;

  if (title === 'Celestial Orrery') {
    ringTurns++;
    ringGroup.rotation.y += Math.PI / 4;
    ringGroup.rotation.x += 0.08;

    if (ringTurns >= 3) {
      hint.textContent = 'The rings have shifted. Perhaps the runes hold another clue.';
    } else {
      hint.textContent = 'The brass rings rotate. Try examining the symbols around the chamber.';
    }
  }

  if (title.startsWith('Rune')) {
    const index = Number(title.split(' ')[1]) - 1;
    const rune = runes[index];

    rune.material = brass;
    solvedRunes = new Set(
      runes.filter(r => r.material === brass)
    ).size;

    hint.textContent = `${solvedRunes} of 3 runes activated. Find the star chart to learn their order.`;
  }

  if (title === 'Star Chart') {
    clues.textContent =
      'Star Chart discovered: Crown → River → Gate. The three runes may follow this sequence.';
    hint.textContent = 'A clue has been added to your journal.';
  }

  if (solvedRunes === 3 && ringTurns >= 3) {
    hint.textContent =
      'The mechanism stirs, but its correct sequence remains undiscovered.';
  }

  showNotice(title, description);
}

document.querySelector('#enter').addEventListener('click', () => {
  entered = true;
  document.querySelector('#start').classList.add('hidden');
  hint.textContent = `${selectedClass} selected. Explore the chamber and inspect the artifacts.`;
  canvas.requestPointerLock?.();
});

function animate() {
  requestAnimationFrame(animate);

  const speed = 3 * Math.min(0.04, 1 / 60);
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const movement = new THREE.Vector3();

  if (entered && document.pointerLockElement === canvas) {
    if (keys.KeyW) movement.add(forward);
    if (keys.KeyS) movement.sub(forward);
    if (keys.KeyD) movement.add(right);
    if (keys.KeyA) movement.sub(right);

    if (movement.lengthSq() > 0) {
      movement.normalize().multiplyScalar(speed);
      camera.position.add(movement);
    }

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -5.4, 5.4);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -5.4, 5.4);
    camera.position.y = 1.65;

    raycaster.setFromCamera(center, camera);
    const hits = raycaster.intersectObjects(interactables, true);

    activeObject = null;
    if (hits.length > 0 && hits[0].distance < 4) {
      let object = hits[0].object;
      while (object && !object.userData.interactable) {
        object = object.parent;
      }

      if (object?.userData.interactable) {
        activeObject = object;
        hint.textContent = `Press E to inspect: ${object.userData.title}`;
      }
    }
  }

  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
});

animate();
