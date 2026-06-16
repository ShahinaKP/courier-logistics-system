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
import { Separator } from "../components/ui/separator";
import { RefreshCw, CheckCircle2, Circle } from "lucide-react";

const STATUS_FLOW = [
  { key: "to_be_picked_up", label: "To Be Picked Up" },
  { key: "picked_up", label: "Picked Up" },
  { key: "added_to_bag", label: "Added to Bag" },
  { key: "en_route", label: "En Route" },
  { key: "arrived", label: "Arrived" },
  { key: "scheduled_for_delivery", label: "Scheduled for Delivery" },
  { key: "out_for_delivery", label: "Out for Delivery" },
];

const statusVariant: Record<string, string> = {
  to_be_picked_up: "bg-blue-100 text-blue-700",
  picked_up: "bg-purple-100 text-purple-700",
  added_to_bag: "bg-amber-100 text-amber-700",
  en_route: "bg-green-100 text-green-700",
  arrived: "bg-emerald-100 text-emerald-700",
  scheduled_for_delivery: "bg-cyan-100 text-cyan-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
};

const generateCaptcha = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
};

const TrackPackage = () => {
  const [trackingId, setTrackingId] = useState("");
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");
  const [pkg, setPkg] = useState<Package | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setPkg(null);
    if (captchaInput.trim().toUpperCase() !== captcha) {
      setError("Incorrect CAPTCHA. Please try again.");
      refreshCaptcha();
      return;
    }
    setLoading(true);

    try {
      const data = await fetchPackageByTrackingId(trackingId.trim());
      setPkg(data);
      refreshCaptcha();
    } catch {
      setError("Package not found. Please check your tracking ID.");
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = pkg
    ? STATUS_FLOW.findIndex((s) => s.key === pkg.status)
    : -1;

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            📦 Track Your Package
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tracking ID</label>
              <Input
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                required
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                CAPTCHA Verification
              </label>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-40 select-none items-center justify-center rounded-md border bg-muted font-mono text-lg tracking-[0.35em] line-through decoration-wavy">
                  {captcha}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={refreshCaptcha}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Type the characters above"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                required
                className="uppercase"
                maxLength={6}
              />
            </div>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Searching…" : "Track Package"}
            </Button>
          </form>

          {pkg && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">Package Status</CardTitle>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusVariant[pkg.status] || "bg-slate-100 text-slate-700"}`}
                  >
                    {STATUS_FLOW.find((s) => s.key === pkg.status)?.label}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status timeline */}
                <div className="space-y-1">
                  {STATUS_FLOW.map((step, idx) => {
                    const done = idx <= currentStepIndex;
                    const active = idx === currentStepIndex;
                    return (
                      <div key={step.key} className="flex items-center gap-2">
                        {done ? (
                          <CheckCircle2
                            className={`h-4 w-4 shrink-0 ${active ? "text-green-600" : "text-green-400"}`}
                          />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                        )}
                        <span
                          className={`text-sm ${active ? "font-semibold text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/50"}`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Separator />
                <div className="grid gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current Location</p>
                    <p className="font-medium">
                      {pkg.current_location || "Not updated yet"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Region</p>
                    <p className="font-medium">
                      {(pkg as any).region?.region_code} –{" "}
                      {(pkg as any).region?.region_name}
                    </p>
                  </div>
                  {pkg.delay_reason && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600">
                      <strong>Delay:</strong> {pkg.delay_reason}
                    </div>
                  )}
                </div>
                <Separator />
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">From</p>
                    <p className="font-medium">{pkg.sender_address}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">To</p>
                    <p className="font-medium">{pkg.receiver_address}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Weight</p>
                    <p className="font-medium">{pkg.weight} kg</p>
                  </div>
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
