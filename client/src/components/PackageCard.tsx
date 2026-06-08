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

const statusColor: Record<string, string> = {
  to_be_picked_up: "#3b82f6",
  picked_up: "#8b5cf6",
  added_to_bag: "#f59e0b",
  en_route: "#22c55e",
  arrived: "#10b981",
  scheduled_for_delivery: "#06b6d4",
  out_for_delivery: "#f97316",
};

interface Props {
  pkg: Package;
}

const PackageCard = ({ pkg }: Props) => {
  return (
    <div style={cardStyle}>
      <div
        style={{
          textAlign: "right",
        }}
      >
        <span
          style={{
            backgroundColor: statusColor[pkg.status] || "#94a3b8",
            color: "white",
            padding: "0.2rem 0.6rem",
            borderRadius: "999px",
            fontSize: "0.75rem",
          }}
        >
          {statusLabel[pkg.status]}
        </span>
      </div>
      <span
        style={{
          display: "flex",
          marginTop: "0.75rem",
          fontSize: "0.75rem",
          color: "#94a3b8",
        }}
      >
        Transaction ID: <strong>{pkg.tracking_id} </strong>
      </span>
      <div style={{ marginTop: "0.75rem" }}>
        <p style={labelStyle}>From</p>
        <p style={valueStyle}>{pkg.sender_name}</p>
        <p style={subValueStyle}>{pkg.sender_address}</p>
      </div>
      <div style={{ marginTop: "0.5rem" }}>
        <p style={labelStyle}>To</p>
        <p style={valueStyle}>{pkg.receiver_name}</p>
        <p style={subValueStyle}>{pkg.receiver_address}</p>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "0.75rem",
        }}
      >
        <span style={labelStyle}>
          Weight: <strong>{pkg.weight} kg</strong>
        </span>
        <span style={labelStyle}>
          Region: <strong>{pkg.region_code}</strong>
        </span>
      </div>
      {pkg.delay_reason && (
        <div
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem",
            backgroundColor: "#fef2f2",
            borderRadius: "4px",
            color: "#ef4444",
            fontSize: "0.8rem",
          }}
        >
          ⚠️ {pkg.delay_reason}
        </div>
      )}
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "1rem",
  backgroundColor: "white",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "#94a3b8",
  margin: 0,
};

const valueStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  fontWeight: 600,
  margin: "0.1rem 0 0",
};

const subValueStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#64748b",
  margin: 0,
};

export default PackageCard;
