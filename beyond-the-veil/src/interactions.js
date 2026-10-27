import { createPuzzle, RUNE_LABELS } from './puzzle.js';

export function createInteractions({ setPuzzleState, ui }) {
  const puzzle = createPuzzle();

  function render(state) {
    setPuzzleState(state);
    ui.setProgress(state);
  }

  function inspect(object) {
    const { type, title, description, runeId } = object.userData;
    if (type === 'exit') {
      const message = puzzle.getState().unlocked
        ? 'Walk through the glowing doorway to leave. Crossing the threshold completes the chamber; pressing E only inspects it.'
        : 'The exit is sealed. Read the star chart on the west wall, awaken the three runes in its order, then align the central orrery.';
      ui.setHint(message);
      ui.showNotice(title, message);
      return;
    }

    const actions = {
      chart: { type: 'read-chart' },
      rune: { type: 'activate-rune', runeId },
      orrery: { type: 'align-orrery' }
    };
    if (!actions[type]) return;

    const result = puzzle.act(actions[type]);
    render(result.state);
    let message;

    switch (result.type) {
      case 'chart-discovered':
        ui.setClues('Crown → River → Gate. Crown: three points; River: two waves; Gate: an arch. Activate them in order on the east wall, then align the central orrery.');
        message = description;
        break;
      case 'need-chart':
        message = 'The mechanism gives no answer. Find and inspect the glowing brass star chart on the west (left-hand) wall before using the runes.';
        break;
      case 'rune-activated':
        message = `${RUNE_LABELS[runeId]} awakens in gold. ${result.state.activated.length} of 3 runes are active. Follow the order in your journal.`;
        break;
      case 'ready':
        message = 'All three runes shine in gold. Return to the celestial orrery in the center and press E to align its rings.';
        break;
      case 'already-active':
        message = 'This rune is already active. Repeated activation does not change your progress; follow the next sign in your journal.';
        break;
      case 'wrong-order':
        message = 'The runes return to blue: that was the wrong order. All rune progress has reset. Your journal still holds the clue; start again with the Crown.';
        break;
      case 'not-ready':
        message = 'The rings resist your touch. Activate all three runes in the order recorded in your journal first. Your current rune progress is unchanged.';
        break;
      case 'unlocked':
        message = 'The rings align and the stone seal withdraws. The exit on the north wall is open. Walk through the glowing doorway to leave.';
        break;
      case 'already-unlocked':
        message = 'The exit is already open. Walk through the glowing doorway on the north wall to leave.';
        break;
      case 'completed':
        ui.setHint('The chamber is complete. The path home is open.');
        ui.showCompletion();
        return;
      default:
        return;
    }

    ui.setHint(message);
    ui.showNotice(title, message);
  }

  function crossExit() {
    if (puzzle.getState().completed) return false;
    const result = puzzle.act({ type: 'exit' });
    if (result.type !== 'completed') return false;
    render(result.state);
    ui.setHint('The chamber is complete. The path home is open.');
    ui.showCompletion();
    return true;
  }

  function reset() {
    const { state } = puzzle.act({ type: 'reset' });
    ui.resetPuzzle();
    render(state);
  }

  render(puzzle.getState());
  return { inspect, crossExit, reset, getState: puzzle.getState };
}
