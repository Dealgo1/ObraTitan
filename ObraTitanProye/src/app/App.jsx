/**
 * App.jsx
 * ------------------------------------------------------------
 * Punto de entrada de la app React (capa de enrutamiento y proveedores).
 * - Define los providers globales (AuthProvider, ProjectProvider).
 * - Configura el Router y las rutas protegidas según roles.
 * - Gestiona sincronización offline → online (creación/edición/eliminación).
 *
 * Tecnologías clave:
 * - react-router-dom: enrutamiento SPA.
 * - Context API (AuthProvider, ProjectProvider): estado global de autenticación y proyectos.
 * - ProtectedRoute: control de acceso por roles a vistas específicas.
 * - Estrategia offline: escucha 'online' para sincronizar datos pendientes.
 */

import React, { useEffect } from "react";

// React Router DOM: Router, contenedor de rutas y hook para leer la URL actual.
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// Providers / Contextos de la aplicación
import { AuthProvider } from "../context/authcontext";
import ProtectedRoute from "../context/ProtectedRoute";
import { ProjectProvider } from '../context/ProjectContext';

// Utilidades de sincronización offline
import { syncOfflineProjects } from "../utils/offlineSync";
import { syncOfflineProjectChanges } from "../utils/syncProjectChanges"; // Maneja edición y eliminación

// ====== Vistas y Componentes usados en rutas ======
import Login from "../features/auth/ui/Login";
import Inicio from "../features/auth/Inicio/ui/Inicio";
import ProjectDashboard from "../features/auth/proyectos/ui/ProjectDashboard";
import ActividadesList from "../features/auth/ListaActividades/ui/ActividadesList";
import BudgetVisualization from "../features/auth/gastos/ui/BudgetVisualization";
import GastosManagement from "../features/auth/gastos/ui/GastosManagement";
import GastosOverview from "../features/auth/gastos/ui/GastosOverview";
import GastoDetail from "../features/auth/gastos/ui/GastoDetail";
import ProveedoresOverview from "../features/auth/proveedores/ui/ProveedoresOverview";
import Detalleproveedor from "../features/auth/proveedores/ui/DetalleProveedor";
import CalculadoraPresupuestoView from "../features/auth/presupuesto/ui/CalculadoraPresupuestoView";
import FormularioProveedor from "../features/auth/proveedores/ui/FormularioProveedor";
import AgregarPago from "../features/auth/pagos/ui/AgregarPago";
import PagosListView from "../features/auth/pagos/ui/PagosListView";
import ProyectosOverview from "../features/auth/proyectos/ui/ProyectosOverview";
import CreateProjectView from "../features/auth/proyectos/ui/CreateProjectView";
import GestionUsuariosView from "../features/auth/usuarios/ui/GestionUsuariosView";
import RegistrarUsuario from "../features/auth/usuarios/ui/RegistrarUsuario";
import ListaUsuarios from "../features/auth/usuarios/ui/ListaUsuarios";

import NoAutorizado from "../features/auth/usuarios/ui/NoAutorizado";
import DocumentosYPlanosView from "../features/auth/documentos/ui/DocumentosYPlanosView";
import ArchivosOverview from "../features/auth/documentos/ui/ArchivosOverview";
import KPIDashboard from "../features/auth/estadisticas/ui/KPIDashboard";


/**
 * AppContent
 * ------------------------------------------------------------
 * Componente que:
 * 1) Decide si se muestra el <Encabezado /> según la ruta actual.
 * 2) Declara y organiza todas las rutas de la aplicación.
 *
 * Nota: Separamos AppContent de App para que App pueda envolver con Providers
 *       y aquí nos enfoquemos en el enrutamiento y layout.
 */
