/**
 * Sidebar.jsx (alineado con App.jsx)
 * - Oculta ítems por rol
 * - Para "contador": el icono Gest_Proy abre /proyecto
 * - Marca como ACTIVO el ítem según la ruta actual (useLocation)
 * - Persiste el scroll de .sidebar-nav y centra el ítem activo
 */

import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
  "project-dashboard": ["administrador", "contador", "ingeniero"],
  proyecto: ["administrador", "contador", "ingeniero"],
  actividades: ["administrador", "ingeniero"],
  Calculadora_presupuesto: ["administrador", "ingeniero"],
  "budget-visualization": ["administrador", "contador"],
  "listar-pagos": ["administrador", "contador"],
  proveedores: ["administrador"],
  "kpi-dashboard": ["administrador"],
  "listar-archivos": ["administrador"],
  "gestion-usuarios": ["administrador"],
};

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef(null); // ⬅️ contenedor con scroll

  const navigate = useNavigate();
  const location = useLocation();
  const { project } = useProject();
  const { logout, userData } = useAuth();
  const role = userData?.rol ?? "";

  const toggleSidebar = () => setIsOpen(!isOpen);

  /* =======================
     Persistencia de scroll
     ======================= */

  const saveScroll = () => {
    const y = navRef.current?.scrollTop ?? 0;
    sessionStorage.setItem("sidebarScrollTop", String(y));
  };

  // Restaura el scroll antes del primer paint
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem("sidebarScrollTop");
    if (navRef.current && saved) {
      navRef.current.scrollTop = parseInt(saved, 10) || 0;
    }
  }, []);

  // Guarda scroll conforme el usuario desplaza
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const onScroll = () => {
      sessionStorage.setItem("sidebarScrollTop", String(el.scrollTop));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Centra el ítem activo cuando cambia la ruta
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      const active = el.querySelector(".sidebar-item.active");
      if (active) {
        const r1 = el.getBoundingClientRect();
        const r2 = active.getBoundingClientRect();
        const fueraArriba = r2.top < r1.top;
        const fueraAbajo = r2.bottom > r1.bottom;
        if (fueraArriba || fueraAbajo) {
          active.scrollIntoView({
            block: "center",
            inline: "nearest",
            behavior: "auto",
          });
        }
      }
    });
    return () => cancelAnimationFrame(id);
  }, [location.pathname]);

  /* =======================
     Navegación + permisos
     ======================= */

  /** Navega exigiendo proyecto activo cuando aplica */
  const goTo = (ruta) => {
    if (project) {
      saveScroll(); // guarda scroll ANTES de navegar
      navigate(ruta, { state: { project } });
      // Opcional: cerrar en móviles tras navegar
      // if (window.matchMedia("(max-width: 1280px)").matches) setIsOpen(false);
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
      customClass: { popup: "logout-popup" },
    });

    if (result.isConfirmed) {
      try {
        await logout();
        localStorage.clear();
        window.location.replace("/");
      } catch (error) {
        Swal.fire(
          "Error",
          `No se pudo cerrar sesión.\n${error.message}`,
          "error"
        );
      }
    }
  };

  // 🔁 Destino del icono "Gest_Proy":
  // - contador → /proyecto (puede ver Inicio y Proyecto)
  // - admin/ingeniero → /project-dashboard
  const rutaGestProy = role === "contador" ? "/proyecto" : "/project-dashboard";
  const claveGestProy = role === "contador" ? "proyecto" : "project-dashboard";

  /** === Helpers de "activo" ===
   * isActiveRoute: compara la ruta actual contra patrones simples.
   * Usamos startsWith para admitir subrutas (p.ej. /listar-pagos/123)
   */
  const isActiveRoute = (route) => {
    const p = location.pathname;
    if (!route) return false;
    if (route === "/project-dashboard")
      return p.startsWith("/project-dashboard");
    if (route === "/proyecto") return p.startsWith("/proyecto");
    if (route === "/actividades") return p.startsWith("/actividades");
    if (route === "/Calculadora_presupuesto")
      return p.startsWith("/Calculadora_presupuesto");
    if (route === "/budget-visualization")
      return p.startsWith("/budget-visualization");
    if (route === "/listar-pagos") return p.startsWith("/listar-pagos");
    if (route === "/proveedores") return p.startsWith("/proveedores");
    if (route === "/kpi-dashboard") return p.startsWith("/kpi-dashboard");
    if (route === "/listar-archivos") return p.startsWith("/listar-archivos");
    if (route === "/gestion-usuarios") return p.startsWith("/gestion-usuarios");
    return false;
  };

  /** Devuelve clases para el item */
  const itemClass = (routeOrKey) =>
    `sidebar-item ${isActiveRoute(routeOrKey) ? "active" : ""}`;

  return (
    <>
      {/* Toggle */}
      <button
        className={`sidebar-toggle ${isOpen ? "open" : ""}`}
        onClick={toggleSidebar}
        aria-label={isOpen ? "Cerrar menú lateral" : "Abrir menú lateral"}
      >
        {isOpen ? (
          <X size={28} color="white" />
        ) : (
          <Menu size={28} color="white" />
        )}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo → /inicio */}
        <div
          className={`sidebar-logo ${isOpen ? "logo-abajo" : "logo-arriba"}`}
          onClick={() => navigate("/inicio")}
          style={{ cursor: "pointer" }}
          aria-label="Ir a Inicio"
        >
          <img src={logo} alt="Logo" className="sidebar-logo-img" />
        </div>

        {/* Navegación con scroll persistente */}
        <div className="sidebar-nav" ref={navRef}>
          {/* Gest_Proy */}
          {puedeVer(claveGestProy) && (
            <div
              className={itemClass(rutaGestProy)}
              data-tooltip="Gest_Proy"
              role="button"
              aria-current={isActiveRoute(rutaGestProy) ? "page" : undefined}
              onClick={() => goTo(rutaGestProy)}
            >
              <img
                src={GestProy}
                alt="Gestión Proyecto"
                className="sidebar-icon icon-GestProy"
              />
            </div>
          )}

          {/* Actividades */}
          {puedeVer("actividades") && (
            <div
              className={itemClass("/actividades")}
              data-tooltip="Actividades"
              role="button"
              aria-current={isActiveRoute("/actividades") ? "page" : undefined}
              onClick={() => goTo("/actividades")}
            >
              <img
                src={checkIcon}
                alt="Tareas"
                className="sidebar-icon icon-actividades"
              />
            </div>
          )}

          {/* Calculadora presupuesto */}
          {puedeVer("Calculadora_presupuesto") && (
            <div
              className={itemClass("/Calculadora_presupuesto")}
              data-tooltip="Calculadora"
              role="button"
              aria-current={
                isActiveRoute("/Calculadora_presupuesto") ? "page" : undefined
              }
              onClick={() => goTo("/Calculadora_presupuesto")}
            >
              <img
                src={calculatorIcon}
                alt="Calculadora"
                className="sidebar-icon icon-calculadora"
              />
            </div>
          )}

          {/* Presupuesto (admin + contador) */}
          {puedeVer("budget-visualization") && (
            <div
              className={itemClass("/budget-visualization")}
              data-tooltip="Presupuesto"
              role="button"
              aria-current={
                isActiveRoute("/budget-visualization") ? "page" : undefined
              }
              onClick={() => goTo("/budget-visualization")}
            >
              <img
                src={moneyIcon}
                alt="Budget"
                className="sidebar-icon icon-presupuesto"
              />
            </div>
          )}

          {/* Pagos (admin + contador) */}
          {puedeVer("listar-pagos") && (
            <div
              className={itemClass("/listar-pagos")}
              data-tooltip="Caja"
              role="button"
              aria-current={isActiveRoute("/listar-pagos") ? "page" : undefined}
              onClick={() => goTo("/listar-pagos")}
            >
              <img
                src={shoppingIcon}
                alt="Pagos"
                className="sidebar-icon icon-caja"
              />
            </div>
          )}

          {/* Proveedores (solo admin) */}
          {puedeVer("proveedores") && (
            <div
              className={itemClass("/proveedores")}
              data-tooltip="Proveedores"
              role="button"
              aria-current={isActiveRoute("/proveedores") ? "page" : undefined}
              onClick={() => goTo("/proveedores")}
            >
              <img
                src={gmailIcon}
                alt="Proveedores"
                className="sidebar-icon icon-proveedores"
              />
            </div>
          )}

          {/* KPI (solo admin) */}
          {puedeVer("kpi-dashboard") && (
            <div
              className={itemClass("/kpi-dashboard")}
              data-tooltip="Estadística"
              role="button"
              aria-current={
                isActiveRoute("/kpi-dashboard") ? "page" : undefined
              }
              onClick={() => goTo("/kpi-dashboard")}
            >
              <img
                src={estadisticaIcon}
                alt="Estadísticas"
                className="sidebar-icon icon-estadistica"
              />
            </div>
          )}

          {/* Archivos (solo admin) */}
          {puedeVer("listar-archivos") && (
            <div
              className={itemClass("/listar-archivos")}
              data-tooltip="Archivos"
              role="button"
              aria-current={
                isActiveRoute("/listar-archivos") ? "page" : undefined
              }
              onClick={() => goTo("/listar-archivos")}
            >
              <img
                src={Documento}
                alt="Archivos"
                className="sidebar-icon icon-archivos"
              />
            </div>
          )}

          {/* Usuarios (solo admin) */}
          {puedeVer("gestion-usuarios") && (
            <div
              className={itemClass("/gestion-usuarios")}
              data-tooltip="Usuarios"
              role="button"
              aria-current={
                isActiveRoute("/gestion-usuarios") ? "page" : undefined
              }
              onClick={() => goTo("/gestion-usuarios")}
            >
              <img
                src={sesion}
                alt="Usuarios"
                className="sidebar-icon icon-usuarios"
              />
            </div>
          )}

          {/* Logout (siempre visible) */}
          <div
            className="sidebar-item"
            data-tooltip="Cerrar sesión"
            role="button"
            onClick={handleLogout}
          >
            <img
              src={Logaut}
              alt="Cerrar sesión"
              className="sidebar-icon icon-logout"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
