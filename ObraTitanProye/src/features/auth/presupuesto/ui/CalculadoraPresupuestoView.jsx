// src/views/PresupuestoView.jsx
import React, { useState } from "react";
import Sidebar from "../../../../components/Sidebar";
import PresupuestoCalculator from "../ui/PresupuestoCalculator";
import EstructuraForm from "../ui/EstructuraForm";
import ListaEstructuras from "../ui/ListaEstructuras";
import { useProject } from "../../../../context/ProjectContext"; // ✅ contexto del proyecto activo
import "../ui/PresupuestoCalculator.css";

/**
 * 🧮 Vista: PresupuestoView
 *
 * Pantalla principal para gestionar el presupuesto del proyecto:
 * - Pestaña "Materiales": formulario/calculadora de materiales.
 * - Pestaña "Estructuras": crear/editar estructuras y, opcionalmente, ver la lista.
 *
 * Requiere un proyecto seleccionado (via ProjectContext). Si no existe projectId,
 * se muestra un mensaje de error.
 */
const CalculadoraPresupuestoView = () => {
  const { project } = useProject(); // ✅ Proyecto activo vía contexto
  const projectId = project?.id;    // ✅ ID del proyecto actual (si existe)

  // =========================
  // 📦 Estado local de la vista
  // =========================
  const [vista, setVista] = useState("materiales"); // "materiales" | "estructura"
  const [estructuraEnEdicion, setEstructuraEnEdicion] = useState(null); // estructura seleccionada para editar
  const [mostrarLista, setMostrarLista] = useState(false); // muestra/oculta lista de estructuras

  return (
    <div className="layout-presupuesto">
      {/* Navegación lateral */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="contenido-presupuesto">
        <h1 className="titulo">Calculadora de Presupuesto</h1>

        {/* 🔀 Conmutador de vistas */}
        <div className="switch-vista">
          {/* Botón: Materiales */}
          <button
            className={`switch-btn ${vista === "materiales" ? "activo" : ""}`}
            onClick={() => setVista("materiales")}
          >
            ➕ Agregar Materiales
          </button>

          {/* Botón: Estructuras */}
          <button
            className={`switch-btn ${vista === "estructura" ? "activo" : ""}`}
            onClick={() => setVista("estructura")}
          >
            🧱 Estructuras
          </button>

          {/* Botón: Lista de estructuras (solo visible en la pestaña Estructuras) */}
          {vista === "estructura" && (
            <button
              className={`switch-btn ${mostrarLista ? "activo" : ""}`}
              onClick={() => setMostrarLista(!mostrarLista)}
            >
              📋 Lista de Estructuras
            </button>
          )}

          {/* Indicador de edición activa (deshabilitado) */}
          {estructuraEnEdicion && (
            <button className="switch-btn editar-activo" disabled>
              ✏️ Editando: {estructuraEnEdicion.nombre}
            </button>
          )}
        </div>

        {/* ✅ Requiere projectId válido */}
        {projectId ? (
          <>
            {/* Vista: Materiales */}
            {vista === "materiales" && (
              <div className="formulario-materiales">
                <PresupuestoCalculator />
              </div>
            )}

            {/* Vista: Estructuras */}
            {vista === "estructura" && (
              <div className="formulario-estructura">
                <EstructuraForm
                  estructuraEnEdicion={estructuraEnEdicion}
                  setEstructuraEnEdicion={setEstructuraEnEdicion}
                />

                {/* Lista colapsable de estructuras */}
                {mostrarLista && (
                  <ListaEstructuras
                    setEstructuraEnEdicion={setEstructuraEnEdicion}
                  />
                )}
              </div>
            )}
          </>
        ) : (
          // ⚠️ Sin proyecto válido
          <p style={{ color: "red" }}>
            Error: No se ha seleccionado un proyecto válido.
          </p>
        )}
      </div>
    </div>
  );
};

export default CalculadoraPresupuestoView;
