/**
 * src/components/.../GastosForm.jsx
 * ------------------------------------------------------------
 * Formulario para crear REGISTROS financieros (gasto/ingreso).
 *
 * Props:
 * - projectId: string
 *      ID del proyecto al que se asocia el registro.
 * - onGastoCreated?: (id: string) => void
 *      Callback opcional que recibe el ID creado por `createGasto`.
 *
 * Flujo:
 * 1) Al montar: obtiene categorías del proyecto (Firestore).
 * 2) Si el tipo es "gasto": exige categoría y permite adjuntar factura.
 * 3) Monto:
 *    - Formateo visual con separadores de miles (formatNumber).
 *    - Limpieza a número antes de persistir (cleanNumber).
 * 4) Archivo:
 *    - Convierte a Base64 (límite aprox. 750 KB binario ⇒ ~1MB base64).
 *    - Guarda también `nombreArchivo` para mostrar/descargar luego.
 * 5) Enviar:
 *    - Valida campos mínimos.
 *    - Llama `createGasto(gasto)` y limpia el formulario.
 */

import React, { useState, useEffect } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { createGasto } from "../../services/gastosService";
import {
  getCategoriasPorProyecto,
  guardarNuevaCategoria,
} from "../../services/categoriasService";
import "../../GastosCss/GastosForm.css";

