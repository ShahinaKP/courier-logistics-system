import { useEffect, useState } from "react";
import {
  fetchBags,
  fetchPackages,
  fetchRegions,
  createBag,
  addPackageToBag,
  updateBagStatus,
} from "../api/api";
import type { Bag, Package, Region } from "../types";
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
  ArrowRight,
  Navigation,
  Package2,
  ShoppingBag,
  Info,
} from "lucide-react";
import { ConfirmDialog, DelayModal } from "../components/Dialog";

// ── Direction utilities ───────────────────────────────────────────────────────

const DIRECTION_MAP: Record<string, Record<string, string>> = {
  "RG-N": { "RG-S": "south", "RG-E": "east", "RG-W": "west", "RG-C": "south" },
  "RG-S": { "RG-N": "north", "RG-E": "east", "RG-W": "west", "RG-C": "north" },
  "RG-E": { "RG-N": "north", "RG-S": "south", "RG-W": "west", "RG-C": "west" },
  "RG-W": { "RG-N": "north", "RG-S": "south", "RG-E": "east", "RG-C": "east" },
  "RG-C": { "RG-N": "north", "RG-S": "south", "RG-E": "east", "RG-W": "west" },
};

const getSuggestedDirection = (from: string, to: string) => {
  if (!from || !to) return "";
  if (from === to) return "central";
  return DIRECTION_MAP[from]?.[to] ?? "central";
};

// ── Constants ─────────────────────────────────────────────────────────────────

const DIRECTIONS = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "central", label: "Central / Local" },
];

const STATUS_COLOR: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  sealed: "bg-blue-100  text-blue-800",
  delayed: "bg-red-100   text-red-800",
  loaded: "bg-purple-100 text-purple-800",
};

const DIRECTION_COLOR: Record<string, string> = {
  north: "bg-sky-100 text-sky-700",
  south: "bg-orange-100 text-orange-700",
  east: "bg-violet-100 text-violet-700",
  west: "bg-teal-100 text-teal-700",
  central: "bg-slate-100 text-slate-700",
};

