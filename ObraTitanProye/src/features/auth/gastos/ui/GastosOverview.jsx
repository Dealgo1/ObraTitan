/**
 * GastosOverview.jsx
 * ------------------------------------------------------------
 * Listado de gastos/ingresos de un proyecto con:
 * - Carga inicial desde `getGastos(projectId)`
 * - Indicador de modo offline (cuando falla la red)
 * - Búsqueda por categoría o tipo (cliente)
 * - Navegación al detalle de un gasto (`/gasto-detail`) con state
 *
 * Dependencias:
 * - Contexto `useProject` para obtener { project.id, project.nombre }
 * - Servicio `getGastos(projectId)` para traer los registros
 * - React-Bootstrap (ListGroup) para la lista
 * - React Router (useNavigate) para ir al detalle
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListGroup } from "react-bootstrap";
import { getGastos } from "../../../../services/gastosService";
import { useAuth } from "../../../../context/authcontext";
import Sidebar from "../../../../components/Sidebar";
import "../ui/GastosOverview.css";
import { useProject } from "../../../../context/ProjectContext";

// Íconos
import arrowIcon from "../../../../assets/iconos/flecha.png";
import iconoBuscar from "../../../../assets/iconos/search.png"; // ✅ Ícono de búsqueda

const GastosOverview = () => {
  const navigate = useNavigate();

  // Proyecto activo desde el contexto global
  const { project } = useProject();
  const { userData } = useAuth();   // ← aquí viene tenantId
  const projectId = project?.id;
  const projectName = project?.nombre;

  // Estado local
  const [gastos, setGastos] = useState([]);   // registros (gastos/ingresos)
  const [filtro, setFiltro] = useState("");   // texto de búsqueda
  const [offline, setOffline] = useState(false); // ✅ indicador de modo sin conexión

  /**
   * Carga inicial de registros para el proyecto actual.
   * - Si la llamada falla y el navegador está offline, muestra bandera `offline`.
   * - En caso de éxito, resetea `offline` a false.
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || !userData?.tenantId) return;

      try {
        const data = await getGastos(projectId, userData.tenantId);
        setGastos(data);
        setOffline(false);
      } catch (error) {
        console.error("Error al obtener gastos:", error);
        if (!navigator.onLine) {
          setOffline(true);
        }
      }
    };

    fetchData();
  }, [projectId, userData?.tenantId]);

  /**
   * Navega a la vista de detalle del gasto seleccionado.
   * - Pasa a la ruta `/gasto-detail` el gasto y metadata del proyecto vía `state`.
   */
  const handleSelectGasto = (gasto) => {
    navigate("/gasto-detail", { state: { gasto, projectId, projectName } });
  };

  /**
   * Filtro simple en cliente:
   * - Busca coincidencias en `categoria` o `tipo` (case-insensitive).
   */
  const gastosFiltrados = gastos.filter((g) => {
    const categoria = g.categoria?.toLowerCase() || "";
    const tipo = g.tipo?.toLowerCase() || "";
    return (
      categoria.includes(filtro.toLowerCase()) ||
      tipo.includes(filtro.toLowerCase())
    );
  });

  // Si no hay projectId (p. ej., acceso directo sin seleccionar proyecto)
  if (!projectId || !userData?.tenantId) {
    return (
      <div className="layout-gastos">
        <Sidebar />
        <div className="gastos-container">
          <h3>Error: No se recibió projectId</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-gastos">
      {/* Sidebar global de navegación */}
      <Sidebar />

      {/* Título del módulo */}
      <h1 className="titulo-fondo-oscuro">Gastos</h1>

      {/* Contenido principal */}
      <div className="gastos-container">
        <div className="gastos-card">
          {/* Encabezado con nombre del proyecto */}
          <h2 className="titulo-proyecto">
            {projectName ? projectName : "Proyecto sin nombre"}
          </h2>

          {/* ✅ Mensaje de modo offline (datos cacheados/locales) */}
          {offline && (
            <div style={{ color: "orange", marginBottom: "10px" }}>
              ⚠ Estás sin conexión. Mostrando datos almacenados en caché.
            </div>
          )}

          {/* ✅ Barra de búsqueda local (categoría/tipo) */}
          <div className="barra-superior-proveedores">
            <div className="input-con-icono">
              <img src={iconoBuscar} alt="Buscar" className="icono-dentro-input" />
              <input
                type="text"
                className="input-busqueda"
                placeholder="Buscar por categoría o tipo..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
          </div>

          {/* Listado de registros (gasto/ingreso) */}
          <ListGroup className="lista-gastos">
            {gastosFiltrados.map((g) => (
              <ListGroup.Item
                key={g.id}
                className="gasto-item"
                onClick={() => handleSelectGasto(g)}
              >
                {/* Si es ingreso, muestra la etiqueta. Si no, la categoría */}
                <div className="gasto-nombre">
                  {g.tipo === "ingreso" ? "Ingreso" : g.categoria}
                </div>

                {/* Fecha (según el formato almacenado) */}
                <div className="gasto-fecha">{g.fecha || "Sin fecha"}</div>

                {/* Icono de flecha para indicar navegabilidad */}
                <div className="gasto-arrow">
                  <img src={arrowIcon} alt="Flecha" className="flecha-derecha" />
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      </div>
    </div>
  );
};

export default GastosOverview;
