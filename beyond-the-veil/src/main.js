import * as THREE from 'three';
import './style.css';
import { createChamber } from './scene.js';
import { createControls } from './controls.js';
import { createInteractions } from './interactions.js';
import { createUI } from './ui.js';

const ui = createUI(document.querySelector('#app'));
const { scene, interactables, runes, ringGroup, brass } = createChamber();

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

const interactions = createInteractions({ runes, ringGroup, brass, ui });
const controls = createControls({
  camera,
  canvas: ui.canvas,
  interactables,
  ui,
  onInspect: interactions.inspect
});
ui.onEnter(() => controls.enter());

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
});

animate();
