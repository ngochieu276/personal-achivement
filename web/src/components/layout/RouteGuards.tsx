import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

export function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function GuestRoute() {
  const token = useAuthStore((state) => state.token);
  if (token) return <Navigate to="/" replace />;
  return <Outlet />;
}
