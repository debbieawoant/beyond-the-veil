import * as THREE from 'three';

export function createControls({ camera, canvas, scene, interactables, ui, onInspect }) {
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

    if (movement.lengthSq() > 0) {
      movement.normalize().multiplyScalar(speed);
      camera.position.add(movement);
    }

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -5.4, 5.4);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -5.4, 5.4);
    camera.position.y = 1.65;

    const target = findTarget();
    ui.setTarget(target ? `Press E: ${target.userData.title}` : '');
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
