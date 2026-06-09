import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="border-b bg-slate-900 text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <h1 className="text-xl font-bold">📦 Courier Collection</h1>

        <div className="flex gap-6">
          <Link to="/">Dashboard</Link>
          <Link to="/new-package">New Package</Link>
          <Link to="/track">Track Package</Link>
        </div>
      </div>
    </nav>
  );
}
