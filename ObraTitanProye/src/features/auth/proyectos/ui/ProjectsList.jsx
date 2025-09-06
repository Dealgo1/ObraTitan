// src/components/ProjectsList.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Table, Button, Modal } from "react-bootstrap";
import { getProjects, deleteProject } from "../../services/projectsService";
import mammoth from "mammoth";
import EditProjectModal from "./EditProjectModal";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { useProject } from "../../context/ProjectContext";

/* ================================
   Modal: Vista previa de documentos Word
   - Recibe un base64 (dataURL) de .doc/.docx
   - Convierte a HTML con mammoth y lo muestra
=================================== */
const WordPreviewModal = ({ base64Doc, onClose }) => {
  const [htmlContent, setHtmlContent] = useState("");

  // Convierte el dataURL base64 a ArrayBuffer y luego a HTML (mammoth)
  const convertWordToHtml = useCallback(async () => {
    try {
      const base64ToArrayBuffer = (base64) => {
        const parts = base64.split(",");
        const byteString = window.atob(parts[1]);     // quita cabecera "data:*/*;base64,"
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        return ab;
      };

      const arrayBuffer = base64ToArrayBuffer(base64Doc);
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setHtmlContent(result.value); // HTML generado por mammoth
    } catch (error) {
      console.error("Error al convertir Word a HTML:", error);
      setHtmlContent("<p>Error al mostrar la vista previa.</p>");
    }
  }, [base64Doc]);

  useEffect(() => {
    if (base64Doc) convertWordToHtml();
  }, [base64Doc, convertWordToHtml]);

  // Descarga directa del dataURL
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = base64Doc;

    // Intenta deducir extensión
    let fileName = "documento";
    if (base64Doc.startsWith("data:application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
      fileName += ".docx";
    } else if (base64Doc.startsWith("data:application/msword")) {
      fileName += ".doc";
    } else {
      fileName += ".docx";
    }

    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal show onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Vista previa de Word</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* mammoth devuelve HTML; se muestra tal cual */}
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleDownload}>Descargar Word</Button>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
};

