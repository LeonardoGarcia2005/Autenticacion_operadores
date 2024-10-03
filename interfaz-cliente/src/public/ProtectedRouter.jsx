import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

function ProtectedRouter() {
  const { isAuthenticated, loading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowLoading(false);
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, []);

  // Si la autenticación aún está cargando, mostramos la pantalla de carga
  if (loading || showLoading) {
    return <LoadingScreen />;
  }

  // Si no está autenticado, redirige a la página de login
  if (!isAuthenticated && !loading) {
    return <Navigate to="/" />;
  }

  // Si está autenticado, renderiza el componente solicitado
  return <Outlet />;
}

export default ProtectedRouter;
