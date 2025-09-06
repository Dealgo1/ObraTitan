/**
 * GastoDetail.jsx
 * ------------------------------------------------------------
 * Vista de detalle y edición de un gasto.
 *
 * Funcionalidad principal:
 * - Muestra datos del gasto seleccionado y permite editarlo/eliminarlo,
 *   salvo que `gasto.esPago` sea true (gasto generado desde Caja),
 *   en cuyo caso no se puede editar ni eliminar.
 * - Carga categorías por proyecto y permite agregar una nueva desde la UI.
 * - Maneja formateo de fechas y montos (con separadores de miles).
 * - Permite adjuntar/ver/descargar una factura (base64) si existe.
 *
 * Props (vía navegación):
 * - location.state.gasto: objeto gasto con { id, categoria, fecha, monto, moneda, facturaBase64, nombreArchivo, esPago, ... }
 * - location.state.projectId: id del proyecto (para cargar categorías).
 *
 * Servicios externos:
 * - updateGasto, deleteGasto: actualizar/eliminar en la colección `gastos`.
 * - getCategoriasPorProyecto(projectId), guardarNuevaCategoria(projectId, nombre).
 *
 * Notas:
 * - El form usa estado local `datosEditables`; se bloquea si no está en modo edición.
 * - Los montos se muestran con comas y se limpian a número antes de guardar.
 * - Fecha:
 *    - Para inputs se usa 'YYYY-MM-DD'.
 *    - Al guardar se envía como string (según tu servicio).
 */

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button, Modal } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import { updateGasto, deleteGasto } from "../services/gastosService";
import {
  getCategoriasPorProyecto,
  guardarNuevaCategoria,
} from "../services/categoriasService";
import "../GastosCss/GastoDetail.css";

import editIcon from "../assets/iconos/edit.png";
import checkIcon from "../assets/iconos/check.png";
import deleteIcon from "../assets/iconos/delete.png";

/** Normaliza a 'YYYY-MM-DD' para inputs de fecha */
const formatFechaParaInput = (fecha) => {
  if (typeof fecha === "string") return fecha;
  const date = fecha?.toDate ? fecha.toDate() : new Date(fecha);
  return date.toISOString().split("T")[0];
};

/** Devuelve símbolo de moneda a partir de ISO */
const getSimboloMoneda = (codigo) => {
  switch (codigo) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "NIO":
      return "C$";
    default:
      return "";
  }
};

