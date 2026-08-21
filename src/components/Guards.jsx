import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth.jsx";

// Redirects unauthenticated users to /login, remembering where they were going.
export function RequireAuth({ children }) {
  const { isAuthed } = useAuth();
  const location = useLocation();
  if (!isAuthed) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

// Only allows admin users (used to protect /admin/* routes).
export function RequireAdmin({ children }) {
  const { isAuthed, isAdmin } = useAuth();
  const location = useLocation();
  if (!isAuthed) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

// If already signed in, bounce away from the auth screens.
export function PublicOnly({ children }) {
  const { isAuthed, role } = useAuth();
  if (isAuthed) return <Navigate to={role === "admin" ? "/admin" : "/"} replace />;
  return children;
}
