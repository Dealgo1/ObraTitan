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
 * Muestra un toast de éxito y un estado de "subiendo..." durante la carga.
 */
const DocumentosYPlanosView = () => {
  const { project } = useProject();

  // =========================
  // 📦 Estados del formulario
  // =========================
  const [file, setFile] = useState(null);               // Archivo seleccionado (File)
  const [tipoDocumento, setTipoDocumento] = useState("Documento"); // "Documento" | "Plano"
  const [nombre, setNombre] = useState("");             // Nombre visible del documento
  const [subiendo, setSubiendo] = useState(false);      // Flag para deshabilitar durante upload
  const [showToast, setShowToast] = useState(false);    // Toast de confirmación

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
   * - Limpia el formulario y muestra un toast de éxito
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validación mínima
    if (!file || !nombre || !project) {
      alert("Por favor completa todos los campos.");
      return;
    }

    setSubiendo(true);

    // Lee el archivo como base64
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64String = reader.result;

      try {
        const fechaSubida = new Date().toISOString(); // Fecha legible para UI

        // 📚 Subcolección: proyectos/{project.id}/documentos
        const proyectoRef = doc(db, "proyectos", project.id);            // Documento del proyecto
        const documentosRef = collection(proyectoRef, "documentos");     // Subcolección "documentos"

        // Guarda metadatos + archivo como base64 (dataURL)
        await addDoc(documentosRef, {
          nombre,
          proyecto: project.nombre,
          tipoDocumento,
          fechaSubida,                  // útil para mostrar en tablas
          archivoBase64: base64String,  // ⚠️ base64 (dataURL) para previsualizar y descargar
          timestamp: serverTimestamp(), // fecha de servidor para ordenar en Firestore
        });

        // ✅ Feedback de éxito
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);

        // 🔄 Reset del formulario
        setNombre("");
        setFile(null);
        setTipoDocumento("Documento");
      } catch (error) {
        console.error("Error al cargar el archivo:", error);
        alert("Hubo un error al cargar el archivo. Inténtalo de nuevo.");
      } finally {
        setSubiendo(false);
      }
    };

    reader.onerror = () => {
      alert("Error al leer el archivo.");
      setSubiendo(false);
    };
  };

  // =========================
  // 🧩 Render
  // =========================
  return (
    <div className="doc-plan-app-container">
      {/* Sidebar de navegación */}
      <Sidebar />

      {/* Contenido central */}
      <div className="doc-plan-content-wrapper">
        <div className="doc-plan-container">
          <h2 className="doc-plan-title">Subir Documento o Plano</h2>

          {/* Formulario de carga */}
          <form onSubmit={handleSubmit} className="doc-plan-form-upload">
            {/* Nombre del proyecto activo (si está en contexto) */}
            {project && (
              <div className="doc-plan-project-name">
                <strong>{project.nombre}</strong>
              </div>
            )}

            {/* Tipo de archivo (Documento / Plano) */}
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
                onChange={(e) => setNombre(e.target.value)}
                required
                className="doc-plan-input"
              />
            </div>

            {/* Selector de archivo con validación por tipo */}
            <div className="doc-plan-form-group">
              <label htmlFor="file" className="doc-plan-label">
                Seleccionar Archivo
              </label>
              <input
                id="file"
                type="file"
                className="doc-plan-input"
                accept={
                  // Define qué extensiones se permiten según "tipoDocumento"
                  tipoDocumento === "Plano"
                    ? ".pdf,.gbl,.dwg"
                    : "application/pdf,.doc,.docx,.txt"
                }
                onChange={handleFileChange}
                required
              />
            </div>

            {/* Botón de acción (deshabilitado durante la subida) */}
            <button
              type="submit"
              className="doc-plan-submit-btn"
              disabled={subiendo}
            >
              {subiendo ? "Subiendo..." : `Subir ${tipoDocumento}`}
            </button>
          </form>

          {/* Toast de éxito (desaparece a los 3s) */}
          {showToast && (
            <div className="doc-plan-toast-success">
              ✅ Archivo cargado correctamente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentosYPlanosView;
