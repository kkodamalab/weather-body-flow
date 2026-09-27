// Adapted from Visual Motion Lab e551b183: toCamera/fromCamera/advanceView.
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class CameraController {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset();
    this.bind();
  }

  reset() {
    this.yaw = this.pitch = this.targetYaw = this.targetPitch = 0;
    this.travel = this.pending = this.panX = this.panY = 0;
    this.drag = null;
  }

  transform(p) {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const x = cy * p.x - sy * p.z, z = sy * p.x + cy * p.z;
    return { x, y: cp * p.y - sp * z, z: sp * p.y + cp * z };
  }

  fromCamera(p) {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const y = cp * p.y + sp * p.z, z = -sp * p.y + cp * p.z;
    return { x: cy * p.x + sy * z, y, z: -sy * p.x + cy * z };
  }

  advance(dt, points) {
    const step = Math.PI / 6 * dt;
    this.yaw += clamp(this.targetYaw - this.yaw, -step, step);
    this.pitch += clamp(this.targetPitch - this.pitch, -step, step);
    const travel = clamp(this.pending, -2 * dt, 2 * dt);
    this.pending -= travel;
    this.travel += travel;
    if (travel || this.panX || this.panY) {
      const d = this.fromCamera({ x: this.panX, y: this.panY, z: travel });
      for (const p of points) { p.x -= d.x; p.y -= d.y; p.z -= d.z; }
      this.panX = this.panY = 0;
    }
  }

  bind() {
    const canvas = this.canvas;
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('pointerdown', e => {
      if (e.button !== 0 && e.button !== 2) return;
      e.preventDefault();
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, right: e.button === 2 };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      const d = this.drag;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      d.x = e.clientX; d.y = e.clientY;
      if (d.right) {
        this.panX -= dx * .006;
        this.panY -= dy * .006;
      } else {
        const sensitivity = .12 * Math.PI / 180;
        this.targetYaw = clamp(this.targetYaw + dx * sensitivity, -Math.PI / 3, Math.PI / 3);
        this.targetPitch = clamp(this.targetPitch + dy * sensitivity, -Math.PI / 4, Math.PI / 4);
      }
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      canvas.addEventListener(event, () => { this.drag = null; });
    }
    canvas.addEventListener('wheel', e => {
      if (e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientHeight : 1);
      this.pending = clamp(this.pending - delta * .002, -.5, .5);
    }, { passive: false });
    window.addEventListener('blur', () => {
      this.drag = null;
      this.targetYaw = this.yaw;
      this.targetPitch = this.pitch;
      this.pending = this.panX = this.panY = 0;
    });
  }
}
