import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createChamber } from '../src/scene.js';
import { createControls } from '../src/controls.js';
import { createInteractions } from '../src/interactions.js';
import { RUNE_SEQUENCE } from '../src/puzzle.js';

function createTestUI() {
  return {
    hint: '', clues: '', target: '', notice: null, completed: false,
    setHint(text) { this.hint = text; },
    setClues(text) { this.clues = text; },
    setTarget(text) { this.target = text; },
    setProgress(state) { this.progress = state; },
    showNotice(title, description) { this.notice = { title, description }; },
    hideNotice() { this.notice = null; },
    isNoticeOpen() { return this.notice !== null; },
    isComplete() { return this.completed; },
    showCompletion() { this.completed = true; this.notice = null; },
    resetPuzzle() { this.completed = false; this.clues = ''; this.notice = null; }
  };
}

function createLocalGame() {
  const chamber = createChamber();
  const ui = createTestUI();
  const interactions = createInteractions({ ...chamber, ui });
  const target = type => chamber.interactables.find(object => object.userData.type === type);
  const rune = id => chamber.runes.find(object => object.userData.runeId === id);
  return { ...chamber, ui, ...interactions, target, rune };
}

function readyGame(game) {
  game.inspect(game.target('chart'));
  for (const runeId of RUNE_SEQUENCE) game.inspect(game.rune(runeId));
}

test('chamber retains its architecture and every interaction target is rendered', () => {
  const { scene, interactables, runes, ringGroup } = createChamber();
  assert.equal(scene.getObjectByName('floor').geometry.parameters.width, 12);
  assert.deepEqual(scene.getObjectByName('sealed door').position.toArray(), [0, 2, -5.72]);
  assert.equal(scene.children.filter(object => object.name === 'pillar').length, 4);
  assert.equal(scene.children.filter(object => object.isPointLight).length, 4);
  assert.equal(ringGroup.children.length, 4);
  assert.equal(interactables.length, 6);
  for (const object of interactables) {
    assert.equal(object.parent, scene);
    assert.equal(object.visible, true);
  }
  assert.deepEqual(runes.map(rune => rune.userData.runeId), ['river', 'gate', 'crown']);
  assert.ok(runes.every(rune => rune.children[1].children.length > 0));
});

test('rune activation changes only the correct glyph and a wrong order resets the visuals', () => {
  const game = createLocalGame();
  const crown = game.rune('crown').children[1].children[0];
  const river = game.rune('river').children[1].children[0];
  const originalMaterial = crown.material;
  game.inspect(game.target('chart'));
  game.inspect(game.rune('crown'));
  assert.notEqual(crown.material, originalMaterial);
  assert.equal(river.material, originalMaterial);
  game.inspect(game.rune('gate'));
  assert.equal(crown.material, originalMaterial);
  assert.deepEqual(game.ui.progress.activated, []);
  assert.match(game.ui.notice.description, /wrong order/);
  assert.match(game.ui.clues, /Crown → River → Gate/);
});

test('chart inspection records a readable clue and premature alignment gives useful feedback', () => {
  const game = createLocalGame();
  game.inspect(game.ringGroup);
  assert.match(game.ui.notice.description, /star chart/);
  game.inspect(game.target('chart'));
  assert.match(game.ui.clues, /Crown → River → Gate/);
  game.inspect(game.rune('crown'));
  game.inspect(game.ringGroup);
  assert.match(game.ui.notice.description, /current rune progress is unchanged/);
  assert.deepEqual(game.getState().activated, ['crown']);
});

test('alignment opens the doorway, but inspecting it cannot complete the chamber', () => {
  const game = createLocalGame();
  readyGame(game);
  assert.equal(game.door.visible, true);
  game.inspect(game.ringGroup);
  assert.equal(game.door.visible, false);
  assert.equal(game.exit.userData.title, 'Open Exit');
  assert.equal(game.ui.isComplete(), false);
  assert.notEqual(game.ringGroup.rotation.y, 0);
  game.inspect(game.exit);
  assert.equal(game.getState().completed, false);
  assert.match(game.ui.notice.description, /Walk through/);
  game.crossExit();
  assert.equal(game.getState().completed, true);
  assert.equal(game.ui.isComplete(), true);
});

