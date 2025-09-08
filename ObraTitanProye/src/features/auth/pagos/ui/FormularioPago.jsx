/**
 * src/components/.../FormularioPago.jsx
 * ------------------------------------------------------------
 * Formulario para registrar un pago asociado a un proyecto.
 *
 * Props:
 * - onSubmit: (payload) => void
 *      Callback que recibe el objeto del pago al enviar el formulario.
 * - nombreProyecto: string
 *      Se muestra como encabezado del formulario (fallback: "Proyecto Sin Nombre").
 * - projectId: string
 *      ID del proyecto; se usa para cargar proveedores vinculados.
 *
 * Estado interno:
 * - proveedorEmpleado: string  → nombre seleccionado/escrito del proveedor/empleado.
 * - metodoPago: string         → Efectivo, Transferencia, Cheque, Tarjeta.
 * - monto: string              → monto del pago (texto; se envía tal cual).
 * - moneda: string             → C$, USD, EUR.
 * - fecha: string              → fecha en formato "YYYY-MM-DD" (del input date).
 * - proveedores: array<any>    → lista cargada desde Firestore por projectId.
 *
 * Lógica:
 * - Al montar/cambiar projectId: se piden proveedores (obtenerProveedores).
 * - Al enviar:
 *    - Convierte la fecha "YYYY-MM-DD" a Date local (sin TZ) → fechaLocal.
 *    - Llama `onSubmit` con { proveedorEmpleado, metodoPago, monto, moneda, fecha: fechaLocal }.
 *
 * Notas:
 * - El input de proveedor usa <datalist> para autocompletar por nombre.
 * - El monto se guarda como string; si necesitas número, convierte en el onSubmit del padre.
 * - Manejo básico de errores en carga de proveedores (console.error).
 */

import React, { useState, useEffect } from "react";
import "../ui/FormularioPago.css";
import { obtenerProveedores } from "../../../../services/pagosService";

const FormularioPago = ({ onSubmit, nombreProyecto, projectId }) => {
  // === Estado de formulario ===
  const [proveedorEmpleado, setProveedorEmpleado] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("C$");
  const [fecha, setFecha] = useState("");

  // Lista de proveedores vinculados al proyecto
  const [proveedores, setProveedores] = useState([]);

  /**
   * Carga de proveedores al cambiar `projectId`.
   * - Si no hay projectId, no intenta cargar.
   */
  useEffect(() => {
    const cargarProveedores = async () => {
      try {
        const lista = await obtenerProveedores(projectId);
        setProveedores(lista);
      } catch (error) {
        console.error("Error al cargar proveedores:", error);
      }
    };

    if (projectId) cargarProveedores();
  }, [projectId]);

  /**
   * handleSubmit
   * ----------------------------------------------------------
   * - Normaliza la fecha del input a objeto Date local (YYYY, MM-1, DD).
   * - Dispara el callback `onSubmit` con el payload del pago.
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // Convierte "YYYY-MM-DD" → Date local sin hora
    const [year, month, day] = fecha.split("-");
    const fechaLocal = new Date(year, month - 1, day);

    onSubmit({
      proveedorEmpleado,
      metodoPago,
      monto,
      moneda,
      fecha: fechaLocal, // ⬅️ se guarda como fecha del gasto
    });
  };

  return (
    <form className="formulario-pago" onSubmit={handleSubmit}>
      {/* Encabezado con el nombre del proyecto */}
      <h3 className="form-nombre-proyecto">
        {nombreProyecto || "Proyecto Sin Nombre"}
      </h3>

      {/* Proveedor/Empleado con datalist (autocompletar) */}
      <label>Proveedor/Empleado:</label>
      <input
        list="proveedores"
        value={proveedorEmpleado}
        onChange={(e) => setProveedorEmpleado(e.target.value)}
      />
      <datalist id="proveedores">
        {proveedores.map((p) => (
          <option key={p.id} value={p.nombre} />
        ))}
      </datalist>

      {/* Método de pago */}
      <label>Método de pago:</label>
      <select
        value={metodoPago}
        onChange={(e) => setMetodoPago(e.target.value)}
        className="form-select-input"
      >
        <option value="">Seleccione un método</option>
        <option value="Efectivo">Efectivo</option>
        <option value="Transferencia">Transferencia</option>
        <option value="Cheque">Cheque</option>
        <option value="Tarjeta">Tarjeta</option>
      </select>

      {/* Monto + Moneda */}
      <label>Monto:</label>
      <div className="form-monto-con-moneda">
        <input
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />
        <select
          value={moneda}
          onChange={(e) => setMoneda(e.target.value)}
          className="form-moneda-select"
        >
          <option value="C$">C$</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>

      {/* Fecha del pago */}
      <label>Fecha:</label>
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
      />

      {/* CTA */}
      <div className="form-botones-derecha">
        <button type="submit" className="form-btn-agregar">
          Agregar Pago
        </button>
      </div>
    </form>
  );
};

export default FormularioPago;
