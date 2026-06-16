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
import {
  Truck as TruckIcon,
  PackageOpen,
  Plus,
  ChevronDown,
  ChevronRight,
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

  // Create truck form
  const [truckCode, setTruckCode] = useState("");
  const [truckCapacity, setTruckCapacity] = useState("10");

  // Create schedule form
  const [selectedTruck, setSelectedTruck] = useState("");
  const [scheduleRegion, setScheduleRegion] = useState("");
  const [departure, setDeparture] = useState("");

  // Load bag form
  const [loadScheduleId, setLoadScheduleId] = useState("");
  const [loadBagId, setLoadBagId] = useState("");

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
      alert(result.error);
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
      alert(result.error);
      return;
    }
    setLoadBagId("");
    load();
  };

  const handleDelay = async (scheduleId: number) => {
    const reason = prompt("Enter delay reason:");
    if (!reason) return;
    await updateSchedule(scheduleId, {
      status: "delayed",
      delay_reason: reason,
    });
    load();
  };

  const handleDepart = async (scheduleId: number) => {
    await updateSchedule(scheduleId, {
      status: "departed",
      actual_departure: new Date().toISOString(),
    });
    load();
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Truck Schedules</h1>
        <p className="mt-2 text-muted-foreground">
          Manage truck fleet, schedules, bag loading, and departures.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Create Truck */}
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

        {/* Create Schedule */}
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

        {/* Load Bag onto Truck */}
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

      {/* Schedules list */}
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
                <div key={s.id} className="rounded-lg border">
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

                    <span className="font-mono text-sm font-semibold w-24">
                      {(s as any).truck?.truck_code ?? `SCH-${s.id}`}
                    </span>
                    <Badge variant="secondary" className="w-20 justify-center">
                      {(s as any).region?.region_code ?? "—"}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex-1">
                      {new Date(s.scheduled_departure).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(s as any).bag_count ?? 0} bags ·{" "}
                      {(s as any).package_count ?? 0} pkgs
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        scheduleStatusColor[s.status] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {s.status}
                    </span>

                    <div className="flex gap-2">
                      {s.status === "scheduled" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDepart(s.id)}
                          >
                            Mark Departed
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelay(s.id)}
                          >
                            Delay
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded: bags on this schedule */}
                  {expandedSchedule === s.id && (
                    <div className="border-t bg-muted/20 px-8 py-3 text-xs text-muted-foreground">
                      {s.delay_reason && (
                        <p className="mb-2 text-red-600">
                          <strong>Delay:</strong> {s.delay_reason}
                        </p>
                      )}
                      {(s as any).truck_bags?.length > 0 ? (
                        <div className="space-y-1">
                          <p className="font-medium text-foreground mb-1">
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

      {/* Fleet overview */}
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
