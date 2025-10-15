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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * 📊 KPI2PagosPorMes
 * Conteo de pagos por mes (enero—diciembre) para el proyecto activo.
 * Exporta la tarjeta completa como PNG.
 */
const KPI2PagosPorMes = () => {
  const { project } = useProject();
  const [conteoPorMes, setConteoPorMes] = useState(Array(12).fill(0));
  const [cantidadTotal, setCantidadTotal] = useState(0);

  const cardRef = useRef(null);
  const botonRef = useRef(null);

  const toDateSafe = (raw) => {
    if (!raw) return null;
    if (typeof raw?.toDate === "function") return raw.toDate(); // Firestore Timestamp
    const d = new Date(raw);
    return isNaN(d) ? null : d;
    // si tienes unix seconds: new Date(raw.seconds*1000)
  };

  const descargarKPI = async () => {
    if (!cardRef.current) return;
    if (botonRef.current) botonRef.current.style.display = "none";
    const canvas = await html2canvas(cardRef.current, { backgroundColor: "#ffffff", scale: 2 });
    if (botonRef.current) botonRef.current.style.display = "block";
    const link = document.createElement("a");
    link.download = "kpi2_tarjeta_completa.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  useEffect(() => {
    const obtenerPagos = async () => {
      if (!project?.id) return;
      try {
        const pagosRef = collection(db, "pagos");
        const qPagos = query(pagosRef, where("projectId", "==", project.id));
        const snap = await getDocs(qPagos);

        const porMes = Array(12).fill(0);
        snap.docs.forEach((d) => {
          const data = d.data();
          // prioriza fechaPago, cae en fecha si no existe
          const fecha = toDateSafe(data.fechaPago) || toDateSafe(data.fecha);
          if (!fecha) return;
          const m = fecha.getMonth();
          if (m >= 0 && m < 12) porMes[m] += 1;
        });

        setConteoPorMes(porMes);
        setCantidadTotal(snap.size);
      } catch (e) {
        console.error("Error al obtener pagos:", e);
      }
    };

    obtenerPagos();
  }, [project]);

  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

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

  const options = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "black" } },
      title: { display: true, text: "Cantidad de pagos realizados por mes", color: "black" },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.label}: ${ctx.formattedValue} pago${Number(ctx.raw) === 1 ? "" : "s"}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: "black" } },
      y: { beginAtZero: true, ticks: { color: "black", precision: 0 } },
    },
  };

  return (
    <div
      ref={cardRef}
      className="kpi-card"
      style={{ backgroundColor: "white", border: "2px solid #D35400", borderRadius: "15px", padding: "1.5rem" }}
    >
      <Bar data={data} options={options} />

      <div
        className="kpi-summary"
        style={{ marginTop: "1.5rem", border: "2px solid #D35400", borderRadius: "10px", padding: "1rem", textAlign: "center", color: "black", fontSize: "1.2rem" }}
      >
        <strong style={{ fontSize: "1.5rem", color: "#D35400" }}>{cantidadTotal}</strong>
        <br />
        Cantidad de pagos registrados
      </div>

      <button
        ref={botonRef}
        onClick={descargarKPI}
        style={{ marginTop: "1rem", padding: "0.6rem 1.2rem", backgroundColor: "#D35400", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", display: "block", marginLeft: "auto", marginRight: "auto" }}
      >
        Descargar KPI completo
      </button>
    </div>
  );
};

export default KPI2PagosPorMes;
