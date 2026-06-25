import { useEffect, useState } from "react";
import { fetchPackages } from "../api/packageApi";
import type { Dashboard as DashboardData, Package } from "../types";
import PackageCard from "../components/PackageCard";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock3, AlertTriangle, PackageCheck } from "lucide-react";

interface SectionProps {
  title: string;
  packages: Package[];
}

const Section = ({ title, packages }: SectionProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl">
          <span>{title}</span>
          <span className="text-sm text-muted-foreground">
            {packages.length} Packages
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {packages.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No packages in this section.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages()
      .then((data) => setDashboard(data.dashboard))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-4xl font-bold">Office Dashboard</h1>
        <p className="text-muted-foreground">Loading packages...</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-red-500">Failed to load packages.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Office Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor package collection and delivery status.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex">
              Awaiting Pickup
              <Clock3 className="h-5 w-5 ml-2 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {dashboard.to_be_picked_up.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex">
              Collected
              <PackageCheck className="h-5 w-5 ml-2 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{dashboard.collected.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex">
              Active Deliveries
              <Truck className="h-5 w-5 ml-2 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{dashboard.active.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex">
              Delayed Packages
              <AlertTriangle className="h-5 w-5 ml-2 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{dashboard.delayed.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Package Lists */}

      <Section
        title="📬 Awaiting Pickup"
        packages={dashboard.to_be_picked_up}
      />

      <Section
        title="📦 Collected (processing at hub)"
        packages={dashboard.collected}
      />

      <Section title="🚚 Active Deliveries" packages={dashboard.active} />

      <Section title="⚠️ Delayed Packages" packages={dashboard.delayed} />
    </div>
  );
};

export default Dashboard;
