/**
 * Vista: GastosManagement
 * ------------------------------------------------------------
 * Pantalla para crear nuevos registros financieros (gasto/ingreso)
 * asociados al proyecto seleccionado.
 *
 * Flujo principal:
 * - Obtiene el proyecto activo desde el ProjectContext (useProject).
 * - Si no hay proyecto seleccionado, muestra un mensaje de error.
 * - Renderiza un card con:
 *    - Título del módulo.
 *    - Nombre del proyectos
 *    - Botón para ir al listado de gastos del proyecto.
 *    - Formulario <GastosForm /> para crear gasto/ingreso.
 *
 * Detalles:
 * - `handleGastoCreated`: alterna un estado local `refresh` para permitir
 *   reacciones colaterales si en el futuro quisieras refrescar algo externo.
 * - `handleVerGastos`: navega a /gastos-overview, pasando projectId y nombre.
 * - Efecto `useEffect`: setea el fondo del <body> a gris oscuro mientras la
 *   vista está montada, y lo revierte al desmontar.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../../components/Sidebar";
import GastosForm from "../ui/GastosForm";
import "../ui/GastosForm.css";
import { useProject } from "../../../../context/ProjectContext"; // Contexto de proyecto
import Close from "../../../../assets/iconos/close.png";
const GastosManagement = () => {
  // ⛏️ Toma el proyecto activo del contexto global
  const { project } = useProject();
  const navigate = useNavigate();

  // Estado dummy para reaccionar después de crear un registro (si se necesitara)
  const [refresh, setRefresh] = useState(false);

  /** Callback que recibe <GastosForm /> al crear un registro con éxito */
  const handleGastoCreated = () => setRefresh(!refresh);

  /** Navega al listado de gastos del proyecto actual */
  const handleVerGastos = () =>
    navigate("/gastos-overview", {
      state: { projectId: project?.id, projectName: project?.nombre },
    });

  /**
   * Estiliza el fondo del <body> mientras esta vista esté activa.
   * Se limpia al desmontar para no afectar otras pantallas.
   */
  useEffect(() => {
    document.body.style.background = "#2f2f2f";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  // Si no hay proyecto seleccionado, informa al usuario
  if (!project) {
    return (
      <div className="layout-formulario-gasto">
        <Sidebar />
        <div className="gastos-container">
          <h2>Error: No hay proyecto seleccionado</h2>
        </div>
      </div>
    );
  }

  // Render principal: card blanco con título, nombre del proyecto, botón y formulario
  return (
    <div className="layout-formulario-gasto">
      <Sidebar />

      <div className="contenido-gastos">
        {/* Título del módulo */}
        <h1 className="titulo-fondo-oscurito">Agregar Gasto / Ingreso</h1>

        <div className="gastos-formulario-wrapper">
          {/* ✅ Nombre del proyecto dentro del card blanco */}
          <h2 className="nombre-proyecto-gasto">{project.nombre}</h2>

          {/* Botón para ver el listado de gastos */}
          <div className="btn-ver-gastos-container">
            <button className="btn-ver-gastos" onClick={handleVerGastos}>
              Ver Gastos
            </button>

            <button
              type="button"
              className="dg-icono2"
              onClick={() => navigate("/budget-visualization", { state: { projectId: project?.id } })}
              title="Volver a Budget Visualization"
            >
              <img src={Close} alt="Volver" />
            </button>

          </div>






          {/* Formulario para crear registros financieros */}
          <GastosForm projectId={project.id} onGastoCreated={handleGastoCreated} />
        </div>
      </div>
    </div >
  );
};

export default GastosManagement;
