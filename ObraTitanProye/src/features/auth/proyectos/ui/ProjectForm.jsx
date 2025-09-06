import React, { useState, useEffect } from "react";
import "../../ProveedoresCss/CrearProyecto.css";
import { createProject } from "../../services/projectsService";
import { useNavigate } from "react-router-dom";

const ProjectForm = () => {
  // =========================
  // 📌 Estado del formulario
  // =========================
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cliente, setCliente] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [estado, setEstado] = useState("En progreso");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [imagen, setImagen] = useState(null);     // Archivo original
  const [preview, setPreview] = useState(null);   // URL de vista previa
  const [errores, setErrores] = useState({});     // Errores de validación
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // 🌐 Estado de conexión

  const navigate = useNavigate();

  // ==========================================================
  // 🌐 Detección de conexión y sincronización offline → online
  // ==========================================================
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineProjects(); // 🔁 Intenta sincronizar lo guardado localmente
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Estado inicial conforme al navegador
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ==========================================
  // ✅ Validación de campos del formulario
  // ==========================================
  const validar = () => {
    const nuevosErrores = {};
    const regexPresupuesto = /^\d+(\.\d{1,2})?$/; // números positivos con hasta 2 decimales

    if (!nombre.trim()) nuevosErrores.nombre = "Campo requerido";
    if (!descripcion.trim()) nuevosErrores.descripcion = "Campo requerido";
    if (!cliente.trim()) nuevosErrores.cliente = "Campo requerido";

    if (!presupuesto.trim()) {
      nuevosErrores.presupuesto = "Campo requerido";
    } else if (!regexPresupuesto.test(presupuesto)) {
      nuevosErrores.presupuesto = "Debe ser un número positivo válido";
    } else if (parseFloat(presupuesto) < 0) {
      nuevosErrores.presupuesto = "No puede ser negativo";
    }

    if (!fechaInicio) nuevosErrores.fechaInicio = "Seleccione una fecha";
    if (!fechaFin) nuevosErrores.fechaFin = "Seleccione una fecha";

    // 🗓️ Validación del orden cronológico
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      if (inicio > fin) {
        nuevosErrores.fechaFin = "La fecha fin debe ser mayor que la fecha de inicio";
      }
    }

    return nuevosErrores;
  };

  // ==========================================
  // 🖼️ Manejo de carga de imagen y preview
  // ==========================================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      setPreview(URL.createObjectURL(file)); // URL temporal para previsualizar
    }
  };

  // ==========================================
  // 🗜️ Compresión de imagen en el navegador
  // - Redimensiona si excede maxWidth/Height
  // - Exporta como JPEG con 'quality'
  // ==========================================
  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.6) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Mantiene proporción y ajusta a límites
          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width *= scale;
            height *= scale;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Exporta a DataURL base64
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // ==========================================
  // 📤 Envío del formulario
  // - Valida
  // - Comprime imagen (si hay)
  // - Verifica tamaño final (~1MB)
  // - Crea proyecto (online) o guarda en localStorage (offline)
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    const nuevosErrores = validar();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      let base64Image = null;

      if (imagen) {
        base64Image = await compressImage(imagen);

        // ⚖️ Estimar tamaño real del base64 (sin encabezado data:)
        // Nota: la estimación base64Length = (longitud * 3 / 4) es aproximada
        const base64Body = base64Image.split(",")[1] || "";
        const base64Length = base64Body.length * (3 / 4);

        // Límite de 1MB (1,048,576 bytes)
        if (base64Length > 1048576) {
          alert("La imagen sigue siendo muy grande después de la compresión. Intente con otra imagen más liviana.");
          return;
        }
      }

      // 🧱 Payload para la creación
      const projectData = {
        nombre,
        descripcion,
        cliente,
        presupuesto: Number(presupuesto),
        estado,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        imagen: base64Image, // base64 | null
      };

      if (isOffline) {
        // 💾 Persistencia local si no hay internet
        localStorage.setItem("offlineProject", JSON.stringify(projectData));
        alert("Estás offline. El proyecto se guardará localmente y se sincronizará cuando vuelva la conexión.");
      } else {
        // ☁️ Crear en backend/Firestore (según tu servicio)
        await createProject(projectData);
        navigate("/proyecto"); // Redirección a la vista de proyectos
      }
    } catch (error) {
      console.error("Error al crear proyecto:", error);
    }
  };

  // ======================================================
  // 🔁 Sincronizar proyecto guardado localmente al volver
  //    la conexión. Si sube con éxito, limpia el local.
  // ======================================================
  const syncOfflineProjects = () => {
    const offlineProject = localStorage.getItem("offlineProject");
    if (offlineProject) {
      const projectData = JSON.parse(offlineProject);
      createProject(projectData)
        .then(() => {
          localStorage.removeItem("offlineProject");
        })
        .catch((error) => {
          console.error("Error al sincronizar proyecto:", error);
        });
    }
  };

  // ==========================
  // 🧩 Render del formulario
  // ==========================
  return (
    <div className="crear-proyecto-container">
      {/* Encabezado con acción primaria */}
      <div className="header-proyecto">
        <h2 className="titulo-crear">Crear Proyecto</h2>
        {/* Botón de acción rápida que dispara el submit */}
        <button type="submit" className="btn-agregar-proyecto" onClick={handleSubmit}>
          Agregar
        </button>
      </div>

      <form className="formulario-proyecto" onSubmit={handleSubmit}>
        {/* Nombre */}
        <div className="fila-formulario">
          <label>Nombre del Proyecto:</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          {errores.nombre && <span className="error-texto">{errores.nombre}</span>}
        </div>

        {/* Descripción */}
        <div className="fila-formulario">
          <label>Descripción:</label>
          <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          {errores.descripcion && <span className="error-texto">{errores.descripcion}</span>}
        </div>

        {/* Cliente */}
        <div className="fila-formulario">
          <label>Cliente:</label>
          <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          {errores.cliente && <span className="error-texto">{errores.cliente}</span>}
        </div>

        {/* Presupuesto con validación de input */}
        <div className="fila-formulario">
          <label>Presupuesto:</label>
          <input
            type="text"
            inputMode="decimal"
            value={presupuesto}
            onChange={(e) => setPresupuesto(e.target.value)}
            onBeforeInput={(e) => {
              
              const char = e.data;
              const current = e.target.value;
              if (!char) return; 

              
              const isValid = /^[0-9.]$/.test(char);
              const alreadyHasDot = current.includes(".");
              if (!isValid || (char === "." && alreadyHasDot)) {
                e.preventDefault();
              }
            }}
            placeholder="Ingrese un monto válido"
          />
          {errores.presupuesto && <span className="error-texto">{errores.presupuesto}</span>}
        </div>

        {/* Estado (radio) */}
        <div className="fila-formulario">
          <label>Estado:</label>
          <div className="fila-estados">
            <label>
              <input
                type="radio"
                value="En progreso"
                checked={estado === "En progreso"}
                onChange={(e) => setEstado(e.target.value)}
              />{" "}
              En Progreso
            </label>
            <label>
              <input
                type="radio"
                value="Finalizado"
                checked={estado === "Finalizado"}
                onChange={(e) => setEstado(e.target.value)}
              />{" "}
              Finalizado
            </label>
            <label>
              <input
                type="radio"
                value="Cancelado"
                checked={estado === "Cancelado"}
                onChange={(e) => setEstado(e.target.value)}
              />{" "}
              Cancelado
            </label>
          </div>
        </div>

        {/* Fechas */}
        <div className="fila-fechas">
          <div className="campo-fecha">
            <label>Fecha inicio:</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            {errores.fechaInicio && <span className="error-texto">{errores.fechaInicio}</span>}
          </div>
          <div className="campo-fecha">
            <label>Fecha fin:</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            {errores.fechaFin && <span className="error-texto">{errores.fechaFin}</span>}
          </div>
        </div>

        {/* Imagen (opcional) */}
        <div className="fila-formulario">
          <label>Imagen del proyecto (opcional):</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {errores.imagen && <span className="error-texto">{errores.imagen}</span>}
          {preview && <img src={preview} alt="Vista previa" className="preview-imagen" />}
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
