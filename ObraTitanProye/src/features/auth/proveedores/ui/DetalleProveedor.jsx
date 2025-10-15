// src/views/.../DetalleProveedorView.jsx
/**
 * Vista: DetalleProveedorView
 * ----------------------------------------------------------------------------
 * - Muestra y edita datos de un proveedor.
 * - Elimina proveedor con confirmación.
 * - Usa ConfirmModal para alertas/confirmaciones.
 */

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  actualizarProveedor,
  eliminarProveedor,
} from "../../../../services/proveedoresService";
import { doc, updateDoc } from "firebase/firestore"; // (ruta alternativa no usada por defecto)
import Sidebar from "../../../../components/Sidebar";
import ConfirmModal from "../../../../components/ConfirmModal";
import editIcon from "../../../../assets/iconos/edit.png";
import checkIcon from "../../../../assets/iconos/check.png";
import deleteIcon from "../../../../assets/iconos/delete.png";
import closeIcon from "../../../../assets/iconos/close.png";
import "../ui/ProveedorDetalle.css";

const DetalleProveedorView = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const proveedor = location.state?.proveedor;
  const project = location.state?.project;

  const projectId =
    project?.id ||
    proveedor?.projectId ||
    localStorage.getItem("projectId");

  const [editando, setEditando] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [formulario, setFormulario] = useState({
    nombre: proveedor?.nombre || "",
    empresa: proveedor?.empresa || "",
    servicios: proveedor?.servicios || "",
    telefono: proveedor?.telefono || "",
    historialPago: {
      monto: proveedor?.historialPago?.monto || "",
      fecha: proveedor?.historialPago?.fecha || "",
      estado: proveedor?.historialPago?.estado || "A tiempo",
    },
  });

  const [isOffline] = useState(!navigator.onLine);

  // ⚠️ Modal informativo (sustituye alert)
  const [infoModal, setInfoModal] = useState({
    open: false,
    variant: "warning", // "success" | "warning" | "error" | "info"
    title: "",
    message: "",
    confirmText: "Entendido",
  });

  // 🗑️ Modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!proveedor) {
    return (
      <div style={{ padding: 24 }}>
        <p>Error: No se proporcionó proveedor.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("historialPago.")) {
      const campo = name.split(".")[1];
      setFormulario((prev) => ({
        ...prev,
        historialPago: { ...prev.historialPago, [campo]: value },
      }));
    } else {
      setFormulario((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleGuardar = async () => {
    const datosActualizados = {
      ...formulario,
      historialPago: {
        monto: parseFloat(formulario.historialPago.monto),
        fecha: formulario.historialPago.fecha,
        estado: formulario.historialPago.estado,
      },
    };

    if (isOffline) {
      setInfoModal({
        open: true,
        variant: "warning",
        title: "Sin conexión",
        message:
          "Proveedor actualizado localmente. Se sincronizará cuando haya internet.",
        confirmText: "Entendido",
      });
    }

    await actualizarProveedor(proveedor.id, datosActualizados);

    setEditando(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleEliminar = async () => {
    setShowDeleteModal(true);
  };

  const confirmEliminar = async () => {
    try {
      await eliminarProveedor(proveedor.id);
      setShowDeleteModal(false);
      navigate("/proveedores", { state: { project: { id: projectId } } });
    } catch (err) {
      setShowDeleteModal(false);
      setInfoModal({
        open: true,
        variant: "error",
        title: "Error al eliminar",
        message: "No se pudo eliminar el proveedor. Intenta de nuevo.",
        confirmText: "Cerrar",
      });
    }
  };

  // (Opcional) Alternativa directa con Firestore; no se usa por defecto
  const handleEditCategoria = async () => {
    // import { db } from '.../firebaseconfig' si la usas
    // const proveedorRef = doc(db, "proveedores", proveedor.id);
    // await updateDoc(proveedorRef, { ...formulario });
  };

  return (
    <div className="layout-proveedores">
      <Sidebar />
      <h1 className="titulo-fondo-oscuro">Proveedores</h1>

      <div className="proveedores-container">
        <div className="proveedor-detalle-card">
          <div className="encabezado-detalle">
            <h2 className="titulo-proyecto">{formulario.empresa}</h2>

            <div className="botones-superiores">
              <button
                onClick={() => (editando ? handleGuardar() : setEditando(true))}
                title={editando ? "Guardar" : "Editar"}
              >
                <img
                  src={editando ? checkIcon : editIcon}
                  alt={editando ? "Guardar" : "Editar"}
                />
              </button>

              <button onClick={handleEliminar} title="Eliminar">
                <img src={deleteIcon} alt="Eliminar" />
              </button>

              <button
                onClick={() =>
                  navigate("/proveedores", {
                    state: { project: { id: projectId } },
                  })
                }
                title="Volver"
              >
                <img src={closeIcon} alt="Volver" />
              </button>
            </div>
          </div>

          <div className="fila-detalle-vertical">
            <div className="campo-horizontal">
              <label>Nombre:</label>
              <input
                type="text"
                name="nombre"
                className="input-nombre"
                value={formulario.nombre}
                onChange={handleChange}
                disabled={!editando}
              />
            </div>

            <div className="campo-horizontal">
              <label>Empresa:</label>
              <input
                type="text"
                name="empresa"
                className="input-empresa"
                value={formulario.empresa}
                onChange={handleChange}
                disabled={!editando}
              />
            </div>

            <div className="campo-horizontal">
              <label>Servicios que ofrece:</label>
              <textarea
                name="servicios"
                className="input-servicios"
                value={formulario.servicios}
                onChange={handleChange}
                disabled={!editando}
              />
            </div>

            <div className="campo-horizontal">
              <label>Contacto:</label>
              <input
                type="text"
                name="telefono"
                className="input-telefono"
                value={formulario.telefono}
                onChange={handleChange}
                disabled={!editando}
              />
            </div>

            <div className="campo-horizontal">
              <label>Monto del último pago:</label>
              <input
                type="number"
                name="historialPago.monto"
                className="input-monto"
                value={formulario.historialPago.monto}
                onChange={handleChange}
                disabled={!editando}
              />
            </div>

            <div className="campo-horizontal">
              <label>Fecha del último pago:</label>
              <input
                type="date"
                name="historialPago.fecha"
                className="input-fecha"
                value={formulario.historialPago.fecha}
                onChange={handleChange}
                disabled={!editando}
              />
            </div>

            <div className="campo-horizontal">
              <label>Estado del pago:</label>
              <select
                name="historialPago.estado"
                className="input-estado"
                value={formulario.historialPago.estado}
                onChange={handleChange}
                disabled={!editando}
              >
                <option value="A tiempo">A tiempo</option>
                <option value="Atrasado">Atrasado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Toast de éxito */}
      {showToast && (
        <div className="toast-exito-proveedor">✅ Proveedor actualizado con éxito</div>
      )}

      {/* Modal de Confirmación de eliminación */}
      <ConfirmModal
        open={showDeleteModal}
        variant="warning"
        title="¿Eliminar proveedor?"
        message={`¿Seguro que deseas eliminar a "${formulario.nombre || formulario.empresa}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        showCancel={true}
        onConfirm={confirmEliminar}
        onClose={() => setShowDeleteModal(false)}
      />

      {/* Modal informativo (reemplaza alerts) */}
      <ConfirmModal
        open={infoModal.open}
        variant={infoModal.variant}
        title={infoModal.title}
        message={infoModal.message}
        confirmText={infoModal.confirmText}
        onConfirm={() => setInfoModal((s) => ({ ...s, open: false }))}
        onClose={() => setInfoModal((s) => ({ ...s, open: false }))}
      />
    </div>
  );
};

export default DetalleProveedorView;
