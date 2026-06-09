import { useState } from "react";
import { fetchPackageByTrackingId } from "../api/packageApi";
import type { Package } from "../types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";

const statusLabel: Record<string, string> = {
  to_be_picked_up: "To Be Picked Up",
  picked_up: "Picked Up",
  added_to_bag: "Added to Bag",
  en_route: "En Route",
  arrived: "Arrived",
  scheduled_for_delivery: "Scheduled for Delivery",
  out_for_delivery: "Out for Delivery",
};

const TrackPackage = () => {
  const [trackingId, setTrackingId] = useState("");
  const [pkg, setPkg] = useState<Package | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setPkg(null);
    setLoading(true);

    try {
      const data = await fetchPackageByTrackingId(trackingId.trim());
      setPkg(data);
    } catch {
      setError("Package not found. Please check your tracking ID.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            📦 Track Your Package
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleTrack}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Input
              placeholder="Enter Tracking ID"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              required
            />

            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Track"}
            </Button>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
              {error}
            </div>
          )}

          {pkg && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Package Details</CardTitle>

                  <Badge variant="secondary">{statusLabel[pkg.status]}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Current Location
                  </p>
                  <p className="font-medium">
                    {pkg.current_location || "Not updated yet"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p className="font-medium">
                    {pkg.region_code} - {pkg.region_name}
                  </p>
                </div>

                {pkg.delay_reason && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600">
                    <strong>Delay Reason:</strong> {pkg.delay_reason}
                  </div>
                )}

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="font-medium">{pkg.sender_address}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">To</p>
                    <p className="font-medium">{pkg.receiver_address}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-medium">{pkg.weight} kg</p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackPackage;
