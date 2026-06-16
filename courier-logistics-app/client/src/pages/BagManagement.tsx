import { useEffect, useState } from "react";
import {
  fetchBags,
  fetchPackages,
  fetchRegions,
  createBag,
  addPackageToBag,
  updateBagStatus,
} from "../api/api";
import type { Bag, Package } from "../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  Info,
  Package2,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

// ─── constants ───────────────────────────────────────────────────────────────

const DIRECTIONS = [
  { value: "north", label: "North", desc: "Hubs above this region" },
  { value: "south", label: "South", desc: "Hubs below this region" },
  { value: "east", label: "East", desc: "Hubs to the right" },
  { value: "west", label: "West", desc: "Hubs to the left" },
  { value: "central", label: "Central", desc: "Central hub / local delivery" },
];

const STATUS_COLOR: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  sealed: "bg-blue-100  text-blue-800",
  delayed: "bg-red-100   text-red-800",
  loaded: "bg-purple-100 text-purple-800",
};

// Packages that can be added to a bag at the logistics hub.
// Both "to_be_picked_up" (just arrived via webhook / manual entry) and
// "picked_up" (explicitly marked collected from the front office) are eligible.
const BAGGERABLE_STATUSES = ["to_be_picked_up", "picked_up"];

// ─── workflow step pill ───────────────────────────────────────────────────────

const Step = ({
  n,
  label,
  active,
}: {
  n: number;
  label: string;
  active?: boolean;
}) => (
  <div
    className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
      active
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground"
    }`}
  >
    <span
      className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
        active ? "bg-white/20" : "bg-muted-foreground/20"
      }`}
    >
      {n}
    </span>
    {label}
  </div>
);

// ─── main component ───────────────────────────────────────────────────────────

