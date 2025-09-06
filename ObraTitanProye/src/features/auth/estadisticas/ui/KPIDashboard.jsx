import React from "react";
import KPI2Presupuesto from "./KPI2Presupuesto";
import KPI3EstadoCaja from "./KPI3EstadoCaja";
import KPI4PagosMensuales from "./KPI4PagosMensuales";
import Sidebar from "../Sidebar";
import "../../EstadisticasCss/KPIDashboard.css";

/**
 * 📊 Componente: KPIDashboard
 * 
 * Este panel agrupa y muestra los KPIs (Indicadores Clave de Desempeño)
 * relacionados con el proyecto "Obra Titan".
 * 
 * - Incluye un sidebar lateral de navegación.
 * - Presenta un título y una breve descripción del propósito del dashboard.
 * - Muestra tres métricas principales en formato de tarjetas/gráficas:
 *   1. Presupuesto (KPI2Presupuesto)
 *   2. Estado de caja (KPI3EstadoCaja)
 *   3. Pagos mensuales (KPI4PagosMensuales)
 */
const KPIDashboard = () => {
  return (
    <>
      {/* Sidebar de navegación */}
      <Sidebar />

      {/* Contenedor principal del dashboard */}
      <div className="kpi-dashboard-container">
        <h2>Dashboard de KPIs - Obra Titan</h2>

        <p>
          Este panel presenta un análisis visual de los indicadores clave del sistema Obra Titan.
          Se visualizan métricas relacionadas con el presupuesto, liquidez y pagos,
          con el objetivo de facilitar decisiones informadas y mejorar el control del proyecto.
        </p>

        {/* Grid de KPIs (tarjetas/gráficas) */}
        <div className="kpi-grid">
          <KPI2Presupuesto />
          <KPI3EstadoCaja />
          <KPI4PagosMensuales />
        </div>
      </div>
    </>
  );
};

export default KPIDashboard;
