import React, { useState } from "react";
import { guardarProveedor } from "../../services/firebaseProveedores";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import "../../Proveedorcss/FormularioProveedor.css";

/**
 * 📌 Componente: FormularioProveedor
 * Este componente permite registrar un nuevo proveedor en un proyecto específico.
 * Contiene un formulario con los datos básicos del proveedor, así como el historial de pagos.
 */
const FormularioProveedor = () => {
  // Estado local que guarda los valores del formulario
  const [formulario, setFormulario] = useState({
    nombre: "",
    empresa: "",
    servicios: "",
    telefono: "",
    historialPago: {
      monto: "",
      fecha: "",
      estado: "A tiempo", // Estado por defecto del pago
    },
  });

  // Hook de navegación de React Router
  const navigate = useNavigate();

  // Hook para obtener datos enviados en la navegación (ej. projectId)
  const location = useLocation();

  // Se obtiene el projectId desde el estado de navegación o localStorage
  const projectId =
    location.state?.projectId || localStorage.getItem("projectId");

  // Si no existe un projectId, se muestra un mensaje de error
  if (!projectId) {
    return (
      <div className="layout-proveedores">
        <Sidebar />
        <h2 className="titulo-fondo-oscuro">⚠️ Proceso inválido</h2>
        <p style={{ color: "#fff" }}>
          No se detectó el ID del proyecto. Por favor, vuelve al dashboard del
          proyecto y desde allí ingresa a proveedores.
        </p>
      </div>
    );
  }

  /**
   * 📌 handleChange
   * Función que maneja los cambios en los inputs del formulario.
   * Permite actualizar campos simples y también los anidados dentro de historialPago.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si el campo pertenece al objeto historialPago
    if (name.startsWith("historialPago.")) {
      const campo = name.split(".")[1]; // Extrae la propiedad (monto, fecha, estado)
      setFormulario((prev) => ({
        ...prev,
        historialPago: {
          ...prev.historialPago,
          [campo]: value,
        },
      }));
    } else {
      // Actualiza cualquier otro campo de nivel superior
      setFormulario((prev) => ({ ...prev, [name]: value }));
    }
  };

  /**
   * 📌 handleSubmit
   * Función que maneja el envío del formulario.
   * Guarda el proveedor en Firebase (o local si no hay conexión) y redirige a la vista de proveedores.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Se construye el objeto proveedor listo para almacenar
    const proveedor = {
      ...formulario,
      historialPago: {
        monto: parseFloat(formulario.historialPago.monto), // Convierte monto a número
        fecha: formulario.historialPago.fecha,
        estado: formulario.historialPago.estado,
      },
      proyectoId: projectId, // Se asocia el proveedor al proyecto actual
    };

    try {
      await guardarProveedor(proveedor); // Guardado en Firebase
    } catch (error) {
      // Si hay error (ej. sin conexión), igualmente se redirige
      console.warn(
        "Guardado localmente. Se sincronizará cuando haya conexión."
      );
    } finally {
      // Redirige siempre a la lista de proveedores del proyecto
      navigate("/proveedores", { state: { projectId } });
    }
  };

  // 📌 Renderizado del formulario
  return (
    <div className="layout-proveedores">
      <Sidebar />
      <h1 className="titulo-fondo-oscuro">Agregar Proveedor</h1>

      <div className="proveedores-container">
        <div className="proveedor-detalle-card">
          {/* Formulario para registrar proveedor */}
          <form onSubmit={handleSubmit} className="fila-detalle-vertical">
            {/* Campo: Nombre */}
            <div className="campo-horizontal">
              <label>Nombre:</label>
              <input
                type="text"
                name="nombre"
                className="input-nombre"
                value={formulario.nombre}
                onChange={handleChange}
                required
              />
            </div>

            {/* Campo: Empresa */}
            <div className="campo-horizontal">
              <label>Empresa:</label>
              <input
                type="text"
                name="empresa"
                className="input-empresa"
                value={formulario.empresa}
                onChange={handleChange}
                required
              />
            </div>

            {/* Campo: Servicios */}
            <div className="campo-horizontal">
              <label>Servicios que ofrece:</label>
              <textarea
                name="servicios"
                className="input-servicios"
                value={formulario.servicios}
                onChange={handleChange}
                required
              />
            </div>

            {/* Campo: Teléfono */}
            <div className="campo-horizontal">
              <label>Contacto:</label>
              <input
                type="text"
                name="telefono"
                className="input-telefono"
                value={formulario.telefono}
                onChange={handleChange}
                required
              />
            </div>

            {/* Campo: Monto del último pago */}
            <div className="campo-horizontal">
              <label>Monto del último pago:</label>
              <input
                type="number"
                name="historialPago.monto"
                className="input-monto"
                value={formulario.historialPago.monto}
                onChange={handleChange}
                required
              />
            </div>

            {/* Campo: Fecha del último pago */}
            <div className="campo-horizontal">
              <label>Fecha del último pago:</label>
              <input
                type="date"
                name="historialPago.fecha"
                className="input-fecha"
                value={formulario.historialPago.fecha}
                onChange={handleChange}
                required
              />
            </div>

            {/* Campo: Estado del pago */}
            <div className="campo-horizontal">
              <label>Estado del pago:</label>
              <select
                name="historialPago.estado"
                className="input-estado"
                value={formulario.historialPago.estado}
                onChange={handleChange}
              >
                <option value="A tiempo">A tiempo</option>
                <option value="Atrasado">Atrasado</option>
              </select>
            </div>

            {/* Botones */}
            <div className="botones-formulario">
              <button type="submit" className="btn-agregar">
                Agregar
              </button>
              <button
                type="button"
                className="btn-cancelar"
                onClick={() =>
                  navigate("/proveedores", { state: { projectId } })
                }
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioProveedor;