const BagManagement = () => {
  const [bags, setBags] = useState<Bag[]>([]);
  const [available, setAvailable] = useState<Package[]>([]); // packages eligible to bag
  const [regions, setRegions] = useState<
    { id: number; region_code: string; region_name: string }[]
  >([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  // create-bag form
  const [direction, setDirection] = useState("");
  const [regionId, setRegionId] = useState("");

  // add-to-bag form
  const [selBag, setSelBag] = useState("");
  const [selPkg, setSelPkg] = useState("");
  const [addMsg, setAddMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  // ── loaders ──────────────────────────────────────────────────────────────

  const load = async () => {
    const [bagsData, pkgsData, regionsData] = await Promise.all([
      fetchBags(),
      fetchPackages(),
      fetchRegions(),
    ]);
    setBags(bagsData);
    setRegions(regionsData);

    // Show any package that hasn't been bagged yet
    const all: Package[] = pkgsData.packages ?? [];
    setAvailable(
      all.filter((p: Package) => BAGGERABLE_STATUSES.includes(p.status)),
    );
  };

  useEffect(() => {
    load();
  }, []);

  // ── handlers ─────────────────────────────────────────────────────────────

  const handleCreateBag = async () => {
    if (!direction || !regionId) return;
    await createBag({ region_id: parseInt(regionId), direction });
    setDirection("");
    setRegionId("");
    load();
  };

  const handleAddPackage = async () => {
    if (!selBag || !selPkg) return;
    setAddMsg(null);
    const res = await addPackageToBag(parseInt(selBag), parseInt(selPkg));
    if (res.error) {
      setAddMsg({ ok: false, text: res.error });
    } else {
      setAddMsg({ ok: true, text: "Package added to bag successfully." });
      setSelPkg("");
    }
    load();
  };

  const handleSeal = async (bagId: number) => {
    await updateBagStatus(bagId, { status: "sealed" });
    load();
  };

  const handleDelay = async (bagId: number) => {
    const reason = prompt("Enter delay reason:");
    if (!reason) return;
    await updateBagStatus(bagId, { status: "delayed", delay_reason: reason });
    load();
  };

  const handleReopen = async (bagId: number) => {
    await updateBagStatus(bagId, { status: "open" });
    load();
  };

  // ── derived ───────────────────────────────────────────────────────────────

  const openBags = bags.filter((b) => b.status === "open");

  const selectedBagRegion = selBag
    ? bags.find((b) => b.id === parseInt(selBag))
    : null;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Bag Management</h1>
        <p className="mt-1 text-muted-foreground">
          Group packages into sealed bags by outgoing direction, then hand them
          to Truck Schedules for loading.
        </p>
      </div>

      {/* Workflow explanation */}
      <Card className="border-dashed bg-muted/30">
        <CardContent className="pt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Workflow
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Step n={1} label="Create bag" />
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Step n={2} label="Add packages" />
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Step n={3} label="Seal bag" />
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Step n={4} label="Load onto truck" />
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Step n={5} label="Truck departs → packages go En Route" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <strong>Direction</strong> = which way the bag is heading out of
            this hub (e.g. North = towards northern regional hubs).{" "}
            <strong>Region</strong> = which hub is creating / owning this bag
            (your current hub). Once a bag is <em>sealed</em> it can be loaded
            onto a scheduled truck in the Truck Schedules page.
          </p>
        </CardContent>
      </Card>

      {/* Action panels */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* ── Create New Bag ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4" />
              Step 1 — Create New Bag
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Direction */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                Outgoing Direction
                <span className="text-xs text-muted-foreground">
                  (where this bag is headed)
                </span>
              </Label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a direction…" />
                </SelectTrigger>
                <SelectContent>
                  {DIRECTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      <div className="flex flex-col">
                        <span>{d.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {d.desc}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Region */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                Hub Region
                <span className="text-xs text-muted-foreground">
                  (this hub's region)
                </span>
              </Label>
              <Select value={regionId} onValueChange={setRegionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your hub…" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      <div className="flex flex-col">
                        <span>{r.region_code}</span>
                        <span className="text-xs text-muted-foreground">
                          {r.region_name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleCreateBag}
              disabled={!direction || !regionId}
            >
              Create Bag
            </Button>
          </CardContent>
        </Card>

        {/* ── Add Package to Bag ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package2 className="h-4 w-4" />
              Step 2 — Add Package to Bag
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bag picker — only open bags */}
            <div className="space-y-1.5">
              <Label>Select Open Bag</Label>
              {openBags.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                  No open bags — create one first.
                </p>
              ) : (
                <Select
                  value={selBag}
                  onValueChange={(v) => {
                    setSelBag(v);
                    setAddMsg(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— pick a bag —" />
                  </SelectTrigger>
                  <SelectContent>
                    {openBags.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs">
                            {b.bag_code}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {b.direction} · {(b as any).region?.region_code} ·{" "}
                            {b.package_count} pkg(s)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Package picker */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                Select Package
                <span className="text-xs text-muted-foreground">
                  (awaiting pickup or already picked up)
                </span>
              </Label>
              {available.length === 0 ? (
                <div className="flex items-start gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    No packages available to bag. Packages appear here once they
                    arrive at this hub (status: <em>To Be Picked Up</em> or{" "}
                    <em>Picked Up</em>).
                  </span>
                </div>
              ) : (
                <Select
                  value={selPkg}
                  onValueChange={(v) => {
                    setSelPkg(v);
                    setAddMsg(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— pick a package —" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs">
                            {p.tracking_id.slice(0, 13)}…
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {p.sender_name} → {p.receiver_name} · {p.weight} kg
                            {p.status === "to_be_picked_up" && (
                              <span className="ml-1 text-amber-600">
                                (will be marked Picked Up)
                              </span>
                            )}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {addMsg && (
              <div
                className={`rounded-md px-3 py-2 text-sm ${
                  addMsg.ok
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {addMsg.text}
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleAddPackage}
              disabled={!selBag || !selPkg}
            >
              Add to Bag
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── All Bags ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            All Bags
            <span className="text-sm font-normal text-muted-foreground">
              {bags.length} bag{bags.length !== 1 ? "s" : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bags.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No bags yet. Create one above.
            </div>
          ) : (
            <div className="space-y-2">
              {bags.map((b) => (
                <div key={b.id} className="rounded-lg border">
                  {/* Bag summary row */}
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    {/* Expand toggle */}
                    <button
                      onClick={() =>
                        setExpanded(expanded === b.id ? null : b.id)
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {expanded === b.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    <span className="w-44 font-mono text-xs text-muted-foreground">
                      {b.bag_code}
                    </span>

                    {/* Direction badge */}
                    <Badge variant="outline" className="capitalize">
                      {b.direction}
                    </Badge>

                    {/* Hub region */}
                    <Badge variant="secondary">
                      {(b as any).region?.region_code ?? "—"}
                    </Badge>

                    {/* Status pill */}
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_COLOR[b.status] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {b.status}
                    </span>

                    <span className="flex-1 text-sm text-muted-foreground">
                      {b.package_count} pkg{b.package_count !== 1 ? "s" : ""}
                    </span>

                    {/* Context-aware action buttons */}
                    <div className="flex gap-2">
                      {b.status === "open" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSeal(b.id)}
                            disabled={b.package_count === 0}
                            title={
                              b.package_count === 0
                                ? "Add at least one package before sealing"
                                : "Lock this bag"
                            }
                          >
                            Seal
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelay(b.id)}
                          >
                            Mark Delayed
                          </Button>
                        </>
                      )}
                      {b.status === "delayed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReopen(b.id)}
                        >
                          Reopen
                        </Button>
                      )}
                      {b.status === "sealed" && (
                        <span className="text-xs italic text-muted-foreground">
                          Ready to load onto a truck →
                        </span>
                      )}
                      {b.status === "loaded" && (
                        <span className="text-xs italic text-muted-foreground">
                          On truck
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded package list */}
                  {expanded === b.id && (
                    <div className="border-t bg-muted/20 px-8 py-3">
                      {(b as any).packages?.length > 0 ? (
                        <table className="w-full text-xs">
                          <thead className="text-muted-foreground">
                            <tr>
                              <th className="pb-2 text-left">Tracking ID</th>
                              <th className="pb-2 text-left">Sender</th>
                              <th className="pb-2 text-left">Receiver</th>
                              <th className="pb-2 text-left">Weight</th>
                              <th className="pb-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {(b as any).packages.map((p: Package) => (
                              <tr key={p.id}>
                                <td className="py-1.5 font-mono">
                                  {p.tracking_id.slice(0, 13)}…
                                </td>
                                <td className="py-1.5">{p.sender_name}</td>
                                <td className="py-1.5">{p.receiver_name}</td>
                                <td className="py-1.5">{p.weight} kg</td>
                                <td className="py-1.5 capitalize">
                                  {p.status.replace(/_/g, " ")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No packages in this bag yet.
                        </p>
                      )}
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

export default BagManagement;
