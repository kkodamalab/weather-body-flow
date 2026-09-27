// Port of Visual Motion Lab e551b183 rand/newCloud/spawn3D and 3D advance.
import { project } from './optic-flow.js';

export class ParticleEngine {
  constructor(count, config, camera) {
    this.config = config;
    this.camera = camera;
    this.setCount(count);
  }

  random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  setCount(count) {
    this.seed = 1975;
    const c = this.config();
    this.particles = Array.from({ length: count }, () => {
      // Preserve the reference newCloud random sequence (its initial 2D samples).
      this.random(); this.random();
      return this.spawn(c);
    });
  }

  spawn(c) {
    const z = c.near + this.random() * (c.far - c.near);
    return this.camera.fromCamera({
      x: (this.random() * c.width - c.width * c.foeX) * z / c.focal,
      y: (this.random() * c.height - c.height * c.foeY) * z / c.focal,
      z,
    });
  }

  update(dt, running = true) {
    const c = this.config();
    this.camera.advance(dt, this.particles);
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (running) p.z -= .5 * dt;
      const v = project(p, this.camera, c);
      if (v.z < c.near || v.z > c.far || v.x < 0 || v.x > c.width || v.y < 0 || v.y > c.height) {
        this.particles[i] = this.spawn(c);
      }
    }
  }
}
