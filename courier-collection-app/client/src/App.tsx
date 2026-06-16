import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import NewPackage from "./pages/NewPackage";
import TrackPackage from "./pages/TrackPackage";
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          <Route
            path="/track"
            element={
              <>
                <Navbar />
                <TrackPackage />
              </>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Dashboard />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/new-package"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <NewPackage />
                </>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
