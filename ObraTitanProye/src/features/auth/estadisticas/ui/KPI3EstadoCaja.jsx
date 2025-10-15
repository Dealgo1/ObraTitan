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
 * 📊 KPI3EstadoCaja
 * - Ingresos: documentos en `gastos` con tipo === "ingreso"
 * - Egresos: documentos en `gastos` con tipo === "gasto" + todos los `pagos`
 * - Saldo: (presupuestoInicial || 0) + totalIngresos - totalEgresos
 */
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

  const toNumberSafe = (n) => {
    const v = parseFloat(n);
    return isNaN(v) ? 0 : v;
  };

  const descargarKPI = async () => {
    if (!cardRef.current) return;
    if (botonRef.current) botonRef.current.style.display = "none";
    const canvas = await html2canvas(cardRef.current, { backgroundColor: "#ffffff", scale: 2 });
    if (botonRef.current) botonRef.current.style.display = "block";
    const link = document.createElement("a");
    link.href = canvas.toDataURL();
    link.download = "kpi3_estado_caja.png";
    link.click();
  };

  useEffect(() => {
    const obtenerDatos = async () => {
      if (!project?.id) return;

      // toma presupuesto inicial del objeto del proyecto (nombra tus campos aquí)
     const pInit =
  toNumberSafe(project?.presupuesto) || // ← tu campo real
  toNumberSafe(project?.presupuestoInicial) ||
  toNumberSafe(project?.budgetInicial) ||
  toNumberSafe(project?.budget) ||
  0;

      setPresupuestoInicial(pInit);

      try {
        // ===== GASTOS: ingresos (tipo=ingreso) y egresos (tipo=gasto)
        const gastosRef = collection(db, "gastos");

        const qIngresos = query(
          gastosRef,
          where("projectId", "==", project.id),
          where("tipo", "==", "ingreso")
        );
        const qEgresos = query(
          gastosRef,
          where("projectId", "==", project.id),
          where("tipo", "==", "gasto")
        );

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
          if (mes >= 0 && mes < 12) {
            ingresos[mes] += monto;
            sumaIngresos += monto;
          }
        });

        snapEgresos.docs.forEach((d) => {
          const data = d.data();
          const fecha = toDateSafe(data.fecha);
          if (!fecha) return;
          const mes = fecha.getMonth();
          const monto = toNumberSafe(data.monto);
          if (mes >= 0 && mes < 12) {
            egresos[mes] += monto;
            sumaEgresos += monto;
          }
        });

        // ===== PAGOS: cuentan como EGRESOS
        const pagosRef = collection(db, "pagos");
        const qPagos = query(pagosRef, where("projectId", "==", project.id));
        const snapPagos = await getDocs(qPagos);

        snapPagos.docs.forEach((d) => {
          const data = d.data();
          const fecha = toDateSafe(data.fechaPago) || toDateSafe(data.fecha);
          if (!fecha) return;
          const mes = fecha.getMonth();
          const monto = toNumberSafe(data.monto);
          if (mes >= 0 && mes < 12) {
            egresos[mes] += monto;
            sumaEgresos += monto;
          }
        });

        setIngresosMes(ingresos);
        setEgresosMes(egresos);
        setTotalIngresos(sumaIngresos);
        setTotalEgresos(sumaEgresos);
      } catch (error) {
        console.error("Error al obtener estado de caja:", error);
      }
    };

    obtenerDatos();
  }, [project]);

  const saldo = presupuestoInicial + totalIngresos - totalEgresos;

  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const data = {
    labels: meses,
    datasets: [
      {
        label: "Ingresos",
        data: ingresosMes,
        backgroundColor: "#E3A008",
        borderColor: "white",
        borderWidth: 2,
        borderRadius: 5,
      },
      {
        label: "Egresos",
        data: egresosMes,
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
      title: { display: true, text: "Ingresos vs Egresos por mes", color: "black" },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = Number(ctx.raw) || 0;
            return `${ctx.dataset.label}: C$${v.toLocaleString("es-NI")}`;
          },
        },
      },
    },
    scales: {
      x: { ticks: { color: "black" } },
      y: { beginAtZero: true, ticks: { color: "black" } },
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
        style={{ marginTop: "1.5rem", border: "2px solid #D35400", borderRadius: "10px", padding: "1rem", textAlign: "center", fontSize: "1.1rem", color: "black" }}
      >
        <div style={{ marginBottom: ".5rem" }}>
          <strong>Presupuesto inicial:&nbsp;</strong>
          <span> C${(presupuestoInicial || 0).toLocaleString("es-NI")}</span>
        </div>
        <div style={{ marginBottom: ".5rem" }}>
          <strong>Total ingresos:&nbsp;</strong>
          <span> C${(totalIngresos || 0).toLocaleString("es-NI")}</span>
        </div>
        <div style={{ marginBottom: ".75rem" }}>
          <strong>Total egresos:&nbsp;</strong>
          <span> C${(totalEgresos || 0).toLocaleString("es-NI")}</span>
        </div>

        <strong style={{ fontSize: "1.6rem" }}>
          Saldo gastado: C${saldo.toLocaleString("es-NI")}
        </strong>
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

export default KPI3EstadoCaja;
