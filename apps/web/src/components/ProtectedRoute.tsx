import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--color-bg)">
        <p className="text-sm text-(--color-text-muted)">Yükleniyor...</p>
      </div>
    );
  }

  if (status !== "signed-in") {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
