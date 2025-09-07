// src/views/BudgetVisualization.jsx
/**
 * Vista: BudgetVisualization
 * ---------------------------------------------------------------------------
 * Muestra un resumen financiero del proyecto seleccionado:
 * - Presupuesto inicial del proyecto.
 * - Ingresos adicionales (sumados a partir de transacciones tipo "ingreso").
 * - Monto gastado (sumado a partir de transacciones tipo "gasto").
 * - Saldo disponible = (presupuesto inicial + ingresos) - gastos.
 *
 * Fuente de datos:
 * - `getGastos(projectId)` retorna transacciones del proyecto (gasto/ingreso).
 *
 * Consideraciones:
 * - Convierte todas las transacciones a moneda local (C$) con tasas fijas.
 * - Maneja modo offline: si falla petición y `navigator.onLine === false`,
 *   muestra un aviso y (si hay caché en tu servicio) renderiza con datos previos.
 *
 * Navegación:
 * - Botón "Gastos": ir a listado resumido (/gastos-overview).
 * - Botón "Gastos +": ir a alta de registros (/gastos).
 */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getGastos } from '../services/gastosService';
import Sidebar from '../components/Sidebar';
import '../ui/BudgetVisualization.css';

const BudgetVisualization = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Proyecto recibido por state desde otra vista
  const project = location.state?.project;

  // Acumuladores en Córdobas (moneda local)
  const [totalGastado, setTotalGastado] = useState(0);
  const [totalIngresos, setTotalIngresos] = useState(0);

  // Bandera para UI cuando no hay conexión
  const [offline, setOffline] = useState(false);

  // Tasas de cambio (fijas) → convierten a C$ (NIO)
  // ⚠ Si quieres tasas en tiempo real, reemplaza por un servicio externo.
  const tasasCambio = {
    USD: 37,
    EUR: 40.77,
    NIO: 1,
  };

  /**
   * Convierte un monto (en su moneda) a Córdobas (NIO) usando `tasasCambio`.
   * @param {number} monto
   * @param {'USD'|'EUR'|'NIO'} moneda
   * @returns {number} monto en C$
   */
  const convertirAMonedaLocal = (monto, moneda) => {
    const tasa = tasasCambio[moneda] || 1;
    return Number(monto) * tasa;
  };

  /**
   * Carga transacciones del proyecto, separa gasto/ingreso y acumula en C$.
   */
  useEffect(() => {
    const fetchTransacciones = async () => {
      if (!project?.id) return;

      try {
        const transacciones = await getGastos(project.id);

        // Divide por tipo de transacción
        const gastos = transacciones.filter((t) => t.tipo === 'gasto');
        const ingresos = transacciones.filter((t) => t.tipo === 'ingreso');

        // Suma en C$ (conversión según moneda de cada transacción)
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
        if (!navigator.onLine) {
          setOffline(true); // muestra aviso de modo sin conexión
        }
      }
    };

    fetchTransacciones();
  }, [project]);

  // Presupuesto inicial del proyecto (ya se asume en C$)
  const montoInicial = project?.presupuesto ? Number(project.presupuesto) : 0;

  // Presupuesto total y saldo en C$
  const presupuestoTotal = montoInicial + totalIngresos;
  const saldoDisponible = presupuestoTotal - totalGastado;

  return (
    <div className="dashboard-container">
      {/* Sidebar fijo de navegación */}
      <Sidebar />

      <div className="contenido-principal">
        <h1 className="titulo-modulo-izquierda">Presupuesto del Proyecto</h1>

        {/* Aviso de modo offline (si `getGastos` falló por desconexión) */}
        {offline && (
          <div style={{ color: 'orange', marginBottom: '10px' }}>
            ⚠ Estás sin conexión. Mostrando datos desde la caché local (si están disponibles).
          </div>
        )}

        {/* Card principal con resumen financiero */}
        <div className="presupuesto-card">
          <div className="nombre-y-botones">
            <span className="nombre-proyecto">
              {project?.nombre || 'Proyecto sin nombre'}
            </span>

            {/* Acciones rápidas: ver listado y crear registro */}
            <div className="botones-superiores">
              <button
                className="btn-naranja"
                onClick={() =>
                  navigate('/gastos-overview', { state: { projectId: project.id } })
                }
              >
                Gastos
              </button>

              <button
                className="btn-naranja"
                onClick={() => navigate('/gastos', { state: { projectId: project.id } })}
              >
                Gastos +
              </button>
            </div>
          </div>

          {/* Métricas principales en C$ (NIO) */}
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
