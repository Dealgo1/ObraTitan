/**
 * Sidebar.jsx (alineado con App.jsx)
 * - Oculta ítems por rol
 * - Para "contador": el icono Gest_Proy abre /proyecto
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Contextos
import { useProject } from "../context/ProjectContext";
import { useAuth } from "../context/authcontext";

// Estilos y librerías
import "./Sidebar.css";
import { Menu, X } from "lucide-react";
import Swal from "sweetalert2";

// Íconos
import logo from "../assets/iconos/Logo.png";
import calculatorIcon from "../assets/iconos/calculator.png";
import checkIcon from "../assets/iconos/Chek.png";
import estadisticaIcon from "../assets/iconos/estadistica.png";
import gmailIcon from "../assets/iconos/gmail.png";
import moneyIcon from "../assets/iconos/money.png";
import shoppingIcon from "../assets/iconos/shopping.png";
import sesion from "../assets/iconos/user-interface.png";
import Documento from "../assets/iconos/documento.png";
import Logaut from "../assets/iconos/logout.png";
import GestProy from "../assets/iconos/GestProy.png";

/* ============================================================
   PERMISOS visibles en el Sidebar — EXACTO según App.jsx
   (SIN rol "lector")
   ============================================================ */
const PERMISOS_SIDEBAR = {
  // Nota: este icono redirige según rol (ver abajo),
  // pero ambos destinos están permitidos:
  // /project-dashboard → ["administrador","contador","ingeniero"]
  // /proyecto          → ["administrador","contador","ingeniero"]
  "project-dashboard": ["administrador", "contador", "ingeniero"],
  "proyecto": ["administrador", "contador", "ingeniero"],

  // /actividades → ["administrador","ingeniero"]
  "actividades": ["administrador", "ingeniero"],

  // /Calculadora_presupuesto → ["administrador","ingeniero"]
  "Calculadora_presupuesto": ["administrador", "ingeniero"],

  // /budget-visualization → ["administrador"]
  "budget-visualization": ["administrador", "contador"],

  // /listar-pagos → ["administrador","contador"]
  "listar-pagos": ["administrador", "contador"],

  // /proveedores → ["administrador"]
  "proveedores": ["administrador"],

  // /kpi-dashboard → ["administrador"]
  "kpi-dashboard": ["administrador"],

  // /listar-archivos → ["administrador"]
  "listar-archivos": ["administrador"],

  // /gestion-usuarios → ["administrador"]
  "gestion-usuarios": ["administrador"],
};

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();
  const { project } = useProject();
  const { logout, userData } = useAuth();
  const role = userData?.rol ?? "";

  const toggleSidebar = () => setIsOpen(!isOpen);

  /** Navega exigiendo proyecto activo cuando aplica */
  const goTo = (ruta) => {
    if (project) {
      navigate(ruta, { state: { project } });
    } else {
      alert("No hay proyecto seleccionado.");
    }
  };

  /** Controla visibilidad por rol (alineado con App.jsx) */
  const puedeVer = (clave) => {
    const roles = PERMISOS_SIDEBAR[clave];
    if (!roles) return true;
    return roles.includes(role);
  };

  /** Logout con confirmación */
 const handleLogout = async () => {
  const result = await Swal.fire({
    title: "¿Cerrar sesión?",
    text: "Tu sesión actual se cerrará.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#D35400",
    cancelButtonColor: "#1e293b",
    confirmButtonText: "Sí, cerrar",
    cancelButtonText: "Cancelar",
    customClass: {
      popup: "logout-popup",
    },
  });

  if (result.isConfirmed) {
    try {
      await logout();
      localStorage.clear();
      window.location.replace("/");
    } catch (error) {
      Swal.fire("Error", `No se pudo cerrar sesión.\n${error.message}`, "error");
    }
  }
};


  // 🔁 Destino del icono "Gest_Proy":
  // - contador → /proyecto (puede ver Inicio y Proyecto)
  // - admin/ingeniero → /project-dashboard
  const rutaGestProy = role === "contador" ? "/proyecto" : "/project-dashboard";
  const claveGestProy = role === "contador" ? "proyecto" : "project-dashboard";

  return (
    <>
      {/* Toggle */}
      <button className={`sidebar-toggle ${isOpen ? "open" : ""}`} onClick={toggleSidebar}>
        {isOpen ? <X size={28} color="white" /> : <Menu size={28} color="white" />}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo → /inicio (Inicio está permitido para admin/contador/ingeniero) */}
        <div
          className={`sidebar-logo ${isOpen ? "logo-abajo" : "logo-arriba"}`}
          onClick={() => navigate("/inicio")}
          style={{ cursor: "pointer" }}
        >
          <img src={logo} alt="Logo" className="sidebar-logo-img" />
        </div>

        <div className="sidebar-nav">
          {/* Gest_Proy */}
          {puedeVer(claveGestProy) && (
            <div className="sidebar-item" data-tooltip="Gest_Proy" onClick={() => goTo(rutaGestProy)}>
              <img src={GestProy} alt="Gestión Proyecto" className="sidebar-icon icon-GestProy" />
            </div>
          )}

          {/* Actividades */}
          {puedeVer("actividades") && (
            <div className="sidebar-item" data-tooltip="Actividades" onClick={() => goTo("/actividades")}>
              <img src={checkIcon} alt="Tareas" className="sidebar-icon icon-actividades" />
            </div>
          )}

          {/* Calculadora presupuesto */}
          {puedeVer("Calculadora_presupuesto") && (
            <div
              className="sidebar-item"
              data-tooltip="Calculadora"
              onClick={() => goTo("/Calculadora_presupuesto")}
            >
              <img src={calculatorIcon} alt="Calculadora" className="sidebar-icon icon-calculadora" />
            </div>
          )}

          {/* Presupuesto (solo admin) */}
          {puedeVer("budget-visualization") && (
            <div
              className="sidebar-item"
              data-tooltip="Presupuesto"
              onClick={() => goTo("/budget-visualization")}
            >
              <img src={moneyIcon} alt="Budget" className="sidebar-icon icon-presupuesto" />
            </div>
          )}

          {/* Pagos (admin + contador) */}
          {puedeVer("listar-pagos") && (
            <div className="sidebar-item" data-tooltip="Caja" onClick={() => goTo("/listar-pagos")}>
              <img src={shoppingIcon} alt="Pagos" className="sidebar-icon icon-caja" />
            </div>
          )}

          {/* Proveedores (solo admin) */}
          {puedeVer("proveedores") && (
            <div className="sidebar-item" data-tooltip="Proveedores" onClick={() => goTo("/proveedores")}>
              <img src={gmailIcon} alt="Proveedores" className="sidebar-icon icon-proveedores" />
            </div>
          )}

          {/* KPI (solo admin) */}
          {puedeVer("kpi-dashboard") && (
            <div className="sidebar-item" data-tooltip="Estadística" onClick={() => goTo("/kpi-dashboard")}>
              <img src={estadisticaIcon} alt="Estadísticas" className="sidebar-icon icon-estadistica" />
            </div>
          )}

          {/* Archivos (solo admin) */}
          {puedeVer("listar-archivos") && (
            <div className="sidebar-item" data-tooltip="Archivos" onClick={() => goTo("/listar-archivos")}>
              <img src={Documento} alt="Archivos" className="sidebar-icon icon-archivos" />
            </div>
          )}

          {/* Usuarios (solo admin) */}
          {puedeVer("gestion-usuarios") && (
            <div className="sidebar-item" data-tooltip="Usuarios" onClick={() => goTo("/gestion-usuarios")}>
              <img src={sesion} alt="Usuarios" className="sidebar-icon icon-usuarios" />
            </div>
          )}

          {/* Logout (siempre visible) */}
          <div className="sidebar-item" data-tooltip="Cerrar sesión" onClick={handleLogout}>
            <img src={Logaut} alt="Cerrar sesión" className="sidebar-icon icon-logout" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
