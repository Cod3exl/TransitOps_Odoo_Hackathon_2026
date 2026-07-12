import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FuelExpenses from "./pages/FuelExpenses";
import Reports from "./pages/Reports";
import Placeholder from "./pages/Placeholder";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />

        <Route
          path="/fuel-expenses"
          element={
            <ProtectedRoute roles={["financial_analyst", "fleet_manager"]}>
              <FuelExpenses />
            </ProtectedRoute>
          }
        />

        {/* Teammate slices — placeholders until their pages land */}
        <Route path="/dispatch" element={<Placeholder title="Dispatch" owner="Member A" />} />
        <Route path="/vehicles" element={<Placeholder title="Vehicles" owner="Member B" />} />
        <Route path="/drivers" element={<Placeholder title="Drivers" owner="Member B" />} />
        <Route path="/maintenance" element={<Placeholder title="Maintenance" owner="Member B" />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
