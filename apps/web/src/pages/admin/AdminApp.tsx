import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "../../auth/AuthContext";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { AdminLogin } from "./AdminLogin";
import { AdminDashboard } from "./AdminDashboard";
import { Statements } from "./Statements";
import { ToastProvider } from "./Toast";
import { ConfirmProvider } from "./ConfirmDialog";

// Mounted lazily at /admin/* (see App.tsx) so the Cognito SDK + QR code libraries this pulls in
// never load for public resume visitors — only when someone actually navigates to /admin.
export default function AdminApp() {
  // /admin is served the prerendered public HTML (CloudFront's SPA fallback), so mark it noindex
  // here too — robots.txt alone only stops crawling, not indexing of a URL found elsewhere.
  useEffect(() => {
    const existing = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const meta = existing ?? document.head.appendChild(Object.assign(document.createElement("meta"), { name: "robots" }));
    const previous = meta.content;
    meta.content = "noindex, nofollow";
    return () => {
      if (existing) meta.content = previous;
      else meta.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Routes>
            <Route path="login" element={<AdminLogin />} />
            <Route
              index
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="statements"
              element={
                <ProtectedRoute>
                  <Statements />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
