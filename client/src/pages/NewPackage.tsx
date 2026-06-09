import { useEffect, useState } from "react";
import { createPackage, fetchRegions } from "../api/packageApi";
import type { Region } from "../types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";

const NewPackage = () => {
  const [regions, setRegions] = useState<Region[]>([]);

  const [form, setForm] = useState({
    sender_name: "",
    sender_address: "",
    receiver_name: "",
    receiver_address: "",
    weight: "",
    region_id: "",
  });

  const [result, setResult] = useState<{
    tracking_id: string;
    amount: number;
  } | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    fetchRegions().then(setRegions);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setResult(null);

    try {
      const data = await createPackage({
        ...form,
        weight: parseFloat(form.weight),
        region_id: parseInt(form.region_id),
      });

      setResult({
        tracking_id: data.package.tracking_id,
        amount: data.bill.amount,
      });

      setForm({
        sender_name: "",
        sender_address: "",
        receiver_name: "",
        receiver_address: "",
        weight: "",
        region_id: "",
      });
    } catch {
      setError("Failed to create package. Please try again.");
    }
  };

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            📦 New Package Entry
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sender_name">Sender Name</Label>
              <Input
                id="sender_name"
                value={form.sender_name}
                onChange={(e) =>
                  setForm({ ...form, sender_name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender_address">Sender Address</Label>
              <Input
                id="sender_address"
                value={form.sender_address}
                onChange={(e) =>
                  setForm({ ...form, sender_address: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiver_name">Receiver Name</Label>
              <Input
                id="receiver_name"
                value={form.receiver_name}
                onChange={(e) =>
                  setForm({ ...form, receiver_name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiver_address">Receiver Address</Label>
              <Input
                id="receiver_address"
                value={form.receiver_address}
                onChange={(e) =>
                  setForm({ ...form, receiver_address: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>

              <Select
                value={form.region_id}
                onValueChange={(value) =>
                  setForm({ ...form, region_id: value })
                }
              >
                <SelectTrigger id="region">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>

                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={String(region.id)}>
                      {region.region_code} - {region.region_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full">
              Create Package
            </Button>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
              {error}
            </div>
          )}

          {result && (
            <Card className="mt-6 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <h3 className="mb-3 text-lg font-semibold text-green-700">
                  ✅ Package Created Successfully
                </h3>

                <p className="mb-2">
                  <span className="font-semibold">Tracking ID:</span>{" "}
                  {result.tracking_id}
                </p>

                <p>
                  <span className="font-semibold">Bill Amount:</span> ₹
                  {result.amount}
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewPackage;
