// src/views/.../kpi/KPIDashboard.jsx
import React, { useEffect, useState } from "react";
import KPI2PagosPorMes from "./KPI2Presupuesto";
import KPI3EstadoCaja from "./KPI3EstadoCaja";
import KPI4PagosMensuales from "./KPI4PagosMensuales";
import Sidebar from "../../../../components/Sidebar";
import PantallaCarga from "../../../../components/PantallaCarga";
import "../ui/KPIDashboard.css";

/**
 * 📊 Dashboard de KPIs
 */
const KPIDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timeout);
  }, []);

  if (isLoading) {
    return (
      <div className="layout-kpi-dashboard">
        <Sidebar />
        <PantallaCarga mensaje="Cargando indicadores del proyecto..." />
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="kpi-dashboard-container">
        <h2 className="titulo-fondo-oscuro2">Dashboard de KPIs - Obra Titan</h2>

        <p className="kpi-intro">
          Panel con los principales indicadores del proyecto: cantidad de pagos, estado de caja
          e **egresos por categoría**. Todo con un diseño uniforme, legible y responsive.
        </p>

        <div className="kpi-grid">
          <KPI2PagosPorMes />
          <KPI3EstadoCaja />
          <KPI4PagosMensuales />
        </div>
      </div>
    </>
  );
};

export default KPIDashboard;
