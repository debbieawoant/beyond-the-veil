import * as THREE from 'three';

const ROOM_LIMIT = 5.4;
// The rendered opening is 2.8 units wide. Leave space for the player's body.
const PASSAGE_HALF_WIDTH = 1.1;
const PASSAGE_END_Z = -7.1;
const EXIT_THRESHOLD_Z = -6.25;

export function createControls({
  camera, canvas, scene, interactables, ui, onInspect,
  isExitOpen = () => false, onExit = () => {}
}) {
  let yaw = 0;
  let pitch = 0;
  const keys = {};
  const raycaster = new THREE.Raycaster();
  const center = new THREE.Vector2(0, 0);
  let entered = false;

  function clearInput() {
    for (const code of Object.keys(keys)) delete keys[code];
    ui.setTarget('');
  }

  function capturePointer() {
    const failed = () => ui.setHint('Mouse capture was unavailable. Click the scene to try again; a desktop browser is required.');
    try {
      if (!canvas.requestPointerLock) return failed();
      canvas.requestPointerLock()?.catch(failed);
    } catch {
      failed();
    }
  }

  function canExplore() {
    return entered && !ui.isNoticeOpen() && !ui.isComplete()
      && document.pointerLockElement === canvas;
  }

  function findTarget() {
    camera.updateMatrixWorld();
    scene?.updateMatrixWorld();
    raycaster.setFromCamera(center, camera);
    // Solid scenery blocks inspection. Hidden doors/portals must not block rays.
    const hits = raycaster.intersectObjects(scene ? scene.children : interactables, true);
    for (const hit of hits) {
      let visible = true;
      for (let parent = hit.object; parent; parent = parent.parent) {
        if (!parent.visible) visible = false;
      }
      if (!visible) continue;
      if (hit.distance >= 4) return null;
      let object = hit.object;
      while (object && !object.userData.interactable) object = object.parent;
      return object?.userData.interactable ? object : null;
    }
    return null;
  }

  canvas.addEventListener('click', () => {
    if (entered && !ui.isNoticeOpen() && !ui.isComplete()) capturePointer();
  });

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement !== canvas) clearInput();
  });
  document.addEventListener('visibilitychange', clearInput);
  globalThis.addEventListener?.('blur', clearInput);

  document.addEventListener('mousemove', e => {
    if (!canExplore()) return;
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch = THREE.MathUtils.clamp(pitch, -1.35, 1.35);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  });

  document.addEventListener('keydown', e => {
    if (!entered || ui.isComplete()) return;
    if (e.code === 'KeyE') {
      if (e.repeat) return;
      e.preventDefault();
      clearInput();
      if (ui.isNoticeOpen()) {
        ui.hideNotice();
      } else if (canExplore()) {
        const object = findTarget();
        if (object) onInspect(object);
        else ui.setHint('Move closer and aim the crosshair at a chart, rune, or mechanism.');
      }
      return;
    }
    if (canExplore()) keys[e.code] = true;
  });

  document.addEventListener('keyup', e => {
    delete keys[e.code];
  });

  function update(deltaSeconds = 1 / 60) {
    if (!canExplore()) {
      clearInput();
      return;
    }

    const speed = 3 * Math.min(0.04, Math.max(0, deltaSeconds));
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const movement = new THREE.Vector3();
    if (keys.KeyW) movement.add(forward);
    if (keys.KeyS) movement.sub(forward);
    if (keys.KeyD) movement.add(right);
    if (keys.KeyA) movement.sub(right);

    if (movement.lengthSq() > 0) movement.normalize().multiplyScalar(speed);

    const previousZ = camera.position.z;
    const exitOpen = isExitOpen();
    // Resolve X first so diagonal movement cannot cut through a passage side.
    const xLimit = previousZ < -ROOM_LIMIT ? PASSAGE_HALF_WIDTH : ROOM_LIMIT;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x + movement.x, -xLimit, xLimit);
    const inDoorway = Math.abs(camera.position.x) <= PASSAGE_HALF_WIDTH;
    const northLimit = exitOpen && inDoorway ? PASSAGE_END_Z : -ROOM_LIMIT;
    camera.position.z = THREE.MathUtils.clamp(previousZ + movement.z, northLimit, ROOM_LIMIT);
    camera.position.y = 1.65;

    if (exitOpen && inDoorway && previousZ > EXIT_THRESHOLD_Z
      && camera.position.z <= EXIT_THRESHOLD_Z) {
      onExit();
      clearInput();
      return;
    }

    const target = findTarget();
    ui.setTarget(target?.userData.type === 'exit' && exitOpen
      ? 'Walk through the doorway to leave'
      : target ? `Press E: ${target.userData.title}` : '');
  }

  function enter() {
    entered = true;
    capturePointer();
  }

  function restart() {
    clearInput();
    yaw = 0;
    pitch = 0;
    camera.position.set(0, 1.65, 5);
    camera.rotation.set(0, 0, 0, 'YXZ');
    enter();
  }

  return { update, enter, restart };
}
