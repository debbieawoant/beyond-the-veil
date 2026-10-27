// Local prototype state only. Puzzle validation and networking are future work.
export function createInteractions({ runes, ringGroup, brass, ui }) {
  let solvedRunes = 0;
  let ringTurns = 0;

  function inspect(object) {
    const title = object.userData.title;
    const description = object.userData.description;

    if (title === 'Celestial Orrery') {
      ringTurns++;
      ringGroup.rotation.y += Math.PI / 4;
      ringGroup.rotation.x += 0.08;

      if (ringTurns >= 3) {
        ui.setHint('The rings have shifted. Perhaps the runes hold another clue.');
      } else {
        ui.setHint('The brass rings rotate. Try examining the symbols around the chamber.');
      }
    }

    if (title.startsWith('Rune')) {
      const index = Number(title.split(' ')[1]) - 1;
      const rune = runes[index];

      rune.material = brass;
      solvedRunes = new Set(
        runes.filter(r => r.material === brass)
      ).size;

      ui.setHint(`${solvedRunes} of 3 runes activated. Find the star chart to learn their order.`);
    }

    if (title === 'Star Chart') {
      ui.setClues(
        'Star Chart discovered: Crown → River → Gate. The three runes may follow this sequence.'
      );
      ui.setHint('A clue has been added to your journal.');
    }

    if (solvedRunes === 3 && ringTurns >= 3) {
      ui.setHint('The mechanism stirs, but its correct sequence remains undiscovered.');
    }

    ui.showNotice(title, description);
  }

  return { inspect };
}
