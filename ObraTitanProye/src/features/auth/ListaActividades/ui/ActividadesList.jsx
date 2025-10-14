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
import { db } from "../../../../services/firebaseconfig";
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
import { useProject } from "../../../../context/ProjectContext";
import Sidebar from "../../../../components/Sidebar";
import { useAuth } from "../../../../context/authcontext";
// Iconografía UI
import editIcon from "../../../../assets/iconos/edit.png";
import deleteIcon from "../../../../assets/iconos/delete.png";
import checkIcon from "../../../../assets/iconos/check.png";
import closeIcon from "../../../../assets/iconos/close.png";
import ConfirmModal from "../../../../components/ConfirmModal";
import "./ActividadesList.css";

const ActividadesList = () => {
  // --- Estados UI / control ---
  const [leyendaVisible, setLeyendaVisible] = useState({});
  const [actividades, setActividades] = useState([]);
  const [nuevaActividad, setNuevaActividad] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [editandoId, setEditandoId] = useState(null);
  const [editDatos, setEditDatos] = useState({});

  const [subtareaInput, setSubtareaInput] = useState({});
  const [editandoSubtarea, setEditandoSubtarea] = useState({});
  const [nuevoNombreSubtarea, setNuevoNombreSubtarea] = useState({});

  const [menuAbierto, setMenuAbierto] = useState(null);
  const [visibles, setVisibles] = useState({});
  const [loadingFull, setLoadingFull] = useState(true);
  const [contadores, setContadores] = useState({
    finalizado: 0,
    enProceso: 0,
    cancelado: 0,
  });

  const [modal, setModal] = useState({
    open: false,
    variant: "warning",
    title: "",
    message: "",
    confirmText: "Aceptar",
    cancelText: "Cancelar",
    showCancel: false,
    onConfirm: null,
  });
  const openModal = (data) => setModal((m) => ({ ...m, open: true, ...data }));
  const closeModal = () =>
    setModal((m) => ({ ...m, open: false, onConfirm: null }));

  // Helpers de fecha seguros para evitar "Invalid Date"
  const fmtFechaCorta = (s) => {
    if (!s) return "";
    // Forzamos medianoche local para evitar desfasajes por TZ
    const d = new Date(`${s}T00:00:00`);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  };

  // YYYY-MM-DD en HORA LOCAL (sin desfases por UTC)
  const hoyLocalYMD = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const estadoDesdeSubtareas = (subs = []) => {
    if (!Array.isArray(subs) || subs.length === 0) {
      return { estado: "enProceso", fechaFinalizado: null };
    }
    const todas = subs.every((s) => s.completado);
    return {
      estado: todas ? "finalizado" : "enProceso",
      fechaFinalizado: todas ? hoyLocalYMD() : null,
    };
  };

  // 🔔 Toast de éxito (como en PagosListView)
  const [showToast, setShowToast] = useState(false);
  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const { project } = useProject();
  const { userData } = useAuth(); // ← para tenantId
  const [projectId, setProjectId] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("project"));
    setProjectId(project?.id || stored?.id || null);
  }, [project?.id]);

  useEffect(() => {
    if (projectId && userData?.tenantId) {
      obtenerActividades(projectId, userData.tenantId, { full: true });
    }
  }, [projectId, userData?.tenantId]);

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
  const obtenerActividades = async (
    projectId,
    tenantId,
    { full = false } = {}
  ) => {
    if (!projectId || !tenantId) return;

    if (full) setLoadingFull(true); // solo muestra pantalla completa si lo pides
    try {
      const q = query(
        collection(db, "actividades"),
        where("projectId", "==", projectId),
        where("tenantId", "==", tenantId)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setActividades(items);
      contarEstados(items);
    } catch (error) {
      console.error("Error al cargar actividades:", error);
    } finally {
      if (full) setLoadingFull(false);
    }
  };

  /**
   * Crea una nueva actividad para el proyecto actual
   * Campos: nombre, subtareas[], estado, fechaInicio, fechaFin, proyectoId
   */
  const agregarActividad = async () => {
    if (!nuevaActividad.trim() || !projectId || !userData?.tenantId) return;

    // Validación: no permitir números en el nombre
    if (/\d/.test(nuevaActividad)) {
      alert("El nombre de la tarea no puede contener números.");
      return;
    }

    // Validación de fechas: fin >= inicio (si ambas existen)
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      alert("La fecha fin no puede ser menor que la fecha de inicio.");
      return;
    }

    await addDoc(collection(db, "actividades"), {
      nombre: nuevaActividad,
      subtareas: [],
      estado: "enProceso",
      fechaInicio: fechaInicio || "",
      fechaFin: fechaFin || "",
      projectId: projectId, // ← obligatorio por reglas
      tenantId: userData.tenantId, // ← obligatorio por reglas
    });

    // Limpia inputs y recarga
    setNuevaActividad("");
    setFechaInicio("");
    setFechaFin("");

    await obtenerActividades(projectId, userData?.tenantId, { full: false });

    triggerToast(); // 🔔
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
    // Validación defensiva: no permitir números al guardar
    if (/\d/.test(editDatos.nombre || "")) {
      alert("El nombre de la tarea no puede contener números.");
      return;
    }

    // Validación de fechas en edición: fin >= inicio (si ambas existen)
    if (
      editDatos.fechaInicio &&
      editDatos.fechaFin &&
      editDatos.fechaFin < editDatos.fechaInicio
    ) {
      alert("La fecha fin no puede ser menor que la fecha de inicio.");
      return;
    }

    const act = actividades.find((a) => a.id === editandoId);

    await updateDoc(doc(db, "actividades", editandoId), {
      nombre: editDatos.nombre,
      fechaInicio: editDatos.fechaInicio || "",
      fechaFin: editDatos.fechaFin || "",
      ...(act.estado === "finalizado" &&
        !act.fechaFinalizado && {
          fechaFinalizado: hoyLocalYMD(),
        }),
    });

    setEditandoId(null);

    await obtenerActividades(projectId, userData?.tenantId, { full: false });

    triggerToast(); // 🔔
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

    await updateDoc(doc(db, "actividades", id), {
      subtareas: nuevas,
      ...estadoDesdeSubtareas(nuevas), // ← esto limpia Finalizado si corresponde
    });
    setSubtareaInput({ ...subtareaInput, [id]: "" });
    setMenuAbierto(null); // si se usa un menú contextual

    await obtenerActividades(projectId, userData?.tenantId, { full: false });

    triggerToast(); // 🔔

    obtenerActividades(projectId, userData?.tenantId);
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

    await obtenerActividades(projectId, userData?.tenantId, { full: false });

    triggerToast(); // 🔔

    obtenerActividades(projectId, userData?.tenantId);
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
    if (!actividad) return;

    const nuevasSubtareas = [...(actividad.subtareas || [])];
    const actual = nuevasSubtareas[index];
    if (!actual) return;

    // Alternar estado y fecha
    actual.completado = !actual.completado;
    actual.fechaCompletado = actual.completado ? hoyLocalYMD() : null;

    await updateDoc(doc(db, "actividades", actividadId), {
      subtareas: nuevasSubtareas,
      ...estadoDesdeSubtareas(nuevasSubtareas),
    });

    // Recarga interna sin pantalla completa
    await obtenerActividades(projectId, userData?.tenantId, { full: false });

    triggerToast();
  };

  /**
   * Marca/desmarca TODAS las subtareas desde el checkbox principal
   * - Si se intenta marcar como completada la actividad, valida que no haya subtareas pendientes.
   */
  const toggleTodasSubtareas = async (actividadId, completar) => {
    const actividad = actividades.find((a) => a.id === actividadId);
    if (!actividad) return;

    const subs = Array.isArray(actividad.subtareas) ? actividad.subtareas : [];

    // ✅ SIN SUBTAREAS: alterna el estado de la actividad
    if (subs.length === 0) {
      const updateData = {
        estado: completar ? "finalizado" : "enProceso",
        fechaFinalizado: completar ? hoyLocalYMD() : null,
      };
      await updateDoc(doc(db, "actividades", actividadId), updateData);

      // Si quieres refrescar la lista/counters inmediatamente:
      obtenerActividades(projectId, userData?.tenantId);
      triggerToast();
      return;
    }

    // ✅ CON SUBTAREAS: si se intenta completar todas, valida
    if (completar) {
      const hayIncompletas = subs.some((s) => !s.completado);
      if (hayIncompletas) {
        openModal({
          variant: "warning",
          title: "No se puede completar",
          message:
            "No puedes marcar la tarea como completada si hay subtareas pendientes.",
          confirmText: "Entendido",
          showCancel: false,
        });
        return;
      }
    }

    const nuevasSubtareas = subs.map((sub) => ({
      ...sub,
      completado: completar,
      fechaCompletado: completar ? hoyLocalYMD() : null,
    }));

    await updateDoc(doc(db, "actividades", actividadId), {
      subtareas: nuevasSubtareas,
      ...(completar
        ? { estado: "finalizado", fechaFinalizado: hoyLocalYMD() }
        : { estado: "enProceso", fechaFinalizado: null }),
    });

    // Refresca y toast como ya haces en otros lados
    obtenerActividades(projectId, userData?.tenantId);
    triggerToast();
  };

  /** Elimina una subtarea por índice */
  const eliminarSubtarea = async (actividadId, index) => {
    const actividad = actividades.find((a) => a.id === actividadId);
    const sub = actividad?.subtareas?.[index];

    openModal({
      variant: "error",
      title: "Eliminar subtarea",
      message: `¿Eliminar la subtarea${
        sub?.nombre ? ` “${sub.nombre}”` : ""
      }? Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      showCancel: true,
      onConfirm: async () => {
        const nuevas = Array.isArray(actividad.subtareas)
          ? [...actividad.subtareas]
          : [];
        nuevas.splice(index, 1);

        await updateDoc(doc(db, "actividades", actividadId), {
          subtareas: nuevas,
          ...estadoDesdeSubtareas(nuevas), // mantiene estado/fecha de la tarjeta
        });

        await obtenerActividades(projectId, userData?.tenantId, {
          full: false,
        });

        triggerToast();
      },
    });
  };

  /** Elimina una actividad completa */
  const eliminarActividad = async (id) => {
    openModal({
      variant: "error",
      title: "Eliminar actividad",
      message: "Esta acción no se puede deshacer. ¿Eliminar definitivamente?",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      showCancel: true,
      onConfirm: async () => {
        await deleteDoc(doc(db, "actividades", id));
        await obtenerActividades(projectId, userData?.tenantId, {
          full: false,
        });

        triggerToast();
      },
    });
  };

  /**
   * Cicla por el estado de la actividad:
   * enProceso → finalizado → cancelado → enProceso ...
   * - Si pasa a "finalizado" y no hay fechaFinalizado, la setea a hoy.
   * - Si sale de "finalizado", limpia la fechaFinalizado.
   */
  // Reemplaza COMPLETO este bloque
  const cambiarEstadoCiclo = async (actividad) => {
    const estados = ["enProceso", "finalizado", "cancelado"];
    const index = estados.indexOf(actividad.estado);
    let nuevoEstado = estados[(index + 1) % estados.length];

    // Si se intenta pasar a "finalizado", valida subtareas (solo si existen)
    if (nuevoEstado === "finalizado") {
      const tieneSubtareas =
        Array.isArray(actividad.subtareas) && actividad.subtareas.length > 0;
      const hayIncompletas =
        tieneSubtareas && actividad.subtareas.some((s) => !s.completado);

      if (hayIncompletas) {
        openModal({
          variant: "warning",
          title: "Subtareas pendientes",
          message:
            "Hay subtareas sin completar. ¿Deseas marcar la actividad como CANCELADA?",
          confirmText: "Sí, cancelar",
          cancelText: "Mantener en proceso",
          showCancel: true,
          onConfirm: async () => {
            await updateDoc(doc(db, "actividades", actividad.id), {
              estado: "cancelado",
              fechaFinalizado: null,
            });
            await obtenerActividades(projectId, userData?.tenantId, {
              full: false,
            });

            triggerToast();
          },
        });
        return; // 👍 detenemos aquí; el onConfirm hace el trabajo
      }
    }

    const updateData = { estado: nuevoEstado };
    if (nuevoEstado === "finalizado") {
      updateData.fechaFinalizado = hoyLocalYMD();
    } else {
      updateData.fechaFinalizado = null;
    }

    await updateDoc(doc(db, "actividades", actividad.id), updateData);

    // 🔁 Refresca para ver el cambio y actualizar contadores
    await obtenerActividades(projectId, userData?.tenantId);
    triggerToast();
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

  if (loadingFull) {
    return (
      <div className="pantalla-carga">
        <div className="wave-loader">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
        <p className="texto-cargando">Cargando actividades...</p>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar />

      <div className="contenido">
        <h2 className="titulo">Gestión de Tareas</h2>

        {/* Leyenda con contadores por estado */}
        <div className="estado-leyenda">
          <span>
            <span className="estado verde" /> Finalizado:{" "}
            {contadores.finalizado}
          </span>
          <span>
            <span className="estado amarillo" /> En Proceso:{" "}
            {contadores.enProceso}
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
            onChange={(e) =>
              // Elimina cualquier número al escribir o pegar
              setNuevaActividad(e.target.value.replace(/\d/g, ""))
            }
            onKeyDown={(e) => {
              if (/\d/.test(e.key)) e.preventDefault(); // bloquea números
            }}
            onPaste={(e) => {
              e.preventDefault();
              const texto = (e.clipboardData || window.clipboardData).getData(
                "text"
              );
              setNuevaActividad((prev) => prev + texto.replace(/\d/g, ""));
            }}
          />

          <div className="fechas-form">
            <label className="label-fecha">
              <span>Fecha inicio</span>
              <input
                type="date"
                value={fechaInicio}
                // Si ya hay fechaFin y el usuario cambia inicio a una fecha mayor, mantenemos coherencia
                onChange={(e) => {
                  const v = e.target.value;
                  setFechaInicio(v);
                  if (fechaFin && v && fechaFin < v) {
                    setFechaFin(v);
                  }
                }}
                max={fechaFin || undefined}
              />
            </label>

            <label className="label-fecha">
              <span>Fecha fin aproximada</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                min={fechaInicio || undefined}
              />
            </label>
          </div>

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
                <div
                  className={`tarjeta-tarea fade-in ${
                    act.estado === "finalizado" ? "tarea-completada" : ""
                  }`}
                  onClick={() => toggleVisibilidad(act.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    toggleVisibilidad(act.id)
                  }
                >
                  <div className="info-tarea">
                    {/* Checkbox maestro: marca todas si ya están completas (validado) */}
                    <input
                      type="checkbox"
                      checked={
                        act.subtareas?.length === 0
                          ? act.estado === "finalizado"
                          : todasCompletadas(act.subtareas)
                      }
                      onChange={() =>
                        toggleTodasSubtareas(
                          act.id,
                          act.subtareas?.length === 0
                            ? !(act.estado === "finalizado") // si no hay subtareas, alterna el estado finalizado
                            : !todasCompletadas(act.subtareas)
                        )
                      }
                    />

                    {/* Título clickable: expande/colapsa subtareas */}
                    <div style={{ flex: 1 }}>
                      <strong
                        className={
                          act.estado === "finalizado" ? "titulo-tachado" : ""
                        }
                      >
                        {act.nombre}
                      </strong>
                    </div>

                    {/* Fechas y botón de estado */}
                    <div className="fecha-estado-wrapper">
                      {act.fechaInicio || act.fechaFin ? (
                        <div className={`fecha-pill ${act.estado}`}>
                          {fmtFechaCorta(act.fechaInicio) || "—"} —{" "}
                          {fmtFechaCorta(act.fechaFin) || "—"}
                        </div>
                      ) : (
                        <div className={`fecha-pill ${act.estado}`}>
                          Sin fechas
                        </div>
                      )}

                      {act.fechaFinalizado && (
                        <div className="fecha-pill finalizado">
                          Finalizado: {fmtFechaCorta(act.fechaFinalizado)}
                        </div>
                      )}
                      <button
                        className="btn-estado"
                        onClick={(e) => {
                          e.stopPropagation();
                          cambiarEstadoCiclo(act);
                        }}
                        style={{ backgroundColor: colorEstado(act.estado) }}
                        aria-label={`Cambiar estado (${act.estado})`}
                      />
                    </div>
                  </div>

                  {/* Botón de leyenda de colores (⋯) */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLeyenda(act.id);
                      }}
                      className="btn-tres-puntos"
                    >
                      ⋯
                    </button>

                    {leyendaVisible[act.id] && (
                      <div
                        className="leyenda-colores"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                    <div
                      className="form-editar-tarea"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editDatos.nombre}
                        onChange={(e) =>
                          setEditDatos({
                            ...editDatos,
                            // elimina números mientras escribe
                            nombre: e.target.value.replace(/\d/g, ""),
                          })
                        }
                        onKeyDown={(e) => {
                          if (/\d/.test(e.key)) e.preventDefault(); // bloquea números
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const texto = (
                            e.clipboardData || window.clipboardData
                          ).getData("text");
                          // Inserta el texto pegado sin dígitos en la posición del cursor
                          const target = e.target;
                          const start = target.selectionStart ?? 0;
                          const end = target.selectionEnd ?? 0;
                          const limpio = texto.replace(/\d/g, "");
                          const nuevoValor =
                            target.value.slice(0, start) +
                            limpio +
                            target.value.slice(end);
                          setEditDatos({ ...editDatos, nombre: nuevoValor });
                        }}
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            guardarEdicion();
                          }}
                        >
                          <img src={checkIcon} alt="guardar" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelarEdicion();
                          }}
                        >
                          <img src={closeIcon} alt="cancelar" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Área para agregar subtareas cuando está expandida */}
                  {visibles[act.id] && (
                    <div
                      className="agregar-subtarea"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          agregarSubtarea(act.id);
                        }}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {/* Acciones de actividad (fuera de la tarjeta) */}
                <div
                  className="acciones-tarea-principal acciones-abajo"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="btn-accion edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditActividad(act);
                    }}
                  >
                    <img src={editIcon} alt="editar" />
                  </button>
                  <button
                    className="btn-accion delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarActividad(act.id);
                    }}
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
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="contenido-subtarea">
                          <input
                            type="checkbox"
                            className="checkbox-subtarea"
                            checked={sub.completado}
                            onClick={(e) => e.stopPropagation()}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  guardarEdicionSubtarea(
                                    act.id,
                                    idx,
                                    nuevoNombreSubtarea[act.id]
                                  );
                                }}
                              >
                                <img src={checkIcon} alt="guardar" />
                              </button>

                              <button
                               onClick={(e) => { e.stopPropagation(); cancelarEdicionSubtarea(act.id);}}
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

      <ConfirmModal
        open={modal.open}
        variant={modal.variant}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        showCancel={modal.showCancel}
        onConfirm={modal.onConfirm}
        onClose={closeModal}
      />

      {/* 🔔 Toast de éxito (reusa estilos de PagosListView si los tienes) */}
      {showToast && (
        <div className="toast-exito-pago">✅ Acción realizada con éxito</div>
      )}
    </div>
  );
};

export default ActividadesList;
