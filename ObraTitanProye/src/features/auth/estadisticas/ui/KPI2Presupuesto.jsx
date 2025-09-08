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

// Registro de componentes de Chart.js necesarios para la barra
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * 📊 KPI2PagosPorMes
 * Muestra un gráfico de barras con el conteo de pagos por mes para el proyecto activo
 * y un resumen con la cantidad total de pagos. Permite descargar la tarjeta completa
 * (gráfico + resumen + botón) como imagen PNG usando html2canvas.
 */
const KPI2PagosPorMes = () => {
  const { project } = useProject();

  // Estado con el conteo por cada uno de los 12 meses (enero—diciembre)
  const [conteoPorMes, setConteoPorMes] = useState(Array(12).fill(0));
  // Total de pagos encontrados para el proyecto
  const [cantidadTotal, setCantidadTotal] = useState(0);

  // Refs para capturar la tarjeta completa y ocultar el botón al momento de exportar
  const cardRef = useRef(null);
  const botonRef = useRef(null);

  /**
   * 📥 Descargar KPI como imagen PNG
   * - Oculta el botón para que no salga en la captura
   * - Renderiza la tarjeta (cardRef) a un canvas con fondo blanco
   * - Restaura el botón y dispara la descarga
   */
  const descargarKPI = async () => {
    if (!cardRef.current) return;

    // Ocultar botón temporalmente
    if (botonRef.current) botonRef.current.style.display = "none";

    // Captura de la tarjeta a canvas
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#ffffff",
      scale: 2, // mayor resolución de salida
    });

    // Restaurar visibilidad del botón
    if (botonRef.current) botonRef.current.style.display = "block";

    // Descargar como PNG
    const link = document.createElement("a");
    link.download = "kpi2_tarjeta_completa.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  /**
   * 🔎 Cargar pagos del proyecto y calcular conteos por mes
   * - Consulta colección "pagos" filtrada por projectId
   * - Interpreta fecha Firestore Timestamp o ISO/string
   * - Incrementa el contador correspondiente al mes (0-11)
   */
  useEffect(() => {
    const obtenerPagos = async () => {
      if (!project?.id) return;

      try {
        const pagosRef = collection(db, "pagos");
        const q = query(pagosRef, where("projectId", "==", project.id));
        const snapshot = await getDocs(q);

        const pagosPorMes = Array(12).fill(0);

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          // Admite Timestamp de Firestore (data.fecha.toDate()) o string/Date
          const fechaRaw = data.fecha;
          if (!fechaRaw) return;

          const fecha = fechaRaw?.seconds
            ? new Date(fechaRaw.seconds * 1000)
            : new Date(fechaRaw);

          if (isNaN(fecha)) return; // evita fechas inválidas

          const mes = fecha.getMonth(); // 0-11
          if (mes >= 0 && mes <= 11) pagosPorMes[mes]++;
        });

        setConteoPorMes(pagosPorMes);
        setCantidadTotal(snapshot.size);
      } catch (error) {
        console.error("Error al obtener pagos:", error);
      }
    };

    obtenerPagos();
  }, [project]);

  // Etiquetas de meses para el eje X
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // Dataset para Chart.js
  const data = {
    labels: meses,
    datasets: [
      {
        label: "Pagos por mes",
        data: conteoPorMes,
        backgroundColor: "#D35400",
        borderColor: "white",
        borderWidth: 2,
        borderRadius: 5,
      },
    ],
  };

  // Opciones de visualización del gráfico
  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: "black" },
      },
      title: {
        display: true,
        text: "Cantidad de pagos realizados por mes",
        color: "black",
      },
      tooltip: {
        callbacks: {
          // Ej: "Mar: 5 pagos"
          label: (ctx) => `${ctx.label}: ${ctx.formattedValue} pago${Number(ctx.raw) === 1 ? "" : "s"}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "black" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "black", precision: 0 }, // sin decimales
      },
    },
  };

  // 📦 Tarjeta del KPI (gráfico + resumen + botón de descarga)
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
      {/* Gráfico de barras */}
      <Bar data={data} options={options} />

      {/* Resumen total */}
      <div
        className="kpi-summary"
        style={{
          marginTop: "1.5rem",
          border: "2px solid #D35400",
          borderRadius: "10px",
          padding: "1rem",
          textAlign: "center",
          color: "black",
          fontSize: "1.2rem",
        }}
      >
        <strong style={{ fontSize: "1.5rem", color: "#D35400" }}>
          {cantidadTotal}
        </strong>
        <br />
        Cantidad de pagos registrados
      </div>

      {/* Botón de descarga (se oculta al exportar) */}
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

export default KPI2PagosPorMes;
