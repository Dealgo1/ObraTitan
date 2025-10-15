import React, { useEffect, useState, useRef } from "react";
import { db } from "../../../../services/firebaseconfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useProject } from "../../../../context/ProjectContext";
import { Doughnut } from "react-chartjs-2";
import html2canvas from "html2canvas";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

// Plugin para escribir total al centro del donut
const CenterTotalPlugin = {
  id: "centerTotal",
  beforeDraw(chart, args, opts) {
    const { ctx, chartArea: { width, height } } = chart;
    const total = opts?.total || 0;
    if (!total) return;
    ctx.save();
    ctx.fillStyle = opts?.color || "#111";
    ctx.font = opts?.font || "bold 14px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Total`, width / 2, height / 2 - 10);
    ctx.font = opts?.fontBig || "bold 16px Inter, Arial, sans-serif";
    ctx.fillText(`C$${total.toLocaleString("es-NI")}`, width / 2, height / 2 + 12);
    ctx.restore();
  },
};
ChartJS.register(CenterTotalPlugin);

const KPI4PagosMensuales = () => {
  const { project } = useProject();
  const [porCategoria, setPorCategoria] = useState({});

  const cardRef = useRef(null);
  const botonRef = useRef(null);

  const toNumberSafe = (n) => (isNaN(parseFloat(n)) ? 0 : parseFloat(n));

  const descargarKPI = async () => {
    if (!cardRef.current) return;
    if (botonRef.current) botonRef.current.style.display = "none";
    const canvas = await html2canvas(cardRef.current, { backgroundColor: "#ffffff", scale: 2 });
    if (botonRef.current) botonRef.current.style.display = "block";
    const link = document.createElement("a");
    link.download = "kpi4_egresos_por_categoria.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  useEffect(() => {
    const obtener = async () => {
      if (!project?.id) return;

      // Egresos desde gastos (tipo=gasto)
      const gastosRef = collection(db, "gastos");
      const snapGastos = await getDocs(query(gastosRef, where("projectId", "==", project.id), where("tipo", "==", "gasto")));

      const acc = {};
      snapGastos.docs.forEach((d) => {
        const data = d.data();
        const cat = data.categoria || "Otros";
        acc[cat] = (acc[cat] || 0) + toNumberSafe(data.monto);
      });

      // Pagos como egreso adicional (categoría "Pagos")
      const pagosRef = collection(db, "pagos");
      const snapPagos = await getDocs(query(pagosRef, where("projectId", "==", project.id)));
      let totalPagos = 0;
      snapPagos.docs.forEach((d) => (totalPagos += toNumberSafe(d.data().monto)));
      if (totalPagos > 0) acc["Pagos"] = (acc["Pagos"] || 0) + totalPagos;

      setPorCategoria(acc);
    };

    obtener().catch(console.error);
  }, [project]);

  const labels = Object.keys(porCategoria);
  const valores = Object.values(porCategoria);
  const total = valores.reduce((a, b) => a + b, 0);

  const coloresBase = ["#E3A008", "#D35400", "#5B6F8F", "#1ABC9C", "#8E44AD", "#2E86C1", "#27AE60", "#C0392B"];
  const coloresUsados = labels.map((_, i) => coloresBase[i % coloresBase.length]);

  const data = {
    labels,
    datasets: [
      { data: valores, backgroundColor: coloresUsados, borderColor: "#ffffff", borderWidth: 2, hoverOffset: 6 },
    ],
  };

  const textColor = "#e5e7eb";

  const options = {
    cutout: "58%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: textColor,
          // Añadimos monto y porcentaje en la leyenda
          generateLabels: (chart) => {
            const ds = chart.data.datasets[0];
            return chart.data.labels.map((label, i) => {
              const v = ds.data[i] || 0;
              const pct = total ? Math.round((v / total) * 100) : 0;
              return {
                text: `${label} — C$${Number(v).toLocaleString("es-NI")} (${pct}%)`,
                fillStyle: ds.backgroundColor[i],
                strokeStyle: "#ffffff",
                lineWidth: 2,
                hidden: isNaN(v) || v === 0,
                index: i,
              };
            });
          },
        },
      },
      title: { display: true, text: "Egresos por categoría (C$)", color: textColor },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = Number(ctx.parsed) || 0;
            const pct = total ? (v / total) * 100 : 0;
            return ` ${ctx.label}: C$${v.toLocaleString("es-NI")} (${pct.toFixed(1)}%)`;
          },
        },
      },
      centerTotal: { total, color: "#111" },
    },
  };

  const vacio = !total;

  return (
    <div ref={cardRef} className="kpi-card" style={{ backgroundColor: "white", border: "2px solid #D35400", borderRadius: "15px", padding: "1.5rem", minHeight: 380 }}>
      {!vacio ? (
        <Doughnut data={data} options={options} />
      ) : (
        <div style={{ height: 220, display: "grid", placeItems: "center", color: "#111" }}>
          <em>No hay egresos para mostrar.</em>
        </div>
      )}

      <button ref={botonRef} onClick={descargarKPI} style={{ marginTop: "1.2rem", padding: "0.6rem 1.2rem", backgroundColor: "#D35400", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", display: "block", marginLeft: "auto", marginRight: "auto" }}>
        Descargar KPI completo
      </button>
    </div>
  );
};

export default KPI4PagosMensuales;
