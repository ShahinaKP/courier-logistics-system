import { useEffect, useState } from "react";
import { fetchPackages, updatePackageStatus } from "../api/api";
import type { Package } from "../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { ClipboardEdit } from "lucide-react";

const STATUSES = [
  { value: "to_be_picked_up", label: "To Be Picked Up" },
  { value: "picked_up", label: "Picked Up" },
  { value: "added_to_bag", label: "Added to Bag" },
  { value: "en_route", label: "En Route" },
  { value: "arrived", label: "Arrived" },
  { value: "scheduled_for_delivery", label: "Scheduled for Delivery" },
  { value: "out_for_delivery", label: "Out for Delivery" },
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

const PackageStatusUpdate = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [delayReason, setDelayReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const load = () => {
    fetchPackages().then((d) => setPackages(d.packages));
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (pkg: Package) => {
    setEditingId(pkg.tracking_id);
    setNewStatus(pkg.status);
    setNewLocation(pkg.current_location || "");
    setDelayReason(pkg.delay_reason || "");
    setSuccessId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewStatus("");
    setNewLocation("");
    setDelayReason("");
  };

  const saveEdit = async (trackingId: string) => {
    setSaving(true);
    try {
      await updatePackageStatus(trackingId, {
        status: newStatus,
        current_location: newLocation || undefined,
        delay_reason: delayReason || undefined,
      });
      setSuccessId(trackingId);
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const filtered = packages.filter(
    (p) =>
      p.tracking_id.includes(search) ||
      p.sender_name.toLowerCase().includes(search.toLowerCase()) ||
      p.receiver_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          Package Status Updates
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manually update status, location, and delay info for individual
          packages.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardEdit className="h-4 w-4" />
            All Packages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by tracking ID, sender, or receiver…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No packages found.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => (
                <div key={p.id} className="rounded-lg border">
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground w-28">
                      {p.tracking_id.slice(0, 8)}…
                    </span>
                    <span className="font-medium text-sm flex-1 min-w-[120px]">
                      {p.sender_name} → {p.receiver_name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {p.weight} kg
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusVariant[p.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {STATUSES.find((s) => s.value === p.status)?.label ??
                        p.status}
                    </span>
                    {p.current_location && (
                      <Badge variant="outline" className="text-xs">
                        📍 {p.current_location}
                      </Badge>
                    )}
                    {successId === p.tracking_id && (
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Saved
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        editingId === p.tracking_id
                          ? cancelEdit()
                          : startEdit(p)
                      }
                    >
                      {editingId === p.tracking_id ? "Cancel" : "Edit"}
                    </Button>
                  </div>

                  {/* Edit form */}
                  {editingId === p.tracking_id && (
                    <div className="border-t bg-muted/20 px-6 py-4 grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-xs">New Status</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Current Location</Label>
                        <Input
                          placeholder="e.g. Region HUB-NORTH"
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">
                          Delay Reason (leave blank to clear)
                        </Label>
                        <Input
                          placeholder="e.g. Weather conditions"
                          value={delayReason}
                          onChange={(e) => setDelayReason(e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-3 flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(p.tracking_id)}
                          disabled={saving}
                        >
                          {saving ? "Saving…" : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PackageStatusUpdate;
