"use client";

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import p5 from 'p5';

interface Star {
  pos: p5.Vector;
  prevPos: p5.Vector;
  vel: p5.Vector;
  ang: number;
  isActive: () => boolean;
  update: (acc: number) => void;
  draw: () => void;
}

const P5Background = () => {
  const sketchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sketchRef.current) return;

    const numStars = 500;
    let stars: Star[] = [];

    const sketch = (p: p5) => {
      const onScreen = (x: number, y: number) => {
        return x >= 0 && x <= p.width && y >= 0 && y <= p.height;
      };

      class Star {
        pos: p5.Vector;
        prevPos: p5.Vector;
        vel: p5.Vector;
        ang: number;

        constructor(x: number, y: number) {
          this.pos = p.createVector(x, y);
          this.prevPos = p.createVector(x, y);
          this.vel = p.createVector(0, 0);
          this.ang = p.atan2(y - p.height/2, x - p.width/2);
        }

        isActive() {
          return onScreen(this.prevPos.x, this.prevPos.y);
        }

        update(acc: number) {
          this.vel.x += p.cos(this.ang) * acc;
          this.vel.y += p.sin(this.ang) * acc;
          this.prevPos.set(this.pos);
          this.pos.add(this.vel);
        }

        draw() {
          const alpha = p.map(this.vel.mag(), 0, 3, 0, 255);
          p.stroke(255, alpha);
          p.line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
        }
      }

      p.setup = () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.position(0, 0);
        canvas.style('z-index', '-1');
        p.stroke(255);
        p.strokeWeight(2);

        for (let i = 0; i < numStars; i++) {
          stars.push(new Star(p.random(p.width), p.random(p.height)));
        }
      };

      p.draw = () => {
        p.background(0, 50);
        const acc = p.map(p.mouseX, 0, p.width, 0.005, 0.2);

        stars = stars.filter(star => {
          star.draw();
          star.update(acc);
          return star.isActive();
        });

        while (stars.length < numStars) {
          stars.push(new Star(p.random(p.width), p.random(p.height)));
        }
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
    };

    const p5Instance = new p5(sketch, sketchRef.current);

    return () => {
      p5Instance.remove();
    };
  }, []);

  return (
    <div
      ref={sketchRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
      }}
    />
  );
};

export default dynamic(() => Promise.resolve(P5Background), {
  ssr: false
});