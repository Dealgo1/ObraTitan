/**
 * Sidebar.jsx
 * ------------------------------------------------------------
 * Componente de barra lateral (sidebar) para navegación principal.
 * 
 * Características:
 * - Diseño responsivo: se abre/cierra con un botón (hamburguesa / X).
 * - Acceso a vistas clave del sistema: actividades, presupuesto, pagos, etc.
 * - Usa contexto de proyectos (ProjectContext) para pasar el proyecto activo.
 * - Usa contexto de autenticación (AuthContext) para cerrar sesión.
 * - SweetAlert2 para confirmación elegante al cerrar sesión.
 * 
 * Dependencias:
 * - react-router-dom → useNavigate para redirección SPA.
 * - lucide-react → íconos (Menu, X).
 * - sweetalert2 → alertas y confirmaciones.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Contextos globales
import { useProject } from "../context/ProjectContext";
import { useAuth } from "../context/authcontext"; // provee logout()

// Estilos y librerías
import "./Sidebar.css";
import { Menu, X } from "lucide-react";
import Swal from "sweetalert2";

// Íconos locales (assets)
import logo from "../assets/iconos/Logo.png";
import calculatorIcon from "../assets/iconos/calculator.png";
import checkIcon from "../assets/iconos/Chek.png";
import codigo from "../assets/iconos/codigo.png";
import estadisticaIcon from "../assets/iconos/estadistica.png";
import gmailIcon from "../assets/iconos/gmail.png";
import moneyIcon from "../assets/iconos/money.png";
import shoppingIcon from "../assets/iconos/shopping.png";
import sesion from "../assets/iconos/user-interface.png";
import Documento from "../assets/iconos/documento.png";
import Logaut from "../assets/iconos/logout.png";

const Sidebar = () => {
  /** Estado local que controla si la barra lateral está abierta o cerrada */
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();
  const { project } = useProject(); // proyecto seleccionado en contexto
  const { logout } = useAuth();     // función para cerrar sesión

  /** Alterna la visibilidad de la sidebar */
  const toggleSidebar = () => setIsOpen(!isOpen);

  /**
   * Redirige a una ruta, pero exige que haya un proyecto activo.
   * - Si existe `project`, lo pasa vía state en la navegación.
   * - Si no hay, muestra un alert.
   */
  const goTo = (ruta) => {
    if (project) {
      navigate(ruta, { state: { project } });
    } else {
      alert("No hay proyecto seleccionado.");
    }
  };

  /**
   * Cierra sesión con confirmación.
   * - Lanza un SweetAlert de confirmación.
   * - Si el usuario acepta:
   *   - Llama a logout() (debe estar enlazado a Firebase signOut o similar).
   *   - Limpia el localStorage.
   *   - Redirige a "/" forzando recarga con window.location.replace().
   * - Si falla, muestra alerta de error.
   */
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "Tu sesión actual se cerrará.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, cerrar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await logout(); // Implementado en authcontext con Firebase o similar
        console.log("Sesión cerrada con éxito");
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

  return (
    <>
      {/** Botón de toggle (menú hamburguesa / cerrar) */}
      <button
        className={`sidebar-toggle ${isOpen ? "open" : ""}`}
        onClick={toggleSidebar}
      >
        {isOpen ? (
          <X size={28} color="white" />
        ) : (
          <Menu size={28} color="white" />
        )}
      </button>

      {/** Contenedor de la sidebar */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        {/** Logo (clic → inicio) */}
        <div
          className={`sidebar-logo ${isOpen ? "logo-abajo" : "logo-arriba"}`}
          onClick={() => goTo("/inicio")}
          style={{ cursor: "pointer" }}
        >
          <img src={logo} alt="Logo" className="sidebar-logo-img" />
        </div>

        {/** Navegación lateral con tooltips */}
        <div className="sidebar-nav">
          <div
            className="sidebar-item"
            data-tooltip="Actividades"
            onClick={() => goTo("/actividades")}
          >
            <img src={checkIcon} alt="Tareas" className="sidebar-icon icon-check" />
          </div>

          <div
            className="sidebar-item"
            data-tooltip="Calculadora"
            onClick={() => goTo("/Calculadora_presupuesto")}
          >
            <img src={calculatorIcon} alt="Calculadora" className="sidebar-icon icon-calc" />
          </div>

          <div
            className="sidebar-item"
            data-tooltip="Presupuesto"
            onClick={() => goTo("/budget-visualization")}
          >
            <img src={moneyIcon} alt="Budget" className="sidebar-icon icon-money" />
          </div>

          <div
            className="sidebar-item"
            data-tooltip="Caja"
            onClick={() => goTo("/listar-pagos")}
          >
            <img src={shoppingIcon} alt="Pagos" className="sidebar-icon icon-shop" />
          </div>

          <div
            className="sidebar-item"
            data-tooltip="Proveedores"
            onClick={() => goTo("/proveedores")}
          >
            <img src={gmailIcon} alt="Proveedores" className="sidebar-icon icon-mail" />
          </div>

          <div
            className="sidebar-item"
            data-tooltip="Estadistica"
            onClick={() => goTo("/kpi-dashboard")}
          >
            <img src={estadisticaIcon} alt="Estadísticas" className="sidebar-icon icon-stats" />
          </div>

          <div
            className="sidebar-item"
            data-tooltip="Archivos"
            onClick={() => goTo("/listar-archivos")}
          >
            <img src={Documento} alt="Archivos" className="sidebar-icon icon-sesion" />
          </div>

          <div
            className="sidebar-item"
            data-tooltip="Resumen de Gastos"
            onClick={() => goTo("/resumen-gastos")}
          >
            <img src={codigo} alt="Resumen de Gastos" className="sidebar-icon icon-sesion" />
          </div>

          <div
            className="sidebar-item"
            data-tooltip="Usuarios"
            onClick={() => goTo("/gestion-usuarios")}
          >
            <img src={sesion} alt="Usuarios" className="sidebar-icon icon-sesion" />
          </div>

          <div
            className="sidebar-item"
            data-tooltip="Cerrar sesión"
            onClick={handleLogout}
          >
            <img src={Logaut} alt="Cerrar sesión" className="sidebar-icon icon-sesion" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
