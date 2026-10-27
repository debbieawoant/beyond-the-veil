import * as THREE from 'three';

export function createControls({ camera, canvas, interactables, ui, onInspect }) {
  let yaw = 0;
  let pitch = 0;
  const keys = {};
  const raycaster = new THREE.Raycaster();
  const center = new THREE.Vector2(0, 0);
  let activeObject = null;
  let entered = false;

  canvas.addEventListener('click', () => {
    if (!entered || ui.isNoticeOpen()) return;
    canvas.requestPointerLock?.();
  });

  document.addEventListener('mousemove', e => {
    if (document.pointerLockElement !== canvas) return;
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch = THREE.MathUtils.clamp(pitch, -1.35, 1.35);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  });

  document.addEventListener('keydown', e => {
    keys[e.code] = true;

    if (e.code === 'KeyE' && ui.isNoticeOpen()) {
      ui.hideNotice();
      return;
    }

    if (e.code === 'KeyE' && activeObject) {
      onInspect(activeObject);
      activeObject = null;
    }

    if (e.code === 'KeyE' && !activeObject) {
      ui.setHint('Look directly at a glowing object or mechanism.');
    }
  });

  document.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  function update() {
    // Preserve the prototype's per-frame movement until the controls milestone.
    const speed = 3 * Math.min(0.04, 1 / 60);
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const movement = new THREE.Vector3();

    if (entered && document.pointerLockElement === canvas) {
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

      raycaster.setFromCamera(center, camera);
      const hits = raycaster.intersectObjects(interactables, true);

      activeObject = null;
      if (hits.length > 0 && hits[0].distance < 4) {
        let object = hits[0].object;
        while (object && !object.userData.interactable) {
          object = object.parent;
        }

        if (object?.userData.interactable) {
          activeObject = object;
          ui.setHint(`Press E to inspect: ${object.userData.title}`);
        }
      }
    }
  }

  return {
    update,
    enter() {
      entered = true;
      canvas.requestPointerLock?.();
    }
  };
}
