import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors ${
      isActive
        ? "text-white font-semibold"
        : "text-slate-400 hover:text-slate-300"
    }`;

  return (
    <nav className="border-b bg-slate-900 text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <h1 className="text-xl font-bold">📦 Courier Collection</h1>
        <div className="flex items-center gap-6">
          {isAuthenticated && (
            <>
              <NavLink to="/" className={navClass}>
                Dashboard
              </NavLink>
              <NavLink to="/new-package" className={navClass}>
                New Package
              </NavLink>
            </>
          )}
          <NavLink to="/track" className={navClass}>
            Track Package
          </NavLink>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{user.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
