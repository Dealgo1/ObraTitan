/**
 * PagosListView.jsx
 * ------------------------------------------------------------
 * Vista de "Caja" para listar, buscar, editar y eliminar pagos
 * asociados a un proyecto. Sincroniza cambios también con la
 * colección `gastos` cuando existe `gastoId` en el pago.
 *
 * Flujo principal:
 * - Al montar (y cuando cambia `project.id`): consulta pagos del proyecto.
 * - Edición inline: inicia edición → guarda cambios en `pagos` y en `gastos`.
 * - Eliminación: borra primero el gasto vinculado (si existe), luego el pago.
 * - Búsqueda: filtra por proveedor, método, moneda o fecha formateada.
 *
 * Dependencias:
 * - Firestore (getDocs, updateDoc, deleteDoc, etc.).
 * - date-fns (format) para formateo de fechas.
 * - React Router (useLocation para obtener `project` del state).
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { db } from '../assets/database/firebaseconfig';
import Sidebar from '../components/Sidebar';
import '../PagosCss/ListaPagos.css';
import { format } from 'date-fns';

// Íconos locales
import editIcon from '../assets/iconos/edit.png';
import checkIcon from '../assets/iconos/check.png';
import deleteIcon from '../assets/iconos/delete.png';
import iconoBuscar from '../assets/iconos/search.png';

const PagosListView = () => {
  // Proyecto provisto vía navegación (state)
  const location = useLocation();
  const { project } = location.state || {};

  // Estado local
  const [pagos, setPagos] = useState([]);               // listado de pagos
  const [editandoId, setEditandoId] = useState(null);   // id del pago en modo edición
  const [formEdit, setFormEdit] = useState({});         // estado del formulario inline
  const [showToast, setShowToast] = useState(false);    // toast de éxito
  const [filtroBusqueda, setFiltroBusqueda] = useState("");// texto de búsqueda global
  const navigate = useNavigate();

  /**
   * Carga inicial de pagos del proyecto actual.
   * - Consulta `pagos` donde `projectId` == project.id
   */
  useEffect(() => {
    const fetchPagos = async () => {
      if (project?.id) {
        const q = query(collection(db, 'pagos'), where('projectId', '==', project.id));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPagos(data);
      }
    };
    fetchPagos();
  }, [project]);

  /**
   * Inicia edición inline de un pago.
   * - Convierte la fecha guardada (Timestamp|Date|string) a 'yyyy-MM-dd' para el input.
   */
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

  /** Cancela el modo edición y limpia el formulario inline */
  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormEdit({});
  };

  /**
   * Guarda cambios del pago editado:
   * 1) Actualiza doc en `pagos`.
   * 2) Si existe `gastoId`, sincroniza doc relacionado en `gastos`:
   *    - proveedorEmpleado → proveedorEmpleado
   *    - metodoPago → categoria (mapeo)
   *    - monto, moneda, fecha (string 'YYYY-MM-DD' para el gasto)
   * 3) Refresca estado local y muestra toast.
   */
  const guardarCambios = async (id) => {
    try {
      const ref = doc(db, 'pagos', id);

      // Normaliza fecha 'YYYY-MM-DD' → Date local
      const [year, month, day] = formEdit.fecha.split("-");
      const fechaLocal = new Date(year, month - 1, day);

      // Actualiza el pago
      await updateDoc(ref, {
        proveedorEmpleado: formEdit.proveedorEmpleado,
        metodoPago: formEdit.metodoPago,
        monto: parseFloat(formEdit.monto),
        moneda: formEdit.moneda,
        fecha: fechaLocal
      });

      // Recupera el pago actualizado para obtener el gastoId
      const pagoSnap = await getDoc(ref);
      const pagoActual = pagoSnap.data();
      const gastoId = pagoActual?.gastoId;

      // Si hay gasto vinculado, sincroniza campos principales
      if (gastoId) {
        await updateDoc(doc(db, "gastos", gastoId), {
          proveedorEmpleado: formEdit.proveedorEmpleado,
          categoria: formEdit.metodoPago, // mapeo simple método→categoría
          monto: parseFloat(formEdit.monto),
          // Nota: aquí se mapea "C$" → "NIO"; otras monedas se pasan tal cual
          moneda: formEdit.moneda === "C$" ? "NIO" : formEdit.moneda,
          fecha: fechaLocal.toISOString().split("T")[0] // 'YYYY-MM-DD'
        });
      } else {
        console.warn("⚠️ El pago no tiene gastoId, no se pudo actualizar el gasto.");
      }

      // Refresca estado local del listado
      const actualizados = pagos.map(p =>
        p.id === id ? { ...p, ...formEdit, fecha: fechaLocal } : p
      );
      setPagos(actualizados);
      cancelarEdicion();

      // Toast de éxito
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Error actualizando pago y gasto:", error);
    }
  };

  /**
   * Elimina un pago:
   * 1) Lee el pago para conocer `gastoId`.
   * 2) Si hay `gastoId`, borra el doc en `gastos`.
   * 3) Borra el doc de `pagos`.
   * 4) Actualiza el estado local.
   */
  const eliminarPago = async (id) => {
    if (confirm("¿Deseas eliminar este pago?")) {
      try {
        const refPago = doc(db, 'pagos', id);
        const pagoSnap = await getDoc(refPago);
        const pago = pagoSnap.data();

        if (pago?.gastoId) {
          const refGasto = doc(db, 'gastos', pago.gastoId);
          await deleteDoc(refGasto);
        }

        await deleteDoc(refPago);
        setPagos(pagos.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error eliminando pago y gasto vinculado:", error);
      }
    }
  };

  /** Manejador de cambios para inputs/selects del formulario inline de edición */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormEdit(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Filtro de búsqueda:
   * - Busca coincidencias en proveedor, método, moneda o fecha (dd/MM/yyyy).
   */
  const pagosFiltrados = pagos.filter(p => {
    const proveedor = p.proveedorEmpleado?.toLowerCase() || "";
    const metodo = p.metodoPago?.toLowerCase() || "";
    const moneda = p.moneda?.toLowerCase() || "";
    const fecha = p.fecha?.toDate ? format(p.fecha.toDate(), 'dd/MM/yyyy') : "";

    return (
      proveedor.includes(filtroBusqueda.toLowerCase()) ||
      metodo.includes(filtroBusqueda.toLowerCase()) ||
      moneda.includes(filtroBusqueda.toLowerCase()) ||
      fecha.includes(filtroBusqueda)
    );
  });

  return (
    <div className="dashboard-container">
      {/* Sidebar de navegación */}
      <Sidebar />

      <div className="contenido-principal fondo-oscuro">
        <h1 className="titulo-modulo">Caja</h1>

        <div className="tabla-contenedor tabla-ancha">
          {/* Nombre del proyecto activo */}
          <h2 className="nombre-proyecto">{project?.nombre}</h2>

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
                                {/* Nota: aquí se usan etiquetas "US$" y "€$".
                                   Asegúrate de que coincidan con las que usa tu backend/reportes. */}
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
