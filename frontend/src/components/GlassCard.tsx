"use client";
import React, { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({ children }) => {
  return (
    <div
      style={{
        position: "relative",
        margin: "2rem auto",
        padding: "1.5rem",
        maxWidth: "600px",
        color: "#fff",
        background: "rgba(255, 255, 255, 0.1)", // 半透明背景◆
        backdropFilter: "blur(10px)", // 毛玻璃模糊◆
        WebkitBackdropFilter: "blur(10px)", // Safari 前缀◆
        border: "1px solid rgba(255, 255, 255, 0.2)", // 细边框增强分隔◆
        borderRadius: "16px", // 圆角美观◆
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)", // 轻微阴影提升层次感◆
      }}
    >
      {children}
    </div>
  );
};

export default GlassCard;
