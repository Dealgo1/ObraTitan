import React, { useState } from "react";
import { Modal, Form, Button, Alert } from "react-bootstrap";
import { updateProject } from "../../../../services/projectsService";

// 🔧 Utilidad: convierte un archivo a Base64 (para guardar/mandar imágenes o docs)
const toBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);     // Lee el archivo como data URL
    reader.onload = () => resolve(reader.result); // Devuelve el base64
    reader.onerror = (error) => reject(error);    // Manejo de error
  });
};

const EditProjectModal = ({ show, onClose, project, onUpdated }) => {
  // 🧠 Estados locales para editar los campos del proyecto
  const [nombre, setNombre] = useState(project?.nombre || "");
  const [descripcion, setDescripcion] = useState(project?.descripcion || "");
  const [cliente, setCliente] = useState(project?.cliente || "");
  const [presupuesto, setPresupuesto] = useState(project?.presupuesto || "");
  const [estado, setEstado] = useState(project?.estado || "En progreso");

  // 📅 Normaliza fechas Firestore (Timestamp) -> "YYYY-MM-DD" para el input date
  const [fechaInicio, setFechaInicio] = useState(() => {
    if (project?.fechaInicio?.seconds) {
      const dateObj = new Date(project.fechaInicio.seconds * 1000);
      return dateObj.toISOString().split("T")[0];
    }
    return "";
  });
  const [fechaFin, setFechaFin] = useState(() => {
    if (project?.fechaFin?.seconds) {
      const dateObj = new Date(project.fechaFin.seconds * 1000);
      return dateObj.toISOString().split("T")[0];
    }
    return "";
  });

  // 🗂 Archivos nuevos (convertidos a base64)
  const [newFiles, setNewFiles] = useState([]);
  // ⚠️ Mensaje de error (si algo falla)
  const [error, setError] = useState(null);

  // 📥 Maneja selección de archivos y los convierte a Base64
  const handleFileChange = async (e) => {
    const selectedFiles = e.target.files;
    const promises = [];
    for (const file of selectedFiles) {
      // convierte cada archivo a { name, data(base64) }
      promises.push(
        toBase64(file).then((base64Data) => ({
          name: file.name,
          data: base64Data,
        }))
      );
    }
    try {
      const filesBase64 = await Promise.all(promises);
      setNewFiles(filesBase64); // guarda en estado
    } catch (err) {
      console.error("Error al procesar archivos:", err);
      setError("Ocurrió un error al procesar los archivos.");
    }
  };

  // 💾 Envía el formulario para actualizar el proyecto
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Objeto con los campos a actualizar
      const updatedData = {
        nombre,
        descripcion,
        cliente,
        presupuesto: Number(presupuesto) || 0, // asegura número
        estado,
        // Convierte strings "YYYY-MM-DD" a Date (o null si está vacío)
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
      };

      // Si hay archivos nuevos, mapea a solo los base64; si no, null
      const base64Files = newFiles.length > 0 ? newFiles.map((f) => f.data) : null;

      // 🛠 Llama al servicio para actualizar (puede aceptar los base64)
      await updateProject(project.id, updatedData, base64Files);

      // 🔔 Notifica al padre que terminó y cierra el modal
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error("Error al actualizar el proyecto:", err);
      setError("No se pudo actualizar el proyecto.");
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Editar Proyecto</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* ⚠️ Muestra error si ocurre algo */}
        {error && <Alert variant="danger">{error}</Alert>}

        {/* 📝 Formulario de edición */}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="nombre" className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group controlId="descripcion" className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="cliente" className="mb-3">
            <Form.Label>Cliente</Form.Label>
            <Form.Control
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="presupuesto" className="mb-3">
            <Form.Label>Presupuesto</Form.Label>
            <Form.Control
              type="number"
              value={presupuesto}
              onChange={(e) => setPresupuesto(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="estado" className="mb-3">
            <Form.Label>Estado</Form.Label>
            <Form.Control
              as="select"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option>En progreso</option>
              <option>Finalizado</option>
              <option>Cancelado</option>
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="fechaInicio" className="mb-3">
            <Form.Label>Fecha de Inicio</Form.Label>
            <Form.Control
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="fechaFin" className="mb-3">
            <Form.Label>Fecha de Fin</Form.Label>
            <Form.Control
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </Form.Group>

          {/* 📎 Subida de nuevos documentos (se reemplazan los anteriores si se envían) */}
          <Form.Group controlId="documentos" className="mb-3">
            <Form.Label>Subir nuevos documentos (opcional)</Form.Label>
            <Form.Control type="file" multiple onChange={handleFileChange} />
            <Form.Text className="text-muted">
              Si subes nuevos archivos, se reemplazarán los anteriores.
            </Form.Text>
          </Form.Group>

          <Button variant="primary" type="submit">
            Guardar Cambios
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditProjectModal;
