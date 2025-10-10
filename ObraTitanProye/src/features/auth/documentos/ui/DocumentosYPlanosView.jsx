import React, { useState } from "react";
import Sidebar from "../../../../components/Sidebar";
import { db } from "../../../../services/firebaseconfig";
import { addDoc, collection, serverTimestamp, doc } from "firebase/firestore";
import { useProject } from "../../../../context/ProjectContext";
import "../ui/DocumentosYPlanosView.css";

/**
 * 📄 Vista: DocumentosYPlanosView
 * Permite subir un archivo (Documento o Plano) asociado al proyecto activo.
 * Guarda el archivo como dataURL (base64) en una subcolección `proyectos/{id}/documentos`.
 * Muestra un toast visual de éxito o error, y un estado de "subiendo..." durante la carga.
 */
const DocumentosYPlanosView = () => {
  const { project } = useProject();

  // =========================
  // 📦 Estados del formulario
  // =========================
  const [file, setFile] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState("Documento");
  const [nombre, setNombre] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  // =========================
  // 🔔 Toast control
  // =========================
  const triggerToast = (mensaje) => {
    setToastMsg(mensaje);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // =========================
  // 📝 Handlers de inputs
  // =========================
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleTipoDocumentoChange = (e) => setTipoDocumento(e.target.value);

  /**
   * 📤 Envío del formulario:
   * - Valida campos requeridos
   * - Convierte el archivo a base64 (dataURL)
   * - Crea un documento en la subcolección `proyectos/{id}/documentos`
   * - Muestra toasts visuales en vez de alert()
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones previas
    if (!file || !nombre || !project) {
      triggerToast("⚠️ Por favor completa todos los campos.");
      return;
    }

    if (/\d/.test(nombre)) {
      triggerToast("🚫 El nombre no puede contener números.");
      return;
    }

    setSubiendo(true);

    // Lee el archivo como base64
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64String = reader.result;

      try {
        const fechaSubida = new Date().toISOString();
        const proyectoRef = doc(db, "proyectos", project.id);
        const documentosRef = collection(proyectoRef, "documentos");

        await addDoc(documentosRef, {
          nombre,
          proyecto: project.nombre,
          tipoDocumento,
          fechaSubida,
          archivoBase64: base64String,
          timestamp: serverTimestamp(),
        });

        triggerToast("✅ Archivo cargado correctamente.");

        // Reset del formulario
        setNombre("");
        setFile(null);
        setTipoDocumento("Documento");
      } catch (error) {
        console.error("❌ Error al cargar el archivo:", error);
        triggerToast("❌ Error al cargar el archivo. Intenta de nuevo.");
      } finally {
        setSubiendo(false);
      }
    };

    reader.onerror = () => {
      triggerToast("❌ Error al leer el archivo.");
      setSubiendo(false);
    };
  };

  // =========================
  // 🧩 Render
  // =========================
  return (
    <div className="doc-plan-app-container">
      <Sidebar />

      <div className="doc-plan-content-wrapper">
        <div className="doc-plan-container">
          <h2 className="doc-plan-title">Subir Documento o Plano</h2>

          <form onSubmit={handleSubmit} className="doc-plan-form-upload">
            {project && (
              <div className="doc-plan-project-name">
                <strong>{project.nombre}</strong>
              </div>
            )}

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

            {/* Nombre visible del documento */}
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
                accept={
                  tipoDocumento === "Plano"
                    ? ".pdf,.gbl,.dwg"
                    : "application/pdf,.doc,.docx,.txt"
                }
                onChange={handleFileChange}
                required
              />
            </div>

            {/* Botón principal */}
            <button
              type="submit"
              className="doc-plan-submit-btn"
              disabled={subiendo}
            >
              {subiendo ? "Subiendo..." : `Subir ${tipoDocumento}`}
            </button>
          </form>

          {/* Toast visual (estilo unificado) */}
          {showToast && (
            <div className="toast-exito-pago">{toastMsg}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentosYPlanosView;
