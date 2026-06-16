import { Badge } from "lucide-react";
import type { Package } from "../types";
import { Card, CardContent, CardHeader } from "./ui/card";

const statusLabel: Record<string, string> = {
  to_be_picked_up: "To Be Picked Up",
  picked_up: "Picked Up",
  added_to_bag: "Added to Bag",
  en_route: "En Route",
  arrived: "Arrived",
  scheduled_for_delivery: "Scheduled for Delivery",
  out_for_delivery: "Out for Delivery",
};

const statusVariant: Record<string, string> = {
  to_be_picked_up: "bg-blue-500",
  picked_up: "bg-purple-500",
  added_to_bag: "bg-amber-500",
  en_route: "bg-green-500",
  arrived: "bg-emerald-500",
  scheduled_for_delivery: "bg-cyan-500",
  out_for_delivery: "bg-orange-500",
};

interface Props {
  pkg: Package;
}

const PackageCard = ({ pkg }: Props) => {
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-end">
          <Badge
            className={`text-white ${
              statusVariant[pkg.status] || "bg-slate-500"
            }`}
          >
            {statusLabel[pkg.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">Transaction ID</p>

          <p className="break-all text-sm font-medium">{pkg.tracking_id}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">From</p>

          <p className="font-semibold">{pkg.sender_name}</p>

          <p className="text-sm text-muted-foreground">{pkg.sender_address}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">To</p>

          <p className="font-semibold">{pkg.receiver_name}</p>

          <p className="text-sm text-muted-foreground">
            {pkg.receiver_address}
          </p>
        </div>

        <div className="flex justify-between border-t pt-3 text-sm">
          <span>
            Weight:
            <strong className="ml-1">{pkg.weight} kg</strong>
          </span>
        </div>

        {pkg.delay_reason && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            ⚠️ {pkg.delay_reason}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PackageCard;
