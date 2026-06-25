import { useEffect, useState } from "react";
import { fetchPackages } from "../api/api";
import type { Package } from "../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Package2,
  ShoppingBag,
  AlertTriangle,
  Inbox,
  RefreshCw,
  Truck,
} from "lucide-react";

const statusLabel: Record<string, string> = {
  to_be_picked_up: "To Be Picked Up",
  picked_up: "Picked Up",
  added_to_bag: "Added to Bag",
  en_route: "En Route",
  arrived: "Arrived",
  scheduled_for_delivery: "Scheduled for Delivery",
  out_for_delivery: "Out for Delivery",
};

const statusVariant: Record<string, string> = {
  to_be_picked_up: "bg-blue-100 text-blue-700",
  picked_up: "bg-purple-100 text-purple-700",
  added_to_bag: "bg-amber-100 text-amber-700",
  en_route: "bg-green-100 text-green-700",
  arrived: "bg-emerald-100 text-emerald-700",
  scheduled_for_delivery: "bg-cyan-100 text-cyan-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
};

const PackageTable = ({ packages }: { packages: Package[] }) =>
  packages.length === 0 ? (
    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
      No packages in this section.
    </div>
  ) : (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            {[
              "Tracking ID",
              "Sender",
              "Receiver",
              "Weight",
              "Status",
              "Delay",
            ].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {packages.map((p) => (
            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {p.tracking_id.slice(0, 8)}…
              </td>
              <td className="px-4 py-3 font-medium">{p.sender_name}</td>
              <td className="px-4 py-3">{p.receiver_name}</td>
              <td className="px-4 py-3">{p.weight} kg</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusVariant[p.status] || "bg-slate-100 text-slate-700"}`}
                >
                  {statusLabel[p.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-red-500">
                {p.delay_reason || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

const Section = ({
  title,
  packages,
  icon,
}: {
  title: string;
  packages: Package[];
  icon: React.ReactNode;
}) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center justify-between text-base">
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <span className="text-sm font-normal text-muted-foreground">
          {packages.length} packages
        </span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <PackageTable packages={packages} />
    </CardContent>
  </Card>
);

const getWindowLabel = () => {
  const h = new Date().getHours();
  if (h < 12) return "Morning window (midnight – noon)";
  if (h < 18) return "Afternoon window (noon – 6 pm)";
  return "Evening window (6 pm – midnight)";
};

const Dashboard = () => {
  const [dashboard, setDashboard] = useState<{
    new_in_window: Package[];
    unbagged: Package[];
    bagged: Package[];
    in_transit: Package[];
    delayed: Package[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchPackages()
      .then((d) => setDashboard(d.dashboard))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading)
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  if (!dashboard) return null;

  const stats = [
    {
      label: "New in Window",
      count: dashboard.new_in_window.length,
      icon: <Inbox className="h-5 w-5 text-indigo-500" />,
      sub: getWindowLabel(),
    },
    {
      label: "Unbagged",
      count: dashboard.unbagged.length,
      icon: <Package2 className="h-5 w-5 text-amber-500" />,
      sub: "Picked up, awaiting bag",
    },
    {
      label: "Bagged",
      count: dashboard.bagged.length,
      icon: <ShoppingBag className="h-5 w-5 text-blue-500" />,
      sub: "In sealed bags",
    },
    {
      label: "In Transit",
      count: dashboard.in_transit.length,
      icon: <Truck className="h-5 w-5 text-green-500" />,
      sub: "Departed / between hubs",
    },
    {
      label: "Delayed",
      count: dashboard.delayed.length,
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      sub: "Requires attention",
    },
  ];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Logistics Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Back-office package and logistics management.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                {s.icon}
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{s.count}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Section
        title={`New in Current Window — ${getWindowLabel()}`}
        packages={dashboard.new_in_window}
        icon={<Inbox className="h-4 w-4 text-indigo-500" />}
      />
      <Section
        title="Unbagged Packages ( Awaiting bag assignment )"
        packages={dashboard.unbagged}
        icon={<Package2 className="h-4 w-4 text-amber-500" />}
      />
      <Section
        title="Bagged Packages"
        packages={dashboard.bagged}
        icon={<ShoppingBag className="h-4 w-4 text-blue-500" />}
      />
      <Section
        title="In Transit ( Departed on truck / between hubs )"
        packages={dashboard.in_transit}
        icon={<Truck className="h-4 w-4 text-green-500" />}
      />
      <Section
        title="Delayed Packages"
        packages={dashboard.delayed}
        icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
      />
    </div>
  );
};

export default Dashboard;
