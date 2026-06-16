import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isStaff } = useAuth();
  if (!isAuthenticated || !isStaff) return <Navigate to="/login" replace />;
  return <>{children}</>;
};
