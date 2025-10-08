import React, { useState, useEffect } from "react";
import { useProject } from "../../../../context/ProjectContext";
import editarIcono from "../../../../assets/iconos/edit.png";
import eliminarIcono from "../../../../assets/iconos/delete.png";
import checkIcon from "../../../../assets/iconos/check.png";
import closeIcon from "../../../../assets/iconos/close.png";
import {
  updateProject,
  deleteProject,
} from "../../../../services/projectsService";
import "../../proyectos/ui/DetalleProyecto.css";
import { useNavigate } from "react-router-dom";
import PantallaCarga from "../../../../components/PantallaCarga"; // ✅ Componente de carga

const DetalleProyectoView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // 🔄 Estado de pantalla de carga

  const { project, setProject } = useProject(); // Contexto del proyecto seleccionado
  const [modoEdicion, setModoEdicion] = useState(false); // Alterna entre ver/editar
  const [preview, setPreview] = useState(project?.imagen || null); // Vista previa de la imagen
  const [nuevaImagen, setNuevaImagen] = useState(null); // Archivo de nueva imagen
  const [mostrarModalImagen, setMostrarModalImagen] = useState(false); // Modal para ampliar imagen
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // 🌐 Estado de conexión

  // 👉 Estado de errores por campo
  const [errores, setErrores] = useState({});

  // Estado local editable del proyecto (inicializado con los datos del contexto)
  const [datosEditables, setDatosEditables] = useState(() => ({
    ...project,
    nombre: project?.nombre || "",
    cliente: project?.cliente || "",
    descripcion: project?.descripcion || "",
    presupuesto: project?.presupuesto ?? "",
    moneda: project?.moneda || "CORD", // ✅ nueva propiedad
    estado: project?.estado || "En progreso",
    fechaInicio: formatFechaParaInput(project?.fechaInicio),
    fechaFin: formatFechaParaInput(project?.fechaFin),
    imagen: project?.imagen || null,
  }));

  /**
   * ⏳ Efecto inicial
   * - Maneja eventos online/offline
   * - Simula una pantalla de carga (300 ms)
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineChanges(); // cuando vuelve internet, intenta sincronizar
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    const timeout = setTimeout(() => setLoading(false), 300);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearTimeout(timeout);
    };
  }, []);

  // ✅ Toast de éxito para proyectos
  const [dpvToastMsg, setDpvToastMsg] = useState("");
  const [dpvShowToast, setDpvShowToast] = useState(false);

  const dpvShowSuccessToast = (msg = "✅ Proyecto actualizado con éxito") => {
    setDpvToastMsg(msg);
    setDpvShowToast(true);
    // Oculta automáticamente a los 3s
    setTimeout(() => setDpvShowToast(false), 3000);
  };

  /** 📅 Convierte fechas (Firestore o string) al formato válido para inputs <date> */
  function formatFechaParaInput(fecha) {
    try {
      if (!fecha) return "";
      if (fecha?.toDate) fecha = fecha.toDate(); // Firestore Timestamp
      else if (typeof fecha === "string") fecha = new Date(fecha);
      if (isNaN(fecha.getTime())) return "";
      // Ajuste para evitar desfaces de zona horaria
      const iso = new Date(
        Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
      )
        .toISOString()
        .slice(0, 10);
      return iso;
    } catch {
      return "";
    }
  }

  /** 🧠 Helpers de validación */
  const esNumeroPositivo = (v) => !isNaN(v) && Number(v) > 0;
  const normaliza = (v) => (typeof v === "string" ? v.trim() : v);

  const validaCampo = (name, value, contexto = {}) => {
    const v = normaliza(value);
    switch (name) {
      case "nombre":
        if (!v) return "El nombre es obligatorio";
        if (v.length < 3) return "El nombre debe tener al menos 3 caracteres";
        if (v.length > 80) return "El nombre no debe exceder 80 caracteres";
        return "";
      case "cliente":
        if (!v) return "El cliente es obligatorio";
        if (v.length < 3) return "El cliente debe tener al menos 3 caracteres";
        if (v.length > 80) return "El cliente no debe exceder 80 caracteres";
        return "";
      case "descripcion":
        if (v && v.length > 1000)
          return "La descripción no debe exceder 1000 caracteres";
        return "";
      case "presupuesto":
        if (v === "" || v === null) return "El presupuesto es obligatorio";
        if (!esNumeroPositivo(v))
          return "El presupuesto debe ser un número mayor a 0";
        if (Number(v) > 999999999999)
          return "El presupuesto es demasiado grande";
        return "";
      case "fechaInicio": {
        if (v && isNaN(new Date(`${v}T00:00:00`).getTime()))
          return "Fecha de inicio inválida";
        const { fechaFin } = contexto;
        if (v && fechaFin) {
          const ini = new Date(`${v}T00:00:00`);
          const fin = new Date(`${fechaFin}T00:00:00`);
          if (ini > fin)
            return "La fecha de inicio no puede ser posterior a la fecha fin";
        }
        return "";
      }
      case "fechaFin": {
        if (v && isNaN(new Date(`${v}T00:00:00`).getTime()))
          return "Fecha fin inválida";
        const { fechaInicio } = contexto;
        if (v && fechaInicio) {
          const ini = new Date(`${fechaInicio}T00:00:00`);
          const fin = new Date(`${v}T00:00:00`);
          if (fin < ini)
            return "La fecha fin no puede ser anterior a la fecha de inicio";
        }
        return "";
      }
      case "estado": {
        const permitidos = ["En progreso", "Finalizado", "Cancelado"];
        if (!permitidos.includes(v)) return "Estado inválido";
        return "";
      }
      case "imagen": {
        // Validación se hace en change del input:file, aquí solo placeholder
        return "";
      }

      case "moneda": {
        const permitidas = ["CORD", "USD", "EUR"];
        if (!permitidas.includes(v)) return "Moneda inválida";
        return "";
      }

      default:
        return "";
    }
  };

  const validaFormulario = (data) => {
    const nuevosErrores = {};
    nuevosErrores.nombre = validaCampo("nombre", data.nombre);
    nuevosErrores.cliente = validaCampo("cliente", data.cliente);
    nuevosErrores.descripcion = validaCampo("descripcion", data.descripcion);
    nuevosErrores.presupuesto = validaCampo("presupuesto", data.presupuesto);
    nuevosErrores.fechaInicio = validaCampo("fechaInicio", data.fechaInicio, {
      fechaFin: data.fechaFin,
    });
    nuevosErrores.fechaFin = validaCampo("fechaFin", data.fechaFin, {
      fechaInicio: data.fechaInicio,
    });
    nuevosErrores.estado = validaCampo("estado", data.estado);
    nuevosErrores.moneda = validaCampo("moneda", data.moneda);

    // Limpia mensajes vacíos
    Object.keys(nuevosErrores).forEach((k) => {
      if (!nuevosErrores[k]) delete nuevosErrores[k];
    });
    return nuevosErrores;
  };

  /** ✏ Guardar/editar proyecto */
  const handleEditar = async () => {
    if (modoEdicion) {
      // ➜ Estamos intentando GUARDAR
      const formErrors = validaFormulario(datosEditables);
      setErrores(formErrors);
      if (Object.keys(formErrors).length > 0) {
        alert("Revisá los campos marcados antes de guardar.");
        return;
      }

      try {
        // Validación de fechas (formato ya validado por campo)
        const fechaInicioValida = datosEditables.fechaInicio
          ? new Date(`${datosEditables.fechaInicio}T00:00:00`)
          : null;
        const fechaFinValida = datosEditables.fechaFin
          ? new Date(`${datosEditables.fechaFin}T00:00:00`)
          : null;

        // Imagen en base64 (si hay nueva subida)
        let base64Imagen = datosEditables.imagen;
        if (nuevaImagen) {
          base64Imagen = await convertirImagenABase64(nuevaImagen);
        }

        // Construcción de objeto actualizado
        const datosActualizados = {
          ...datosEditables,
          nombre: datosEditables.nombre.trim(),
          cliente: datosEditables.cliente.trim(),
          descripcion: datosEditables.descripcion?.trim() || "",
          presupuesto: Number(datosEditables.presupuesto),
          moneda: datosEditables.moneda, // ✅ se guarda la moneda
          fechaInicio: fechaInicioValida,
          fechaFin: fechaFinValida,
          imagen: base64Imagen,
        };

        if (isOffline) {
          // Guardar cambios en localStorage si no hay conexión
          localStorage.setItem(
            "offlineProjectUpdates",
            JSON.stringify({ id: project.id, data: datosActualizados })
          );
          alert("Estás offline. Los cambios se guardaron localmente.");
          setProject({ ...project, ...datosActualizados }); // refleja cambios en UI
          dpvShowSuccessToast("✅ Cambios guardados localmente (offline)");
        } else {
          // Guardar directamente en Firestore
          await updateProject(project.id, datosActualizados);
          setProject({ ...project, ...datosActualizados });
          dpvShowSuccessToast("✅ Proyecto actualizado con éxito");
        }
      } catch (error) {
        console.error("Error al actualizar el proyecto:", error);
        alert("Ocurrió un error al actualizar.");
        return; // no salir del modo edición si falló
      }
    }

    // Cambia modo (edición ↔ vista)
    setModoEdicion(!modoEdicion);
  };

  /** 📷 Convierte imagen a base64 */
  const convertirImagenABase64 = (archivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(archivo);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  /**
   * 🗑 Eliminar proyecto
   * - Si no hay conexión, se guarda la eliminación en localStorage
   */
  const handleEliminar = async () => {
    if (window.confirm("¿Deseás eliminar este proyecto?")) {
      if (isOffline) {
        localStorage.setItem("offlineProjectDeletion", project.id);
        alert("Estás offline. Se eliminará cuando vuelvas a conectarte.");
      } else {
        await deleteProject(project.id);
        alert("Proyecto eliminado.");
        navigate("/proyecto");
      }
    }
  };

  /** 🔄 Actualizar campos editables del form */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosEditables((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /** Validación por campo al salir del input */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const msg = validaCampo(name, value, {
      fechaInicio: name === "fechaFin" ? datosEditables.fechaInicio : undefined,
      fechaFin: name === "fechaInicio" ? datosEditables.fechaFin : undefined,
    });
    setErrores((prev) => {
      const next = { ...prev };
      if (msg) next[name] = msg;
      else delete next[name];
      return next;
    });
  };

  /** 🖼 Cargar nueva imagen desde input:file (valida tipo y tamaño) */
  const handleImagenChange = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // Validaciones: tipo y tamaño (2 MB)
    if (!archivo.type.startsWith("image/")) {
      setErrores((prev) => ({
        ...prev,
        imagen: "El archivo debe ser una imagen",
      }));
      return;
    }
    const MAX_MB = 2;
    if (archivo.size > MAX_MB * 1024 * 1024) {
      setErrores((prev) => ({
        ...prev,
        imagen: `La imagen no debe exceder ${MAX_MB} MB`,
      }));
      return;
    }

    setErrores((prev) => {
      const n = { ...prev };
      delete n.imagen;
      return n;
    });
    setNuevaImagen(archivo);
    setPreview(URL.createObjectURL(archivo)); // Vista previa
  };

  /**
   * 🔁 Sincroniza cambios almacenados en localStorage cuando vuelve internet
   */
  const syncOfflineChanges = () => {
    const offlineUpdates = localStorage.getItem("offlineProjectUpdates");
    if (offlineUpdates) {
      const { id, data } = JSON.parse(offlineUpdates);
      updateProject(id, data)
        .then(() => {
          localStorage.removeItem("offlineProjectUpdates");
          setProject({ ...project, ...data });
          alert("Proyecto actualizado correctamente.");
        })
        .catch((error) =>
          console.error("Error al sincronizar cambios:", error)
        );
    }

    const offlineDeletion = localStorage.getItem("offlineProjectDeletion");
    if (offlineDeletion) {
      deleteProject(offlineDeletion)
        .then(() => {
          localStorage.removeItem("offlineProjectDeletion");
          alert("Proyecto eliminado correctamente.");
          navigate("/proyecto");
        })
        .catch((error) =>
          console.error("Error al sincronizar eliminación:", error)
        );
    }
  };

  // ➕ Helper: genera el estado editable desde el proyecto actual
  const snapshotDesdeProyecto = (p) => ({
    ...p,
    nombre: p?.nombre || "",
    cliente: p?.cliente || "",
    descripcion: p?.descripcion || "",
    presupuesto: p?.presupuesto ?? "",
    estado: p?.estado || "En progreso",
    fechaInicio: formatFechaParaInput(p?.fechaInicio),
    fechaFin: formatFechaParaInput(p?.fechaFin),
    imagen: p?.imagen || null,
  });

  const handleCancelarEdicion = () => {
    // Restaura estado editable desde el proyecto del contexto
    const snapshot = snapshotDesdeProyecto(project);
    setDatosEditables(snapshot);
    setErrores({});
    setPreview(project?.imagen || null);
    setNuevaImagen(null);
    setModoEdicion(false);
  };

  useEffect(() => {
    if (!modoEdicion) return;
    const onEsc = (e) => {
      if (e.key === "Escape") handleCancelarEdicion();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [modoEdicion, project]);

  // 🌀 Mostrar pantalla de carga si no hay proyecto o aún cargando
  if (loading || !project || Object.keys(project).length === 0) {
    return <PantallaCarga mensaje="Cargando proyecto..." />;
  }

  // 🔹 Añade esto dentro de tu componente, antes del return
  const CONVERSION_RATES = {
    USD: 37, // 1 USD ≈ 37 Córdobas
    EUR: 43, // 1 EUR ≈ 43 Córdobas
    CORD: 1, // 1 Córdobas = 1 Córdobas
  };

  // Formatea número con 2 decimales y agrega moneda
  const formatCurrency = (value, currency) => {
    if (value === null || value === undefined || isNaN(value))
      return `0.00 ${currency}`;
    return (
      Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + ` ${currency}`
    );
  };

  // Convierte cualquier moneda a cualquier otra usando CONVERSION_RATES
  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (!amount || isNaN(amount)) return 0;
    const amountInCord = Number(amount) * (CONVERSION_RATES[fromCurrency] ?? 1); // pasa a Córdobas primero
    const rateToTarget = CONVERSION_RATES[toCurrency] ?? 1;
    return amountInCord / rateToTarget;
  };

  return (
    <div className="dpv-wrapper">
      <div className="dpv-card">
        {/* 🛠 Barra de acciones: editar/guardar y eliminar */}
        <div className="dpv-header">
          {/* Guardar / Editar */}
          <button
            type="button"
            className="dpv-btn-icon"
            onClick={handleEditar}
            title={modoEdicion ? "Guardar cambios" : "Editar proyecto"}
            aria-label={modoEdicion ? "Guardar cambios" : "Editar proyecto"}
          >
            <img src={modoEdicion ? checkIcon : editarIcono} alt="" />
          </button>

          {/* Cancelar (solo visible en edición) */}
          {modoEdicion && (
            <button
              type="button"
              className="dpv-btn-icon dpv-btn-cancelar"
              onClick={handleCancelarEdicion}
              title="Cancelar edición"
              aria-label="Cancelar edición"
            >
              <img src={closeIcon} alt="" />
            </button>
          )}

          {/* Eliminar */}
          <button
            type="button"
            className="dpv-btn-icon dpv-btn-eliminar"
            onClick={handleEliminar}
            title="Eliminar proyecto"
            aria-label="Eliminar proyecto"
          >
            <img src={eliminarIcono} alt="" />
          </button>
        </div>

        {/* Imagen del proyecto (con opción de ampliarla en modal) */}
        {preview && (
          <>
            <img
              src={preview}
              alt="Vista previa"
              className="dpv-imagen"
              onClick={() => setMostrarModalImagen(true)}
            />
            {errores.imagen && <p className="dpv-error">{errores.imagen}</p>}
          </>
        )}

        {/* Si está en modo edición → inputs con validación */}
        {modoEdicion ? (
          <>
            <input
              name="nombre"
              value={datosEditables.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`dpv-input ${errores.nombre ? "dpv-input-error" : ""}`}
              placeholder="Nombre del proyecto"
              maxLength={80}
            />
            {errores.nombre && <p className="dpv-error">{errores.nombre}</p>}

            <input
              name="cliente"
              value={datosEditables.cliente}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`dpv-input ${
                errores.cliente ? "dpv-input-error" : ""
              }`}
              placeholder="Cliente"
              maxLength={80}
            />
            {errores.cliente && <p className="dpv-error">{errores.cliente}</p>}

            <textarea
              name="descripcion"
              value={datosEditables.descripcion}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`dpv-textarea ${
                errores.descripcion ? "dpv-input-error" : ""
              }`}
              placeholder="Descripción"
              maxLength={1000}
            />
            {errores.descripcion && (
              <p className="dpv-error">{errores.descripcion}</p>
            )}

            <div className="dpv-presupuesto-moneda">
  <input
    name="presupuesto"
    type="number"
    value={datosEditables.presupuesto}
    onChange={handleChange}
    onBlur={handleBlur}
    className={`dpv-input ${errores.presupuesto ? "dpv-input-error" : ""}`}
    placeholder="Presupuesto"
    step="0.01"
    min="0"
    onKeyDown={(e) => {
      if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
    }}
  />

  <div className="dpv-moneda">
    <select
      name="moneda"
      value={datosEditables.moneda}
      onChange={handleChange}
      onBlur={handleBlur}
    >
      <option value="CORD">Córdobas (C$)</option>
      <option value="USD">Dólar (USD)</option>
      <option value="EUR">Euro (EUR)</option>
    </select>
  </div>
</div>

{/* Mensajes de error separados */}
{errores.presupuesto && <p className="dpv-error">{errores.presupuesto}</p>}
{errores.moneda && <p className="dpv-error">{errores.moneda}</p>}


            <div className="dpv-fechas-estado">
              <div className="dpv-fecha-item">
                <label>Fecha inicio :</label>
                <input
                  type="date"
                  name="fechaInicio"
                  value={datosEditables.fechaInicio || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errores.fechaInicio ? "dpv-input-error" : ""}
                />
                {errores.fechaInicio && (
                  <p className="dpv-error">{errores.fechaInicio}</p>
                )}
              </div>
              <div className="dpv-fecha-item">
                <label>Fecha fin :</label>
                <input
                  type="date"
                  name="fechaFin"
                  value={datosEditables.fechaFin || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errores.fechaFin ? "dpv-input-error" : ""}
                />
                {errores.fechaFin && (
                  <p className="dpv-error">{errores.fechaFin}</p>
                )}
              </div>
            </div>

            <div className="dpv-estado">
              {["En progreso", "Finalizado", "Cancelado"].map((estado) => (
                <label key={estado}>
                  <input
                    type="radio"
                    name="estado"
                    value={estado}
                    checked={datosEditables.estado === estado}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {estado}
                </label>
              ))}
              {errores.estado && <p className="dpv-error">{errores.estado}</p>}
            </div>

            <div className="dpv-archivo">
              <label className="dpv-file-label">
                Cambiar imagen:
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                />
              </label>
            </div>
          </>
        ) : (
          // Si está en modo vista → solo muestra los datos
          <>
            <h2 className="dpv-nombre">{project?.nombre}</h2>
            <p className="dpv-cliente">Cliente : {project?.cliente}</p>
            <div className="dpv-descripcion">{project?.descripcion}</div>
            <div className="dpv-presupuesto">
              Presupuesto base:{" "}
              {formatCurrency(
                datosEditables.presupuesto,
                datosEditables.moneda
              )}
              <div className="dpv-conversiones">
                {["USD", "EUR", "CORD"].map((moneda) => {
                  if (moneda === datosEditables.moneda) return null;
                  return (
                    <div key={moneda}>
                      ≈{" "}
                      {formatCurrency(
                        convertCurrency(
                          datosEditables.presupuesto,
                          datosEditables.moneda,
                          moneda
                        ),
                        moneda
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="dpv-fechas-estado">
              <div className="dpv-fecha-item">
                <label>Fecha inicio :</label>
                <input
                  type="text"
                  readOnly
                  value={formatFechaParaInput(project?.fechaInicio)}
                />
              </div>
              <div className="dpv-fecha-item">
                <label>Fecha fin :</label>
                <input
                  type="text"
                  readOnly
                  value={formatFechaParaInput(project?.fechaFin)}
                />
              </div>
            </div>

            <div className="dpv-estado">
              {["En progreso", "Finalizado", "Cancelado"].map((estado) => (
                <span
                  key={estado}
                  className={project?.estado === estado ? "dpv-activo" : ""}
                >
                  {estado}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal para ampliar la imagen */}
      {mostrarModalImagen && (
        <div
          className="modal-imagen-overlay"
          onClick={() => setMostrarModalImagen(false)}
        >
          <img src={preview} alt="Vista ampliada" className="modal-imagen" />
        </div>
      )}

      {dpvShowToast && (
        <div className="dpv-toast-exito" role="status" aria-live="polite">
          {dpvToastMsg}
        </div>
      )}
    </div>
  );
};

export default DetalleProyectoView;
