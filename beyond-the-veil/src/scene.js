import * as THREE from 'three';

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

  return { scene, interactables, runes, ringGroup, brass };
}
