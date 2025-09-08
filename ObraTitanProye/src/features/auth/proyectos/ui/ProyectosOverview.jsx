import React, { useEffect, useState } from "react";
import "../ui/ProyectosOverview.css";
import { useNavigate } from "react-router-dom";
import { getProjects } from "../../../../services/projectsService";
import { useProject } from "../../../../context/ProjectContext";
import flechaIcon from "../assets/iconos/Flech.png";
import estrellaIcon from "../assets/iconos/star.png";
import iconoBuscar from "../assets/iconos/search.png";

/**
 * 📌 Vista: ProyectosOverview
 * 
 * - Lista proyectos obtenidos desde Firestore (services/projectsService).
 * - Permite filtrar por nombre/cliente/fecha.
 * - Muestra contadores por estado.
 * - Al seleccionar un proyecto, lo guarda en el ProjectContext y navega al dashboard.
 * - Incluye botón para crear un nuevo proyecto.
 */
const ProyectosOverview = () => {
  // Estado principal de la lista y su versión filtrada
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");

  // Control de carga inicial
  const [loading, setLoading] = useState(true);

  // Navegación y contexto de proyecto seleccionado
  const navigate = useNavigate();
  const { setProject } = useProject();

  // 🔄 Carga inicial de proyectos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProjects();   // 👉 Llama al servicio (Firestore)
        setProjects(data);                  // Lista completa
        setFiltered(data);                  // Lista filtrada (inicialmente igual)
      } catch (err) {
        console.error("Error al cargar proyectos", err);
      } finally {
        setLoading(false);                  // Apaga la pantalla de carga
      }
    };
    fetchData();
  }, []);

  /**
   * 🔍 Filtro de búsqueda (nombre, cliente, fecha formateada)
   * - La fecha se forma con createdAt.seconds (timestamp de Firestore)
   * - Soporta búsqueda por texto libre
   */
  const handleSearch = (e) => {
    const text = e.target.value.toLowerCase();
    setSearch(text);

    setFiltered(
      projects.filter((proj) => {
        const nombre = proj.nombre?.toLowerCase() || "";
        const cliente = proj.cliente?.toLowerCase() || "";
        // Formatea fecha si viene como timestamp de Firestore
        const fecha = proj.createdAt?.seconds
          ? new Date(proj.createdAt.seconds * 1000).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "";

        return (
          nombre.includes(text) ||
          cliente.includes(text) ||
          fecha.includes(text)
        );
      })
    );
  };

  /**
   * 🧮 Contadores por estado
   * - Se usa directamente la lista completa `projects`
   */
  const contarPorEstado = (estado) =>
    projects.filter((p) => p.estado === estado).length;

  /** ➕ Ir a crear proyecto */
  const handleNuevoProyecto = () => {
    navigate("/CrearProyecto");
  };

  /**
   * 📂 Guardar proyecto en contexto y abrir su dashboard
   * - Persistimos el objeto project en ProjectContext para que esté disponible en todo el flujo
   */
  const handleAbrirDashboard = (project) => {
    setProject(project);
    navigate("/project-dashboard");
  };

  // 🌀 Pantalla de carga (coincide con tu loader global)
  if (loading) {
    return (
      <div className="pantalla-carga">
        <div className="wave-loader">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
        <p className="texto-cargando">Cargando proyectos...</p>
      </div>
    );
  }

  return (
    <div className="layout-proyectos">
      <h1 className="titulo-proyectos">Proyectos</h1>

      {/* 🔖 Filtros-resumen por estado (muestran contadores) */}
      <div className="filtros-proyectos">
        <button className="btn-filtro">
          Proyectos Cancelados <span>{contarPorEstado("Cancelado")}</span>
        </button>
        <button className="btn-filtro">
          Proyectos Terminado <span>{contarPorEstado("Finalizado")}</span>
        </button>
        <button className="btn-filtro">
          Proyectos Proceso <span>{contarPorEstado("En progreso")}</span>
        </button>
      </div>

      {/* 🧾 Card principal con buscador + lista */}
      <div className="card-blanca-proyectos">
        <div className="barra-superior">
          {/* 🔎 Buscador con icono */}
          <div className="input-con-icono">
            <img src={iconoBuscar} alt="Buscar" className="icono-dentro-input" />
            <input
              type="text"
              className="input-busqueda"
              placeholder="Buscar proyecto..."
              value={search}
              onChange={handleSearch}
            />
          </div>

          {/* ➕ CTA para crear proyecto */}
          <button className="btn-nuevo" onClick={handleNuevoProyecto}>
            Nuevo proyecto +
          </button>
        </div>

        {/* ♿️ Wrapper con scroll horizontal si hay muchas tarjetas */}
        <div className="scroll-horizontal-wrapper">
          <div className="lista-proyectos">
            {filtered.map((project, index) => {
              // 🗓 Fecha legible (y capitalizada la primera letra)
              const fechaFormateada = project.createdAt?.seconds
                ? new Date(project.createdAt.seconds * 1000)
                    .toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                    .replace(/^\w/, (c) => c.toUpperCase())
                : "fecha desconocida";

              return (
                <div
                  key={index}
                  className="card-proyecto clickable-card"
                  onClick={() => handleAbrirDashboard(project)} // 👉 click en la tarjeta
                >
                  <div className="fila-principal">
                    {/* 🖼 Imagen del proyecto (o placeholder) */}
                    {project.imagen ? (
                      <img
                        src={project.imagen}
                        alt="Proyecto"
                        className="icono-imagen"
                      />
                    ) : (
                      <div className="icono-imagen-placeholder" />
                    )}

                    {/* 🧠 Info principal */}
                    <div className="bloque-informacion">
                      <p className="nombre-proyecto">{project.nombre}</p>
                      <div className="info-centro">
                        <p className="propiedad-proyecto">
                          Propiedad de {project.cliente || "XXXXXX"}
                        </p>
                        <p className="fecha-proyecto">
                          Creado el {fechaFormateada}
                        </p>
                      </div>
                    </div>

                    {/* ⭐ Acciones rápidas */}
                    <div className="acciones-proyecto">
                      <img
                        src={estrellaIcon}
                        alt="Favorito"
                        className="icono-personalizado"
                      />
                      <img
                        src={flechaIcon}
                        alt="Ver proyecto"
                        className="icono-personalizado"
                        onClick={() => handleAbrirDashboard(project)} // 👉 click en flecha
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProyectosOverview;
