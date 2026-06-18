import { useEffect, useState } from "react";
import {
  fetchTrucks,
  fetchSchedules,
  fetchBags,
  fetchRegions,
  createTruck,
  createSchedule,
  updateSchedule,
  loadBagOntoTruck,
} from "../api/api";
import type { Truck, TruckSchedule, Bag } from "../types";
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
import { ConfirmDialog, DelayModal } from "../components/Dialog";
import {
  Truck as TruckIcon,
  PackageOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

const scheduleStatusColor: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  delayed: "bg-red-100 text-red-700",
  departed: "bg-green-100 text-green-700",
  arrived: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-700",
};

const TruckSchedules = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [schedules, setSchedules] = useState<TruckSchedule[]>([]);
  const [sealedBags, setSealedBags] = useState<Bag[]>([]);
  const [regions, setRegions] = useState<
    { id: number; region_code: string; region_name: string }[]
  >([]);
  const [expandedSchedule, setExpandedSchedule] = useState<number | null>(null);

  const [truckCode, setTruckCode] = useState("");
  const [truckCapacity, setTruckCapacity] = useState("10");
  const [selectedTruck, setSelectedTruck] = useState("");
  const [scheduleRegion, setScheduleRegion] = useState("");
  const [departure, setDeparture] = useState("");
  const [loadScheduleId, setLoadScheduleId] = useState("");
  const [loadBagId, setLoadBagId] = useState("");

  const [departConfirm, setDepartConfirm] = useState<{
    open: boolean;
    scheduleId: number | null;
    truckCode: string;
  }>({ open: false, scheduleId: null, truckCode: "" });
  const [arrivedConfirm, setArrivedConfirm] = useState<{
    open: boolean;
    scheduleId: number | null;
    truckCode: string;
  }>({ open: false, scheduleId: null, truckCode: "" });
  const [delayModal, setDelayModal] = useState<{
    open: boolean;
    scheduleId: number | null;
  }>({ open: false, scheduleId: null });
  const [rescheduleConfirm, setRescheduleConfirm] = useState<{
    open: boolean;
    scheduleId: number | null;
    truckCode: string;
  }>({ open: false, scheduleId: null, truckCode: "" });
  const [modalLoading, setModalLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const load = () => {
    fetchTrucks().then(setTrucks);
    fetchSchedules().then(setSchedules);
    fetchBags().then((bags: Bag[]) =>
      setSealedBags(bags.filter((b) => b.status === "sealed")),
    );
    fetchRegions().then(setRegions);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateTruck = async () => {
    if (!truckCode) return;
    const result = await createTruck({
      truck_code: truckCode,
      capacity: parseInt(truckCapacity),
    });
    if (result.error) {
      setActionMsg({ ok: false, text: result.error });
      return;
    }
    setTruckCode("");
    setTruckCapacity("10");
    load();
  };

  const handleCreateSchedule = async () => {
    if (!selectedTruck || !scheduleRegion || !departure) return;
    await createSchedule({
      truck_id: parseInt(selectedTruck),
      region_id: parseInt(scheduleRegion),
      scheduled_departure: departure,
    });
    setSelectedTruck("");
    setScheduleRegion("");
    setDeparture("");
    load();
  };

  const handleLoadBag = async () => {
    if (!loadScheduleId || !loadBagId) return;
    const result = await loadBagOntoTruck(
      parseInt(loadScheduleId),
      parseInt(loadBagId),
    );
    if (result.error) {
      setActionMsg({ ok: false, text: result.error });
      return;
    }
    setLoadBagId("");
    load();
  };

  const confirmDepart = async () => {
    if (!departConfirm.scheduleId) return;
    setModalLoading(true);
    await updateSchedule(departConfirm.scheduleId, {
      status: "departed",
      actual_departure: new Date().toISOString(),
    });
    setModalLoading(false);
    setDepartConfirm({ open: false, scheduleId: null, truckCode: "" });
    load();
  };

  const confirmArrived = async () => {
    if (!arrivedConfirm.scheduleId) return;
    setModalLoading(true);
    await updateSchedule(arrivedConfirm.scheduleId, { status: "arrived" });
    setModalLoading(false);
    setArrivedConfirm({ open: false, scheduleId: null, truckCode: "" });
    load();
  };

  const confirmDelay = async (reason: string) => {
    if (!delayModal.scheduleId) return;
    setModalLoading(true);
    await updateSchedule(delayModal.scheduleId, {
      status: "delayed",
      delay_reason: reason,
    });
    setModalLoading(false);
    setDelayModal({ open: false, scheduleId: null });
    load();
  };

  const confirmReschedule = async () => {
    if (!rescheduleConfirm.scheduleId) return;
    setModalLoading(true);
    await updateSchedule(rescheduleConfirm.scheduleId, {
      status: "scheduled",
      delay_reason: "",
    });
    setModalLoading(false);
    setRescheduleConfirm({ open: false, scheduleId: null, truckCode: "" });
    load();
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <ConfirmDialog
        open={departConfirm.open}
        onClose={() =>
          setDepartConfirm({ open: false, scheduleId: null, truckCode: "" })
        }
        onConfirm={confirmDepart}
        title={`Mark ${departConfirm.truckCode} as Departed?`}
        description="The truck will be marked as departed and all packages on board will move to En Route. This cannot be undone."
        confirmLabel="Mark Departed"
        loading={modalLoading}
      />
      <ConfirmDialog
        open={arrivedConfirm.open}
        onClose={() =>
          setArrivedConfirm({ open: false, scheduleId: null, truckCode: "" })
        }
        onConfirm={confirmArrived}
        title={`Mark ${arrivedConfirm.truckCode} as Arrived?`}
        description="Confirm the truck has arrived at its destination. Package statuses will be updated to Arrived."
        confirmLabel="Mark Arrived"
        loading={modalLoading}
      />
      <ConfirmDialog
        open={rescheduleConfirm.open}
        onClose={() =>
          setRescheduleConfirm({ open: false, scheduleId: null, truckCode: "" })
        }
        onConfirm={confirmReschedule}
        title={`Reschedule ${rescheduleConfirm.truckCode}?`}
        description="This will clear the delay and move the schedule back to Scheduled. The delay reason will be removed from all packages on board."
        confirmLabel="Reschedule"
        loading={modalLoading}
      />
      <DelayModal
        open={delayModal.open}
        onClose={() => setDelayModal({ open: false, scheduleId: null })}
        onConfirm={confirmDelay}
        title="Delay This Truck Schedule"
        loading={modalLoading}
      />

      <div>
        <h1 className="text-4xl font-bold tracking-tight">Truck Schedules</h1>
        <p className="mt-2 text-muted-foreground">
          Manage truck fleet, schedules, bag loading, and departures.
        </p>
      </div>

      {actionMsg && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${actionMsg.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}
        >
          {actionMsg.text}
          <button
            className="ml-3 text-xs underline"
            onClick={() => setActionMsg(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TruckIcon className="h-4 w-4" />
              Add New Truck
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Truck Code</Label>
              <Input
                placeholder="TRK-001"
                value={truckCode}
                onChange={(e) => setTruckCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <Label>Capacity (bags)</Label>
              <Input
                type="number"
                value={truckCapacity}
                min={1}
                onChange={(e) => setTruckCapacity(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreateTruck}
              disabled={!truckCode}
            >
              Add Truck
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4" />
              Schedule Departure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Truck</Label>
              <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                <SelectTrigger>
                  <SelectValue placeholder="— select truck —" />
                </SelectTrigger>
                <SelectContent>
                  {trucks.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.truck_code} (cap: {t.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={scheduleRegion} onValueChange={setScheduleRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="— select region —" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.region_code} – {r.region_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scheduled Departure</Label>
              <Input
                type="datetime-local"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreateSchedule}
              disabled={!selectedTruck || !scheduleRegion || !departure}
            >
              Create Schedule
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PackageOpen className="h-4 w-4" />
              Load Bag onto Truck
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Schedule</Label>
              <Select value={loadScheduleId} onValueChange={setLoadScheduleId}>
                <SelectTrigger>
                  <SelectValue placeholder="— select schedule —" />
                </SelectTrigger>
                <SelectContent>
                  {schedules
                    .filter((s) => s.status === "scheduled")
                    .map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {(s as any).truck?.truck_code} →{" "}
                        {(s as any).region?.region_code} @{" "}
                        {new Date(s.scheduled_departure).toLocaleString()}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sealed Bag</Label>
              <Select value={loadBagId} onValueChange={setLoadBagId}>
                <SelectTrigger>
                  <SelectValue placeholder="— select sealed bag —" />
                </SelectTrigger>
                <SelectContent>
                  {sealedBags.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.bag_code} ({b.direction}, {b.package_count} pkgs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleLoadBag}
              disabled={!loadScheduleId || !loadBagId}
            >
              Load Bag
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            All Schedules
            <span className="text-sm font-normal text-muted-foreground">
              {schedules.length} schedules
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No schedules yet.
            </div>
          ) : (
            <div className="space-y-2">
              {schedules.map((s) => (
                <div key={s.id} className="rounded-lg border overflow-hidden">
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setExpandedSchedule(
                          expandedSchedule === s.id ? null : s.id,
                        )
                      }
                    >
                      {expandedSchedule === s.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <span className="w-24 font-mono text-sm font-semibold">
                      {(s as any).truck?.truck_code ?? `SCH-${s.id}`}
                    </span>
                    <Badge variant="secondary" className="w-20 justify-center">
                      {(s as any).region?.region_code ?? "—"}
                    </Badge>
                    <span className="flex-1 text-sm text-muted-foreground">
                      {new Date(s.scheduled_departure).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(s as any).bag_count ?? 0} bags ·{" "}
                      {(s as any).package_count ?? 0} pkgs
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${scheduleStatusColor[s.status] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {s.status}
                    </span>

                    <div className="flex gap-2">
                      {s.status === "scheduled" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDepartConfirm({
                                open: true,
                                scheduleId: s.id,
                                truckCode:
                                  (s as any).truck?.truck_code ?? `SCH-${s.id}`,
                              })
                            }
                          >
                            Mark Departed
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              setDelayModal({ open: true, scheduleId: s.id })
                            }
                          >
                            Delay
                          </Button>
                        </>
                      )}
                      {s.status === "delayed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setRescheduleConfirm({
                              open: true,
                              scheduleId: s.id,
                              truckCode:
                                (s as any).truck?.truck_code ?? `SCH-${s.id}`,
                            })
                          }
                        >
                          Reschedule
                        </Button>
                      )}
                      {s.status === "departed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setArrivedConfirm({
                              open: true,
                              scheduleId: s.id,
                              truckCode:
                                (s as any).truck?.truck_code ?? `SCH-${s.id}`,
                            })
                          }
                        >
                          Mark Arrived
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Delay reason banner */}
                  {s.status === "delayed" && s.delay_reason && (
                    <div className="flex items-center gap-2 border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        <strong>Delay reason:</strong> {s.delay_reason}
                      </span>
                    </div>
                  )}

                  {expandedSchedule === s.id && (
                    <div className="border-t bg-muted/20 px-8 py-3 text-xs text-muted-foreground">
                      {(s as any).truck_bags?.length > 0 ? (
                        <div className="space-y-1">
                          <p className="mb-1 font-medium text-foreground">
                            Loaded bags:
                          </p>
                          {(s as any).truck_bags.map((tb: any) => (
                            <div
                              key={tb.id}
                              className="flex items-center gap-3"
                            >
                              <span className="font-mono">
                                {tb.bag?.bag_code}
                              </span>
                              <span className="capitalize">
                                {tb.bag?.direction}
                              </span>
                              <span>
                                {tb.bag?.package_bags?.length ?? 0} pkgs
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No bags loaded yet.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TruckIcon className="h-4 w-4" />
            Fleet Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trucks.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No trucks in fleet yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    {["Truck Code", "Capacity", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {trucks.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-semibold">
                        {t.truck_code}
                      </td>
                      <td className="px-4 py-3">{t.capacity} bags</td>
                      <td className="px-4 py-3 capitalize">{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TruckSchedules;
