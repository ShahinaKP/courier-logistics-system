import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import BagManagement from "./pages/BagManagement";
import TruckSchedules from "./pages/TruckSchedules";
import PackageStatusUpdate from "./pages/PackageStatusUpdate";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bags" element={<BagManagement />} />
        <Route path="/trucks" element={<TruckSchedules />} />
        <Route path="/packages" element={<PackageStatusUpdate />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
