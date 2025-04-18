"use client";

import { useRef, useEffect, useCallback } from 'react';

interface Star {
  pos: { x: number; y: number };
  prevPos: { x: number; y: number };
  vel: { x: number; y: number };
  ang: number;
}

const StarBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const starsRef = useRef<Star[]>([]);
  const animationFrame = useRef<number>(null);

  const NUM_STARS = 500;

  const onScreen = (x: number, y: number): boolean => {
    if (!canvasRef.current) return false;
    return x >= 0 && x <= canvasRef.current.width && y >= 0 && y <= canvasRef.current.height;
  };

  const createStar = (): Star => {
    if (!canvasRef.current) throw new Error("Canvas not initialized");

    const x: number = Math.random() * canvasRef.current.width;
    const y: number = Math.random() * canvasRef.current.height;
    return {
      pos: { x, y },
      prevPos: { x: 0, y: 0 },
      vel: { x: 0, y: 0 },
      ang: Math.atan2(
        y - canvasRef.current.height / 2,
        x - canvasRef.current.width / 2
      ),
    };
  };

  const updateStar = (star: Star, acc: number) => {
    star.vel.x += Math.cos(star.ang) * acc;
    star.vel.y += Math.sin(star.ang) * acc;

    star.prevPos = { ...star.pos };
    star.pos.x += star.vel.x;
    star.pos.y += star.vel.y;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布（实现拖尾效果）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 从ref获取鼠标位置计算加速度
    const acc = mousePosRef.current.x / canvas.width * 0.2 + 0.005;

    // 更新和绘制星星
    starsRef.current = starsRef.current.filter(star => {
      updateStar(star, acc);

      // 绘制运动轨迹
      const velocityMagnitude = Math.sqrt(star.vel.x ** 2 + star.vel.y ** 2);
      const alpha = Math.min(velocityMagnitude / 3 * 255, 255);

      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha/255})`;
      ctx.lineWidth = 2;
      ctx.moveTo(star.prevPos.x, star.prevPos.y);
      ctx.lineTo(star.pos.x, star.pos.y);
      ctx.stroke();

      return onScreen(star.prevPos.x, star.prevPos.y);
    });

    // 补充消失的星星
    while (starsRef.current.length < NUM_STARS) {
      starsRef.current.push(createStar());
    }

    animationFrame.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 响应式画布尺寸
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();

    // 初始化星星
    starsRef.current = Array.from({ length: NUM_STARS }, createStar);
    animationFrame.current = requestAnimationFrame(draw);

    // 窗口尺寸变化处理
    window.addEventListener('resize', updateCanvasSize);

    // 性能优化：页面不可见时暂停动画
    const handleVisibilityChange = () => {
      if (document.hidden && animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      } else {
        animationFrame.current = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [draw]);

  useEffect(() => {
    // 鼠标移动监听（使用ref存储位置，不触发重渲染）
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1,
        width: '100vw',
        height: '100vh',
      }}
    />
  );
};

export default StarBackground;