const AppContent = () => {
  const location = useLocation(); // Lee la ruta/URL actual

  /**
   * noHeaderRoutes
   * ----------------------------------------------------------
   * Rutas en las que NO debe renderizarse el <Encabezado />.
   * Ejemplo: pantalla de Login o pantallas que requieren un layout limpio.
   * Si una ruta está en esta lista, el header se oculta.
   */
  const noHeaderRoutes = [
    "/",
    "/gastos-overview",
    "/proveedores",
    "/Calculadora_presupuesto",
    "/detalle-proveedor",
    "/AgregarPago",
    "/agregar-proveedor",
    "/listar-pagos",
    "/inicio",
    "/budget-visualization",
    "/proyecto",
    "/CrearProyecto",
    "/project-dashboard",
    "/gastos",
    "/gasto-detail",
    "/gestion-usuarios",
    "/registrar-usuario",
    "/lista-usuarios",
    "/no-autorizado",
    "/Documentos",
    "/listar-archivos",
    "/actividades",
    "/kpi-dashboard",
    "/resumen-gastos"
  ];

  return (
    <>
      {/* Encabezado condicional: si la ruta actual NO está en noHeaderRoutes, se muestra */}
      {!noHeaderRoutes.includes(location.pathname) && <Encabezado />}

      {/* Contenedor principal del contenido enrutado */}
      <main>
        <Routes>
          {/** =================== Rutas Públicas =================== */}
          {/* Login (pública) */}
          <Route path="/" element={<Login />} />

          {/* Página informativa cuando el usuario no tiene permisos suficientes */}
          <Route path="/no-autorizado" element={<NoAutorizado />} />

          {/** =================== Rutas Protegidas ===================
           * Cada ruta protegida envuelve un componente de Vista dentro de <ProtectedRoute />
           * y declara los roles que pueden acceder a dicha ruta.
           *
           * @roles posibles: "administrador" | "contador" | "ingeniero" | "lector"
           *
           * ProtectedRoute espera props:
           * - element: JSX.Element a renderizar si el usuario está autenticado y autorizado.
           * - roles: string[] con roles permitidos (autorización por RBAC).
           */}

          {/* Inicio → visible para todos los roles autenticados */}
          <Route
            path="/inicio"
            element={
              <ProtectedRoute
                element={<Inicio />}
                roles={["administrador", "contador", "ingeniero", "lector"]}
              />
            }
          />

          {/* Vista general de proyectos */}
          <Route
            path="/proyecto"
            element={
              <ProtectedRoute
                element={<ProyectosOverview />}
                roles={["administrador", "contador", "ingeniero", "lector"]}
              />
            }
          />

          {/* Dashboard de un proyecto */}
          <Route
            path="/project-dashboard"
            element={
              <ProtectedRoute
                element={<ProjectDashboard />}
                roles={["administrador", "contador", "ingeniero", "lector"]}
              />
            }
          />

          {/* Lista de actividades del proyecto */}
          <Route
            path="/actividades"
            element={
              <ProtectedRoute
                element={<ActividadesList />}
                roles={["administrador", "ingeniero", "lector"]}
              />
            }
          />

          {/* Visualización de presupuesto (solo administrador) */}
          <Route
            path="/budget-visualization"
            element={
              <ProtectedRoute
                element={<BudgetVisualization />}
                roles={["administrador"]}
              />
            }
          />

          {/* Gestión de gastos (solo administrador) */}
          <Route
            path="/gastos"
            element={
              <ProtectedRoute
                element={<GastosManagement />}
                roles={["administrador"]}
              />
            }
          />

          {/* Resumen de gastos (solo administrador) */}
          <Route
            path="/gastos-overview"
            element={
              <ProtectedRoute
                element={<GastosOverview />}
                roles={["administrador"]}
              />
            }
          />

          {/* Detalle de un gasto (solo administrador) */}
          <Route
            path="/gasto-detail"
            element={
              <ProtectedRoute
                element={<GastoDetail />}
                roles={["administrador"]}
              />
            }
          />

          {/* Proveedores (solo administrador) */}
          <Route
            path="/proveedores"
            element={
              <ProtectedRoute
                element={<ProveedoresOverview />}
                roles={["administrador"]}
              />
            }
          />

          {/* Detalle de proveedor (solo administrador) */}
          <Route
            path="/detalle-proveedor"
            element={
              <ProtectedRoute
                element={<Detalleproveedor />}
                roles={["administrador"]}
              />
            }
          />

          {/* Calculadora de presupuesto (admin + ingeniero) */}
          <Route
            path="/Calculadora_presupuesto"
            element={
              <ProtectedRoute
                element={<CalculadoraPresupuestoView />}
                roles={["administrador", "ingeniero"]}
              />
            }
          />

          {/* Alta de proveedor (solo administrador) */}
          <Route
            path="/agregar-proveedor"
            element={
              <ProtectedRoute
                element={<FormularioProveedor />}
                roles={["administrador"]}
              />
            }
          />

          {/* Registrar pago (admin + contador) */}
          <Route
            path="/AgregarPago"
            element={
              <ProtectedRoute
                element={<AgregarPago />}
                roles={["administrador", "contador"]}
              />
            }
          />

          {/* Listado de pagos (admin + contador) */}
          <Route
            path="/listar-pagos"
            element={
              <ProtectedRoute
                element={<PagosListView />}
                roles={["administrador", "contador"]}
              />
            }
          />

          {/* Crear proyecto (solo administrador) */}
          <Route
            path="/CrearProyecto"
            element={
              <ProtectedRoute
                element={<CreateProjectView />}
                roles={["administrador"]}
              />
            }
          />

          {/* Gestión de usuarios (solo administrador) */}
          <Route
            path="/gestion-usuarios"
            element={
              <ProtectedRoute
                element={<GestionUsuariosView />}
                roles={["administrador"]}
              />
            }
          />

          {/* Registrar usuario (solo administrador) */}
          <Route
            path="/registrar-usuario"
            element={
              <ProtectedRoute
                element={<RegistrarUsuario />}
                roles={["administrador"]}
              />
            }
          />

          {/* Lista de usuarios (solo administrador) */}
          <Route
            path="/lista-usuarios"
            element={
              <ProtectedRoute
                element={<ListaUsuarios />}
                roles={["administrador"]}
              />
            }
          />

          {/* Documentos y planos (solo administrador) */}
          <Route
            path="/Documentos"
            element={
              <ProtectedRoute
                element={<DocumentosYPlanosView />}
                roles={["administrador"]}
              />
            }
          />

          {/* Archivos (solo administrador) */}
          <Route
            path="/listar-archivos"
            element={
              <ProtectedRoute
                element={<ArchivosOverview />}
                roles={["administrador"]}
              />
            }
          />

          {/* KPI Dashboard (solo administrador) */}
          <Route
            path="/kpi-dashboard"
            element={
              <ProtectedRoute
                element={<KPIDashboard />}
                roles={["administrador"]}
              />
            }
          />

          
        </Routes>
      </main>
    </>
  );
};

