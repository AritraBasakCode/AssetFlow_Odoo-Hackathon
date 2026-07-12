import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import { ProtectedRoute } from "./routes/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Organization from "./pages/Organization";
import Assets from "./pages/Assets";
import AssetDetail from "./pages/AssetDetail";
import Allocations from "./pages/Allocations";
import Bookings from "./pages/Bookings";
import Maintenance from "./pages/Maintenance";
import Audits from "./pages/Audits";
import Reports from "./pages/Reports";
import Activity from "./pages/Activity";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/assets/:id" element={<AssetDetail />} />
          <Route path="/allocations" element={<Allocations />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/audits" element={<Audits />} />
          <Route path="/activity" element={<Activity />} />

          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="/organization" element={<Organization />} />
          </Route>

          <Route element={<ProtectedRoute roles={["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"]} />}>
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