/* ================================
   Modal: Vista previa PDF (dataURL)
=================================== */
const PDFPreviewModal = ({ base64Doc, onClose }) => {
  return (
    <Modal show onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Vista previa de PDF</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <iframe
          src={base64Doc}
          title="PDF Preview"
          style={{ width: "100%", height: "80vh", border: "none" }}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
};

/* ================================
   Modal: Vista previa de imagen (dataURL)
=================================== */
const ImagePreviewModal = ({ base64Doc, onClose }) => {
  return (
    <Modal show onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Vista previa de imagen</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex justify-content-center">
        <img src={base64Doc} alt="Vista previa" style={{ maxWidth: "100%", maxHeight: "80vh" }} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
};

/* ================================
   Lista de Proyectos
   - Obtiene proyectos del servicio
   - Permite ver/editar/eliminar
   - Previsualiza documentos (img/pdf/word)
=================================== */
const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const { setProject } = useProject(); // (si lo usas para contexto global)
  // Estados para modales de previsualización
  const [wordPreviewDoc, setWordPreviewDoc] = useState(null);
  const [showWordModal, setShowWordModal] = useState(false);
  const [pdfPreviewDoc, setPdfPreviewDoc] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [imagePreviewDoc, setImagePreviewDoc] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Estados para edición
  const [editProject, setEditProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const navigate = useNavigate();

  // Carga de proyectos
  const fetchProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error al obtener proyectos:", error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Eliminar proyecto y refrescar
  const handleDelete = async (projectId) => {
    try {
      await deleteProject(projectId);
      fetchProjects();
    } catch (error) {
      console.error("Error al eliminar el proyecto:", error);
    }
  };

  // Abrir modales de previsualización
  const handleWordPreview = (doc) => { setWordPreviewDoc(doc); setShowWordModal(true); };
  const handlePdfPreview = (doc) => { setPdfPreviewDoc(doc); setShowPdfModal(true); };
  const handleImagePreview = (doc) => { setImagePreviewDoc(doc); setShowImageModal(true); };

  // Ir al dashboard del proyecto (lleva el proyecto por state)
  const handleProjectDashboard = (project) => {
    // Si además quieres fijarlo en contexto: setProject(project);
    navigate("/project-dashboard", { state: { project } });
  }; // ✅ FIX: aquí cerramos correctamente la función SIN llaves extra

  // Abrir modal de edición
  const handleEdit = (project) => {
    setEditProject(project);
    setShowEditModal(true);
  };

  // Cerrar modal de edición
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditProject(null);
  };

  // Tras actualizar, refrescar lista
  const handleUpdated = () => {
    fetchProjects();
    handleCloseEditModal();
  };

  // Renderiza documento por tipo de dataURL
  const renderDocument = (doc, index) => {
    if (doc.startsWith("data:image")) {
      return (
        <img
          src={doc}
          alt={`Documento ${index + 1}`}
          style={{ width: "150px", border: "1px solid #ccc", cursor: "pointer" }}
          onClick={() => handleImagePreview(doc)}
        />
      );
    } else if (doc.startsWith("data:application/pdf")) {
      return (
        <button onClick={() => handlePdfPreview(doc)}>
          Previsualizar PDF {index + 1}
        </button>
      );
    } else if (
      doc.startsWith("data:application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
      doc.startsWith("data:application/msword")
    ) {
      return (
        <button onClick={() => handleWordPreview(doc)}>
          Previsualizar Word {index + 1}
        </button>
      );
    } else {
      return (
        <a href={doc} target="_blank" rel="noopener noreferrer">
          Ver Documento {index + 1}
        </a>
      );
    }
  };

  return (
    <div>
      <h2>Proyectos</h2>

      {/* Tabla principal */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Cliente</th>
            <th>Presupuesto</th>
            <th>Estado</th>
            <th>Fecha de Inicio</th>
            <th>Fecha de Fin</th>
            <th>Documentos</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>{project.nombre}</td>
              <td>{project.descripcion}</td>
              <td>{project.cliente}</td>
              <td>{project.presupuesto}</td>
              <td>{project.estado}</td>
              <td>
                {/* Si son Timestamps de Firestore */}
                {project.fechaInicio &&
                  new Date(
                    (project.fechaInicio.seconds ?? project.fechaInicio._seconds) * 1000
                  ).toLocaleDateString()}
              </td>
              <td>
                {project.fechaFin &&
                  new Date(
                    (project.fechaFin.seconds ?? project.fechaFin._seconds) * 1000
                  ).toLocaleDateString()}
              </td>

              {/* Documentos (dataURL) */}
              <td>
                {project.documentos && project.documentos.length > 0 ? (
                  project.documentos.map((doc, index) => (
                    <div key={index} style={{ marginBottom: "10px" }}>
                      {renderDocument(doc, index)}
                    </div>
                  ))
                ) : (
                  <span>No hay documentos</span>
                )}
              </td>

              {/* Acciones */}
              <td>
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => handleProjectDashboard(project)}
                  title="Acceder"
                >
                  <FaEye />
                </Button>{" "}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleEdit(project)}
                  title="Editar"
                >
                  <FaEdit />
                </Button>{" "}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(project.id)}
                  title="Eliminar"
                >
                  <FaTrash />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modales de previsualización */}
      {showWordModal && (
        <WordPreviewModal
          base64Doc={wordPreviewDoc}
          onClose={() => setShowWordModal(false)}
        />
      )}

      {showPdfModal && (
        <PDFPreviewModal
          base64Doc={pdfPreviewDoc}
          onClose={() => setShowPdfModal(false)}
        />
      )}

      {showImageModal && (
        <ImagePreviewModal
          base64Doc={imagePreviewDoc}
          onClose={() => setShowImageModal(false)}
        />
      )}

      {/* Modal de edición */}
      {showEditModal && editProject && (
        <EditProjectModal
          show={showEditModal}
          onClose={handleCloseEditModal}
          project={editProject}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
};

export default ProjectsList;
