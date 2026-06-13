// boids/sketch.js — p5 instance-mode flocking sketch.
//
// Reads from `ctx.params` every frame, so Tweakpane edits apply live. In
// preview mode it runs a smaller flock to stay cheap inside the grid.
import { sizeOf } from "../../js/engine/lifecycle.js";

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;
  /** @type {{pos: any, vel: any, acc: any}[]} */
  let boids = [];

  const targetCount = () =>
    Math.round(params.count * (preview ? 0.45 : 1));

  function makeBoid() {
    const angle = p.random(p.TWO_PI);
    return {
      pos: p.createVector(p.random(p.width), p.random(p.height)),
      vel: p.createVector(Math.cos(angle), Math.sin(angle)).mult(p.random(1.5, 3)),
      acc: p.createVector(0, 0),
    };
  }

  function syncPopulation() {
    const target = targetCount();
    while (boids.length < target) boids.push(makeBoid());
    if (boids.length > target) boids.length = target;
  }

  p.setup = () => {
    const { w, h } = sizeOf(container);
    p.createCanvas(w, h);
    syncPopulation();
    p.background(11, 14, 18);
  };

  p.windowResized = () => {
    const { w, h } = sizeOf(container);
    p.resizeCanvas(w, h);
  };

  p.draw = () => {
    syncPopulation();

    // Fade to background for motion trails (trail=0 => fully clear each frame).
    const fade = p.map(params.trail, 0, 0.6, 255, 30, true);
    p.noStroke();
    p.fill(11, 14, 18, fade);
    p.rect(0, 0, p.width, p.height);

    const perception = params.perception;
    const percSq = perception * perception;
    const maxSpeed = params.maxSpeed;
    const maxForce = 0.18;

    for (const b of boids) {
      const sep = p.createVector(0, 0);
      const ali = p.createVector(0, 0);
      const coh = p.createVector(0, 0);
      let total = 0;

      for (const other of boids) {
        if (other === b) continue;
        const dx = b.pos.x - other.pos.x;
        const dy = b.pos.y - other.pos.y;
        const dSq = dx * dx + dy * dy;
        if (dSq > percSq || dSq === 0) continue;

        // Separation is distance-weighted; closer neighbours push harder.
        sep.x += dx / dSq;
        sep.y += dy / dSq;
        ali.add(other.vel);
        coh.add(other.pos);
        total++;
      }

      b.acc.set(0, 0);
      if (total > 0) {
        steerToward(sep, maxSpeed, maxForce).mult(params.separation);
        b.acc.add(sep);

        ali.div(total);
        steerToward(ali, maxSpeed, maxForce).mult(params.alignment);
        b.acc.add(ali);

        coh.div(total);
        coh.sub(b.pos);
        steerToward(coh, maxSpeed, maxForce).mult(params.cohesion);
        b.acc.add(coh);
      }
    }

    // Integrate + wrap + render.
    p.noStroke();
    p.fill(94, 234, 212);
    const r = preview ? 2.1 : 2.8;
    for (const b of boids) {
      b.vel.add(b.acc).limit(maxSpeed);
      b.pos.add(b.vel);
      wrap(b.pos);
      p.circle(b.pos.x, b.pos.y, r * 2);
    }
  };

  // Normalize a desired vector to max speed, then clamp the steering delta.
  function steerToward(vec, maxSpeed, maxForce) {
    const m = vec.mag();
    if (m > 0) {
      vec.mult(maxSpeed / m);
      vec.limit(maxForce);
    }
    return vec;
  }

  function wrap(v) {
    if (v.x < 0) v.x += p.width;
    else if (v.x >= p.width) v.x -= p.width;
    if (v.y < 0) v.y += p.height;
    else if (v.y >= p.height) v.y -= p.height;
  }
}
