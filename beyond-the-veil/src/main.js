import * as THREE from 'three';
import './style.css';
import { createChamber } from './scene.js';
import { createControls } from './controls.js';
import { createInteractions } from './interactions.js';
import { createUI } from './ui.js';
import { createRoomClient } from './multiplayer.js';
import { createPingMarkers } from './pings.js';

const ui = createUI(document.querySelector('#app'));
const chamber = createChamber();
const { scene, interactables } = chamber;

const camera = new THREE.PerspectiveCamera(
  75, innerWidth / innerHeight, 0.1, 100
);
camera.position.set(0, 1.65, 5);

const renderer = new THREE.WebGLRenderer({
  canvas: ui.canvas,
  antialias: true
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const interactions = createInteractions({ ...chamber, ui });
const pings = createPingMarkers({ root: ui.pingRoot, camera });
let room = null;
let playing = false;
const controls = createControls({
  camera,
  canvas: ui.canvas,
  scene,
  interactables,
  ui,
  onInspect: interactions.inspect,
  isExitOpen: () => interactions.getState().unlocked,
  onExit: interactions.crossExit,
  onPing: ping => {
    if (room?.getSnapshot()) room.ping(ping).catch(error => ui.setHint(error.message));
    else ui.setHint('Pings are available in multiplayer rooms.');
  }
});
ui.onEnter(() => { playing = true; controls.enter(); });

async function restart() {
  if (room?.getSnapshot()) {
    if (!confirm('Restart the shared puzzle for everyone?')) return;
    ui.setBusy(true);
    try {
      const result = await interactions.reset();
      if (result.type === 'stale') {
        ui.setHint('The room changed. Try restarting again.');
        ui.setCompletionStatus('The room changed. Try restarting again.');
      }
    } catch (error) { ui.setHint(error.message); ui.setCompletionStatus(error.message); }
    finally { ui.setBusy(false); }
  } else {
    interactions.reset();
    controls.restart();
  }
}
ui.onRestart(restart);
ui.onRoomReset(restart);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const configured = /^https:\/\/[^/]+\.supabase\.co\/?$/.test(supabaseUrl ?? '')
  && publishableKey?.startsWith('sb_publishable_')
  && !`${supabaseUrl}${publishableKey}`.includes('YOUR_');
ui.configureMultiplayer(!!configured);

async function setupMultiplayer() {
  if (!configured) return;
  ui.setLobbyBusy(true);
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(supabaseUrl, publishableKey);
  room = createRoomClient({
    client,
    onSnapshot(next, previous) {
      interactions.setRemote(room.act);
      const reset = previous && next.room.generation !== previous.room.generation;
      if (reset) {
        pings.clear();
        ui.resetPuzzle();
        if (playing) controls.restart({ capture: false });
        ui.setHint('The host restarted the puzzle. Click the scene to resume if your mouse is released.');
      }
      interactions.applySharedState(next.state);
      ui.setRoom(next, room.getUserId());
    },
    onStatus: ui.setConnectionStatus,
    onPing(payload) {
      const snapshot = room.getSnapshot();
      if (snapshot) pings.add(payload, snapshot);
    },
    onError(message) { ui.setHint(message); ui.setLobbyStatus(message); }
  });
  ui.onConnect(async (kind, input) => {
    ui.setLobbyBusy(true);
    ui.setLobbyStatus('Signing in and connecting…');
    try {
      const snapshot = await room.connect(kind, input);
      ui.setLobbyStatus(`Room ${snapshot.room.code} ready. Share its code, then click Enter room.`);
    } catch (error) { ui.setLobbyStatus(error.message); }
    finally { ui.setLobbyBusy(false); }
  });
  ui.setLobbyBusy(true);
  await room.resume().then(resumed => {
    if (resumed) ui.setLobbyStatus('Previous room restored. Click Enter room to continue.');
  }).catch(error => ui.setLobbyStatus(`Could not restore room: ${error.message}`))
    .finally(() => ui.setLobbyBusy(false));
}
setupMultiplayer().catch(error => {
  ui.configureMultiplayer(false);
  ui.setLobbyStatus(`Multiplayer could not start: ${error.message}`);
  ui.setLobbyBusy(false);
});

ui.onLeave(async () => {
  ui.setBusy(true);
  try {
    await room.leave();
    playing = false;
    pings.clear();
    interactions.setRemote(null);
    interactions.reset();
    controls.restart({ capture: false });
    ui.setRoom(null);
    ui.setConnectionStatus('Local puzzle · no connection needed', false);
    ui.setLobbyStatus('You left the room. Create/join another room or play solo.');
    ui.showStart();
  } catch (error) {
    ui.setHint(`Could not leave: ${error.message}`);
    ui.setLobbyStatus(`Could not leave: ${error.message}`);
  }
  finally { ui.setBusy(false); }
});

let lastFrame = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  controls.update((now - lastFrame) / 1000);
  lastFrame = now;
  pings.update();
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
});

requestAnimationFrame(animate);
