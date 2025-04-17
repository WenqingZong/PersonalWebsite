import StarBackground from "@/components/StarBackground";
import HealthStatus from "@/components/HealthStatus";

export default function Home() {
  return (
    <div style={{ position: "relative" }}>
      <StarBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        <h1>Your Content Here</h1>
        <HealthStatus />
      </div>
    </div>
  );
}