const Step = ({ n, label }: { n: number; label: string }) => (
  <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/20 text-[10px] font-bold">
      {n}
    </span>
    {label}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const BagManagement = () => {
  const [bags, setBags] = useState<Bag[]>([]);
  const [available, setAvailable] = useState<Package[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Create bag form
  const [direction, setDirection] = useState("");
  const [regionId, setRegionId] = useState("");

  // Add to bag form
  const [selBag, setSelBag] = useState("");
  const [selPkg, setSelPkg] = useState("");
  const [addMsg, setAddMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  // ── Modal state ───────────────────────────────────────────────────────────
  const [sealConfirm, setSealConfirm] = useState<{
    open: boolean;
    bagId: number | null;
  }>({
    open: false,
    bagId: null,
  });
  const [delayModal, setDelayModal] = useState<{
    open: boolean;
    bagId: number | null;
  }>({
    open: false,
    bagId: null,
  });
  const [modalLoading, setModalLoading] = useState(false);

  // ── Loaders ───────────────────────────────────────────────────────────────

  const load = async () => {
    const [bagsData, pkgsData, regionsData] = await Promise.all([
      fetchBags(),
      fetchPackages(),
      fetchRegions(),
    ]);
    setBags(bagsData);
    setRegions(regionsData);
    const all: Package[] = pkgsData.packages ?? [];
    setAvailable(
      all.filter((p) => ["to_be_picked_up", "picked_up"].includes(p.status)),
    );
  };

  useEffect(() => {
    load();
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const openBags = bags.filter((b) => b.status === "open");
  const selectedBag = selBag
    ? bags.find((b) => b.id === parseInt(selBag))
    : null;
  const selectedBagRegionCode = (selectedBag as any)?.region?.region_code ?? "";

  // ── Handlers ─────────────────────────────────────────────────────────────

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
      setAddMsg({ ok: true, text: "Package added to bag." });
      setSelPkg("");
    }
    load();
  };

  // Seal — confirm dialog
  const confirmSeal = async () => {
    if (!sealConfirm.bagId) return;
    setModalLoading(true);
    const res = await updateBagStatus(sealConfirm.bagId, { status: "sealed" });
    setModalLoading(false);
    setSealConfirm({ open: false, bagId: null });
    if (res?.error) {
      setAddMsg({ ok: false, text: res.error });
    }
    load();
  };

  // Delay — modal with reason input
  const confirmDelay = async (reason: string) => {
    if (!delayModal.bagId) return;
    setModalLoading(true);
    await updateBagStatus(delayModal.bagId, {
      status: "delayed",
      delay_reason: reason,
    });
    setModalLoading(false);
    setDelayModal({ open: false, bagId: null });
    load();
  };

  const handleReopen = async (bagId: number) => {
    await updateBagStatus(bagId, { status: "open" });
    load();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Modals */}
      <ConfirmDialog
        open={sealConfirm.open}
        onClose={() => setSealConfirm({ open: false, bagId: null })}
        onConfirm={confirmSeal}
        title="Seal this bag?"
        description="Once sealed, no more packages can be added. The bag will be ready to load onto a truck."
        confirmLabel="Seal Bag"
        variant="default"
        loading={modalLoading}
      />

      <DelayModal
        open={delayModal.open}
        onClose={() => setDelayModal({ open: false, bagId: null })}
        onConfirm={confirmDelay}
        title="Mark Bag as Delayed"
        loading={modalLoading}
      />

      {/* Page header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Bag Management</h1>
        <p className="mt-1 text-muted-foreground">
          Group packages into sealed bags by outgoing direction, then load onto
          a truck.
        </p>
      </div>

      {/* Workflow banner */}
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
            <Step n={4} label="Load onto truck (Truck Schedules page)" />
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Step n={5} label="Truck departs → packages En Route" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create bag */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4" />
              Step 1 — Create New Bag
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                Outgoing Direction
                <span className="ml-1 text-xs text-muted-foreground">
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
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                Hub Region
                <span className="ml-1 text-xs text-muted-foreground">
                  (this hub)
                </span>
              </Label>
              <Select value={regionId} onValueChange={setRegionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your hub…" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      <span className="font-mono">{r.region_code}</span>
                      <span className="ml-2 text-muted-foreground">
                        {r.region_name}
                      </span>
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

        {/* Add package to bag */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package2 className="h-4 w-4" />
              Step 2 — Add Package to Bag
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                        <span className="font-mono text-xs">{b.bag_code}</span>
                        <span className="ml-2 text-xs capitalize text-muted-foreground">
                          {b.direction} · {(b as any).region?.region_code} ·{" "}
                          {b.package_count} pkg(s)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Select Package</Label>
              {available.length === 0 ? (
                <div className="flex items-start gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  No packages awaiting bag assignment.
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
                    {available.map((p) => {
                      const suggestedDir = getSuggestedDirection(
                        selectedBagRegionCode,
                        (p as any).destination_region?.region_code ?? "",
                      );
                      return (
                        <SelectItem key={p.id} value={String(p.id)}>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs">
                              {p.tracking_id.slice(0, 13)}…
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {p.sender_name} → {p.receiver_name}
                              {(p as any).receiver_pincode &&
                                ` · ${(p as any).receiver_pincode}`}
                              {(p as any).destination_region && (
                                <span className="ml-1 font-medium text-foreground">
                                  → {(p as any).destination_region.region_code}
                                </span>
                              )}
                              {suggestedDir && selectedBagRegionCode && (
                                <span
                                  className={`ml-1.5 rounded px-1 py-0.5 text-[10px] font-semibold capitalize ${DIRECTION_COLOR[suggestedDir]}`}
                                >
                                  {suggestedDir}
                                </span>
                              )}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
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

      {/* All bags */}
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
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3">
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

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${DIRECTION_COLOR[b.direction] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      <Navigation className="h-3 w-3" />
                      {b.direction}
                    </span>

                    <Badge variant="secondary">
                      {(b as any).region?.region_code ?? "—"}
                    </Badge>

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[b.status] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {b.status}
                    </span>

                    <span className="flex-1 text-sm text-muted-foreground">
                      {b.package_count} pkg{b.package_count !== 1 ? "s" : ""}
                    </span>

                    <div className="flex items-center gap-2">
                      {b.status === "open" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={b.package_count === 0}
                            title={
                              b.package_count === 0
                                ? "Add packages first"
                                : "Seal this bag"
                            }
                            onClick={() =>
                              setSealConfirm({ open: true, bagId: b.id })
                            }
                          >
                            Seal
                          </Button>
                          {b.package_count === 0 && (
                            <span className="text-xs italic text-muted-foreground">
                              Add packages first
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setDelayModal({ open: true, bagId: b.id })
                            }
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
                              <th className="pb-2 text-left">Pincode</th>
                              <th className="pb-2 text-left">Destination</th>
                              <th className="pb-2 text-left">Weight</th>
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
                                <td className="py-1.5 font-mono">
                                  {(p as any).receiver_pincode ?? "—"}
                                </td>
                                <td className="py-1.5">
                                  {(p as any).destination_region ? (
                                    <Badge variant="outline">
                                      {
                                        (p as any).destination_region
                                          .region_code
                                      }
                                    </Badge>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="py-1.5">{p.weight} kg</td>
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
