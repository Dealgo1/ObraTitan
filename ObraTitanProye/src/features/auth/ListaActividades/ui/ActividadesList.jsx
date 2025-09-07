// src/components/actividadeslist/ActividadesList.jsx
/**
 * Componente: ActividadesList
 * ---------------------------------------------------------------------------
 * Tablero de actividades (tareas) por proyecto con soporte para:
 * - Crear, editar, eliminar actividades.
 * - Agregar, editar, eliminar subtareas.
 * - Marcar/desmarcar subtareas (individuales y en bloque con validación).
 * - Cambiar estado de la actividad (enProceso → finalizado → cancelado → ...).
 * - Contadores de estado (finalizado, enProceso, cancelado).
 * - Vista expandible/colapsable de subtareas.
 *
 * Fuente de datos:
 * Firestore (colección "actividades"), filtradas por proyecto actual (proyectoId).
 *
 * Integraciones:
 * - useProject(): determina el proyecto activo (contexto + localStorage fallback).
 * - Sidebar: navegación lateral de la app.
 *
 * Notas:
 * - Se contemplan conversiones simples de fecha (string YYYY-MM-DD).
 * - Los estilos y algunos menús están controlados por CSS.
 */

import React, { useState, useEffect } from "react";
import { db } from "../../assets/database/firebaseconfig";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { useProject } from "../../context/ProjectContext";
import Sidebar from "../../components/Sidebar";

// Iconografía UI
import editIcon from "../../assets/iconos/edit.png";
import deleteIcon from "../../assets/iconos/delete.png";
import checkIcon from "../../assets/iconos/check.png";
import closeIcon from "../../assets/iconos/close.png";

import "./ActividadesList.css";

