"use client";

import { useEffect, useState } from "react";

export default function HealthStatus() {
  const [healthStatus, setHealthStatus] = useState("Loading...");

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(
          process.env.NODE_ENV === "development"
            ? "http://localhost:8080/api/health"
            : "/api/health",
        );
        const text = await res.text();
        setHealthStatus(text);
      } catch (err) {
        console.error("Error fetching /health:", err);
        setHealthStatus("Failed to fetch health status");
      }
    };

    fetchHealth();
  }, []);

  return <p>Health Check: {healthStatus}</p>;
}
