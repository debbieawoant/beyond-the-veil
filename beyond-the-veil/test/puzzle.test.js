import assert from 'node:assert/strict';
import test from 'node:test';
import { createPuzzle, RUNE_SEQUENCE } from '../src/puzzle.js';

function readyPuzzle() {
  const puzzle = createPuzzle();
  puzzle.act({ type: 'read-chart' });
  for (const runeId of RUNE_SEQUENCE) puzzle.act({ type: 'activate-rune', runeId });
  return puzzle;
}

test('initial state is locked and snapshots cannot mutate the puzzle', () => {
  const puzzle = createPuzzle();
  const snapshot = puzzle.getState();
  assert.deepEqual(snapshot, {
    chartDiscovered: false, activated: [], unlocked: false, completed: false
  });
  snapshot.activated.push('crown');
  snapshot.unlocked = true;
  assert.equal(puzzle.getState().activated.length, 0);
  assert.equal(puzzle.getState().unlocked, false);
});

test('reading the chart is required before activating runes or aligning the orrery', () => {
  const puzzle = createPuzzle();
  assert.equal(puzzle.act({ type: 'activate-rune', runeId: 'crown' }).type, 'need-chart');
  for (let i = 0; i < 5; i++) {
    assert.equal(puzzle.act({ type: 'align-orrery' }).type, 'need-chart');
  }
  assert.equal(puzzle.act({ type: 'exit' }).type, 'locked');
  assert.deepEqual(puzzle.getState().activated, []);
});

test('Crown, River, Gate readies the mechanism; alignment and exit are separate actions', () => {
  const puzzle = readyPuzzle();
  assert.equal(puzzle.getState().unlocked, false);
  assert.equal(puzzle.act({ type: 'exit' }).type, 'locked');
  assert.equal(puzzle.act({ type: 'align-orrery' }).type, 'unlocked');
  assert.equal(puzzle.getState().completed, false);
  assert.equal(puzzle.act({ type: 'exit' }).type, 'completed');
  assert.equal(puzzle.getState().completed, true);
});

for (const runeId of ['river', 'gate']) {
  test(`starting with ${runeId} rejects the order and preserves the discovered chart`, () => {
    const puzzle = createPuzzle();
    puzzle.act({ type: 'read-chart' });
    assert.equal(puzzle.act({ type: 'activate-rune', runeId }).type, 'wrong-order');
    assert.deepEqual(puzzle.getState().activated, []);
    assert.equal(puzzle.getState().chartDiscovered, true);
  });
}

test('a wrong second rune clears the sequence and allows a fresh successful attempt', () => {
  const puzzle = createPuzzle();
  puzzle.act({ type: 'read-chart' });
  puzzle.act({ type: 'activate-rune', runeId: 'crown' });
  assert.equal(puzzle.act({ type: 'activate-rune', runeId: 'gate' }).type, 'wrong-order');
  assert.deepEqual(puzzle.getState().activated, []);
  for (const runeId of RUNE_SEQUENCE) puzzle.act({ type: 'activate-rune', runeId });
  assert.equal(puzzle.act({ type: 'align-orrery' }).type, 'unlocked');
});

test('repeated active runes are idempotent at every stage', () => {
  const puzzle = createPuzzle();
  puzzle.act({ type: 'read-chart' });
  for (const runeId of RUNE_SEQUENCE) {
    puzzle.act({ type: 'activate-rune', runeId });
    const before = puzzle.getState();
    assert.equal(puzzle.act({ type: 'activate-rune', runeId }).type, 'already-active');
    assert.deepEqual(puzzle.getState(), before);
  }
});

test('early orrery use and rereading the chart preserve partial progress', () => {
  const puzzle = createPuzzle();
  puzzle.act({ type: 'read-chart' });
  puzzle.act({ type: 'activate-rune', runeId: 'crown' });
  const before = puzzle.getState();
  assert.equal(puzzle.act({ type: 'align-orrery' }).type, 'not-ready');
  puzzle.act({ type: 'read-chart' });
  assert.deepEqual(puzzle.getState(), before);
});

test('unknown actions and rune identifiers cannot alter progress or unlock the door', () => {
  const puzzle = readyPuzzle();
  const before = puzzle.getState();
  assert.equal(puzzle.act({ type: 'activate-rune', runeId: 'not-a-rune' }).type, 'invalid');
  assert.equal(puzzle.act({ type: 'unlock' }).type, 'invalid');
  assert.deepEqual(puzzle.getState(), before);
});

test('unlock and completion remain stable under repeated interactions', () => {
  const puzzle = readyPuzzle();
  puzzle.act({ type: 'align-orrery' });
  const unlocked = puzzle.getState();
  assert.equal(puzzle.act({ type: 'align-orrery' }).type, 'already-unlocked');
  assert.equal(puzzle.act({ type: 'activate-rune', runeId: 'crown' }).type, 'already-unlocked');
  assert.deepEqual(puzzle.getState(), unlocked);
  puzzle.act({ type: 'exit' });
  const completed = puzzle.getState();
  for (const action of [{ type: 'exit' }, { type: 'read-chart' }, { type: 'align-orrery' },
    { type: 'activate-rune', runeId: 'river' }]) {
    puzzle.act(action);
    assert.deepEqual(puzzle.getState(), completed);
  }
});

test('reset restores a fresh puzzle at every progression stage', () => {
  const actions = [
    { type: 'read-chart' },
    ...RUNE_SEQUENCE.map(runeId => ({ type: 'activate-rune', runeId })),
    { type: 'align-orrery' }, { type: 'exit' }
  ];
  for (let count = 0; count <= actions.length; count++) {
    const puzzle = createPuzzle();
    for (const action of actions.slice(0, count)) puzzle.act(action);
    assert.equal(puzzle.act({ type: 'reset' }).type, 'reset');
    assert.deepEqual(puzzle.getState(), createPuzzle().getState());
  }
});

test('two local puzzles never share state', () => {
  const first = readyPuzzle();
  const second = createPuzzle();
  first.act({ type: 'align-orrery' });
  assert.equal(second.getState().chartDiscovered, false);
  assert.equal(second.getState().unlocked, false);
});
