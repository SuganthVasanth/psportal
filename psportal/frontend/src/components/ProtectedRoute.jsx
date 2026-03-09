import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/" />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <h3>Access Denied</h3>;
  }

  return children;
}