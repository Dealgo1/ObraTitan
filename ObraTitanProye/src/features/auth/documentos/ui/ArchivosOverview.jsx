import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../../../components/Sidebar";
import { db } from "../../../../services/firebaseconfig";
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { useProject } from "../../../../context/ProjectContext";
import { useNavigate } from "react-router-dom";
import "../ui/ArchivosOverview.css";
import editIcon from "../../../../assets/iconos/edit.png";
import deleteIcon from "../../../../assets/iconos/delete.png";
import downloadIcon from "../../../../assets/iconos/archivo.png";
import eyeIcon from "../../../../assets/iconos/ojo.png";
import checkIcon from "../../../../assets/iconos/check.png";
import mammoth from "mammoth";
import iconoBuscar from "../../../../assets/iconos/search.png";

/**
 * 📌 Vista: ArchivoOverview
 * Lista documentos/planos subidos dentro del proyecto activo.
 * Permite: buscar, previsualizar (imagen/PDF/Word), editar metadatos, reemplazar archivo y eliminar.
 */
const ArchivoOverview = () => {
  const { project } = useProject();

  // =========================
  // 📦 Estados
  // =========================
  const [documentos, setDocumentos] = useState([]);   // Lista de docs del proyecto
  const [editandoId, setEditandoId] = useState(null); // Fila en edición
  const [formEdit, setFormEdit] = useState({});       // Form de edición (nombre/tipo/archivo)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [documentoPrevisualizar, setDocumentoPrevisualizar] = useState(null); // Doc actual a previsualizar
  const [loading, setLoading] = useState(true);       // Loader
  const [searchTerm, setSearchTerm] = useState("");   // Búsqueda por texto

  // 🔔 Toast/alarma de acción
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const navigate = useNavigate();

  // Ref para contenedor de preview Word (evita manipular DOM por id)
  const wordPreviewRef = useRef(null);

  // =========================
  // 🔄 Cargar documentos
  // =========================
  useEffect(() => {
    const fetchDocumentos = async () => {
      if (!project) return;

      try {
        const proyectoRef = doc(db, "proyectos", project.id);
        const documentosRef = collection(proyectoRef, "documentos");
        const querySnapshot = await getDocs(documentosRef);

        const documentosList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDocumentos(documentosList);
      } catch (error) {
        console.error("❌ Error al obtener los documentos:", error);
      } finally {
        // Simulación breve para ver loader (puedes quitarlo)
        setTimeout(() => setLoading(false), 1000);
      }
    };

    fetchDocumentos();
  }, [project]);

  // =========================
  // ✏️ Edición
  // =========================
  const iniciarEdicion = (documento) => {
    setEditandoId(documento.id);
    setFormEdit({
      nombre: documento.nombre,
      tipoDocumento: documento.tipoDocumento,
      archivoBase64: documento.archivoBase64,
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormEdit({});
  };

  const guardarCambios = async (id) => {
    try {
      // 🚫 Validación: el nombre no admite números
      if (/\d/.test(formEdit.nombre || "")) {
        alert("El nombre del documento no puede contener números.");
        return;
      }

      const ref = doc(db, "proyectos", project.id, "documentos", id);
      await updateDoc(ref, formEdit);

      const actualizados = documentos.map((d) =>
        d.id === id ? { ...d, ...formEdit } : d
      );
      setDocumentos(actualizados);
      cancelarEdicion();
      triggerToast("✅ Documento actualizado con éxito");
    } catch (error) {
      console.error("❌ Error actualizando documento:", error);
    }
  };

  const eliminarDocumento = async (id) => {
    if (window.confirm("¿Deseas eliminar este documento?")) {
      try {
        await deleteDoc(doc(db, "proyectos", project.id, "documentos", id));
        setDocumentos((prev) => prev.filter((d) => d.id !== id));
        triggerToast("🗑️ Documento eliminado");
      } catch (error) {
        console.error("❌ Error al eliminar documento:", error);
      }
    }
  };

  // =========================
  // 📝 Inputs (edición / archivo)
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Solo campo 'nombre' debe bloquear números
    if (name === "nombre") {
      setFormEdit((prev) => ({ ...prev, [name]: value.replace(/\d/g, "") }));
      return;
    }

    setFormEdit((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setFormEdit((prev) => ({ ...prev, archivoBase64: base64 }));
    };
    reader.readAsDataURL(archivo);
  };

  // =========================
  // 🗓️ Util: Formatear fecha
  // =========================
  const formatFecha = (fecha) => {
    if (!fecha) return "";

    // Si viene como Timestamp Firestore: { seconds, nanoseconds }
    if (typeof fecha === "object" && "seconds" in fecha) {
      const date = new Date(fecha.seconds * 1000);
      return `${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1
      ).padStart(2, "0")}/${date.getFullYear()}`;
    }

    // Si viene como string ISO o número
    const date = new Date(fecha);
    if (isNaN(date)) return "";
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  // =========================
  // 👁️ Previsualización
  // =========================
  const abrirModalPrevisualizacion = (documento) => {
    setDocumentoPrevisualizar(documento);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setDocumentoPrevisualizar(null);
    if (wordPreviewRef.current) wordPreviewRef.current.textContent = "";
  };

  // Convierte base64 (dataURL) → ArrayBuffer (para mammoth)
  const base64ToArrayBuffer = (base64) => {
    const binaryString = window.atob(base64.split(",")[1] || "");
    const length = binaryString.length;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < length; i++) view[i] = binaryString.charCodeAt(i);
    return arrayBuffer;
  };

  // Renderiza el contenido del documento en el modal
  const renderPrevisualizacion = () => {
    if (!documentoPrevisualizar) return null;

    const { archivoBase64, nombre } = documentoPrevisualizar;

    // 🖼️ Imágenes
    if (archivoBase64.startsWith("data:image/")) {
      return (
        <img
          src={archivoBase64}
          alt={nombre}
          style={{ width: "100%", maxHeight: "600px", objectFit: "contain" }}
        />
      );
    }

    // 📄 PDF
    if (archivoBase64.startsWith("data:application/pdf")) {
      return (
        <iframe
          src={archivoBase64}
          width="100%"
          height="600px"
          title="PDF Viewer"
          style={{ border: "none" }}
        />
      );
    }

    // 📝 Word (.docx) → texto sin formato (mammoth)
    if (
      archivoBase64.startsWith(
        "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) || archivoBase64.startsWith("data:application/msword")
    ) {
      const arrayBuffer = base64ToArrayBuffer(archivoBase64);

      // Extrae TEXTO PLANO (no HTML) y lo inyecta como textContent
      mammoth
        .extractRawText({ arrayBuffer })
        .then((result) => {
          if (wordPreviewRef.current) {
            wordPreviewRef.current.textContent = result.value || "(Documento vacío)";
          }
        })
        .catch((error) => {
          console.error("❌ Error al extraer contenido de Word:", error);
          if (wordPreviewRef.current) {
            wordPreviewRef.current.textContent = "No se pudo previsualizar el documento.";
          }
        });

      return (
        <div
          ref={wordPreviewRef}
          style={{
            whiteSpace: "pre-wrap",
            width: "100%",
            height: "600px",
            overflowY: "auto",
            padding: "8px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}
        />
      );
    }

    // Tipo no reconocido
    return <p>No se puede previsualizar este tipo de archivo.</p>;
  };

  // =========================
  // 🔎 Búsqueda
  // =========================
  const documentosFiltrados = documentos.filter((doc) => {
    const term = searchTerm.toLowerCase().trim();
    const nombre = (doc.nombre || "").toLowerCase();
    const tipo = (doc.tipoDocumento || "").toLowerCase();
    const fecha = formatFecha(doc.fechaSubida).toLowerCase();
    return nombre.includes(term) || tipo.includes(term) || fecha.includes(term);
  });

  // =========================
  // ⏳ Loader
  // =========================
  if (loading) {
    return (
      <div className="archivo-overview-loader">
        <div className="wave-loader">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
        <p>Cargando documentos...</p>
      </div>
    );
  }

  // =========================
  // 🖥️ Render principal
  // =========================
  return (
    <div className="archivo-overview-fondo">
      {/* Título general */}
      <h2 className="archivo-overview-titulo">Documentos y Planos Subidos</h2>

      {/* Sidebar de navegación */}
      <Sidebar />

      <div className="archivo-overview-wrapper">
        <div className="archivo-overview-contenedor">
          {/* Nombre del proyecto activo */}
          {project && (
            <h3 className="archivo-overview-nombre-proyecto">
              {project.nombre}
            </h3>
          )}

          {/* Buscador */}
          <div className="archivo-overview-buscador-contenedor">
            <img
              src={iconoBuscar}
              alt="Buscar"
              className="archivo-overview-icono-buscar"
            />
            <input
              type="text"
              className="archivo-overview-buscador"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, tipo o fecha…"
            />
          </div>

          {/* Tabla/lista de documentos */}
          <div className="archivo-overview-tabla-scroll">
            {documentosFiltrados.length === 0 ? (
              <p>No se han subido documentos o planos aún.</p>
            ) : (
              <table className="archivo-overview-tabla">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Fecha de Subida</th>
                    {editandoId && <th>Archivo</th>}
                    <th>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {documentosFiltrados.map((documento) => {
                    const esEditando = editandoId === documento.id;

                    return (
                      <tr
                        key={documento.id}
                        className={esEditando ? "archivo-overview-fila-seleccionada" : ""}
                      >
                        {/* Celdas en modo edición */}
                        {esEditando ? (
                          <>
                            <td>
                              <input
                                type="text"
                                name="nombre"
                                value={formEdit.nombre}
                                onChange={handleChange}
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
                                  setFormEdit((prev) => ({ ...prev, nombre: nuevoValor }));
                                }}
                                className="archivo-overview-input"
                              />
                            </td>

                            <td>
                              <select
                                name="tipoDocumento"
                                value={formEdit.tipoDocumento}
                                onChange={handleChange}
                                className="archivo-overview-input"
                              >
                                <option value="documento">Documento</option>
                                <option value="plano">Plano</option>
                              </select>
                            </td>

                            <td>{formatFecha(documento.fechaSubida)}</td>

                            {/* Reemplazar archivo */}
                            <td>
                              <input
                                type="file"
                                onChange={handleFileChange}
                                className="archivo-overview-input"
                              />
                            </td>
                          </>
                        ) : (
                          // Celdas en modo lectura
                          <>
                            <td>{documento.nombre}</td>
                            <td>{documento.tipoDocumento}</td>
                            <td>{formatFecha(documento.fechaSubida)}</td>
                            {editandoId && <td></td>}
                          </>
                        )}

                        {/* Acciones */}
                        <td className="archivo-overview-acciones">
                          {esEditando ? (
                            <>
                              <button onClick={() => guardarCambios(documento.id)} title="Guardar">
                                <img src={checkIcon} alt="Confirmar" />
                              </button>
                              <button onClick={cancelarEdicion} title="Cancelar">
                                <img src={deleteIcon} alt="Cancelar" />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Descargar (dataURL) */}
                              <button
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = documento.archivoBase64;
                                  link.download = documento.nombre || "documento";
                                  link.click();
                                }}
                                title="Descargar"
                              >
                                <img src={downloadIcon} alt="Descargar" />
                              </button>

                              {/* Ver (abre modal) */}
                              <button
                                onClick={() => abrirModalPrevisualizacion(documento)}
                                title="Ver"
                              >
                                <img src={eyeIcon} alt="Ver" />
                              </button>

                              {/* Editar */}
                              <button onClick={() => iniciarEdicion(documento)} title="Editar">
                                <img src={editIcon} alt="Editar" />
                              </button>

                              {/* Eliminar */}
                              <button onClick={() => eliminarDocumento(documento.id)} title="Eliminar">
                                <img src={deleteIcon} alt="Eliminar" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Modal de previsualización */}
          {modalAbierto && (
            <div className="archivo-overview-modal">
              <div className="archivo-overview-modal-contenido">
                <span
                  className="archivo-overview-modal-cerrar"
                  onClick={cerrarModal}
                >
                  &times;
                </span>
                {renderPrevisualizacion()}
              </div>
            </div>
          )}

          {/* CTA para registrar documento nuevo */}
          <button
            className="archivo-overview-boton-documento"
            onClick={() => navigate("/Documentos")}
          >
            Registrar Documento
          </button>
        </div>
      </div>

      {/* 🔔 Toast / Alarma de acción */}
      {showToast && (
        <div className="toast-exito-pago">{toastMsg || "✅ Acción realizada con éxito"}</div>
      )}
    </div>
  );
};

export default ArchivoOverview;
