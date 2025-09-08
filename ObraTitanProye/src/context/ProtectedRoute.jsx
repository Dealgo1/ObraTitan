/**
 * src/components/ProtectedRoute.jsx
 * ------------------------------------------------------------
 * Componente que protege rutas según el estado de autenticación
 * y el rol del usuario.
 *
 * Props:
 * - element: JSX → componente que se debe renderizar si pasa la validación.
 * - roles: array<string> → lista de roles permitidos para la ruta.
 *
 * Flujo de lógica:
 * 1. Si `loading` está activo, no se toma ninguna decisión todavía.
 * 2. Si no hay usuario (`!user`), redirige a la página de login (/).
 * 3. Si no hay `userData`, retorna null (espera a que se carguen datos).
 * 4. Obtiene el rol de `userData.rol`.
 * 5. Si `roles` incluye ese rol → renderiza `element`.
 *    Si no, redirige a `/no-autorizado`.
 *
 * Dependencias:
 * - `useAuth`: hook de contexto de autenticación (provee user, userData, loading).
 * - `Navigate`: de react-router-dom para redirecciones.
 */

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authcontext";

const ProtectedRoute = ({ element, roles }) => {
  const { user, userData, loading } = useAuth();

  // Mientras se cargan los datos de autenticación
  if (loading) return null; // 👈 podrías mostrar un spinner en lugar de null

  // Si no hay usuario autenticado → redirige al login
  if (!user) return <Navigate to="/" replace />;

  // Si todavía no se han cargado los datos adicionales del usuario
  if (!userData) return null;

  // Extrae el rol del usuario autenticado
  const userRole = userData.rol;

  // Renderiza el componente si el rol está permitido, si no, redirige
  return roles.includes(userRole)
    ? element
    : <Navigate to="/no-autorizado" replace />;
};

export default ProtectedRoute;
