import React, { useEffect, useState, useRef } from "react";
import { db } from "../../../../services/firebaseconfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useProject } from "../../../../context/ProjectContext";
import { Pie } from "react-chartjs-2";
import html2canvas from "html2canvas";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const KPI4PagosMensuales = () => {
  const { project } = useProject();
  const [porCategoria, setPorCategoria] = useState({});
  const cardRef = useRef(null);
  const botonRef = useRef(null);

  const toNumberSafe = (n) => (isNaN(parseFloat(n)) ? 0 : parseFloat(n));

  const descargarKPI = async () => {
    if (!cardRef.current) return;
    if (botonRef.current) botonRef.current.style.display = "none";
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });
    if (botonRef.current) botonRef.current.style.display = "block";
    const link = document.createElement("a");
    link.download = "kpi4_egresos_por_categoria.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  useEffect(() => {
    const obtener = async () => {
      if (!project?.id) return;

      const gastosRef = collection(db, "gastos");
      const snapGastos = await getDocs(
        query(
          gastosRef,
          where("projectId", "==", project.id),
          where("tipo", "==", "gasto")
        )
      );

      const acc = {};
      snapGastos.docs.forEach((d) => {
        const data = d.data();
        const cat = data.categoria || "Otros";
        acc[cat] = (acc[cat] || 0) + toNumberSafe(data.monto);
      });

      const pagosRef = collection(db, "pagos");
      const snapPagos = await getDocs(
        query(pagosRef, where("projectId", "==", project.id))
      );

      let totalPagos = 0;
      snapPagos.docs.forEach(
        (d) => (totalPagos += toNumberSafe(d.data().monto))
      );
      if (totalPagos > 0) acc["Pagos"] = (acc["Pagos"] || 0) + totalPagos;

      setPorCategoria(acc);
    };

    obtener().catch(console.error);
  }, [project]);

  const labels = Object.keys(porCategoria);
  const valores = Object.values(porCategoria);
  const total = valores.reduce((a, b) => a + b, 0);
  const vacio = !total;

  const coloresBase = [
    "#E3A008",
    "#D35400",
    "#5B6F8F",
    "#1ABC9C",
    "#8E44AD",
    "#2E86C1",
    "#27AE60",
    "#C0392B",
    "#AF7AC5",
    "#16A085",
  ];
  const coloresUsados = labels.map(
    (_, i) => coloresBase[i % coloresBase.length]
  );

  const data = {
    labels,
    datasets: [
      {
        data: valores,
        backgroundColor: coloresUsados,
        borderColor: "#fff",
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        align: "center",
        labels: {
          color: "#333",
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 10,
          padding: 16,
          font: { size: 13, family: "Arapey, serif" },
          generateLabels: (chart) => {
            const ds = chart.data.datasets[0];
            const sum = ds.data.reduce(
              (acc, val) => acc + (Number(val) || 0),
              0
            );
            return chart.data.labels.map((label, i) => {
              const v = Number(ds.data[i]) || 0;
              const pct = sum ? ((v / sum) * 100).toFixed(1) : 0;
              return {
                text: `${label} — C$${v.toLocaleString("es-NI")} (${pct}%)`,
                fillStyle: ds.backgroundColor[i],
                strokeStyle: "#fff",
                lineWidth: 2,
                hidden: v === 0,
                index: i,
              };
            });
          },
        },
      },
      title: {
        display: true,
        text: "Distribución de egresos por categoría (C$)",
        color: "#333",
        font: {
          size: 15,
          weight: "bold",
          family: "Arapey, serif",
        },
        padding: { bottom: 14 },
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleFont: { size: 13, weight: "bold" },
        bodyFont: { size: 12 },
        padding: 10,
        callbacks: {
          label: (ctx) => {
            const v = Number(ctx.parsed) || 0;
            const sum = ctx.dataset.data.reduce(
              (a, b) => a + (Number(b) || 0),
              0
            );
            const pct = sum ? ((v / sum) * 100).toFixed(1) : 0;
            return ` ${ctx.label}: C$${v.toLocaleString("es-NI")} (${pct}%)`;
          },
        },
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
      <div
        className="chart-wrap"
        style={{
          height: "320px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {!vacio ? (
          <Pie data={data} options={options} />
        ) : (
          <div
            style={{
              height: 220,
              display: "grid",
              placeItems: "center",
              color: "#111",
            }}
          >
            <em>No hay egresos para mostrar.</em>
          </div>
        )}
      </div>

      <button
        ref={botonRef}
        onClick={descargarKPI}
        style={{
          marginTop: "1.2rem",
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

export default KPI4PagosMensuales;
