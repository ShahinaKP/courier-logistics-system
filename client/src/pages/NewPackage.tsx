import { useEffect, useState } from "react";
import { createPackage, fetchRegions } from "../api/packageApi";
import type { Region } from "../types";

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
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h1>New Package Entry</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        {[
          { label: "Sender Name", key: "sender_name" },
          { label: "Sender Address", key: "sender_address" },
          { label: "Receiver Name", key: "receiver_name" },
          { label: "Receiver Address", key: "receiver_address" },
          { label: "Weight (kg)", key: "weight" },
        ].map(({ label, key }) => (
          <label key={key}>
            {label}
            <input
              style={inputStyle}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required
            />
          </label>
        ))}
        <label>
          Region
          <select
            style={inputStyle}
            value={form.region_id}
            onChange={(e) => setForm({ ...form, region_id: e.target.value })}
            required
          >
            <option value="">Select a region</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.region_code} — {r.region_name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" style={btnStyle}>
          Create Package
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "8px",
          }}
        >
          <h3>✅ Package Created!</h3>
          <p>
            <strong>Tracking ID:</strong> {result.tracking_id}
          </p>
          <p>
            <strong>Bill Amount:</strong> ₹{result.amount}
          </p>
        </div>
      )}
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.5rem",
  marginTop: "0.25rem",
  fontSize: "1rem",
  borderRadius: "4px",
  border: "1px solid #cbd5e1",
};

const btnStyle: React.CSSProperties = {
  padding: "0.75rem",
  backgroundColor: "#3b82f6",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "1rem",
  cursor: "pointer",
};

export default NewPackage;
