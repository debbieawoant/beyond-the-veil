import * as THREE from 'three';

export const PLAYER_COLORS = ['#8ee7f4', '#ffd28b', '#c5a3ff', '#9fe3a4'];
const TARGET_LABELS = { chart: 'Star Chart', crown: 'Crown Rune', river: 'River Rune',
  gate: 'Gate Rune', orrery: 'Celestial Orrery', exit: 'Exit' };

export function validatePing(payload, members, generation, now = Date.now()) {
  const member = members.find(item => item.id === payload?.senderId);
  const age = now - Date.parse(payload?.sentAt);
  if (!member || payload.generation !== generation || !payload.id
    || !Number.isFinite(age) || age < -2000 || age >= 5000
    || !Array.isArray(payload.position) || payload.position.length !== 3
    || !payload.position.every(Number.isFinite)) return null;
  const [x, y, z] = payload.position;
  if (Math.abs(x) > 6 || y < 0 || y > 5 || z < -7.5 || z > 6
    || (payload.target != null && !Object.hasOwn(TARGET_LABELS, payload.target))) return null;
  return { ...payload, expiresAt: now + Math.min(5000, 5000 - age),
    label: `${member.name}: Look here${payload.target ? ` — ${TARGET_LABELS[payload.target]}` : ''}`,
    color: PLAYER_COLORS[member.slot] ?? PLAYER_COLORS[0] };
}

// World-anchored HTML markers are deliberately not part of the raycast scene.
export function createPingMarkers({ root, camera, now = Date.now }) {
  const markers = new Map();
  const projected = new THREE.Vector3();
  const local = new THREE.Vector3();

  function clear() {
    for (const marker of markers.values()) marker.element.remove();
    markers.clear();
  }

  function add(payload, snapshot) {
    const ping = validatePing(payload, snapshot.members, snapshot.room.generation, now());
    if (!ping || markers.has(ping.id)) return;
    // One live marker per sender, so repeated pings cannot fill the screen.
    for (const [id, marker] of markers) {
      if (marker.senderId === ping.senderId) {
        if (Date.parse(marker.sentAt) > Date.parse(ping.sentAt)) return;
        marker.element.remove(); markers.delete(id);
      }
    }
    const element = root.ownerDocument.createElement('div');
    element.className = 'ping-marker';
    element.style.color = ping.color;
    const symbol = root.ownerDocument.createElement('strong');
    symbol.textContent = '◇';
    const label = root.ownerDocument.createElement('span');
    label.textContent = ping.label;
    element.append(symbol, label);
    root.append(element);
    markers.set(ping.id, { ...ping, element, symbol });
  }

  function update() {
    camera.updateMatrixWorld();
    for (const [id, marker] of markers) {
      if (marker.expiresAt <= now()) { marker.element.remove(); markers.delete(id); continue; }
      local.fromArray(marker.position).applyMatrix4(camera.matrixWorldInverse);
      projected.fromArray(marker.position).project(camera);
      const behind = local.z >= 0;
      let x = projected.x;
      let y = -projected.y;
      const offscreen = behind || Math.abs(x) > 0.8 || Math.abs(y) > 0.7;
      if (offscreen) {
        // Camera-space direction works on either side of the projection plane.
        x = local.x;
        y = -local.y;
        if (Math.abs(x) + Math.abs(y) < 0.001) x = 1;
        const scale = Math.max(Math.abs(x) / 0.8, Math.abs(y) / 0.7);
        x /= scale;
        y /= scale;
      }
      marker.element.style.left = `${(x + 1) * 50}%`;
      marker.element.style.top = `${(y + 1) * 50}%`;
      marker.symbol.textContent = offscreen ? '➤' : '◇';
      marker.symbol.style.transform = offscreen ? `rotate(${Math.atan2(y, x)}rad)` : '';
    }
  }

  return { add, update, clear };
}
