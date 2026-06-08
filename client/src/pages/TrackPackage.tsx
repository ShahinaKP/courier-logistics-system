import { useState } from "react";
import { fetchPackageByTrackingId } from "../api/packageApi";
import type { Package } from "../types";

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
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h1>Track Your Package</h1>
      <form onSubmit={handleTrack} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          style={{
            flex: 1,
            padding: "0.5rem",
            fontSize: "1rem",
            border: "1px solid #cbd5e1",
            borderRadius: "4px",
          }}
          placeholder="Enter your tracking ID"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          required
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Track
        </button>
      </form>

      {loading && <p>Searching...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {pkg && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1.5rem",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        >
          <h3>📦 Package Status</h3>
          <p>
            <strong>Status:</strong> {statusLabel[pkg.status]}
          </p>
          <p>
            <strong>Region:</strong> {pkg.region_code} — {pkg.region_name}
          </p>
          <p>
            <strong>Current Location:</strong>{" "}
            {pkg.current_location || "Not updated yet"}
          </p>
          {pkg.delay_reason && (
            <p style={{ color: "#ef4444" }}>
              <strong>Delay Reason:</strong> {pkg.delay_reason}
            </p>
          )}
          <hr />
          <p>
            <strong>From:</strong> {pkg.sender_address}
          </p>
          <p>
            <strong>To:</strong> {pkg.receiver_address}
          </p>
          <p>
            <strong>Weight:</strong> {pkg.weight} kg
          </p>
        </div>
      )}
    </div>
  );
};

export default TrackPackage;
