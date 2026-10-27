import * as THREE from 'three';
import './style.css';
import { createChamber } from './scene.js';
import { createControls } from './controls.js';
import { createInteractions } from './interactions.js';
import { createUI } from './ui.js';

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
const controls = createControls({
  camera,
  canvas: ui.canvas,
  scene,
  interactables,
  ui,
  onInspect: interactions.inspect
});
ui.onEnter(() => controls.enter());
ui.onRestart(() => {
  interactions.reset();
  controls.restart();
});

let lastFrame = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  controls.update((now - lastFrame) / 1000);
  lastFrame = now;
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
});

requestAnimationFrame(animate);
