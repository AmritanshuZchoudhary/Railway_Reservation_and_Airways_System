import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  return localStorage.getItem('railway_token') ? <Outlet /> : <Navigate to="/login" replace />;
}