/** Formatea número con separador de miles (solo visual) */
const formatNumber = (value) => {
  const num = value.toString().replace(/[^\d.]/g, "");
  const parts = num.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

/** Limpia string formateado → número (para persistencia) */
const cleanNumber = (value) => parseFloat(value.toString().replace(/,/g, ""));

const GastoDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Recibimos `gasto` y `projectId` desde la vista previa (via state)
  const { gasto, projectId } = location.state || {};

  // Estado de UI
  const [modoEdicion, setModoEdicion] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false); // confirmación de eliminar
  const [showFacturaModal, setShowFacturaModal] = useState(false); // preview de factura
  const [errores, setErrores] = useState({});

  // Categorías por proyecto
  const [categorias, setCategorias] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [agregandoCategoria, setAgregandoCategoria] = useState(false);

  // Estado editable del formulario
  const [datosEditables, setDatosEditables] = useState({
    categoria: gasto.categoria || "",
    fecha: formatFechaParaInput(gasto.fecha),
    monto: formatNumber(gasto.monto || ""),
    moneda: gasto.moneda || "NIO",
    facturaBase64: gasto.facturaBase64 || "",
    nombreArchivo: gasto.nombreArchivo || "",
  });

  /** Carga de categorías al montar (o si cambia projectId) */
  useEffect(() => {
    const cargarCategorias = async () => {
      const lista = await getCategoriasPorProyecto(projectId);
      setCategorias(lista);
    };
    cargarCategorias();
  }, [projectId]);

  /** Maneja cambios en inputs de texto/select del formulario */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosEditables({ ...datosEditables, [name]: value });
  };

  /** Carga de archivo → convierte a base64 y guarda nombre */
  const handleFileChange = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDatosEditables((prev) => ({
        ...prev,
        facturaBase64: reader.result,
        nombreArchivo: archivo.name,
      }));
    };
    reader.readAsDataURL(archivo);
  };

  /** Validación mínima de campos requeridos */
  const validarCampos = () => {
    const nuevosErrores = {};
    if (!datosEditables.categoria.trim())
      nuevosErrores.categoria = "Este campo es requerido";
    if (!datosEditables.fecha.trim())
      nuevosErrores.fecha = "Este campo es requerido";
    if (!datosEditables.monto.toString().trim())
      nuevosErrores.monto = "Este campo es requerido";
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  /**
   * Guardar cambios:
   * - Si viene de Caja (`gasto.esPago`), no permite edición.
   * - Valida campos requeridos.
   * - Limpia monto a número y envía `fecha` tal cual (YYYY-MM-DD).
   * - Muestra toast de éxito.
   */
  const handleGuardar = async () => {
    if (gasto.esPago) {
      alert("❌ Este gasto proviene de un pago (Caja) y no puede editarse.");
      setModoEdicion(false);
      return;
    }

    if (!validarCampos()) return;

    try {
      await updateGasto(gasto.id, {
        ...datosEditables,
        monto: cleanNumber(datosEditables.monto),
        fecha: datosEditables.fecha,
      });
      setModoEdicion(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Error al actualizar gasto:", error);
    }
  };

  /**
   * Agregar nueva categoría:
   * - Envía a servicio; si ok, refresca lista y selecciona la nueva.
   */
  const handleAgregarCategoria = async () => {
    if (nuevaCategoria.trim() && !categorias.includes(nuevaCategoria)) {
      try {
        const nuevas = await guardarNuevaCategoria(projectId, nuevaCategoria);
        setCategorias(nuevas);
        setDatosEditables({ ...datosEditables, categoria: nuevaCategoria });
        setNuevaCategoria("");
        setAgregandoCategoria(false);
      } catch (err) {
        console.error("No se pudo guardar la nueva categoría:", err);
      }
    }
  };

  /**
   * Eliminar gasto:
   * - Si viene de Caja (`gasto.esPago`), no permite eliminar.
   * - Si procede, llama servicio y vuelve a la vista de resumen.
   */
  const handleEliminar = async () => {
    if (gasto.esPago) {
      alert("❌ Este gasto proviene de un pago (Caja) y no puede eliminarse.");
      setShowModal(false);
      return;
    }

    try {
      await deleteGasto(gasto.id);
      setShowModal(false);
      navigate("/gastos-overview", { state: { projectId } });
    } catch (error) {
      console.error("Error al eliminar gasto:", error);
    }
  };

  return (
    <div className="detalle-gasto-layout">
      {/* Sidebar global de la app */}
      <Sidebar />

      <div className="dg-contenido-principal">
        <Card className="detalle-gasto-card">
          {/* Header con acciones (editar/guardar, eliminar) */}
          <div className="dg-header">
            <h2 className="dg-titulo">Detalle de Gasto</h2>
            <div className="dg-iconos">
              {/* Editar / Guardar (bloqueado si proviene de Caja) */}
              {!gasto.esPago ? (
                modoEdicion ? (
                  <div
                    className="dg-icono"
                    onClick={handleGuardar}
                    title="Guardar cambios"
                  >
                    <img src={checkIcon} alt="Guardar" />
                  </div>
                ) : (
                  <div
                    className="dg-icono"
                    onClick={() => setModoEdicion(true)}
                    title="Editar gasto"
                  >
                    <img src={editIcon} alt="Editar" />
                  </div>
                )
              ) : (
                <div
                  className="dg-icono"
                  style={{ opacity: 0.4, cursor: "not-allowed" }}
                  title="Este gasto proviene de Caja y no puede editarse"
                >
                  <img src={editIcon} alt="No editable" />
                </div>
              )}

              {/* Eliminar (bloqueado si proviene de Caja) */}
              {!gasto.esPago ? (
                <div
                  className="dg-icono"
                  onClick={() => setShowModal(true)}
                  title="Eliminar gasto"
                >
                  <img src={deleteIcon} alt="Eliminar" />
                </div>
              ) : (
                <div
                  className="dg-icono"
                  style={{ opacity: 0.4, cursor: "not-allowed" }}
                  title="Este gasto proviene de un pago y no puede eliminarse"
                >
                  <img src={deleteIcon} alt="No se puede eliminar" />
                </div>
              )}
            </div>
          </div>

          {/* Campo: Categoría */}
          <div className="dg-campo">
            <label>Categoría de Gasto :</label>
            {modoEdicion ? (
              <div className="dg-campo-col">
                <select
                  name="categoria"
                  className="dg-select"
                  value={datosEditables.categoria}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "nueva") {
                      setAgregandoCategoria(true);
                      setDatosEditables({ ...datosEditables, categoria: "" });
                    } else {
                      setDatosEditables({
                        ...datosEditables,
                        categoria: value,
                      });
                      setAgregandoCategoria(false);
                    }
                  }}
                >
                  <option value="">Seleccione...</option>
                  {categorias.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="nueva">-- Agregar nueva categoría --</option>
                </select>

                {/* Input para nueva categoría en línea */}
                {agregandoCategoria && (
                  <div className="dg-nueva-categoria">
                    <input
                      type="text"
                      value={nuevaCategoria}
                      placeholder="Nueva categoría"
                      onChange={(e) => setNuevaCategoria(e.target.value)}
                      className="dg-input"
                    />
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleAgregarCategoria}
                      style={{ marginTop: "0.5rem" }}
                    >
                      Guardar Categoría
                    </Button>
                  </div>
                )}

                {/* Error de validación */}
                {errores.categoria && (
                  <div className="dg-error">{errores.categoria}</div>
                )}
              </div>
            ) : (
              <span className="dg-valor">{datosEditables.categoria}</span>
            )}
          </div>

          {/* Campo: Fecha */}
          <div className="dg-campo">
            <label>Fecha :</label>
            <div className="dg-campo-col">
              <input
                type="date"
                name="fecha"
                className="dg-input"
                value={datosEditables.fecha}
                onChange={handleChange}
                disabled={!modoEdicion}
              />
              {errores.fecha && <div className="dg-error">{errores.fecha}</div>}
            </div>
          </div>

          {/* Campo: Monto + Moneda */}
          <div className="dg-campo">
            <label>Monto Gastado :</label>
            <div className="dg-campo-col d-flex" style={{ gap: "10px" }}>
              {modoEdicion ? (
                <>
                  <select
                    name="moneda"
                    className="dg-select"
                    style={{ maxWidth: "90px" }}
                    value={datosEditables.moneda}
                    onChange={(e) =>
                      setDatosEditables({
                        ...datosEditables,
                        moneda: e.target.value,
                      })
                    }
                  >
                    <option value="USD">$</option>
                    <option value="EUR">€</option>
                    <option value="NIO">C$</option>
                  </select>

                  {/* Input de monto con formateo visual en cada keypress */}
                  <input
                    type="text"
                    name="monto"
                    className="dg-input"
                    value={datosEditables.monto}
                    onChange={(e) =>
                      setDatosEditables({
                        ...datosEditables,
                        monto: formatNumber(e.target.value),
                      })
                    }
                  />
                </>
              ) : (
                // Vista de solo lectura: símbolo + número formateado
                <span className="dg-valor">
                  {getSimboloMoneda(datosEditables.moneda)}{" "}
                  {formatNumber(datosEditables.monto)}
                </span>
              )}
              {errores.monto && <div className="dg-error">{errores.monto}</div>}
            </div>
          </div>

          {/* Campo: Factura adjunta (archivo base64) */}
          <div className="dg-campo">
            <label>Factura Adjunta :</label>
            <div className="dg-factura">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileChange}
                disabled={!modoEdicion}
                className="dg-btn-adjunta"
              />

              {/* Nombre de archivo (clicable si hay base64) */}
              <span
                className="dg-factura-nombre"
                onClick={() =>
                  datosEditables.facturaBase64 && setShowFacturaModal(true)
                }
                style={{
                  cursor: "pointer",
                  color: "#007bff",
                  textDecoration: "underline",
                }}
              >
                {datosEditables.nombreArchivo || "Sin archivo"}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Toast de éxito tras guardar */}
      {showToast && <div className="toast-exito">✅ Gasto actualizado con éxito</div>}

      {/* Modal de Confirmación de eliminación */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que deseas eliminar este gasto?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleEliminar}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para previsualizar/descargar factura */}
      <Modal
        show={showFacturaModal}
        onHide={() => setShowFacturaModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Factura Adjunta</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ textAlign: "center" }}>
          {datosEditables.facturaBase64 ? (
            <>
              {datosEditables.nombreArchivo.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={datosEditables.facturaBase64}
                  title="Factura PDF"
                  width="100%"
                  height="500px"
                  style={{ border: "none" }}
                />
              ) : datosEditables.nombreArchivo.toLowerCase().match(/\.(jpeg|jpg|png)$/) ? (
                <img
                  src={datosEditables.facturaBase64}
                  alt="Factura"
                  style={{ maxWidth: "100%", maxHeight: "500px" }}
                />
              ) : (
                <p>No se puede previsualizar este tipo de archivo.</p>
              )}

              {/* Descarga directa del base64 */}
              <a
                href={datosEditables.facturaBase64}
                download={datosEditables.nombreArchivo}
                className="btn btn-primary mt-3"
              >
                Descargar Factura
              </a>
            </>
          ) : (
            <p>No hay factura adjunta.</p>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default GastoDetail;
