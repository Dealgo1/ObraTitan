import React, { useEffect, useState } from "react";
import KPI2Presupuesto from "./KPI2Presupuesto"; // ← si ya lo tienes, déjalo; si no, puedes ocultarlo temporalmente
import KPI3EstadoCaja from "./KPI3EstadoCaja";
import KPI4PagosMensuales from "./KPI4PagosMensuales";
import Sidebar from "../../../../components/Sidebar";
import PantallaCarga from "../../../../components/PantallaCarga";
import "../ui/KPIDashboard.css";

/**
 * 📊 KPIDashboard
 * Agrupa KPIs del proyecto: presupuesto, estado de caja y egresos por categoría.
 */
const KPIDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulación de carga inicial (opcional)
  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 1200);
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

        <p>
          Este panel presenta un análisis visual de los indicadores clave del sistema Obra Titan.
          Se visualizan métricas relacionadas con el presupuesto, liquidez y egresos por categoría,
          para facilitar decisiones informadas y mejorar el control del proyecto.
        </p>

        <div className="kpi-grid">
          {/* Muestra KPI2Presupuesto solo si lo tienes implementado */}
          {KPI2Presupuesto ? <KPI2Presupuesto /> : null}
          <KPI3EstadoCaja />
          <KPI4PagosMensuales />
        </div>
      </div>
    </>
  );
};

export default KPIDashboard;
