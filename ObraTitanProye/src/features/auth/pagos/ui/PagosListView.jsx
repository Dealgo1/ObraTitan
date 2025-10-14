// src/views/.../PagosListView.jsx
/**
 * PagosListView.jsx
 * ------------------------------------------------------------
 * Vista de "Caja" (pagos) con loader "wave" mientras carga.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/authcontext';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../../../services/firebaseconfig';
import Sidebar from '../../../../components/Sidebar';
import PantallaCarga from '../../../../components/PantallaCarga'; // ⬅️ Loader wave
import '../ui/ListaPagos.css';
import { format } from 'date-fns';

// Íconos
import editIcon from '../../../../assets/iconos/edit.png';
import checkIcon from '../../../../assets/iconos/check.png';
import deleteIcon from '../../../../assets/iconos/delete.png';
import iconoBuscar from '../../../../assets/iconos/search.png';

const PagosListView = () => {
  // Proyecto provisto vía navegación (state)
  const location = useLocation();
  const { project } = location.state || {};

  const { userData } = useAuth(); // tenantId
  const navigate = useNavigate();

  // Estado local
  const [pagos, setPagos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [loading, setLoading] = useState(true);     // ⬅️ controla loader
  const [offline, setOffline] = useState(false);    // ⬅️ modo sin conexión

  /**
   * Carga inicial de pagos del proyecto actual.
   */
  useEffect(() => {
    const fetchPagos = async () => {
      // Mientras no haya project/tenant, mantenemos el loader visible
      if (!project?.id || !userData?.tenantId) return;

      setLoading(true);
      setOffline(false);
      try {
        const q = query(
          collection(db, 'pagos'),
          where('tenantId', '==', userData.tenantId),
          where('projectId', '==', project.id)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setPagos(data);
      } catch (err) {
        console.error('Error al cargar pagos:', err);
        if (!navigator.onLine) setOffline(true);
      } finally {
        setLoading(false); // ⬅️ oculta loader
      }
    };

    fetchPagos();
  }, [project?.id, userData?.tenantId]);

  /** Inicia edición inline de un pago. */
  const iniciarEdicion = (pago) => {
    setEditandoId(pago.id);
    const fechaRaw = pago.fecha?.toDate ? pago.fecha.toDate() : new Date(pago.fecha);
    setFormEdit({
      proveedorEmpleado: pago.proveedorEmpleado,
      metodoPago: pago.metodoPago,
      monto: pago.monto,
      moneda: pago.moneda || 'C$',
      fecha: format(fechaRaw, 'yyyy-MM-dd')
    });
  };

  /** Cancela modo edición */
  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormEdit({});
  };

  /**
   * Guarda cambios del pago y sincroniza con `gastos` si hay gastoId.
   */
  const guardarCambios = async (id) => {
    try {
      const ref = doc(db, 'pagos', id);
      const [y, m, d] = formEdit.fecha.split('-');
      const fechaLocal = new Date(y, m - 1, d);

      await updateDoc(ref, {
        proveedorEmpleado: formEdit.proveedorEmpleado,
        metodoPago: formEdit.metodoPago,
        monto: parseFloat(formEdit.monto),
        moneda: formEdit.moneda,
        fecha: fechaLocal
      });

      const pagoSnap = await getDoc(ref);
      const pagoActual = pagoSnap.data();
      const gastoId = pagoActual?.gastoId;

      if (gastoId) {
        await updateDoc(doc(db, 'gastos', gastoId), {
          proveedorEmpleado: formEdit.proveedorEmpleado,
          categoria: formEdit.metodoPago, // mapeo simple método→categoría
          monto: parseFloat(formEdit.monto),
          moneda: formEdit.moneda === 'C$' ? 'NIO' : formEdit.moneda,
          fecha: fechaLocal.toISOString().split('T')[0]
        });
      } else {
        console.warn('⚠️ El pago no tiene gastoId, no se actualizó gasto.');
      }

      setPagos(prev =>
        prev.map(p => (p.id === id ? { ...p, ...formEdit, fecha: fechaLocal } : p))
      );
      cancelarEdicion();

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error actualizando pago/gasto:', error);
    }
  };

  /**
   * Elimina un pago (y su gasto vinculado si existe).
   */
  const eliminarPago = async (id) => {
    if (confirm('¿Deseas eliminar este pago?')) {
      try {
        const refPago = doc(db, 'pagos', id);
        const pagoSnap = await getDoc(refPago);
        const pago = pagoSnap.data();

        if (pago?.gastoId) {
          await deleteDoc(doc(db, 'gastos', pago.gastoId));
        }

        await deleteDoc(refPago);
        setPagos(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error eliminando pago/gasto:', error);
      }
    }
  };

  /** Cambios en inputs/selects del formulario inline */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormEdit(prev => ({ ...prev, [name]: value }));
  };

  /** Filtro de búsqueda en proveedor, método, moneda o fecha (dd/MM/yyyy) */
  const pagosFiltrados = pagos.filter(p => {
    const proveedor = p.proveedorEmpleado?.toLowerCase() || '';
    const metodo = p.metodoPago?.toLowerCase() || '';
    const moneda = p.moneda?.toLowerCase() || '';
    const fecha = p.fecha?.toDate ? format(p.fecha.toDate(), 'dd/MM/yyyy') : '';
    const q = filtroBusqueda.toLowerCase();

    return (
      proveedor.includes(q) ||
      metodo.includes(q) ||
      moneda.includes(q) ||
      fecha.includes(filtroBusqueda)
    );
  });

  // ⬅️ Pantalla de carga mientras:
  // - aún no hay projectId/tenantId
  // - o estamos cargando los pagos
  if (loading || !project?.id || !userData?.tenantId) {
    return <PantallaCarga mensaje="Cargando pagos de la caja..." />;
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="contenido-principal fondo-oscuro">
        <h1 className="titulo-modulo">Caja</h1>

        <div className="tabla-contenedor tabla-ancha">
          {/* Nombre del proyecto activo */}
          <h2 className="nombre-proyecto">{project?.nombre || 'Proyecto sin nombre'}</h2>

          {/* Aviso offline */}
          {offline && (
            <div style={{ color: 'orange', marginBottom: '10px' }}>
              ⚠ Estás sin conexión. Mostrando datos desde la caché local (si están disponibles).
            </div>
          )}

          {/* Barra de búsqueda */}
          <div className="barra-superior-proveedores">
            <div className="input-con-icono">
              <img src={iconoBuscar} alt="Buscar" className="icono-dentro-input" />
              <input
                type="text"
                className="input-busqueda"
                placeholder="Buscar Pago ..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
              />
            </div>
          </div>

          {/* Tabla de pagos con scroll */}
          <div className="scroll-tabla">
            <table className="tabla-pagos">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Proveedor/Empleado</th>
                  <th>Método de pago</th>
                  <th>Monto</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {pagosFiltrados.map((pago) => {
                  const esEditando = editandoId === pago.id;
                  const fecha = pago.fecha?.toDate ? pago.fecha.toDate() : new Date(pago.fecha);

                  return (
                    <tr key={pago.id} className={esEditando ? 'fila-seleccionada' : ''}>
                      {esEditando ? (
                        <>
                          {/* Edición inline */}
                          <td>
                            <input
                              type="date"
                              name="fecha"
                              value={formEdit.fecha}
                              onChange={handleChange}
                              className="input-editar"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="proveedorEmpleado"
                              value={formEdit.proveedorEmpleado}
                              onChange={handleChange}
                              className="input-editar"
                            />
                          </td>
                          <td>
                            <select
                              name="metodoPago"
                              value={formEdit.metodoPago}
                              onChange={handleChange}
                              className="input-editar"
                            >
                              <option value="Efectivo">Efectivo</option>
                              <option value="Transferencia">Transferencia</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Tarjeta">Tarjeta</option>
                            </select>
                          </td>
                          <td>
                            <div className="monto-con-moneda">
                              <input
                                type="number"
                                name="monto"
                                value={formEdit.monto}
                                onChange={handleChange}
                                className="input-editar"
                              />
                              <select
                                name="moneda"
                                value={formEdit.moneda}
                                onChange={handleChange}
                                className="moneda-select"
                              >
                                <option value="C$">C$</option>
                                <option value="US$">US$</option>
                                <option value="€$">€$</option>
                              </select>
                            </div>
                          </td>
                          <td>
                            <div className="iconos-acciones">
                              <button onClick={() => guardarCambios(pago.id)}>
                                <img src={checkIcon} alt="Guardar" />
                              </button>
                              <button onClick={cancelarEdicion}>
                                <img src={deleteIcon} alt="Cancelar" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Vista normal */}
                          <td>{format(fecha, 'dd/MM/yyyy')}</td>
                          <td>{pago.proveedorEmpleado}</td>
                          <td>{pago.metodoPago}</td>
                          <td>{`${pago.moneda || 'C$'}${pago.monto}`}</td>
                          <td>
                            <div className="iconos-acciones">
                              <button onClick={() => iniciarEdicion(pago)}>
                                <img src={editIcon} alt="Editar" />
                              </button>
                              <button onClick={() => eliminarPago(pago.id)}>
                                <img src={deleteIcon} alt="Eliminar" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Botón flotante para agregar nuevos pagos */}
          <button
            className="btn-flotante"
            onClick={() => navigate('/AgregarPago', { state: { project } })}
          >
            Pagos +
          </button>
        </div>
      </div>

      {/* Toast de éxito */}
      {showToast && (
        <div className="toast-exito-pago">✅ Pago actualizado con éxito</div>
      )}
    </div>
  );
};

export default PagosListView;
