import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import NewPackage from "./pages/NewPackage";
import TrackPackage from "./pages/TrackPackage";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new-package" element={<NewPackage />} />
        <Route path="/track" element={<TrackPackage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
