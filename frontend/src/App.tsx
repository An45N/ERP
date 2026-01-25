import { useState, useEffect } from "react";

function App() {
  const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Health check failed:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>ERP Platform</h1>
      <p>Enterprise Resource Planning System</p>
      
      <div style={{ marginTop: "2rem", padding: "1rem", background: "#f5f5f5", borderRadius: "8px" }}>
        <h2>Backend Status</h2>
        {loading ? (
          <p>Checking backend...</p>
        ) : health ? (
          <div>
            <p>✅ Status: {health.status}</p>
            <p>🕐 Timestamp: {health.timestamp}</p>
          </div>
        ) : (
          <p>❌ Backend not reachable</p>
        )}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>Next Steps</h2>
        <ul>
          <li>Configure SQL Server connection</li>
          <li>Define database schema (Prisma)</li>
          <li>Implement authentication module</li>
          <li>Build master data management</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
