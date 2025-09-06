// src/components/Presupuesto/PresupuestoCalculator.jsx
import React, { useEffect, useState } from "react";
import MaterialForm from "./MaterialForm";
import MaterialList from "./MaterialList";
import { db } from "../../database/firebaseconfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useProject } from "../../context/ProjectContext"; // ✅

/**
 * 🧮 PresupuestoCalculator
 * - Permite agregar materiales (manuales, predefinidos o por estructura)
 * - Calcula el total del presupuesto
 * - Guarda el presupuesto en Firestore bajo el proyecto activo
 * - Exporta una captura del presupuesto a PDF
 */
const PresupuestoCalculator = () => {
  const { project } = useProject(); // ✅ Proyecto activo desde el contexto
  const projectId = project?.id;    // ✅ ID del proyecto (si hay)

  // 📦 Estado local
  const [materiales, setMateriales] = useState([]);     // materiales agregados al presupuesto
  const [predefinidos, setPredefinidos] = useState([]); // catálogo de materiales
  const [estructuras, setEstructuras] = useState([]);   // plantillas de estructuras

  /**
   * 🔎 Carga catálogos iniciales desde Firestore:
   * - materialesPredefinidos
   * - estructuras
   */
  useEffect(() => {
    const cargarDatos = async () => {
      const materialesSnapshot = await getDocs(collection(db, "materialesPredefinidos"));
      const estructurasSnapshot = await getDocs(collection(db, "estructuras"));

      setPredefinidos(materialesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setEstructuras(estructurasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    cargarDatos();
  }, []);

  /** ➕ Agrega un material individual a la lista */
  const agregarMaterial = (material) => {
    setMateriales((prev) => [...prev, material]);
  };

  /** 🗑️ Elimina un material por índice */
  const eliminarMaterial = (index) => {
    setMateriales((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * 💰 Calcula el total del presupuesto
   * - Asegura conversión numérica y evita NaN
   */
  const calcularTotal = () =>
    materiales.reduce((acc, mat) => {
      const precio = Number(mat.precio) || 0;
      const cantidad = Number(mat.cantidad) || 0;
      return acc + precio * cantidad;
    }, 0);

  /**
   * ☁️ Guarda el presupuesto bajo:
   * projects/{projectId}/presupuestos
   */
  const guardarPresupuestoEnFirebase = async () => {
    if (!projectId) {
      alert("No se ha seleccionado un proyecto válido.");
      return;
    }

    try {
      await addDoc(collection(db, `projects/${projectId}/presupuestos`), {
        materiales,
        total: calcularTotal(),
        creado: new Date(),
      });
      alert("Presupuesto guardado con éxito ✅");
    } catch (error) {
      console.error("Error al guardar: ", error);
      alert("Ocurrió un error al guardar el presupuesto.");
    }
  };

  /**
   * 🖨️ Genera un PDF a partir de la captura del contenedor
   * - Usa html2canvas para rasterizar el nodo
   * - Inserta la imagen en un documento jsPDF y lo descarga
   */
  const generarPDF = async () => {
    const input = document.getElementById("presupuesto-container");
    if (!input) {
      alert("No se encontró el contenedor del presupuesto.");
      return;
    }

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("presupuesto.pdf");
  };

  /**
   * 🧱 Agrega todos los materiales de una estructura
   * - Convierte precio y cantidad a número
   * - Los concatena a la lista actual
   */
  const agregarEstructura = (estructura) => {
    const materialesConvertidos = (estructura.materiales || []).map((mat) => ({
      ...mat,
      precio: parseFloat(mat.precio) || 0,
      cantidad: parseFloat(mat.cantidad) || 0,
    }));
    setMateriales((prev) => [...prev, ...materialesConvertidos]);
  };

  return (
    <div className="calculadora-container" id="presupuesto-container">
      {/* Guardrail si no hay proyecto */}
      {!projectId && (
        <p style={{ color: "red" }}>Error: No se recibió el ID del proyecto.</p>
      )}

      {projectId && (
        <>
          {/* Formulario de materiales y combos de catálogos */}
          <MaterialForm
            onAgregar={agregarMaterial}
            predefinidos={predefinidos}
            estructuras={estructuras}
            onAgregarEstructura={agregarEstructura}
          />

          {/* Lista de materiales agregados */}
          <MaterialList materiales={materiales} onEliminar={eliminarMaterial} />

          {/* Total del presupuesto */}
          <div className="total-container">
            <h3>Total: C${calcularTotal().toFixed(2)}</h3>
          </div>

          {/* Acciones: exportar y guardar */}
          <div className="acciones">
            <button onClick={generarPDF} className="btn-pdf">
              Exportar PDF
            </button>
            <button onClick={guardarPresupuestoEnFirebase} className="btn-guardar">
              Guardar Presupuesto
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PresupuestoCalculator;
