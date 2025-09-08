// src/views/DetalleProveedorView.jsx
/**
 * Vista: DetalleProveedorView
 * ----------------------------------------------------------------------------
 * Propósito:
 *   - Mostrar el detalle de un proveedor seleccionado (llegado por `location.state`).
 *   - Permitir editar campos básicos y el historial del último pago.
 *   - Soportar escenarios offline: si no hay internet, se alerta y se sincroniza luego.
 *
 * Flujo principal:
 *   1) Se carga el proveedor desde location.state.
 *   2) Con "Editar" se habilitan inputs; con "Guardar" se persisten cambios.
 *   3) "Eliminar" borra el proveedor y regresa a la lista.
 *   4) "Volver" navega a /proveedores.
 *
 * Persistencia:
 *   - `actualizarProveedor` y `eliminarProveedor` (services/firebaseProveedores).
 *   - Se incluye una ruta alternativa `handleEditCategoria` que usa `updateDoc` directo.
 *
 * UI:
 *   - Sidebar fijo + Card con datos editable/no editable.
 *   - Botones superiores con iconos (editar/guardar, eliminar, volver).
 *   - Toast de éxito temporal al guardar.
 */

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { actualizarProveedor, eliminarProveedor } from "../../../../services/proveedoresService";
import { doc, updateDoc } from "firebase/firestore"; // Para actualización directa (ruta alternativa)
import Sidebar from "../../../../components/Sidebar";
import editIcon from "../assets/iconos/edit.png";
import checkIcon from "../assets/iconos/check.png";
import deleteIcon from "../assets/iconos/delete.png";
import closeIcon from "../assets/iconos/close.png";
import "../ui/ProveedorDetalle.css";

const DetalleProveedorView = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Proveedor recibido desde la vista anterior
  const proveedor = location.state?.proveedor;

  // Modo edición ON/OFF
  const [editando, setEditando] = useState(false);

  // Toast de confirmación tras guardar
  const [showToast, setShowToast] = useState(false);

  // Form state controlado (datos editables del proveedor)
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

  // Estado de conectividad (para alertar y/o diferir sincronización)
  const [isOffline] = useState(!navigator.onLine);

  // Si no viene proveedor por navegación, se avisa
  if (!proveedor) return <p>Error: No se proporcionó proveedor.</p>;

  /**
   * Manejador de cambios: soporta campos simples y anidados (historialPago.*)
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Cuando el name es "historialPago.campo" se actualiza de forma anidada
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

  /**
   * Guardar cambios del formulario usando el servicio `actualizarProveedor`.
   * - Convierte monto a número.
   * - Si no hay conexión, alerta y confía en sincronización posterior.
   * - Muestra toast de éxito y cierra modo edición.
   */
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
      alert("Sin conexión: Proveedor actualizado localmente. Se sincronizará cuando haya internet.");
    }

    // Actualiza a través del service (puede hacer manejo adicional de offline)
    await actualizarProveedor(proveedor.id, datosActualizados);

    setEditando(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  /**
   * Eliminar proveedor y volver a la lista.
   */
  const handleEliminar = async () => {
    if (window.confirm("¿Estás seguro de eliminar este proveedor?")) {
      await eliminarProveedor(proveedor.id);
      navigate("/proveedores");
    }
  };

  /**
   * Alternativa de edición directa con Firestore (`updateDoc`).
   * Nota: Esta función no se invoca en los botones por defecto. Mantener
   * una sola vía de actualización (servicio o directa) para evitar duplicación.
   */
  const handleEditCategoria = async () => {
    if (!formulario.nombre || !formulario.empresa) {
      alert("Por favor, completa todos los campos antes de actualizar.");
      return;
    }

    setEditando(false);

    // ⚠️ Requiere `db` importada desde tu config de Firebase:
    // import { db } from '.../firebaseconfig'
    const proveedorRef = doc(db, "proveedores", proveedor.id);

    try {
      await updateDoc(proveedorRef, {
        nombre: formulario.nombre,
        empresa: formulario.empresa,
        servicios: formulario.servicios,
        telefono: formulario.telefono,
        historialPago: formulario.historialPago,
      });

      if (isOffline) {
        // Refresco local si no hay conexión
        // (En escenarios reales, podrías guardar en cola local)
        // Aquí solo mantenemos el estado actual
        alert("Sin conexión: Proveedor actualizado localmente. Se sincronizará cuando haya internet.");
      } else {
        // Ok en la nube
        // (Podrías mostrar un toast también)
      }
    } catch (error) {
      console.error("Error al actualizar el proveedor:", error);
      alert("Ocurrió un error al actualizar el proveedor: " + error.message);
    }
  };

  return (
    <div className="layout-proveedores">
      {/* Navegación lateral persistente */}
      <Sidebar />

      {/* Título de módulo */}
      <h1 className="titulo-fondo-oscuro">Proveedores</h1>

      <div className="proveedores-container">
        <div className="proveedor-detalle-card">
          {/* Encabezado: título + acciones */}
          <div className="encabezado-detalle">
            <h2 className="titulo-proyecto">{formulario.empresa}</h2>

            <div className="botones-superiores">
              {/* Botón dual: Editar ↔ Guardar */}
              <button onClick={() => (editando ? handleGuardar() : setEditando(true))} title={editando ? "Guardar" : "Editar"}>
                <img src={editando ? checkIcon : editIcon} alt={editando ? "Guardar" : "Editar"} />
              </button>

              {/* Eliminar proveedor */}
              <button onClick={handleEliminar} title="Eliminar">
                <img src={deleteIcon} alt="Eliminar" />
              </button>

              {/* Volver a listado */}
              <button onClick={() => navigate("/proveedores")} title="Volver">
                <img src={closeIcon} alt="Volver" />
              </button>
            </div>
          </div>

          {/* Formulario de detalle (inputs deshabilitados si no se edita) */}
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

      {/* Toast de éxito tras guardar */}
      {showToast && <div className="toast-exito-proveedor">✅ Proveedor actualizado con éxito</div>}
    </div>
  );
};

export default DetalleProveedorView;