test('replay restores the seal, runes, orrery, journal, and completion state', () => {
  const game = createLocalGame();
  const originalMaterial = game.rune('crown').children[1].children[0].material;
  readyGame(game);
  game.inspect(game.ringGroup);
  game.crossExit();
  game.reset();
  assert.equal(game.door.visible, true);
  assert.equal(game.exit.userData.title, 'Sealed Exit');
  assert.equal(game.ringGroup.rotation.y, 0);
  assert.equal(game.rune('crown').children[1].children[0].material, originalMaterial);
  assert.equal(game.ui.clues, '');
  assert.equal(game.ui.isComplete(), false);
  assert.equal(game.getState().chartDiscovered, false);
});

function createControlHarness(t, {
  scene, interactables = [], ui = createTestUI(), onInspect, isExitOpen, onExit
} = {}) {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const document = new EventTarget();
  document.pointerLockElement = null;
  Object.defineProperty(globalThis, 'document', { value: document, configurable: true });
  t.after(() => {
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else delete globalThis.document;
  });

  const canvas = new EventTarget();
  canvas.requestPointerLock = () => { document.pointerLockElement = canvas; };
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  camera.position.set(0, 1.65, 5);
  const inspected = [];
  const controls = createControls({
    camera, canvas, scene, interactables, ui, isExitOpen, onExit,
    onInspect: onInspect ?? (object => {
      inspected.push(object);
      ui.showNotice(object.userData.title, object.userData.description);
    })
  });

  function send(type, properties = {}) {
    document.dispatchEvent(Object.assign(new Event(type), properties));
  }

  function press(code) {
    send('keydown', { code });
    send('keyup', { code });
  }

  return { document, canvas, camera, ui, controls, inspected, send, press };
}

test('movement requires entry and pointer lock', t => {
  const { document, camera, controls, send } = createControlHarness(t);
  send('keydown', { code: 'KeyW' });
  controls.update();
  assert.equal(camera.position.z, 5);
  controls.enter();
  document.pointerLockElement = null;
  send('keydown', { code: 'KeyW' });
  controls.update();
  assert.equal(camera.position.z, 5);
});

test('movement is frame-rate-independent with normalized diagonals', t => {
  const { camera, controls, send } = createControlHarness(t);
  controls.enter();
  const start = camera.position.clone();
  function move(frames) {
    send('keydown', { code: 'KeyW' });
    send('keydown', { code: 'KeyD' });
    for (let i = 0; i < frames; i++) controls.update(1 / frames);
    send('keyup', { code: 'KeyW' });
    send('keyup', { code: 'KeyD' });
    assert.ok(Math.abs(camera.position.distanceTo(start) - 3) < 1e-10);
  }
  move(30);
  controls.restart();
  move(120);
});

test('movement stays within the chamber and large frame delays are capped', t => {
  const { camera, controls, send } = createControlHarness(t);
  controls.enter();
  send('keydown', { code: 'KeyW' });
  controls.update(10);
  assert.ok(Math.abs(camera.position.z - 4.88) < 1e-10);
  for (let i = 0; i < 300; i++) controls.update();
  assert.equal(camera.position.z, -5.4);
  assert.equal(camera.position.y, 1.65);
});

test('mouse look requires pointer lock and clamps pitch', t => {
  const { camera, controls, send } = createControlHarness(t);
  send('mousemove', { movementX: 100, movementY: 10000 });
  assert.equal(camera.rotation.y, 0);
  controls.enter();
  send('mousemove', { movementX: 100, movementY: 10000 });
  assert.equal(camera.rotation.y, -0.2);
  assert.equal(camera.rotation.x, -1.35);
});

test('notices pause movement/look, repeated E is ignored, and hints are preserved', t => {
  const target = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  target.position.set(0, 1.65, 3);
  target.userData = { interactable: true, title: 'Test artifact', description: 'A clue.' };
  target.updateMatrixWorld();
  const { ui, camera, controls, inspected, send, press } = createControlHarness(t, { interactables: [target] });
  controls.enter();
  ui.setHint('Persistent progress feedback');
  controls.update();
  assert.equal(ui.target, 'Press E: Test artifact');
  assert.equal(ui.hint, 'Persistent progress feedback');
  press('KeyE');
  assert.equal(inspected.length, 1);
  const position = camera.position.clone();
  send('keydown', { code: 'KeyW' });
  send('mousemove', { movementX: 50, movementY: 50 });
  send('keydown', { code: 'KeyE', repeat: true });
  controls.update();
  assert.equal(ui.isNoticeOpen(), true);
  assert.deepEqual(camera.position, position);
  assert.equal(camera.rotation.y, 0);
  press('KeyE');
  controls.update();
  assert.equal(ui.isNoticeOpen(), false);
  assert.equal(inspected.length, 1);
  assert.deepEqual(camera.position, position);
});