/**
 * App
 * ------------------------------------------------------------
 * Componente raíz:
 * - Instala listeners de 'online' para sincronización offline → online.
 * - Monta los proveedores globales de la app (AuthProvider, ProjectProvider).
 * - Inicializa el Router que envolverá el contenido.
 */
const App = () => {
  useEffect(() => {
    /**
     * handleOnline
     * --------------------------------------------------------
     * Callback al recuperar conexión. Intenta sincronizar:
     * 1) Proyectos creados offline.
     * 2) Cambios offline (ediciones/eliminaciones) en proyectos.
     */
    const handleOnline = () => {
      console.log("🌐 Conexión restaurada, intentando sincronizar proyectos...");
      // Sincroniza creación de proyectos hechos sin conexión
      syncOfflineProjects();
      // Sincroniza ediciones/eliminaciones hechas sin conexión
      syncOfflineProjectChanges();
    };

    // Suscribimos el listener al evento 'online'
    window.addEventListener("online", handleOnline);

    // Si al montar el componente ya hay conexión, dispara sincronización inicial
    if (navigator.onLine) {
      syncOfflineProjects();
      syncOfflineProjectChanges();
    }

    // Limpieza del listener al desmontar
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    // AuthProvider: expone estado/métodos de autenticación (usuario, rol, login, logout, etc.)
    <AuthProvider>
      {/* ProjectProvider: estado global de proyectos, caché y helpers */}
      <ProjectProvider>
        {/* Router: controla la navegación SPA */}
        <Router>
          <AppContent />
        </Router>
      </ProjectProvider>
    </AuthProvider>
  );
};

export default App;
