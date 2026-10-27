export const RUNE_SEQUENCE = Object.freeze(['crown', 'river', 'gate']);
export const RUNE_LABELS = Object.freeze({ crown: 'Crown', river: 'River', gate: 'Gate' });

// Pure local rules, independent of rendering and input. Networking is future work.
export function createPuzzle() {
  function initialState() {
    return { chartDiscovered: false, activated: [], unlocked: false, completed: false };
  }

  let state = initialState();

  function getState() {
    return { ...state, activated: [...state.activated] };
  }

  function act(action) {
    let type;
    switch (action.type) {
      case 'reset':
        state = initialState();
        type = 'reset';
        break;
      case 'read-chart':
        if (state.completed) return { type: 'completed', state: getState() };
        state.chartDiscovered = true;
        type = 'chart-discovered';
        break;
      case 'activate-rune':
        if (!RUNE_SEQUENCE.includes(action.runeId)) {
          type = 'invalid';
        } else if (state.completed) {
          type = 'completed';
        } else if (!state.chartDiscovered) {
          type = 'need-chart';
        } else if (state.unlocked) {
          type = 'already-unlocked';
        } else if (state.activated.includes(action.runeId)) {
          type = 'already-active';
        } else if (action.runeId !== RUNE_SEQUENCE[state.activated.length]) {
          state.activated = [];
          type = 'wrong-order';
        } else {
          state.activated.push(action.runeId);
          type = state.activated.length === RUNE_SEQUENCE.length ? 'ready' : 'rune-activated';
        }
        break;
      case 'align-orrery':
        if (state.completed) type = 'completed';
        else if (state.unlocked) type = 'already-unlocked';
        else if (!state.chartDiscovered) type = 'need-chart';
        else if (state.activated.length !== RUNE_SEQUENCE.length) type = 'not-ready';
        else {
          state.unlocked = true;
          type = 'unlocked';
        }
        break;
      case 'exit':
        if (!state.unlocked) type = 'locked';
        else {
          state.completed = true;
          type = 'completed';
        }
        break;
      default:
        type = 'invalid';
    }

    return { type, state: getState() };
  }

  return { act, getState };
}