test('pointer unlock and page visibility changes clear held movement keys', t => {
  const { document, canvas, camera, controls, send } = createControlHarness(t);
  controls.enter();
  send('keydown', { code: 'KeyW' });
  document.pointerLockElement = null;
  send('pointerlockchange');
  document.pointerLockElement = canvas;
  controls.update();
  assert.equal(camera.position.z, 5);
  send('keydown', { code: 'KeyW' });
  send('visibilitychange');
  controls.update();
  assert.equal(camera.position.z, 5);
});

test('solid scenery blocks inspection while invisible scenery does not', t => {
  const scene = new THREE.Scene();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.2));
  wall.position.set(0, 1.65, 4);
  const target = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.2));
  target.position.set(0, 1.65, 3);
  target.userData = { interactable: true, title: 'Hidden artifact' };
  scene.add(wall, target);
  const { controls, inspected, press } = createControlHarness(t, { scene });
  controls.enter();
  press('KeyE');
  assert.equal(inspected.length, 0);
  wall.visible = false;
  press('KeyE');
  assert.equal(inspected.length, 1);
});

test('completion blocks input and replay resets position and view', t => {
  const { ui, camera, controls, send } = createControlHarness(t);
  controls.enter();
  ui.showCompletion();
  send('keydown', { code: 'KeyW' });
  send('mousemove', { movementX: 50, movementY: 50 });
  controls.update();
  assert.equal(camera.position.z, 5);
  assert.equal(camera.rotation.y, 0);
  camera.position.set(3, 1.65, -3);
  ui.resetPuzzle();
  controls.restart();
  assert.deepEqual(camera.position.toArray(), [0, 1.65, 5]);
  assert.equal(camera.rotation.y, 0);
});

test('distant objects cannot be inspected', t => {
  const target = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  target.userData = { interactable: true, title: 'Distant artifact' };
  target.updateMatrixWorld();
  const { controls, inspected, press } = createControlHarness(t, { interactables: [target] });
  controls.enter();
  press('KeyE');
  assert.equal(inspected.length, 0);
});

test('the sealed doorway blocks walking and cannot trigger completion', t => {
  const game = createLocalGame();
  const { camera, controls, send } = createControlHarness(t, {
    ui: game.ui, isExitOpen: () => game.getState().unlocked, onExit: game.crossExit
  });
  controls.enter();
  camera.position.set(0, 1.65, -5.3);
  send('keydown', { code: 'KeyW' });
  for (let i = 0; i < 60; i++) controls.update();
  assert.equal(camera.position.z, -5.4);
  assert.equal(game.getState().completed, false);
  assert.equal(game.crossExit(), false);
  assert.equal(game.ui.isComplete(), false);
});

test('walking through an unlocked doorway completes only after crossing its threshold', t => {
  const game = createLocalGame();
  readyGame(game);
  game.inspect(game.ringGroup);
  game.ui.hideNotice();
  const { camera, controls, send } = createControlHarness(t, {
    ui: game.ui, isExitOpen: () => game.getState().unlocked, onExit: game.crossExit
  });
  controls.enter();
  camera.position.set(0, 1.65, -5.3);
  send('keydown', { code: 'KeyW' });
  for (let i = 0; i < 10; i++) controls.update();
  assert.ok(camera.position.z < -5.4);
  assert.ok(camera.position.z > -6.25);
  assert.equal(game.ui.isComplete(), false);
  for (let i = 0; i < 30; i++) controls.update();
  assert.ok(camera.position.z <= -6.25);
  assert.equal(game.getState().completed, true);
  assert.equal(game.ui.isComplete(), true);
});

for (const x of [-1.2, 1.2]) {
  test(`unlocking the doorway does not allow passing through the adjacent wall at x=${x}`, t => {
    let crossings = 0;
    const { camera, controls, send } = createControlHarness(t, {
      isExitOpen: () => true, onExit: () => { crossings++; }
    });
    controls.enter();
    camera.position.set(x, 1.65, -5.3);
    send('keydown', { code: 'KeyW' });
    for (let i = 0; i < 60; i++) controls.update();
    assert.equal(camera.position.z, -5.4);
    assert.equal(crossings, 0);
  });
}

