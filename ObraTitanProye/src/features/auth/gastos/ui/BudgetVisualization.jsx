// src/views/.../BudgetVisualization.jsx
/**
 * Vista: BudgetVisualization
 * ---------------------------------------------------------------------------
 * Muestra un resumen financiero del proyecto seleccionado:
 * - Presupuesto inicial, ingresos, gastos y saldo disponible (todo en C$).
 * - Manejo de modo offline (aviso).
 * - Loader "wave" mientras se cargan los datos.
 */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getGastos } from '../../../../services/gastosService';
import { useAuth } from '../../../../context/authcontext';
import Sidebar from '../../../../components/Sidebar';
import PantallaCarga from '../../../../components/PantallaCarga'; // ⬅️ Loader wave
import '../ui/BudgetVisualization.css';

const BudgetVisualization = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();

  // Proyecto recibido por state o desde localStorage
  const project =
    location.state?.project ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem('project')) || null;
      } catch {
        return null;
      }
    })();

  // Acumuladores en Córdobas (NIO)
  const [totalGastado, setTotalGastado] = useState(0);
  const [totalIngresos, setTotalIngresos] = useState(0);

  // Estados UI
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true); // ⬅️ Controla el loader wave

  // Tasas de cambio (fijas) → convierten a C$ (NIO)
  const tasasCambio = {
    USD: 37,
    EUR: 40.77,
    NIO: 1,
  };

  /**
   * Convierte un monto (en su moneda) a Córdobas (NIO).
   */
  const convertirAMonedaLocal = (monto, moneda) => {
    const tasa = tasasCambio[moneda] || 1;
    return Number(monto) * tasa;
  };

  /**
   * Carga transacciones del proyecto, separa gasto/ingreso y acumula en C$.
   * Muestra loader durante la carga y gestiona modo offline.
   */
  useEffect(() => {
    const fetchTransacciones = async () => {
      // Si aún no están listos proyecto o tenant, mantenemos loader visible
      if (!project?.id || !userData?.tenantId) return;

      setLoading(true);
      setOffline(false);

      try {
        const transacciones = await getGastos(project.id, userData.tenantId);

        const gastos = transacciones.filter((t) => t.tipo === 'gasto');
        const ingresos = transacciones.filter((t) => t.tipo === 'ingreso');

        const sumaGastos = gastos.reduce((acc, trans) => {
          const montoCordobas = convertirAMonedaLocal(
            trans.monto || 0,
            trans.moneda || 'NIO'
          );
          return acc + montoCordobas;
        }, 0);

        const sumaIngresos = ingresos.reduce((acc, trans) => {
          const montoCordobas = convertirAMonedaLocal(
            trans.monto || 0,
            trans.moneda || 'NIO'
          );
          return acc + montoCordobas;
        }, 0);

        setTotalGastado(sumaGastos);
        setTotalIngresos(sumaIngresos);
      } catch (error) {
        console.error('Error obteniendo datos de gastos:', error);
        if (!navigator.onLine) setOffline(true);
      } finally {
        setLoading(false); // ⬅️ Oculta el loader
      }
    };

    fetchTransacciones();
  }, [project?.id, userData?.tenantId]);

  // Presupuesto inicial del proyecto (ya en C$)
  const montoInicial = project?.presupuesto ? Number(project.presupuesto) : 0;

  // Totales en C$
  const presupuestoTotal = montoInicial + totalIngresos;
  const saldoDisponible = presupuestoTotal - totalGastado;

  // ⬅️ Loader "wave" mientras carga o mientras aún no hay project/tenant listos
  if (loading || !project?.id || !userData?.tenantId) {
    return <PantallaCarga mensaje="Cargando presupuesto del proyecto..." />;
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="contenido-principal">
        <h1 className="titulo-modulo-izquierda">Presupuesto del Proyecto</h1>

        {offline && (
          <div className="alerta-offline">
            ⚠ Estás sin conexión. Mostrando datos desde la caché local (si están disponibles).
          </div>
        )}

        <div className="presupuesto-card">
          <div className="nombre-y-botones">
            <span className="nombre-proyecto">
              {project?.nombre || 'Proyecto sin nombre'}
            </span>

            <div className="botones-superiores">
              <button
                className="btn-naranja"
                onClick={() =>
                  navigate('/gastos-overview', { state: { proyectoId: project.id } })
                }
              >
                Gastos
              </button>

              <button
                className="btn-naranja"
                onClick={() =>
                  navigate('/gastos', { state: { proyectoId: project.id } })
                }
              >
                Gastos +
              </button>
            </div>
          </div>

          <div className="presupuesto-datos">
            <div>
              <p className="presupuesto-label">Monto Inicial :</p>
              <div className="presupuesto-box">C${montoInicial.toLocaleString()}</div>
            </div>

            <div className="bloque-vertical">
              <div>
                <p className="presupuesto-label">Ingresos Adicionales:</p>
                <div className="presupuesto-box">
                  C${totalIngresos.toLocaleString()}
                </div>
              </div>

              <div>
                <p className="presupuesto-label">Saldo Disponible:</p>
                <div className="presupuesto-box">
                  C${saldoDisponible.toLocaleString()}
                </div>
              </div>
            </div>

            <div>
              <p className="presupuesto-label">Monto Gastado:</p>
              <div className="presupuesto-box">
                C${totalGastado.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        {/* /presupuesto-card */}
      </div>
    </div>
  );
};

export default BudgetVisualization;
