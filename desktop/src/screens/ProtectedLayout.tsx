import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { Navbar } from "../components/Navbar";
import { Spinner } from "../components/ui";
import { useAuth } from "../lib/auth";

export function ProtectedLayout() {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (hydrated && !user) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [hydrated, user, navigate, location.pathname]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen pb-12">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
