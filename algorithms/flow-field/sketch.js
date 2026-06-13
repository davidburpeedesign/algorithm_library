// flow-field/sketch.js — particles following a Perlin-noise flow field.
//
// Rendered at full container resolution (cheap vector strokes). A 3rd noise
// dimension scrolls slowly so the field itself evolves over time.
import { sizeOf } from "../../js/engine/lifecycle.js";

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  /** @type {{x:number,y:number,px:number,py:number,hue:number}[]} */
  let parts = [];
  let zOff = 0;

  const targetCount = () =>
    Math.round(params.particles * (preview ? 0.4 : 1));

  function makeParticle() {
    const x = p.random(p.width);
    const y = p.random(p.height);
    return { x, y, px: x, py: y, hue: p.random(150, 290) };
  }

  function syncPopulation() {
    const target = targetCount();
    while (parts.length < target) parts.push(makeParticle());
    if (parts.length > target) parts.length = target;
  }

  p.setup = () => {
    const { w, h } = sizeOf(container);
    p.createCanvas(w, h);
    p.colorMode(p.HSB, 360, 100, 100, 1);
    p.background(220, 30, 6);
    syncPopulation();
  };

  p.windowResized = () => {
    const { w, h } = sizeOf(container);
    p.resizeCanvas(w, h);
    p.background(220, 30, 6);
  };

  function respawn(part) {
    part.x = p.random(p.width);
    part.y = p.random(p.height);
    part.px = part.x;
    part.py = part.y;
  }

  p.draw = () => {
    syncPopulation();

    // Translucent wash for trails.
    p.noStroke();
    p.fill(220, 30, 6, params.fade);
    p.rect(0, 0, p.width, p.height);

    const scale = params.noiseScale;
    const speed = params.speed;

    p.strokeWeight(preview ? 0.9 : 1.1);
    for (const part of parts) {
      const angle =
        p.noise(part.x * scale, part.y * scale, zOff) * p.TWO_PI * 2;
      part.px = part.x;
      part.py = part.y;
      part.x += Math.cos(angle) * speed;
      part.y += Math.sin(angle) * speed;

      p.stroke(part.hue, 70, 100, 0.5);
      p.line(part.px, part.py, part.x, part.y);

      if (part.x < 0 || part.x >= p.width || part.y < 0 || part.y >= p.height) {
        respawn(part);
      }
    }

    zOff += params.drift * 0.01;
  };
}