test('the passage sides block sideways movement and still allow returning to the room', t => {
  const { camera, controls, send } = createControlHarness(t, { isExitOpen: () => true });
  controls.enter();
  camera.position.set(0, 1.65, -5.8);
  send('keydown', { code: 'KeyD' });
  for (let i = 0; i < 60; i++) controls.update();
  send('keyup', { code: 'KeyD' });
  assert.equal(camera.position.x, 1.1);
  assert.equal(camera.position.z, -5.8);
  send('keydown', { code: 'KeyS' });
  for (let i = 0; i < 20; i++) controls.update();
  send('keyup', { code: 'KeyS' });
  assert.ok(camera.position.z > -5.4);
  send('keydown', { code: 'KeyD' });
  for (let i = 0; i < 20; i++) controls.update();
  assert.ok(camera.position.x > 1.1);
});

test('diagonal approaches cannot cut through the wall beside the open doorway', t => {
  let crossings = 0;
  const { camera, controls, send } = createControlHarness(t, {
    isExitOpen: () => true, onExit: () => { crossings++; }
  });
  controls.enter();
  camera.position.set(1.08, 1.65, -5.35);
  send('keydown', { code: 'KeyW' });
  send('keydown', { code: 'KeyD' });
  for (let i = 0; i < 30; i++) controls.update();
  assert.equal(camera.position.z, -5.4);
  assert.equal(crossings, 0);
});

test('threshold completion fires once and the far end of the passage remains bounded', t => {
  let crossings = 0;
  const { camera, controls, send } = createControlHarness(t, {
    isExitOpen: () => true, onExit: () => { crossings++; }
  });
  controls.enter();
  camera.position.set(0, 1.65, -6.2);
  send('keydown', { code: 'KeyW' });
  for (let i = 0; i < 5; i++) controls.update();
  assert.equal(crossings, 1);
  send('keydown', { code: 'KeyW' });
  for (let i = 0; i < 60; i++) controls.update();
  assert.equal(camera.position.z, -7.1);
  assert.equal(crossings, 1);
});

test('replay restores the movement barrier as well as resetting the player', t => {
  const game = createLocalGame();
  readyGame(game);
  game.inspect(game.ringGroup);
  game.crossExit();
  const { camera, controls, send } = createControlHarness(t, {
    ui: game.ui, isExitOpen: () => game.getState().unlocked, onExit: game.crossExit
  });
  game.reset();
  controls.restart();
  assert.deepEqual(camera.position.toArray(), [0, 1.65, 5]);
  camera.position.set(0, 1.65, -5.3);
  send('keydown', { code: 'KeyW' });
  for (let i = 0; i < 60; i++) controls.update();
  assert.equal(camera.position.z, -5.4);
  assert.equal(game.door.visible, true);
  assert.equal(game.ui.isComplete(), false);
});

test('the chamber can be solved through real scene raycasts and walking through the exit', t => {
  const game = createLocalGame();
  const { camera, controls, press, send } = createControlHarness(t, {
    scene: game.scene, ui: game.ui, onInspect: game.inspect,
    isExitOpen: () => game.getState().unlocked, onExit: game.crossExit
  });
  controls.enter();
  function inspectFrom(position, target) {
    camera.position.set(...position);
    camera.lookAt(target);
    controls.update();
    assert.notEqual(game.ui.target, '');
    press('KeyE');
    if (!game.ui.isComplete()) press('KeyE');
  }
  inspectFrom([-3, 1.65, -2.5], new THREE.Vector3(-5.72, 1.65, -2.5));
  for (const runeId of RUNE_SEQUENCE) {
    const rune = game.rune(runeId);
    inspectFrom([3, 1.65, rune.position.z], rune.position);
  }
  inspectFrom([0, 1.65, 3], game.ringGroup.position);
  inspectFrom([0, 1.65, -4.5], new THREE.Vector3(0, 1.65, -7.4));
  assert.equal(game.ui.isComplete(), false);
  send('keydown', { code: 'KeyW' });
  for (let i = 0; i < 60; i++) controls.update();
  assert.equal(game.getState().completed, true);
  assert.equal(game.ui.isComplete(), true);
});
