import React from "react";
import Sidebar from "../../../../components/Sidebar";
import DetalleProyectoView from "../../proyectos/ui/DetalleProyectoView";

/**
 * 📌 Componente: ProjectDashboard
 * Este componente representa el dashboard (panel principal) de un proyecto.
 * - Muestra un layout dividido en:
 *   👉 Sidebar (menú lateral de navegación)
 *   👉 Contenido principal (vista del detalle del proyecto)
 */
const ProjectDashboard = () => {
  return (
    <div className="dashboard-container">
      {/* Barra lateral de navegación */}
      <Sidebar />

      {/* Contenedor del área principal */}
      <div className="contenido-principal fondo-oscuro">
        {/* Vista del detalle del proyecto (se inyecta aquí) */}
        <DetalleProyectoView />
      </div>
    </div>
  );
};

export default ProjectDashboard;
