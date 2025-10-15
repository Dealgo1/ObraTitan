// src/views/.../kpi/KPI2PagosPorMes.jsx
import React, { useEffect, useRef, useState } from "react";
import { db } from "../../../../services/firebaseconfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useProject } from "../../../../context/ProjectContext";
import { Bar } from "react-chartjs-2";
import html2canvas from "html2canvas";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const KPI2PagosPorMes = () => {
  const { project } = useProject();
  const [conteoPorMes, setConteoPorMes] = useState(Array(12).fill(0));
  const [cantidadTotal, setCantidadTotal] = useState(0);

  const cardRef = useRef(null);
  const botonRef = useRef(null);

  const toDateSafe = (raw) => {
    if (!raw) return null;
    if (typeof raw?.toDate === "function") return raw.toDate();
    const d = new Date(raw);
    return isNaN(d) ? null : d;
  };

  const descargarKPI = async () => {
    if (!cardRef.current) return;
    if (botonRef.current) botonRef.current.style.display = "none";
    const canvas = await html2canvas(cardRef.current, { backgroundColor: "#ffffff", scale: 2 });
    if (botonRef.current) botonRef.current.style.display = "block";
    const a = document.createElement("a");
    a.download = "kpi_pagos_por_mes.png";
    a.href = canvas.toDataURL();
    a.click();
  };

  useEffect(() => {
    const cargar = async () => {
      if (!project?.id) return;
      const pagosRef = collection(db, "pagos");
      const qPagos = query(pagosRef, where("projectId", "==", project.id));
      const snap = await getDocs(qPagos);

      const porMes = Array(12).fill(0);
      snap.docs.forEach((d) => {
        const data = d.data();
        const fecha = toDateSafe(data.fechaPago) || toDateSafe(data.fecha);
        if (!fecha) return;
        const m = fecha.getMonth();
        if (m >= 0 && m < 12) porMes[m] += 1;
      });

      setConteoPorMes(porMes);
      setCantidadTotal(snap.size);
    };

    cargar().catch(console.error);
  }, [project]);

  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const data = {
    labels: meses,
    datasets: [{
      label: "Pagos por mes",
      data: conteoPorMes,
      backgroundColor: "#D35400",
      borderColor: "#ffffff",
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,            // ← importante para responsive real
    plugins: {
      legend: { labels: { color: "black" } },
      title: { display: true, text: "Cantidad de pagos realizados por mes", color: "black" },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.label}: ${ctx.formattedValue} pago${Number(ctx.raw) === 1 ? "" : "s"}`
        }
      }
    },
    scales: {
      x: { ticks: { color: "black" } },
      y: { beginAtZero: true, ticks: { color: "black", precision: 0 } },
    },
  };

  return (
    <div ref={cardRef} className="kpi-card">
      <div className="chart-wrap"><Bar data={data} options={options} /></div>

      <div className="kpi-summary">
        <strong style={{ fontSize: "1.5rem" }}>{cantidadTotal}</strong>
        <br />Cantidad de pagos registrados
      </div>

      <button ref={botonRef} onClick={descargarKPI}>Descargar KPI completo</button>
    </div>
  );
};

export default KPI2PagosPorMes;
