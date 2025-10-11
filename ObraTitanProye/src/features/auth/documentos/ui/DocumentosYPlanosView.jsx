import React, { useState } from "react";
import Sidebar from "../../../../components/Sidebar";
import { db } from "../../../../services/firebaseconfig";
import { addDoc, collection, serverTimestamp, doc } from "firebase/firestore";
import { useProject } from "../../../../context/ProjectContext";
import { useAuth } from "../../../../context/authcontext";
import "../ui/DocumentosYPlanosView.css";

/**
 * 📄 DocumentosYPlanosView
 * Sube un archivo (Documento o Plano) al proyecto activo.
 * Guarda como Base64 en subcolección: projects/{project.id}/documentos
 * Muestra toasts de éxito/error y estado de "Subiendo..."
 */

const MAX_FILE_MB = 15;

const DocumentosYPlanosView = () => {
  const { project } = useProject();
  const { userData } = useAuth(); // debe aportar tenantId, y opcionalmente displayName / uid

  // =========================
  // 📦 Estados del formulario
  // =========================
  const [file, setFile] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState("Documento"); // "Documento" | "Plano"
  const [nombre, setNombre] = useState("");
  const [subiendo, setSubiendo] = useState(false);

  // =========================
  // 🔔 Toast
  // =========================
  const [toast, setToast] = useState({ show: false, msg: "", kind: "ok" }); // ok | error | warn
  const triggerToast = (msg, kind = "ok", ms = 3000) => {
    setToast({ show: true, msg, kind });
    setTimeout(() => setToast({ show: false, msg: "", kind }), ms);
  };

  // =========================
  // 🧰 Helpers
  // =========================
  const handleFileChange = (e) => setFile(e.target.files?.[0] ?? null);
  const handleTipoDocumentoChange = (e) => setTipoDocumento(e.target.value);

  const fileToDataURL = (archivo) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(archivo);
    });

  // =========================
  // 📤 Submit
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!file || !nombre || !project?.id || !userData?.tenantId) {
      triggerToast("⚠️ Completa archivo, nombre, proyecto y tenant.", "warn");
      return;
    }

    if (/\d/.test(nombre)) {
      triggerToast("🚫 El nombre no puede contener números.", "warn");
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_MB) {
      triggerToast(`📦 El archivo supera ${MAX_FILE_MB} MB.`, "warn");
      return;
    }

    setSubiendo(true);
    try {
      const base64String = await fileToDataURL(file);

      // Ref a subcolección del proyecto
      const proyectoRef = doc(db, "projects", project.id);
      const documentosRef = collection(proyectoRef, "documentos");

      const payload = {
        // Campos de UI
        nombre,
        tipoDocumento, // "Documento" | "Plano"

        // Metadatos del archivo
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,

        // Contenido Base64
        archivoBase64: base64String,

        // Multitenant / relaciones
        tenantId: userData.tenantId,
        projectId: project.id,
        projectName: project.nombre ?? null,

        // Quién sube (si está disponible)
        uploadedByUid: userData.uid ?? null,
        uploadedByName: userData.displayName ?? userData.email ?? null,

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        fechaSubida: serverTimestamp(),
      };

      await addDoc(documentosRef, payload);

      triggerToast("✅ Archivo cargado correctamente.", "ok");

      // Reset form
      setNombre("");
      setFile(null);
      setTipoDocumento("Documento");
    } catch (err) {
      console.error("❌ Error al cargar el archivo:", err);
      triggerToast("❌ Error al cargar el archivo. Intenta de nuevo.", "error");
    } finally {
      setSubiendo(false);
    }
  };

  // =========================
  // 🎨 UI
  // =========================
  const acceptForTipo = 
    tipoDocumento === "Plano"
      // Nota: algunos navegadores no reconocen DWG/DXF MIME; se dejan extensiones.
      ? "application/pdf,.pdf,.dwg,.dxf"
      : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.doc,.docx,.txt";

  return (
    <div className="doc-plan-app-container">
      <Sidebar />

      <div className="doc-plan-content-wrapper">
        <div className="doc-plan-container">
          <h2 className="doc-plan-title">Subir Documento o Plano</h2>

          {project && (
            <div className="doc-plan-project-name">
              Proyecto activo: <strong>{project.nombre}</strong>
            </div>
          )}

          <form onSubmit={handleSubmit} className="doc-plan-form-upload">
            {/* Tipo de archivo */}
            <div className="doc-plan-form-group">
              <label htmlFor="tipoDocumento" className="doc-plan-label">
                Tipo de Archivo
              </label>
              <select
                id="tipoDocumento"
                value={tipoDocumento}
                onChange={handleTipoDocumentoChange}
                className="doc-plan-select"
              >
                <option value="Documento">Documento</option>
                <option value="Plano">Plano</option>
              </select>
            </div>

            {/* Nombre (sin números) */}
            <div className="doc-plan-form-group">
              <label htmlFor="nombre" className="doc-plan-label">
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value.replace(/\d/g, ""))}
                onKeyDown={(e) => {
                  if (/\d/.test(e.key)) e.preventDefault();
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const texto = (e.clipboardData || window.clipboardData).getData("text");
                  const limpio = texto.replace(/\d/g, "");
                  const target = e.target;
                  const start = target.selectionStart ?? 0;
                  const end = target.selectionEnd ?? 0;
                  const nuevoValor =
                    target.value.slice(0, start) + limpio + target.value.slice(end);
                  setNombre(nuevoValor);
                }}
                required
                className="doc-plan-input"
                placeholder={tipoDocumento === "Plano" ? "Ej: Planta arquitectónica" : "Ej: Contrato de obra"}
              />
            </div>

            {/* Selector de archivo */}
            <div className="doc-plan-form-group">
              <label htmlFor="file" className="doc-plan-label">
                Seleccionar Archivo
              </label>
              <input
                id="file"
                type="file"
                className="doc-plan-input"
                accept={acceptForTipo}
                onChange={handleFileChange}
                required
              />
              <small className="doc-plan-hint">
                Tamaño máximo: {MAX_FILE_MB} MB. Tipos aceptados según selección.
              </small>
            </div>

            {/* Botón principal */}
            <button type="submit" className="doc-plan-submit-btn" disabled={subiendo}>
              {subiendo ? "Subiendo..." : `Subir ${tipoDocumento}`}
            </button>
          </form>

          {/* Toast visual */}
          {toast.show && (
            <div
              className={
                toast.kind === "ok"
                  ? "doc-plan-toast-success"
                  : toast.kind === "error"
                  ? "doc-plan-toast-error"
                  : "doc-plan-toast-warn"
              }
            >
              {toast.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentosYPlanosView;
