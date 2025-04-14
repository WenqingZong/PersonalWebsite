// import Image from "next/image";
import P5Background from "@/components/P5Background";

export default function Home() {
  return (
    <div style={{ position: 'relative' }}>
      <P5Background />
      {/* 你的页面内容 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1>Your Content Here</h1>
      </div>
    </div>
  );
}
