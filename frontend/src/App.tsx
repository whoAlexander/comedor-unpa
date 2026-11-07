import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { HOME_BY_ROLE, RoleLayout } from "@/components/AppShell";
import { useCurrentUser } from "@/store/store";
import Login from "@/pages/Login";
import DinerDashboard from "@/pages/diner/DinerDashboard";
import WeeklyMenu from "@/pages/diner/WeeklyMenu";
import Reserve from "@/pages/diner/Reserve";
import MyReservations from "@/pages/diner/MyReservations";
import Payments from "@/pages/diner/Payments";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminPayments from "@/pages/admin/AdminPayments";
import Scanner from "@/pages/admin/Scanner";
import AdminMenus from "@/pages/admin/AdminMenus";
import AdminReport from "@/pages/admin/AdminReport";
import KitchenDemand from "@/pages/kitchen/KitchenDemand";
import Stock from "@/pages/kitchen/Stock";

function RootRedirect() {
  const user = useCurrentUser();
  return <Navigate to={user ? HOME_BY_ROLE[user.role] : "/login"} replace />;
}

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RoleLayout roles={["estudiante", "docente"]} />}>
          <Route path="/inicio" element={<DinerDashboard />} />
          <Route path="/menu-semanal" element={<WeeklyMenu />} />
          <Route path="/reservar" element={<Reserve />} />
          <Route path="/mis-reservas" element={<MyReservations />} />
          <Route path="/pagos" element={<Payments />} />
        </Route>
        <Route element={<RoleLayout roles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/pagos" element={<AdminPayments />} />
          <Route path="/admin/escaner" element={<Scanner />} />
          <Route path="/admin/menus" element={<AdminMenus />} />
          <Route path="/admin/reporte" element={<AdminReport />} />
        </Route>
        <Route element={<RoleLayout roles={["cocina"]} />}>
          <Route path="/cocina" element={<KitchenDemand />} />
          <Route path="/cocina/stock" element={<Stock />} />
        </Route>
        <Route path="*" element={<RootRedirect />} />
      </Routes>
      <Toaster richColors closeButton mobileOffset={{ bottom: 96 }} />
    </>
  );
}