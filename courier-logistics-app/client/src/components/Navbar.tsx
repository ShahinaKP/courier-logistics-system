import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  ClipboardEdit,
} from "lucide-react";

const links = [
  {
    to: "/",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  { to: "/bags", label: "Bags", icon: <ShoppingBag className="h-4 w-4" /> },
  { to: "/trucks", label: "Trucks", icon: <Truck className="h-4 w-4" /> },
  {
    to: "/packages",
    label: "Update Status",
    icon: <ClipboardEdit className="h-4 w-4" />,
  },
];

const Navbar = () => {
  const { pathname } = useLocation();
  return (
    <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center gap-6 px-4">
        <span className="font-bold tracking-tight">🚚 Courier Logistics</span>
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === l.to
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              {l.icon}
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
