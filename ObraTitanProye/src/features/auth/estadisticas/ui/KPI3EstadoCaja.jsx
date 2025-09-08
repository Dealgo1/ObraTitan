import React, { useEffect, useState, useRef } from "react";
import { db } from "../../../../services/firebaseconfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useProject } from "../../../../context/ProjectContext";
import { Bar } from "react-chartjs-2";
import html2canvas from "html2canvas";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registra los componentes necesarios de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * 📊 KPI3EstadoCaja
 * Compara ingresos vs egresos por mes para el proyecto activo
 * y muestra el saldo acumulado (ingresos - egresos).
 * Permite descargar la tarjeta completa como imagen (PNG) con html2canvas.
 */
const KPI3EstadoCaja = () => {
  const { project } = useProject();

  // Series por mes (enero-diciembre)
  const [ingresosMes, setIngresosMes] = useState(Array(12).fill(0));
  const [egresosMes, setEgresosMes] = useState(Array(12).fill(0));

  // Totales acumulados
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalEgresos, setTotalEgresos] = useState(0);

  // Refs para exportar la tarjeta sin el botón
  const cardRef = useRef(null);
  const botonRef = useRef(null);

  /**
   * 🖼️ Descargar KPI completo (tarjeta) como PNG.
   * - Oculta el botón mientras captura
   * - Exporta a imagen con fondo blanco y escala 2x
   */
  const descargarKPI = async () => {
    if (!cardRef.current) return;

    if (botonRef.current) botonRef.current.style.display = "none";

    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });

    if (botonRef.current) botonRef.current.style.display = "block";

    const link = document.createElement("a");
    link.href = canvas.toDataURL();
    link.download = "kpi3_estado_caja.png";
    link.click();
  };

  /**
   * 🔎 Carga datos de Firestore:
   * - Pagos = ingresos
   * - Gastos = egresos
   * Calcula montos por mes (0-11) y totales acumulados.
   */
  useEffect(() => {
    const obtenerDatos = async () => {
      if (!project?.id) return;

      try {
        // ============ Ingresos ============
        const pagosRef = collection(db, "pagos");
        const pagosQuery = query(pagosRef, where("projectId", "==", project.id));
        const pagosSnap = await getDocs(pagosQuery);

        const ingresos = Array(12).fill(0);
        let sumaIngresos = 0;

        pagosSnap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          // Soporta Timestamp de Firestore (toDate) y string/Date
          const fechaRaw = data.fecha;
          if (!fechaRaw) return;

          const fecha = fechaRaw?.seconds
            ? new Date(fechaRaw.seconds * 1000)
            : new Date(fechaRaw);
          if (isNaN(fecha)) return;

          const mes = fecha.getMonth(); // 0-11
          const monto = parseFloat(data.monto || 0);
          if (mes >= 0 && mes <= 11 && !isNaN(monto)) {
            ingresos[mes] += monto;
            sumaIngresos += monto;
          }
        });

        setIngresosMes(ingresos);
        setTotalIngresos(sumaIngresos);

        // ============ Egresos ============
        const gastosRef = collection(db, "gastos");
        const gastosQuery = query(gastosRef, where("projectId", "==", project.id));
        const gastosSnap = await getDocs(gastosQuery);

        const egresos = Array(12).fill(0);
        let sumaEgresos = 0;

        gastosSnap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const fechaRaw = data.fecha;
          if (!fechaRaw) return;

          const fecha = fechaRaw?.seconds
            ? new Date(fechaRaw.seconds * 1000)
            : new Date(fechaRaw);
          if (isNaN(fecha)) return;

          const mes = fecha.getMonth();
          const monto = parseFloat(data.monto || 0);
          if (mes >= 0 && mes <= 11 && !isNaN(monto)) {
            egresos[mes] += monto;
            sumaEgresos += monto;
          }
        });

        setEgresosMes(egresos);
        setTotalEgresos(sumaEgresos);
      } catch (error) {
        console.error("Error al obtener ingresos y egresos:", error);
      }
    };

    obtenerDatos();
  }, [project]);

  // Saldo acumulado (puede ser negativo)
  const saldo = totalIngresos - totalEgresos;

  // Etiquetas para el eje X
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // Dataset de Chart.js
  const data = {
    labels: meses,
    datasets: [
      {
        label: "Ingresos",
        data: ingresosMes,
        backgroundColor: "#E3A008", // dorado
        borderColor: "white",
        borderWidth: 2,
        borderRadius: 5,
      },
      {
        label: "Egresos",
        data: egresosMes,
        backgroundColor: "#D35400", // naranja
        borderColor: "white",
        borderWidth: 2,
        borderRadius: 5,
      },
    ],
  };

  // Opciones del gráfico
  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: "black" },
      },
      title: {
        display: true,
        text: "Ingresos vs Egresos por mes",
        color: "black",
      },
      tooltip: {
        callbacks: {
          // Formatea como moneda local (C$) si lo deseas luego
          label: (ctx) => {
            const v = Number(ctx.raw) || 0;
            return `${ctx.dataset.label}: C$${v.toLocaleString("es-NI")}`;
          },
        },
      },
    },
    scales: {
      x: { ticks: { color: "black" } },
      y: {
        beginAtZero: true,
        ticks: { color: "black" },
      },
    },
  };

  return (
    <div
      ref={cardRef}
      className="kpi-card"
      style={{
        backgroundColor: "white",
        border: "2px solid #D35400",
        borderRadius: "15px",
        padding: "1.5rem",
      }}
    >
      {/* Gráfico de barras: Ingresos vs Egresos */}
      <Bar data={data} options={options} />

      {/* Resumen con el saldo actual */}
      <div
        className="kpi-summary"
        style={{
          marginTop: "1.5rem",
          border: "2px solid #D35400",
          borderRadius: "10px",
          padding: "1rem",
          textAlign: "center",
          fontSize: "1.3rem",
          color: "black",
        }}
      >
        <strong style={{ fontSize: "1.6rem" }}>
          {/* Formato moneda Nicaragua */}
          C${saldo.toLocaleString("es-NI")}
        </strong>
        <br />
        Saldo actual de la caja
      </div>

      {/* Botón para exportar la tarjeta como imagen */}
      <button
        ref={botonRef}
        onClick={descargarKPI}
        style={{
          marginTop: "1rem",
          padding: "0.6rem 1.2rem",
          backgroundColor: "#D35400",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          display: "block",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        Descargar KPI completo
      </button>
    </div>
  );
};

export default KPI3EstadoCaja;
