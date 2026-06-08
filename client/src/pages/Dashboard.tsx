import { useEffect, useState } from "react";
import { fetchPackages } from "../api/packageApi";
import type { Dashboard as DashboardData, Package } from "../types";
import PackageCard from "../components/PackageCard";

const Section = ({
  title,
  packages,
  color,
}: {
  title: string;
  packages: Package[];
  color: string;
}) => (
  <div style={{ marginBottom: "2rem" }}>
    <h2 style={{ borderLeft: `4px solid ${color}`, paddingLeft: "0.75rem" }}>
      {title}{" "}
      <span style={{ fontSize: "0.9rem", color: "#666" }}>
        ({packages.length})
      </span>
    </h2>
    {packages.length === 0 ? (
      <p style={{ color: "#888" }}>No packages in this section.</p>
    ) : (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages()
      .then((data) => setDashboard(data.dashboard))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;
  if (!dashboard)
    return <p style={{ padding: "2rem" }}>Failed to load packages.</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Office Dashboard</h1>
      <Section
        title="📬 Awaiting Pickup"
        packages={dashboard.to_be_picked_up}
        color="#3b82f6"
      />
      <Section
        title="🚚 Active Deliveries"
        packages={dashboard.active}
        color="#22c55e"
      />
      <Section
        title="⚠️ Delayed Packages"
        packages={dashboard.delayed}
        color="#ef4444"
      />
    </div>
  );
};

export default Dashboard;
