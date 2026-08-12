import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Broadcasts from "./pages/Broadcasts.jsx";
import BroadcastDetail from "./pages/BroadcastDetail.jsx";
import Chunks from "./pages/Chunks.jsx";
import Recipients from "./pages/Recipients.jsx";
import Reports from "./pages/Reports.jsx";
import ImportReports from "./pages/ImportReports.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/broadcasts" element={<Broadcasts />} />
        <Route path="/broadcasts/:name" element={<BroadcastDetail />} />
        <Route path="/chunks" element={<Chunks />} />
        <Route path="/recipients" element={<Recipients />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/import" element={<ImportReports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
