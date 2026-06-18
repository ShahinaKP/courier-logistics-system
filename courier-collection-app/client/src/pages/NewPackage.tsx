import { useState, useEffect } from "react";
import { createPackage, lookupPincode } from "../api/packageApi";
import type { PincodeResult } from "../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { MapPin, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface PincodeFieldProps {
  id: string;
  label: string;
  pincode: string;
  onPincodeChange: (val: string) => void;
  result: PincodeResult | null | "not_found" | "loading";
}

// Reusable pincode input with inline auto-fill display
const PincodeField = ({
  id,
  label,
  pincode,
  onPincodeChange,
  result,
}: PincodeFieldProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Input
        id={id}
        placeholder="e.g. 560001"
        value={pincode}
        onChange={(e) =>
          onPincodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        maxLength={6}
        className="pr-8"
        required
      />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
        {result === "loading" && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {result && result !== "loading" && result !== "not_found" && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
        {result === "not_found" && (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>

    {/* Auto-fill result */}
    {result && result !== "loading" && (
      <div
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${
          result === "not_found"
            ? "border border-red-200 bg-red-50 text-red-600"
            : "border border-green-200 bg-green-50 text-green-700"
        }`}
      >
        <MapPin className="h-3 w-3 shrink-0" />
        {result === "not_found" ? (
          "Pincode not found. Package can still be created."
        ) : (
          <>
            <span className="font-medium">{result.city}</span>
            <span className="text-green-600/70">·</span>
            <span>{result.region_name}</span>
            <span className="ml-auto font-mono font-semibold">
              {result.region_code}
            </span>
          </>
        )}
      </div>
    )}
  </div>
);

const NewPackage = () => {
  const [form, setForm] = useState({
    sender_name: "",
    sender_address: "",
    sender_pincode: "",
    receiver_name: "",
    receiver_address: "",
    receiver_pincode: "",
    weight: "",
  });

  const [senderPincodeResult, setSenderPincodeResult] = useState<
    PincodeResult | null | "not_found" | "loading"
  >(null);
  const [receiverPincodeResult, setReceiverPincodeResult] = useState<
    PincodeResult | null | "not_found" | "loading"
  >(null);

  const [result, setResult] = useState<{
    tracking_id: string;
    amount: number;
    destination_region: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-lookup sender pincode
  useEffect(() => {
    if (form.sender_pincode.length !== 6) {
      setSenderPincodeResult(null);
      return;
    }
    setSenderPincodeResult("loading");
    const timer = setTimeout(async () => {
      const res = await lookupPincode(form.sender_pincode);
      setSenderPincodeResult(res ?? "not_found");
    }, 400);
    return () => clearTimeout(timer);
  }, [form.sender_pincode]);

  // Auto-lookup receiver pincode
  useEffect(() => {
    if (form.receiver_pincode.length !== 6) {
      setReceiverPincodeResult(null);
      return;
    }
    setReceiverPincodeResult("loading");
    const timer = setTimeout(async () => {
      const res = await lookupPincode(form.receiver_pincode);
      setReceiverPincodeResult(res ?? "not_found");
    }, 400);
    return () => clearTimeout(timer);
  }, [form.receiver_pincode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setSubmitting(true);

    try {
      const data = await createPackage({
        sender_name: form.sender_name,
        sender_address: form.sender_address,
        sender_pincode: form.sender_pincode,
        receiver_name: form.receiver_name,
        receiver_address: form.receiver_address,
        receiver_pincode: form.receiver_pincode,
        weight: parseFloat(form.weight),
      });

      setResult({
        tracking_id: data.package.tracking_id,
        amount: data.bill.amount,
        destination_region:
          data.package.destination_region?.region_name ?? "Unknown",
      });

      setForm({
        sender_name: "",
        sender_address: "",
        sender_pincode: "",
        receiver_name: "",
        receiver_address: "",
        receiver_pincode: "",
        weight: "",
      });
      setSenderPincodeResult(null);
      setReceiverPincodeResult(null);
    } catch {
      setError("Failed to create package. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            📦 New Package Entry
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the sender and receiver details. The destination region is
            automatically resolved from the receiver's pincode.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sender */}
            <div className="rounded-lg border p-4 space-y-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Sender Details
              </p>
              <div className="space-y-2">
                <Label htmlFor="sender_name">Full Name</Label>
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
                <Label htmlFor="sender_address">Address</Label>
                <Input
                  id="sender_address"
                  value={form.sender_address}
                  onChange={(e) =>
                    setForm({ ...form, sender_address: e.target.value })
                  }
                  required
                />
              </div>
              <PincodeField
                id="sender_pincode"
                label="Pincode"
                pincode={form.sender_pincode}
                onPincodeChange={(v) => setForm({ ...form, sender_pincode: v })}
                result={senderPincodeResult}
              />
            </div>

            {/* Receiver */}
            <div className="rounded-lg border p-4 space-y-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Receiver Details
              </p>
              <div className="space-y-2">
                <Label htmlFor="receiver_name">Full Name</Label>
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
                <Label htmlFor="receiver_address">Address</Label>
                <Input
                  id="receiver_address"
                  value={form.receiver_address}
                  onChange={(e) =>
                    setForm({ ...form, receiver_address: e.target.value })
                  }
                  required
                />
              </div>
              <PincodeField
                id="receiver_pincode"
                label="Pincode"
                pincode={form.receiver_pincode}
                onPincodeChange={(v) =>
                  setForm({ ...form, receiver_pincode: v })
                }
                result={receiverPincodeResult}
              />
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Package & Generate Bill"
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {result && (
            <Card className="mt-6 border-green-200 bg-green-50">
              <CardContent className="pt-6 space-y-3">
                <h3 className="text-lg font-semibold text-green-700">
                  ✅ Package Created Successfully
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tracking ID</span>
                    <span className="font-mono font-medium">
                      {result.tracking_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Destination Region
                    </span>
                    <span className="font-medium">
                      {result.destination_region}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bill Amount</span>
                    <span className="font-semibold text-green-700">
                      ₹{result.amount}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share the Tracking ID with your customer to track this
                  package.
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