const ActividadesList = () => {
  // --- Estados UI / control ---
  const [leyendaVisible, setLeyendaVisible] = useState({}); // mapa de {actividadId: bool}
  const [actividades, setActividades] = useState([]);       // lista de actividades para el proyecto
  const [nuevaActividad, setNuevaActividad] = useState(""); // nombre de la nueva actividad
  const [fechaInicio, setFechaInicio] = useState("");       // fecha inicio para creación
  const [fechaFin, setFechaFin] = useState("");             // fecha fin para creación

  const [editandoId, setEditandoId] = useState(null);       // actividad actualmente en edición
  const [editDatos, setEditDatos] = useState({});           // campos editables de actividad

  const [subtareaInput, setSubtareaInput] = useState({});   // texto nueva subtarea por actividadId
  const [editandoSubtarea, setEditandoSubtarea] = useState({});   // {actividadId: indexEnEdicion}
  const [nuevoNombreSubtarea, setNuevoNombreSubtarea] = useState({}); // {actividadId: texto}

  const [menuAbierto, setMenuAbierto] = useState(null);     // (si tu CSS lo usa) id de actividad con menú abierto
  const [visibles, setVisibles] = useState({});             // {actividadId: bool} para expandir/cerrar subtareas

  // Contadores por estado
  const [contadores, setContadores] = useState({
    finalizado: 0,
    enProceso: 0,
    cancelado: 0,
  });

  const { project } = useProject(); // proyecto activo desde contexto

  /**
   * Al montar/cambiar el proyecto:
   * - Asegura un projectId (contexto o localStorage).
   * - Carga actividades del proyecto.
   */
  useEffect(() => {
    const storedProject = JSON.parse(localStorage.getItem("project"));
    if (!project?.id && storedProject) project.id = storedProject.id; // fallback de id (⚠ mutación directa)
    if (project?.id) obtenerActividades(project.id);
  }, [project]);

  /** Alterna visibilidad de subtareas para una actividad */
  const toggleVisibilidad = (id) => {
    setVisibles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /** Recuenta estados y actualiza los contadores */
  const contarEstados = (actividades) => {
    const conteo = { finalizado: 0, enProceso: 0, cancelado: 0 };
    actividades.forEach((act) => {
      if (conteo[act.estado] !== undefined) conteo[act.estado]++;
    });
    setContadores(conteo);
  };

  /** Alterna visibilidad de la leyenda de colores (por actividad) */
  const toggleLeyenda = (id) => {
    setLeyendaVisible((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  /**
   * Obtiene actividades para el proyecto actual desde Firestore.
   * @param {string} projectId
   */
  const obtenerActividades = async (projectId) => {
    const q = query(
      collection(db, "actividades"),
      where("proyectoId", "==", projectId)
    );
    const data = await getDocs(q);

    const actividadesCargadas = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    setActividades(actividadesCargadas);
    contarEstados(actividadesCargadas);
  };

  /**
   * Crea una nueva actividad para el proyecto actual
   * Campos: nombre, subtareas[], estado, fechaInicio, fechaFin, proyectoId
   */
  const agregarActividad = async () => {
    const projectId =
      project?.id || JSON.parse(localStorage.getItem("project"))?.id;
    if (!nuevaActividad.trim() || !projectId) return;

    await addDoc(collection(db, "actividades"), {
      nombre: nuevaActividad,
      subtareas: [],
      estado: "enProceso",
      fechaInicio,
      fechaFin,
      proyectoId: projectId,
    });

    // Limpia inputs y recarga
    setNuevaActividad("");
    setFechaInicio("");
    setFechaFin("");
    obtenerActividades(projectId);
  };

  /** Activa modo edición para una actividad */
  const activarEdicion = (actividad) => {
    setEditandoId(actividad.id);
    setEditDatos({
      nombre: actividad.nombre,
      fechaInicio: actividad.fechaInicio || "",
      fechaFin: actividad.fechaFin || "",
      fechaFinalizado: actividad.fechaFinalizado || "",
    });
  };

  /** Cancela modo edición */
  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditDatos({});
  };

  /**
   * Guarda edición de la actividad:
   * - Actualiza nombre, fechaInicio, fechaFin.
   * - Si la actividad está en "finalizado" sin fechaFinalizado, la setea a hoy.
   */
  const guardarEdicion = async () => {
    const act = actividades.find((a) => a.id === editandoId);

    await updateDoc(doc(db, "actividades", editandoId), {
      nombre: editDatos.nombre,
      fechaInicio: editDatos.fechaInicio,
      fechaFin: editDatos.fechaFin,
      ...(act.estado === "finalizado" &&
        !act.fechaFinalizado && {
          fechaFinalizado: new Date().toISOString().split("T")[0],
        }),
    });

    setEditandoId(null);
    obtenerActividades(project?.id);
  };

  /**
   * Agrega subtarea a una actividad.
   * Cada subtarea inicia con {nombre, completado:false, fechaCompletado:null}
   */
  const agregarSubtarea = async (id) => {
    const input = subtareaInput[id]?.trim();
    if (!input) return;

    const actividad = actividades.find((a) => a.id === id);
    const nuevas = [
      ...actividad.subtareas,
      { nombre: input, completado: false, fechaCompletado: null },
    ];

    await updateDoc(doc(db, "actividades", id), { subtareas: nuevas });
    setSubtareaInput({ ...subtareaInput, [id]: "" });
    setMenuAbierto(null); // si se usa un menú contextual
    obtenerActividades(project?.id);
  };

  /**
   * Edita el nombre de una subtarea
   * @param {string} actividadId
   * @param {number} index
   * @param {string} nuevoNombre
   */
  const editarSubtarea = async (actividadId, index, nuevoNombre) => {
    const actividad = actividades.find((a) => a.id === actividadId);
    const nuevasSubtareas = [...actividad.subtareas];
    nuevasSubtareas[index].nombre = nuevoNombre;

    await updateDoc(doc(db, "actividades", actividadId), {
      subtareas: nuevasSubtareas,
    });

    setEditandoSubtarea({ ...editandoSubtarea, [actividadId]: null });
    setNuevoNombreSubtarea({ ...nuevoNombreSubtarea, [actividadId]: "" });
    obtenerActividades(project?.id);
  };

  /** Cancela edición de subtarea */
  const cancelarEdicionSubtarea = (actividadId) => {
    setEditandoSubtarea({ ...editandoSubtarea, [actividadId]: null });
    setNuevoNombreSubtarea({ ...nuevoNombreSubtarea, [actividadId]: "" });
  };

  /**
   * Marca/desmarca una subtarea y setea/borra su fechaCompletado
   */
  const toggleSubtarea = async (actividadId, index) => {
    const actividad = actividades.find((a) => a.id === actividadId);
    const nuevasSubtareas = [...actividad.subtareas];
    const actual = nuevasSubtareas[index];

    actual.completado = !actual.completado;
    actual.fechaCompletado = actual.completado
      ? new Date().toISOString().split("T")[0]
      : null;

    await updateDoc(doc(db, "actividades", actividadId), {
      subtareas: nuevasSubtareas,
    });
    obtenerActividades(project?.id);
  };

  /**
   * Marca/desmarca TODAS las subtareas desde el checkbox principal
   * - Si se intenta marcar como completada la actividad, valida que no haya subtareas pendientes.
   */
  const toggleTodasSubtareas = async (actividadId, completar) => {
    const actividad = actividades.find((a) => a.id === actividadId);
    if (!actividad) return;

    if (completar) {
      const hayIncompletas = actividad.subtareas.some((s) => !s.completado);
      if (hayIncompletas) {
        alert("No puedes marcar la tarea como completada si hay subtareas pendientes.");
        return;
      }
    }

    const nuevasSubtareas = actividad.subtareas.map((sub) => ({
      ...sub,
      completado: completar,
      fechaCompletado: completar ? new Date().toISOString().split("T")[0] : null,
    }));

    await updateDoc(doc(db, "actividades", actividadId), {
      subtareas: nuevasSubtareas,
    });
    obtenerActividades(project?.id);
  };

  /** Elimina una subtarea por índice */
  const eliminarSubtarea = async (actividadId, index) => {
    const actividad = actividades.find((a) => a.id === actividadId);
    const nuevas = [...actividad.subtareas];
    nuevas.splice(index, 1);

    await updateDoc(doc(db, "actividades", actividadId), { subtareas: nuevas });
    obtenerActividades(project?.id);
  };

  /** Elimina una actividad completa */
  const eliminarActividad = async (id) => {
    await deleteDoc(doc(db, "actividades", id));
    obtenerActividades(project?.id);
  };

  /**
   * Cicla por el estado de la actividad:
   * enProceso → finalizado → cancelado → enProceso ...
   * - Si pasa a "finalizado" y no hay fechaFinalizado, la setea a hoy.
   * - Si sale de "finalizado", limpia la fechaFinalizado.
   */
  const cambiarEstadoCiclo = async (actividad) => {
    const estados = ["enProceso", "finalizado", "cancelado"];
    const index = estados.indexOf(actividad.estado);
    const nuevoEstado = estados[(index + 1) % estados.length];

    const updateData = { estado: nuevoEstado };

    if (nuevoEstado === "finalizado" && !actividad.fechaFinalizado) {
      updateData.fechaFinalizado = new Date().toISOString().split("T")[0];
    } else if (nuevoEstado !== "finalizado") {
      updateData.fechaFinalizado = null;
    }

    await updateDoc(doc(db, "actividades", actividad.id), updateData);
    obtenerActividades(project?.id);
  };

  /** Colores de botón de estado */
  const colorEstado = (estado) => {
    if (estado === "finalizado") return "#2ecc71";
    if (estado === "enProceso") return "#f1c40f";
    return "#e74c3c"; // cancelado
  };

  /** Guarda edición de subtarea (wrapper semántico) */
  const guardarEdicionSubtarea = async (actividadId, index, nombre) => {
    await editarSubtarea(actividadId, index, nombre);
  };

  /** True si hay subtareas y todas están completadas */
  const todasCompletadas = (subtareas) =>
    subtareas.length > 0 && subtareas.every((s) => s.completado);

  /** Alterna un menú contextual simple por actividad (si lo usas en CSS) */
  const toggleMenu = (id) => {
    setMenuAbierto(menuAbierto === id ? null : id);
  };

  /** Entra a edición de actividad desde el menú */
  const handleEditActividad = (actividad) => {
    activarEdicion(actividad);
    toggleMenu(null);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="layout">
      <Sidebar />

      <div className="contenido">
        <h2 className="titulo">Gestión de Tareas</h2>

        {/* Leyenda con contadores por estado */}
        <div className="estado-leyenda">
          <span>
            <span className="estado verde" /> Finalizado: {contadores.finalizado}
          </span>
          <span>
            <span className="estado amarillo" /> En Proceso: {contadores.enProceso}
          </span>
          <span>
            <span className="estado rojo" /> Cancelado: {contadores.cancelado}
          </span>
        </div>

        {/* Formulario de alta de actividad */}
        <div className="form-agregar">
          <input
            type="text"
            placeholder="Nombre de la tarea"
            value={nuevaActividad}
            onChange={(e) => setNuevaActividad(e.target.value)}
          />
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
          <button onClick={agregarActividad}>
            <span className="mas-simbolo">+</span>
          </button>
        </div>

        {/* Lista de tarjetas de actividades (con scroll horizontal si aplica) */}
        <div className="scroll-horizontal-wrapper">
          <div className="lista-tareas">
            {actividades.map((act) => (
              <React.Fragment key={act.id}>
                {/* Tarjeta principal de actividad */}
                <div className="tarjeta-tarea fade-in">
                  <div className="info-tarea">
                    {/* Checkbox maestro: marca todas si ya están completas (validado) */}
                    <input
                      type="checkbox"
                      checked={todasCompletadas(act.subtareas)}
                      onChange={() =>
                        toggleTodasSubtareas(
                          act.id,
                          !todasCompletadas(act.subtareas)
                        )
                      }
                    />

                    {/* Título clickable: expande/colapsa subtareas */}
                    <div
                      style={{ cursor: "pointer", flex: 1 }}
                      onClick={() => toggleVisibilidad(act.id)}
                    >
                      <strong>{act.nombre}</strong>
                    </div>

                    {/* Fechas y botón de estado */}
                    <div className="fecha-estado-wrapper">
                      <div className={`fecha-pill ${act.estado}`}>
                        {new Date(
                          new Date(act.fechaInicio).getTime() + 86400000
                        ).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        -{" "}
                        {new Date(
                          new Date(act.fechaFin).getTime() + 86400000
                        ).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>

                      <button
                        className="btn-estado"
                        onClick={() => cambiarEstadoCiclo(act)}
                        style={{ backgroundColor: colorEstado(act.estado) }}
                      />
                    </div>
                  </div>

                  {/* Botón de leyenda de colores (⋯) */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => toggleLeyenda(act.id)}
                      className="btn-tres-puntos"
                    >
                      ⋯
                    </button>

                    {leyendaVisible[act.id] && (
                      <div className="leyenda-colores">
                        <strong>Estado:</strong>
                        <div>
                          <span className="punto verde" /> Finalizado
                        </div>
                        <div>
                          <span className="punto amarillo" /> En Proceso
                        </div>
                        <div>
                          <span className="punto rojo" /> Cancelado
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Formulario de edición inline de la actividad */}
                  {editandoId === act.id && (
                    <div className="form-editar-tarea">
                      <input
                        type="text"
                        value={editDatos.nombre}
                        onChange={(e) =>
                          setEditDatos({ ...editDatos, nombre: e.target.value })
                        }
                      />
                      <input
                        type="date"
                        value={editDatos.fechaInicio}
                        onChange={(e) =>
                          setEditDatos({
                            ...editDatos,
                            fechaInicio: e.target.value,
                          })
                        }
                      />
                      <input
                        type="date"
                        value={editDatos.fechaFin}
                        onChange={(e) =>
                          setEditDatos({
                            ...editDatos,
                            fechaFin: e.target.value,
                          })
                        }
                      />
                      <div className="botones-editar">
                        <button onClick={guardarEdicion}>
                          <img src={checkIcon} alt="guardar" />
                        </button>
                        <button onClick={cancelarEdicion}>
                          <img src={closeIcon} alt="cancelar" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Área para agregar subtareas cuando está expandida */}
                  {visibles[act.id] && (
                    <div className="agregar-subtarea">
                      <input
                        type="text"
                        placeholder="Nueva subtarea"
                        value={subtareaInput[act.id] || ""}
                        onChange={(e) =>
                          setSubtareaInput({
                            ...subtareaInput,
                            [act.id]: e.target.value,
                          })
                        }
                      />
                      <button onClick={() => agregarSubtarea(act.id)}>+</button>
                    </div>
                  )}
                </div>

                {/* Acciones de actividad (fuera de la tarjeta) */}
                <div className="acciones-tarea-principal acciones-abajo">
                  <button
                    className="btn-accion edit-btn"
                    onClick={() => handleEditActividad(act)}
                  >
                    <img src={editIcon} alt="editar" />
                  </button>
                  <button
                    className="btn-accion delete-btn"
                    onClick={() => eliminarActividad(act.id)}
                  >
                    <img src={deleteIcon} alt="eliminar" />
                  </button>
                </div>

                {/* Listado de subtareas (cuando la actividad está expandida y NO se edita la actividad) */}
                {visibles[act.id] && editandoId !== act.id && (
                  <>
                    {act.subtareas.map((sub, idx) => (
                      <div
                        key={idx}
                        className={`subtarea-card fade-in ${
                          sub.completado ? "subtarea-completada" : ""
                        }`}
                      >
                        <div className="contenido-subtarea">
                          <input
                            type="checkbox"
                            className="checkbox-subtarea"
                            checked={sub.completado}
                            onChange={() => toggleSubtarea(act.id, idx)}
                          />

                          {editandoSubtarea[act.id] === idx ? (
                            <input
                              type="text"
                              value={nuevoNombreSubtarea[act.id] || sub.nombre}
                              onChange={(e) =>
                                setNuevoNombreSubtarea({
                                  ...nuevoNombreSubtarea,
                                  [act.id]: e.target.value,
                                })
                              }
                              className="input-edicion-subtarea"
                            />
                          ) : (
                            <span className="nombre-subtarea">
                              {sub.nombre}
                            </span>
                          )}

                          {/* Muestra fecha de completado si aplica */}
                          {sub.completado && sub.fechaCompletado && (
                            <small className="fecha-subtarea">
                              {" "}
                              - Finalizado: {sub.fechaCompletado}
                            </small>
                          )}
                        </div>

                        <div className="acciones-subtarea">
                          {editandoSubtarea[act.id] === idx ? (
                            <>
                              <button
                                onClick={() =>
                                  guardarEdicionSubtarea(
                                    act.id,
                                    idx,
                                    nuevoNombreSubtarea[act.id]
                                  )
                                }
                              >
                                <img src={checkIcon} alt="guardar" />
                              </button>
                              <button
                                onClick={() => cancelarEdicionSubtarea(act.id)}
                              >
                                <img src={closeIcon} alt="cancelar" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  setEditandoSubtarea({
                                    ...editandoSubtarea,
                                    [act.id]: idx,
                                  })
                                }
                              >
                                <img src={editIcon} alt="editar" />
                              </button>
                              <button
                                onClick={() => eliminarSubtarea(act.id, idx)}
                              >
                                <img src={deleteIcon} alt="eliminar" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActividadesList;
