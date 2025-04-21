import StarBackground from "@/components/StarBackground";
import HealthStatus from "@/components/HealthStatus";
import GlassCard from "@/components/GlassCard";

export default function Home() {
  return (
    <div style={{ position: "relative" }}>
      <StarBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        <GlassCard>
          <h1>你的标题文字</h1>
          <p>这里放你需要展示的内容，文字在毛玻璃上更易阅读。</p>
          <HealthStatus />
        </GlassCard>
      </div>
    </div>
  );
}
