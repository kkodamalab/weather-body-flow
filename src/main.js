import { ParticleEngine } from './core/particle-engine.js';
import { CameraController } from './core/camera-controller.js';
import { OpticFlowRenderer } from './core/optic-flow.js';
import { setupControls } from './ui/controls.js';

const canvas = document.querySelector('#flow-canvas');
const renderer = new OpticFlowRenderer(canvas); // Size the canvas before seeding.
const camera = new CameraController(canvas);
const inputs = Object.fromEntries([...document.querySelectorAll('input')].map(input => [input.id, input]));
function config() {
  const value = id => Number(inputs[id].value);
  const width = renderer.width, height = renderer.height;
  const near = value('near'), far = Math.max(near + 1, value('far'));
  return { width, height, near, far, fov: value('fov'), foeX: value('foeX'), foeY: value('foeY'),
    color: inputs.color.value, background: inputs.background.value, opacity: value('opacity'),
    size: value('size'), glow: value('glow'), focal: width / (2 * Math.tan(value('fov') * Math.PI / 360)) };
}
const engine = new ParticleEngine(Number(inputs.count.value), config, camera);
let paused = false, last = performance.now(), frames = 0, lastFps = last;
const resetCloud = () => engine.setCount(Number(inputs.count.value));
setupControls({ resetCloud, resetView: () => { camera.reset(); resetCloud(); }, togglePause: v => { paused = v; } });
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000);
  last = now;
  if (renderer.resize()) resetCloud();
  engine.update(dt, !paused);
  canvas.dataset.visibleParticles = renderer.render(engine.particles, camera, config());
  frames++;
  if (now - lastFps > 500) {
    document.querySelector('#fps').textContent = `${Math.round(frames * 1000 / (now - lastFps))} FPS`;
    frames = 0; lastFps = now;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
