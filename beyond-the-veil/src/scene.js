import * as THREE from 'three';
import { RUNE_LABELS } from './puzzle.js';

export function createChamber() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#111722');
  scene.fog = new THREE.FogExp2('#111722', 0.035);

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
  // Leave a real opening behind the sealed door.
  box('north wall left', -3.7, 2.4, -6, 4.6, 5, 0.4, stone);
  box('north wall right', 3.7, 2.4, -6, 4.6, 5, 0.4, stone);
  box('north wall lintel', 0, 4.5, -6, 2.8, 1.2, 0.4, stone);
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
  const door = box('sealed door', 0, 2, -5.72, 2.8, 3.8, 0.3, darkStone);
  box('door frame left', -1.65, 2.1, -5.5, 0.25, 4.2, 0.5, brass);
  box('door frame right', 1.65, 2.1, -5.5, 0.25, 4.2, 0.5, brass);
  box('door frame top', 0, 4.2, -5.5, 3.5, 0.25, 0.5, brass);

  // Central celestial puzzle pedestal
  box('pedestal', 0, 0.55, 0, 1.7, 1.1, 1.7, darkStone);

  const interactables = [];

  function addInteractable(type, name, description, x, y, z, mesh) {
    mesh.position.set(x, y, z);
    mesh.userData.interactable = true;
    mesh.userData.type = type;
    mesh.userData.title = name;
    mesh.userData.description = description;
    scene.add(mesh);
    interactables.push(mesh);
    return mesh;
  }

  const exit = new THREE.Group();
  exit.add(door);
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.8), glow);
  portal.position.set(0, 2, -7.4);
  portal.visible = false;
  exit.add(portal);
  addInteractable('exit', 'Sealed Exit', 'The exit is sealed. The orrery seems connected to its lock.',
    0, 0, 0, exit);
  box('passage floor', 0, -0.15, -6.8, 2.8, 0.3, 2, darkStone);
  box('passage left', -1.55, 2, -6.8, 0.3, 4, 2, stone);
  box('passage right', 1.55, 2, -6.8, 0.3, 4, 2, stone);

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
  ringGroup.userData.type = 'orrery';
  ringGroup.userData.title = 'Celestial Orrery';
  ringGroup.userData.description =
    'Three brass rings surround a luminous star. Activate the runes in the chart\'s order, then press E here to align the rings.';
  interactables.push(ringGroup);

  // Raised, differently shaped symbols on the east wall (not solution order).
  const runes = [];
  const glyphs = [];
  const activeGlow = material('#ffd28b', {
    emissive: '#e2a75f', emissiveIntensity: 1.5
  });

  function line(group, points, mat = glow) {
    for (let i = 1; i < points.length; i++) {
      const start = new THREE.Vector3(...points[i - 1], 0.09);
      const end = new THREE.Vector3(...points[i], 0.09);
      const direction = end.clone().sub(start);
      const segment = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, direction.length(), 8), mat
      );
      segment.position.copy(start).add(end).multiplyScalar(0.5);
      segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      group.add(segment);
    }
  }

  for (const [i, runeId] of ['river', 'gate', 'crown'].entries()) {
    const rune = new THREE.Group();
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 0.12), darkStone);
    rune.add(plaque);
    const glyph = new THREE.Group();
    if (runeId === 'crown') {
      line(glyph, [[-0.28, -0.18], [-0.32, 0.2], [-0.13, 0.02], [0, 0.28],
        [0.13, 0.02], [0.32, 0.2], [0.28, -0.18], [-0.28, -0.18]]);
    } else if (runeId === 'river') {
      for (const y of [-0.12, 0.12]) {
        line(glyph, Array.from({ length: 17 }, (_, n) => {
          const x = -0.32 + n * 0.04;
          return [x, y + Math.sin(n * Math.PI / 8) * 0.06];
        }));
      }
    } else {
      line(glyph, [[-0.25, -0.25], [-0.25, 0.1], [-0.17, 0.24], [0, 0.3],
        [0.17, 0.24], [0.25, 0.1], [0.25, -0.25]]);
      line(glyph, [[-0.32, -0.25], [0.32, -0.25]]);
    }
    rune.add(glyph);
    addInteractable(
      'rune', `${RUNE_LABELS[runeId]} Rune`,
      `The raised symbol represents the ${RUNE_LABELS[runeId]}. Press E to activate it.`,
      5.72, 1.65, -3 + i * 3, rune
    );
    rune.rotation.y = -Math.PI / 2;
    rune.userData.runeId = runeId;
    glyphs.push(glyph);
    runes.push(rune);
  }

  // A brass chart on the west wall; its inscription is readable via inspection.
  const clue = new THREE.Group();
  clue.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 0.12), brass));
  const chartStars = [[-0.38, -0.2], [-0.22, 0.12], [0, 0.28], [0.2, 0.05], [0.38, -0.2]];
  line(clue, chartStars);
  for (const [x, y] of chartStars) {
    const point = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), glow);
    point.position.set(x, y, 0.12);
    clue.add(point);
  }
  addInteractable(
    'chart', 'Star Chart',
    'A brass inscription reads: “First the Crown, then the River, last the Gate. Awaken these three signs in order; then align the celestial rings to unseal the way home.” The Crown has three points, the River has two waves, and the Gate is an arch.',
    -5.72, 1.65, -2.5, clue
  );
  clue.rotation.y = Math.PI / 2;

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

  function setPuzzleState(state) {
    for (const [i, rune] of runes.entries()) {
      const activated = state.activated.includes(rune.userData.runeId);
      glyphs[i].traverse(object => {
        if (object.isMesh) object.material = activated ? activeGlow : glow;
      });
    }
    ringGroup.rotation.set(state.unlocked ? 0.3 : 0, state.unlocked ? Math.PI / 4 : 0, 0);
    door.visible = !state.unlocked;
    portal.visible = state.unlocked;
    exit.userData.title = state.unlocked ? 'Open Exit' : 'Sealed Exit';
  }

  scene.updateMatrixWorld(true);
  return { scene, interactables, runes, ringGroup, door, exit, setPuzzleState };
}
