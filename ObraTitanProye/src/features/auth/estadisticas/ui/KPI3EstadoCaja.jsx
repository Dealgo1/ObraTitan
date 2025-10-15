// src/views/.../kpi/KPI3EstadoCaja.jsx
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

const KPI3EstadoCaja = () => {
  const { project } = useProject();

  const [ingresosMes, setIngresosMes] = useState(Array(12).fill(0));
  const [egresosMes, setEgresosMes] = useState(Array(12).fill(0));
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalEgresos, setTotalEgresos] = useState(0);
  const [presupuestoInicial, setPresupuestoInicial] = useState(0);

  const cardRef = useRef(null);
  const botonRef = useRef(null);

  const toDateSafe = (raw) => {
    if (!raw) return null;
    if (typeof raw?.toDate === "function") return raw.toDate();
    const d = new Date(raw);
    return isNaN(d) ? null : d;
  };
  const toNumberSafe = (n) => (isNaN(parseFloat(n)) ? 0 : parseFloat(n));

  const descargarKPI = async () => {
    if (!cardRef.current) return;
    if (botonRef.current) botonRef.current.style.display = "none";
    const canvas = await html2canvas(cardRef.current, { backgroundColor: "#ffffff", scale: 2 });
    if (botonRef.current) botonRef.current.style.display = "block";
    const a = document.createElement("a");
    a.download = "kpi_estado_caja.png";
    a.href = canvas.toDataURL();
    a.click();
  };

  useEffect(() => {
    const obtenerDatos = async () => {
      if (!project?.id) return;

      const pInit =
        toNumberSafe(project?.presupuesto) ||
        toNumberSafe(project?.presupuestoInicial) ||
        toNumberSafe(project?.budgetInicial) ||
        toNumberSafe(project?.budget) || 0;

      setPresupuestoInicial(pInit);

      const gastosRef = collection(db, "gastos");
      const qIngresos = query(gastosRef, where("projectId", "==", project.id), where("tipo", "==", "ingreso"));
      const qEgresos = query(gastosRef, where("projectId", "==", project.id), where("tipo", "==", "gasto"));

      const [snapIngresos, snapEgresos] = await Promise.all([getDocs(qIngresos), getDocs(qEgresos)]);

      const ingresos = Array(12).fill(0);
      const egresos = Array(12).fill(0);
      let sumaIngresos = 0;
      let sumaEgresos = 0;

      snapIngresos.docs.forEach((d) => {
        const data = d.data();
        const fecha = toDateSafe(data.fecha);
        if (!fecha) return;
        const mes = fecha.getMonth();
        const monto = toNumberSafe(data.monto);
        ingresos[mes] += monto;
        sumaIngresos += monto;
      });

      snapEgresos.docs.forEach((d) => {
        const data = d.data();
        const fecha = toDateSafe(data.fecha);
        if (!fecha) return;
        const mes = fecha.getMonth();
        const monto = toNumberSafe(data.monto);
        egresos[mes] += monto;
        sumaEgresos += monto;
      });

      // pagos → egreso
      const pagosRef = collection(db, "pagos");
      const qPagos = query(pagosRef, where("projectId", "==", project.id));
      const snapPagos = await getDocs(qPagos);
      snapPagos.docs.forEach((d) => {
        const data = d.data();
        const fecha = toDateSafe(data.fechaPago) || toDateSafe(data.fecha);
        if (!fecha) return;
        const mes = fecha.getMonth();
        const monto = toNumberSafe(data.monto);
        egresos[mes] += monto;
        sumaEgresos += monto;
      });

      setIngresosMes(ingresos);
      setEgresosMes(egresos);
      setTotalIngresos(sumaIngresos);
      setTotalEgresos(sumaEgresos);
    };

    obtenerDatos().catch(console.error);
  }, [project]);

  const saldo = presupuestoInicial + totalIngresos - totalEgresos;
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const data = {
    labels: meses,
    datasets: [
      { label: "Ingresos", data: ingresosMes, backgroundColor: "#E3A008", borderColor: "#ffffff", borderWidth: 2, borderRadius: 6 },
      { label: "Egresos",  data: egresosMes,  backgroundColor: "#D35400", borderColor: "#ffffff", borderWidth: 2, borderRadius: 6 },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "black" } },
      title: { display: true, text: "Ingresos vs Egresos por mes", color: "black" },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.dataset.label}: C$${(Number(ctx.raw)||0).toLocaleString("es-NI")}` }
      }
    },
    scales: {
      x: { ticks: { color: "black" } },
      y: { beginAtZero: true, ticks: { color: "black" } },
    },
  };

  return (
    <div ref={cardRef} className="kpi-card">
      <div className="chart-wrap"><Bar data={data} options={options} /></div>

      <div className="kpi-summary">
        <div><strong>Presupuesto inicial:</strong>&nbsp; C${(presupuestoInicial||0).toLocaleString("es-NI")}</div>
        <div><strong>Total ingresos:</strong>&nbsp; C${(totalIngresos||0).toLocaleString("es-NI")}</div>
        <div style={{ marginBottom: ".6rem" }}><strong>Total egresos:</strong>&nbsp; C${(totalEgresos||0).toLocaleString("es-NI")}</div>
        <strong style={{ fontSize: "1.35rem" }}>Saldo gastado: C${saldo.toLocaleString("es-NI")}</strong>
      </div>

      <button ref={botonRef} onClick={descargarKPI}>Descargar KPI completo</button>
    </div>
  );
};

export default KPI3EstadoCaja;