/** Convierte un File a Base64 (data URL) */
const toBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const GastosForm = ({ projectId, onGastoCreated }) => {
  // === Estado del formulario ===
  const [tipo, setTipo] = useState("");                 // "gasto" | "ingreso"
  const [categoria, setCategoria] = useState("");       // solo si tipo = "gasto"
  const [fecha, setFecha] = useState("");               // "YYYY-MM-DD"
  const [monto, setMonto] = useState("");               // string formateado con comas
  const [moneda, setMoneda] = useState("NIO");          // "NIO" | "USD" | "EUR"
  const [facturaBase64, setFacturaBase64] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState(""); // nombre de la factura
  const [error, setError] = useState(null);

  // Categorías (y UI para crear nuevas)
  const [categorias, setCategorias] = useState([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  /**
   * Carga categorías del proyecto actual (una sola vez o si cambia projectId)
   */
  useEffect(() => {
    const cargarCategorias = async () => {
      const categoriasFirestore = await getCategoriasPorProyecto(projectId);
      setCategorias(categoriasFirestore);
    };
    cargarCategorias();
  }, [projectId]);

  /**
   * Maneja selección de archivo:
   * - Valida tamaño (≤ 750 KB binario ≈ ~1 MB en base64).
   * - Convierte a base64 y guarda también el nombre del archivo.
   */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 750 * 1024; // 750KB ≈ ~1MB en base64
    if (file.size > maxSize) {
      setError("El archivo es demasiado grande. Máximo permitido: 750 KB.");
      return;
    }

    try {
      const base64 = await toBase64(file);
      setFacturaBase64(base64);
      setNombreArchivo(file.name); // guardamos nombre para mostrar/descargar luego
    } catch {
      setError("No se pudo procesar el archivo.");
    }
  };

  /**
   * Cambia de categoría:
   * - Si elige "nueva", muestra input para crear una categoría y limpia `categoria`.
   */
  const handleCategoriaChange = (e) => {
    const value = e.target.value;
    if (value === "nueva") {
      setShowNewCategory(true);
      setCategoria("");
    } else {
      setCategoria(value);
      setShowNewCategory(false);
    }
  };

  /**
   * Crea una nueva categoría y la selecciona
   */
  const handleAddNewCategory = async () => {
    if (newCategory.trim() && !categorias.includes(newCategory)) {
      try {
        const nuevasCategorias = await guardarNuevaCategoria(projectId, newCategory);
        setCategorias(nuevasCategorias);
        setCategoria(newCategory);
        setNewCategory("");
        setShowNewCategory(false);
      } catch (err) {
        console.error("Error al guardar categoría:", err);
        setError("No se pudo guardar la nueva categoría.");
      }
    }
  };

  /** Mapa de símbolo por código ISO */
  const getSimboloMoneda = (codigo) => {
    switch (codigo) {
      case "USD": return "$";
      case "EUR": return "€";
      case "NIO": return "C$";
      default: return "";
    }
  };

  /** Formatea un string numérico con separadores de miles */
  const formatNumber = (value) => {
    const num = value.replace(/[^\d.]/g, ""); // deja dígitos y un punto
    const parts = num.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  /** Limpia string formateado → número (para persistir) */
  const cleanNumber = (value) => {
    return parseFloat(value.replace(/,/g, ""));
  };

  /**
   * Validación y envío:
   * - Verifica tipo, fecha, monto válido (> 0).
   * - Si tipo = "gasto": exige categoría.
   * - Arma payload y llama `createGasto`.
   * - Limpia el formulario y ejecuta `onGastoCreated` si existe.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!tipo) return setError("Debe seleccionar un tipo de transacción.");
    if (!fecha) return setError("Debe ingresar una fecha.");
    if (!monto || isNaN(cleanNumber(monto)) || cleanNumber(monto) <= 0) {
      return setError("Debe ingresar un monto válido.");
    }
    if (tipo === "gasto" && !categoria) {
      return setError("Debe seleccionar o agregar una categoría para el gasto.");
    }

    try {
      const gasto = {
        projectId,
        tipo,
        ...(tipo === "gasto" && { categoria }),
        fecha,
        monto: cleanNumber(monto),
        moneda,
        ...(tipo === "gasto" && { facturaBase64, nombreArchivo }),
      };

      const id = await createGasto(gasto);
      if (onGastoCreated) onGastoCreated(id);

      // Reset del formulario
      setTipo("");
      setCategoria("");
      setFecha("");
      setMonto("");
      setMoneda("NIO");
      setFacturaBase64(null);
      setNombreArchivo("");
      setNewCategory("");
      setShowNewCategory(false);
    } catch (err) {
      console.error("Error al crear el registro:", err);
      // Manejo específico si backend devuelve mensaje sobre tamaño base64
      if (err?.message?.includes("facturaBase64") && err?.message?.includes("1048487")) {
        setError("El archivo adjunto excede el límite permitido de 1MB.");
      } else {
        setError(err.message || "No se pudo crear el registro.");
      }
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* Mensaje de error general */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Tipo de transacción */}
      <Form.Group className="mb-3" controlId="tipo">
        <Form.Label>Tipo de Transacción</Form.Label>
        <Form.Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Seleccione...</option>
          <option value="gasto">Gasto</option>
          <option value="ingreso">Ingreso</option>
        </Form.Select>
      </Form.Group>

      {/* Categoría (solo si es gasto) */}
      {tipo === "gasto" && (
        <>
          <Form.Group className="mb-3" controlId="categoria">
            <Form.Label>Categoría de Gasto</Form.Label>
            <Form.Select value={categoria} onChange={handleCategoriaChange}>
              <option value="">Seleccione...</option>
              {categorias.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
              <option value="nueva">-- Agregar nueva categoría --</option>
            </Form.Select>
          </Form.Group>

          {showNewCategory && (
            <Form.Group className="mb-3" controlId="nuevaCategoria">
              <Form.Label>Nueva Categoría</Form.Label>
              <Form.Control
                type="text"
                value={newCategory}
                placeholder="Ingrese la nueva categoría"
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <div className="btn-agregar-categoria-container">
                <Button onClick={handleAddNewCategory} className="btn-agregar-categoria">
                  Agregar Categoría
                </Button>
              </div>
            </Form.Group>
          )}
        </>
      )}

      {/* Fecha */}
      <Form.Group className="mb-3" controlId="fecha">
        <Form.Label>Fecha</Form.Label>
        <Form.Control
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </Form.Group>

      {/* Monto + moneda con formateo visual */}
      <Form.Group className="mb-3" controlId="monto">
        <Form.Label>Monto</Form.Label>
        <div className="d-flex align-items-center">
          <Form.Select
            value={moneda}
            onChange={(e) => setMoneda(e.target.value)}
            style={{ maxWidth: "90px", marginRight: "10px" }}
          >
            <option value="USD">$</option>
            <option value="EUR">€</option>
            <option value="NIO">C$</option>
          </Form.Select>
          <Form.Control
            type="text"
            value={monto}
            onChange={(e) => setMonto(formatNumber(e.target.value))}
            placeholder={`Ingrese monto (${getSimboloMoneda(moneda)})`}
            required
          />
        </div>
      </Form.Group>

      {/* Factura (solo si es gasto) */}
      {tipo === "gasto" && (
        <Form.Group className="mb-3" controlId="factura">
          <Form.Label>Factura Adjunta</Form.Label>
          <Form.Control type="file" onChange={handleFileChange} />
        </Form.Group>
      )}

      {/* CTA */}
      <div className="btn-agregar-container">
        <Button type="submit" className="btn-agregar-registro">
          Agregar Registro
        </Button>
      </div>
    </Form>
  );
};

export default GastosForm;
