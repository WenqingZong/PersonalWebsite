// import Image from "next/image";
import StarBackground from "@/components/StarBackground";

export default function Home() {
  return (
    <div style={{ position: 'relative' }}>
      <StarBackground />
      {/* 你的页面内容 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1>Your Content Here</h1>
      </div>
    </div>
  );
}
