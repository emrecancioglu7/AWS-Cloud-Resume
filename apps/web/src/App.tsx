import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";

const AdminApp = lazy(() => import("./pages/admin/AdminApp"));

const homePage: ReactNode = (
  <Layout>
    <Home />
  </Layout>
);

export default function App() {
  return (
    <Routes>
      {/* "/" is English, "/tr" Turkish — LanguageProvider reads the language from the path. */}
      <Route path="/" element={homePage} />
      <Route path="/tr" element={homePage} />
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={null}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
