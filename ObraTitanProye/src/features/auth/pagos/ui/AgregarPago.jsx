import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { registrarPagoComoGasto } from "../../../../services/pagosService"; // 🔗 Servicio que guarda pagos en Firestore y los vincula como gasto
import FormularioPago from '../ui/FormularioPago'; // 🧾 Componente que contiene el formulario de pago
import Sidebar from '../../../../components/Sidebar'; // 📌 Sidebar lateral
import "../ui/FormularioPago.css"; // 🎨 Estilos del formulario de pago
import { useAuth } from "../../../../context/authcontext";
import Close from '../../../../assets/iconos/close.png';

/**
 * 📌 Vista: AgregarPago
 * 
 * Permite registrar un nuevo pago para un proyecto, 
 * guardándolo en la colección de "pagos" y vinculándolo 
 * como gasto en Firestore.
 */
const AgregarPago = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 📌 El proyecto llega desde la navegación anterior (state)
  const { project } = location.state || {};
  const { userData } = useAuth(); // <- de aquí sale tenantId
  /**
   * 📝 Maneja el evento de agregar pago.
   * - Guarda el pago en Firestore
   * - También lo registra como gasto asociado al proyecto
   * - Navega de regreso a la vista anterior
   */
  const handleAgregarPago = async (data) => {
    try {
      await registrarPagoComoGasto(data, project?.id, userData?.tenantId);
      navigate(-1); // ⬅ vuelve a la página anterior
    } catch (error) {
      console.error('Error al guardar el pago:', error);
    }
  };

  return (
    <div className="dashboard-container">
      {/* 📌 Sidebar persistente */}
      <Sidebar />

      {/* 🎨 Contenido principal */}
      <div className="form-contenido-principal">
        <h1 className="form-titulo-modulo">Pagos</h1>

        {/* 🧾 Contenedor del formulario */}
        <div className="form-pago-container">
          <div className="form-card">
            <button
              type="button"
              className="go-corner-x"
              onClick={() => navigate(-1)}
              title="Volver"
              aria-label="Volver"
            >
              <img src={Close} alt="" />
            </button>

            <FormularioPago
              onSubmit={handleAgregarPago}
              nombreProyecto={project?.nombre}
              projectId={project?.id}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AgregarPago;
