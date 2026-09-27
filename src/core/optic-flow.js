// Perspective and constant screen-diameter dots from Visual Motion Lab e551b183.
export function project(p, camera, c) {
  const q = camera.transform(p);
  return { x: c.width * c.foeX + c.focal * q.x / q.z,
    y: c.height * c.foeY + c.focal * q.y / q.z, z: q.z };
}

export class OpticFlowRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    if (!this.ctx) throw new Error('Canvas 2D is unavailable');
    this.resize();
  }

  resize() {
    const width = this.canvas.clientWidth, height = this.canvas.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (width === this.width && height === this.height && dpr === this.dpr) return false;
    this.width = width; this.height = height; this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  render(points, camera, c) {
    const ctx = this.ctx;
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.background;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = c.color;
    ctx.globalAlpha = c.opacity;
    ctx.shadowColor = c.color;
    ctx.shadowBlur = c.glow;
    let shown = 0;
    for (const p of points) {
      const v = project(p, camera, c);
      if (v.z < c.near || v.z > c.far || v.x < 0 || v.x > c.width || v.y < 0 || v.y > c.height) continue;
      ctx.beginPath();
      ctx.arc(v.x, v.y, c.size / 2, 0, 2 * Math.PI);
      ctx.fill();
      shown++;
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    return shown;
  }
}
