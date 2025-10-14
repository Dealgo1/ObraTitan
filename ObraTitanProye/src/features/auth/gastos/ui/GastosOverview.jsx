// src/views/.../GastosOverview.jsx
/**
 * GastosOverview.jsx
 * ------------------------------------------------------------
 * Lista de gastos/ingresos con loader "wave" mientras carga.
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListGroup } from "react-bootstrap";
import { getGastos } from "../../../../services/gastosService";
import { useAuth } from "../../../../context/authcontext";
import Sidebar from "../../../../components/Sidebar";
import PantallaCarga from "../../../../components/PantallaCarga"; // ⬅️ Loader wave
import "../ui/GastosOverview.css";
import { useProject } from "../../../../context/ProjectContext";
import Close from "../../../../assets/iconos/close.png";
import arrowIcon from "../../../../assets/iconos/flecha.png";
import iconoBuscar from "../../../../assets/iconos/search.png";

const GastosOverview = () => {
  const navigate = useNavigate();

  // Proyecto activo desde el contexto global
  const { project } = useProject();
  const { userData } = useAuth(); // tenantId
  const projectId = project?.id;
  const projectName = project?.nombre;

  // Estado local
  const [gastos, setGastos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true); // ⬅️ controla la pantalla de carga

  // Rango de fechas
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // == Helpers de fecha ==
  const toDate = (value) => {
    if (!value) return null;
    if (typeof value === "object") {
      if (typeof value.toDate === "function") return value.toDate();
      if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
    }
    if (typeof value === "string") {
      const m = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (m) {
        const [_, d, mo, y] = m;
        const iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dt = new Date(iso);
        return isNaN(dt) ? null : dt;
      }
      const dt = new Date(value);
      return isNaN(dt) ? null : dt;
    }
    return null;
  };

  const fmtDMY = (date) => {
    if (!date) return "";
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  /**
   * Carga inicial de registros para el proyecto actual.
   */
  useEffect(() => {
    const fetchData = async () => {
      // Hasta que existan projectId y tenantId, mantenemos loader
      if (!projectId || !userData?.tenantId) return;

      setLoading(true);
      setOffline(false);
      try {
        const data = await getGastos(projectId, userData.tenantId);
        setGastos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al obtener gastos:", error);
        if (!navigator.onLine) setOffline(true);
      } finally {
        setLoading(false); // ⬅️ oculta loader
      }
    };

    fetchData();
  }, [projectId, userData?.tenantId]);

  /**
   * Navega al detalle
   */
  const handleSelectGasto = (gasto) => {
    navigate("/gasto-detail", { state: { gasto, projectId, projectName } });
  };

  // ====== Filtros (texto + rango) y orden ======
  const filtroTexto = filtro.trim().toLowerCase();
  const desdeDate = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null;
  const hastaDate = fechaHasta ? new Date(`${fechaHasta}T23:59:59.999`) : null;

  const gastosFiltrados = gastos.filter((g) => {
    const categoria = (g.categoria || "").toLowerCase();
    const tipo = (g.tipo || "").toLowerCase();
    const gDate = toDate(g.fecha);
    const fechaISO = gDate ? gDate.toISOString().slice(0, 10) : (g.fecha || "");
    const fechaDMY = gDate ? fmtDMY(gDate) : "";

    const textoOK =
      !filtroTexto ||
      categoria.includes(filtroTexto) ||
      tipo.includes(filtroTexto) ||
      String(fechaISO).toLowerCase().includes(filtroTexto) ||
      String(fechaDMY).toLowerCase().includes(filtroTexto);
    if (!textoOK) return false;

    if (desdeDate && (!gDate || gDate < desdeDate)) return false;
    if (hastaDate && (!gDate || gDate > hastaDate)) return false;

    return true;
  });

  const gastosOrdenados = [...gastosFiltrados].sort((a, b) => {
    const da = toDate(a.fecha);
    const db = toDate(b.fecha);
    if (!db && !da) return 0;
    if (!db) return -1;
    if (!da) return 1;
    return db - da;
  });

  const limpiarFechas = () => {
    setFechaDesde("");
    setFechaHasta("");
  };

  // ⬅️ Pantalla de carga:
  // se muestra mientras carga o mientras aún no hay projectId/tenantId disponibles
  if (loading || !projectId || !userData?.tenantId) {
    return <PantallaCarga mensaje="Cargando registros de gastos..." />;
  }

  return (
    <div className="layout-gastos">
      <Sidebar />
      <h1 className="titulo-fondo-oscuro">Gastos</h1>

      <div className="gastos-container">
        <div className="gastos-card">

          <button
            type="button"
            className="go-corner-x"
            onClick={() => navigate("/budget-visualization", { state: { projectId } })}
            title="Volver a Budget Visualization"
            aria-label="Volver"
          >
            <img src={Close} alt="" />
          </button>

          <h2 className="titulo-proyecto">
            {projectName ? projectName : "Proyecto sin nombre"}
          </h2>

          {offline && (
            <div style={{ color: "orange", marginBottom: "10px" }}>
              ⚠ Estás sin conexión. Mostrando datos almacenados en caché.
            </div>
          )}

          {/* 🔎 Búsqueda + rango de fechas */}
          <div
            className="barra-superior-proveedores"
            style={{ gap: 12, display: "flex", flexWrap: "wrap", alignItems: "center" }}
          >
            <div className="input-con-icono" style={{ flex: "1 1 260px", minWidth: 240 }}>
              <img src={iconoBuscar} alt="Buscar" className="icono-dentro-input" />
              <input
                type="text"
                className="input-busqueda"
                placeholder="Buscar por categoría, tipo o fecha..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
              <label style={{ fontSize: 12, opacity: 0.8 }}>Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="input-busqueda"
                style={{ paddingLeft: 10, height: 38 }}
              />
              <label style={{ fontSize: 12, opacity: 0.8 }}>Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="input-busqueda"
                style={{ paddingLeft: 10, height: 38 }}
              />
              {(fechaDesde || fechaHasta) && (
                <button
                  type="button"
                  onClick={limpiarFechas}
                  className="btn btn-sm"
                  style={{
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid #999",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  title="Limpiar rango"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Listado */}
          <ListGroup className="lista-gastos">
            {gastosOrdenados.map((g) => {
              const gDate = toDate(g.fecha);
              const fechaMostrar = gDate ? fmtDMY(gDate) : (g.fecha || "Sin fecha");

              return (
                <ListGroup.Item
                  key={g.id}
                  className="gasto-item"
                  onClick={() => handleSelectGasto(g)}
                >
                  <div className="gasto-nombre">
                    {g.tipo === "ingreso" ? "Ingreso" : g.categoria}
                  </div>
                  <div className="gasto-fecha">{fechaMostrar}</div>
                  <div className="gasto-arrow">
                    <img src={arrowIcon} alt="Flecha" className="flecha-derecha" />
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </div>
      </div>
    </div>
  );
};

export default GastosOverview;
