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
