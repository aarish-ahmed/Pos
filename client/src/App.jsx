import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import PermissionRoute from './components/PermissionRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Kitchen from './pages/Kitchen';
import OrderHistory from './pages/OrderHistory';
import MenuManage from './pages/MenuManage';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import Receipt from './pages/Receipt';
import Reservations from './pages/Reservations';
import { getDefaultPath } from './config/permissions';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={getDefaultPath(user?.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route
          index
          element={
            <PermissionRoute permission="dashboard.view">
              <Dashboard />
            </PermissionRoute>
          }
        />
        <Route
          path="pos"
          element={
            <PermissionRoute permission="pos.access">
              <POS />
            </PermissionRoute>
          }
        />
        <Route
          path="kitchen"
          element={
            <PermissionRoute permission="kitchen.view">
              <Kitchen />
            </PermissionRoute>
          }
        />
        <Route
          path="orders"
          element={
            <PermissionRoute permission="orders.history">
              <OrderHistory />
            </PermissionRoute>
          }
        />
        <Route
          path="reservations"
          element={
            <PermissionRoute permission="reservations.manage">
              <Reservations />
            </PermissionRoute>
          }
        />
        <Route path="receipt/:id" element={<Receipt />} />
        <Route
          path="menu"
          element={
            <PermissionRoute permission="menu.manage">
              <MenuManage />
            </PermissionRoute>
          }
        />
        <Route
          path="reports"
          element={
            <PermissionRoute permission="reports.view">
              <Reports />
            </PermissionRoute>
          }
        />
        <Route
          path="settings"
          element={
            <PermissionRoute permission="settings.general">
              <SettingsPage />
            </PermissionRoute>
          }
        />
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
