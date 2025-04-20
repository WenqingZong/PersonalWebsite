"use client";

import { useRef, useEffect, useCallback } from "react";

interface Star {
  pos: { x: number; y: number };
  prevPos: { x: number; y: number };
  vel: { x: number; y: number };
  ang: number;
}

// Create a single star, use CSS logical coordination.
const createStar = (width: number, height: number): Star => {
  const x = Math.random() * width;
  const y = Math.random() * height;
  return {
    pos: { x, y },
    prevPos: { x, y },
    vel: { x: 0, y: 0 },
    ang: Math.atan2(y - height / 2, x - width / 2),
  };
};

// Check is a star is within window, use CSS logical coordination.
const onScreen = (
  x: number,
  y: number,
  width: number,
  height: number,
): boolean => {
  return x >= 0 && x <= width && y >= 0 && y <= height;
};

const StarBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const starsRef = useRef<Star[]>([]);
  const animationFrame = useRef<number>(0);
  const NUM_STARS = 500;

  // Get current CSS logical width and height.
  const getSize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return { width: 0, height: 0 };
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  };

  // Update star location
  const updateStar = (star: Star, acc: number) => {
    star.vel.x += Math.cos(star.ang) * acc;
    star.vel.y += Math.sin(star.ang) * acc;

    star.prevPos = { ...star.pos };
    star.pos.x += star.vel.x;
    star.pos.y += star.vel.y;
  };

  // Main draw implementation.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = getSize();

    // A black semi-transparent background for 'tail' effect.
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, width, height);

    // Adjust speech according to mouse location.
    // TODO: Only accelerate when scrolling.
    const acc = (mousePosRef.current.x / width) * 0.2 + 0.005;

    // Update and draw each star
    starsRef.current = starsRef.current.filter((star) => {
      updateStar(star, acc);

      const speed = Math.hypot(star.vel.x, star.vel.y);
      const alpha = Math.min(speed / 3, 1);

      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.moveTo(star.prevPos.x, star.prevPos.y);
      ctx.lineTo(star.pos.x, star.pos.y);
      ctx.stroke();

      return onScreen(star.prevPos.x, star.prevPos.y, width, height);
    });

    // Generate new starts.
    while (starsRef.current.length < NUM_STARS) {
      starsRef.current.push(createStar(width, height));
    }

    animationFrame.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    starsRef.current = Array.from({ length: NUM_STARS }, createStar);

    let lastDpr = window.devicePixelRatio || 1;

    // Adjust canvas size and zoom out, and fill with black background.
    const resizeCanvas = () => {
      const { width: cssW, height: cssH } = getSize();
      const dpr = window.devicePixelRatio || 1;

      if (
        dpr === lastDpr &&
        canvas.width === cssW * dpr &&
        canvas.height === cssH * dpr
      ) {
        return;
      }
      lastDpr = dpr;

      // Convert CSS logical coordination to physical coordination.
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Physical pixel size.
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;

      ctx.scale(dpr, dpr);

      // Fill with black to prevent a white flash.
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cssW, cssH);
      starsRef.current = [];
    };

    // Listen for CSS size change.
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(canvas);

    resizeCanvas();
    animationFrame.current = requestAnimationFrame(draw);

    // Page visibility.
    const handleVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame.current);
      } else {
        resizeCanvas();
        animationFrame.current = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", handleVis);

    return () => {
      ro.disconnect();
      document.removeEventListener("visibilitychange", handleVis);
      cancelAnimationFrame(animationFrame.current);
    };
  }, [draw]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: -1,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
      }}
    />
  );
};

export default StarBackground;
