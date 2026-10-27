import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createChamber } from '../src/scene.js';
import { createControls } from '../src/controls.js';
import { createInteractions } from '../src/interactions.js';

function createTestUI() {
  return {
    hint: '',
    clues: '',
    notice: null,
    setHint(text) { this.hint = text; },
    setClues(text) { this.clues = text; },
    showNotice(title, description) { this.notice = { title, description }; },
    hideNotice() { this.notice = null; },
    isNoticeOpen() { return this.notice !== null; }
  };
}

function createLocalGame() {
  const chamber = createChamber();
  const ui = createTestUI();
  const interactions = createInteractions({ ...chamber, ui });
  return { ...chamber, ui, ...interactions };
}

test('chamber retains the prototype geometry, lighting, and inspection targets', () => {
  const { scene, interactables, ringGroup } = createChamber();

  assert.deepEqual(scene.getObjectByName('floor').position.toArray(), [0, -0.15, 0]);
  assert.equal(scene.getObjectByName('floor').geometry.parameters.width, 12);
  assert.deepEqual(scene.getObjectByName('sealed door').position.toArray(), [0, 2, -5.72]);
  assert.equal(scene.children.filter(object => object.name === 'pillar').length, 4);
  assert.equal(scene.children.filter(object => object.isPointLight).length, 4);
  assert.equal(scene.children.filter(object => object.isDirectionalLight).length, 1);
  assert.equal(scene.children.filter(object => object.isHemisphereLight).length, 1);
  assert.equal(ringGroup.children.length, 4);
  assert.deepEqual(interactables.map(object => object.userData.title), [
    'Celestial Orrery', 'Rune 1', 'Rune 2', 'Rune 3', 'Star Chart'
  ]);
  assert.ok(interactables.every(object => object.userData.interactable));
});

test('chambers and local interaction state are independent', () => {
  const first = createLocalGame();
  const second = createLocalGame();

  first.inspect(first.runes[0]);
  first.inspect(first.ringGroup);

  assert.notEqual(first.runes[0].material, second.runes[0].material);
  assert.equal(second.ringGroup.rotation.y, 0);
  second.inspect(second.runes[1]);
  assert.match(second.ui.hint, /^1 of 3 runes activated/);
});

test('repeated rune inspection counts each rune only once', () => {
  const game = createLocalGame();

  game.inspect(game.runes[1]);
  game.inspect(game.runes[1]);
  assert.match(game.ui.hint, /^1 of 3 runes activated/);
  assert.equal(game.runes[1].material, game.brass);
  assert.equal(game.ui.notice.title, 'Rune 2');

  game.inspect(game.runes[0]);
  game.inspect(game.runes[2]);
  assert.match(game.ui.hint, /^3 of 3 runes activated/);
});

test('orrery inspection preserves rotation increments and hint progression', () => {
  const game = createLocalGame();

  game.inspect(game.ringGroup);
  assert.equal(game.ringGroup.rotation.y, Math.PI / 4);
  assert.equal(game.ringGroup.rotation.x, 0.08);
  assert.match(game.ui.hint, /^The brass rings rotate/);

  game.inspect(game.ringGroup);
  game.inspect(game.ringGroup);
  assert.equal(game.ringGroup.rotation.y, 3 * Math.PI / 4);
  assert.equal(game.ringGroup.rotation.x, 0.24);
  assert.match(game.ui.hint, /^The rings have shifted/);
});

test('star chart inspection records the existing journal clue and notice', () => {
  const game = createLocalGame();
  const chart = game.interactables.find(object => object.userData.title === 'Star Chart');

  game.inspect(chart);

  assert.equal(game.ui.clues,
    'Star Chart discovered: Crown → River → Gate. The three runes may follow this sequence.');
  assert.equal(game.ui.hint, 'A clue has been added to your journal.');
  assert.deepEqual(game.ui.notice, {
    title: chart.userData.title,
    description: chart.userData.description
  });
});

test('placeholder puzzle remains unfinished; the refactor adds no win condition', () => {
  const game = createLocalGame();
  const door = game.scene.getObjectByName('sealed door');
  const position = door.position.clone();

  for (const rune of game.runes) game.inspect(rune);
  for (let i = 0; i < 3; i++) game.inspect(game.ringGroup);

  assert.equal(game.ui.hint,
    'The mechanism stirs, but its correct sequence remains undiscovered.');
  assert.deepEqual(door.position, position);
  assert.equal(door.visible, true);
});

function createControlHarness(t, interactables = []) {
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
  camera.updateMatrixWorld();
  const ui = createTestUI();
  const inspected = [];
  const controls = createControls({
    camera, canvas, interactables, ui,
    onInspect(object) {
      inspected.push(object);
      ui.showNotice(object.userData.title, object.userData.description);
    }
  });

  function send(type, properties) {
    document.dispatchEvent(Object.assign(new Event(type), properties));
  }

  return { document, canvas, camera, ui, controls, inspected, send };
}

test('movement requires entry and pointer lock', t => {
  const { document, camera, controls, send } = createControlHarness(t);
  send('keydown', { code: 'KeyW' });
  controls.update();
  assert.equal(camera.position.z, 5);

  controls.enter();
  document.pointerLockElement = null;
  controls.update();
  assert.equal(camera.position.z, 5);
});

test('movement retains the baseline step size and normalized diagonals', t => {
  const { camera, controls, send } = createControlHarness(t);
  controls.enter();
  const start = camera.position.clone();
  send('keydown', { code: 'KeyW' });
  send('keydown', { code: 'KeyD' });
  for (let i = 0; i < 60; i++) controls.update();

  assert.ok(Math.abs(camera.position.distanceTo(start) - 3) < 1e-10);
  send('keyup', { code: 'KeyW' });
  send('keyup', { code: 'KeyD' });
  const stopped = camera.position.clone();
  controls.update();
  assert.deepEqual(camera.position, stopped);
});

test('movement remains bounded by the chamber walls', t => {
  const { camera, controls, send } = createControlHarness(t);
  controls.enter();
  send('keydown', { code: 'KeyW' });
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

  assert.equal(camera.rotation.order, 'YXZ');
  assert.equal(camera.rotation.y, -0.2);
  assert.equal(camera.rotation.x, -1.35);
});

test('nearby targeting, inspection, and dismissal remain wired together', t => {
  const target = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  target.position.set(0, 1.65, 3);
  target.userData = { interactable: true, title: 'Test artifact', description: 'A clue.' };
  target.updateMatrixWorld();
  const { ui, controls, inspected, send } = createControlHarness(t, [target]);
  controls.enter();
  controls.update();
  assert.equal(ui.hint, 'Press E to inspect: Test artifact');

  send('keydown', { code: 'KeyE' });
  assert.deepEqual(inspected, [target]);
  assert.equal(ui.isNoticeOpen(), true);
  send('keydown', { code: 'KeyE' });
  assert.equal(ui.isNoticeOpen(), false);
  assert.equal(inspected.length, 1);
});

test('distant objects cannot be inspected', t => {
  const target = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  target.userData = { interactable: true, title: 'Distant artifact' };
  target.updateMatrixWorld();
  const { controls, inspected, send } = createControlHarness(t, [target]);
  controls.enter();
  controls.update();
  send('keydown', { code: 'KeyE' });

  assert.equal(inspected.length, 0);
});
