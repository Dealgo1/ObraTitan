// src/features/presupuesto/ui/PresupuestoCalculator.jsx
import React, { useEffect, useState } from "react";
import MaterialForm from "./MaterialForm";
import MaterialList from "./MaterialList";
import { db } from "../../../../services/firebaseconfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useProject } from "../../../../context/ProjectContext";
import "../ui/PresupuestoCalculator.css";

const PresupuestoCalculator = () => {
  const { project } = useProject();
  const projectId = project?.id;

  const [materiales, setMateriales] = useState([]);
  const [predefinidos, setPredefinidos] = useState([]);
  const [estructuras, setEstructuras] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      const materialesSnapshot = await getDocs(collection(db, "materialesPredefinidos"));
      const estructurasSnapshot = await getDocs(collection(db, "estructuras"));
      setPredefinidos(materialesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setEstructuras(estructurasSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    cargarDatos();
  }, []);

  const agregarMaterial = (material) => setMateriales((prev) => [...prev, material]);
  const eliminarMaterial = (index) => setMateriales((prev) => prev.filter((_, i) => i !== index));

  const calcularTotal = () =>
    materiales.reduce((acc, mat) => acc + (Number(mat.precio) || 0) * (Number(mat.cantidad) || 0), 0);

  const guardarPresupuestoEnFirebase = async () => {
    if (!projectId) {
      alert("⚠️ No se ha seleccionado un proyecto válido.");
      return;
    }
    try {
      await addDoc(collection(db, `projects/${projectId}/presupuestos`), {
        materiales,
        total: calcularTotal(),
        creado: new Date(),
      });
      alert("✅ Presupuesto guardado con éxito");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("❌ Ocurrió un error al guardar el presupuesto.");
    }
  };

  const generarPDF = async () => {
    const input = document.getElementById("presupuesto-container");
    if (!input) return alert("No se encontró el contenedor del presupuesto.");
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("presupuesto.pdf");
  };

  const agregarEstructura = (estructura) => {
    const materialesConvertidos = (estructura.materiales || []).map((m) => ({
      ...m,
      precio: parseFloat(m.precio) || 0,
      cantidad: parseFloat(m.cantidad) || 0,
    }));
    setMateriales((prev) => [...prev, ...materialesConvertidos]);
  };

  return (
    <div className="calculadora-container" id="presupuesto-container">
      {!projectId ? (
        <p style={{ color: "red", textAlign: "center" }}>Error: No se recibió el ID del proyecto.</p>
      ) : (
        <>
          {/* ════════════════════════
              🔹 SECCIÓN 1: FORMULARIO
              ════════════════════════ */}
          <h3 className="seccion-titulo">➕ Agregar Material</h3>
          <div className="fila-form">
            <MaterialForm
              onAgregar={agregarMaterial}
              predefinidos={predefinidos}
              estructuras={estructuras}
              onAgregarEstructura={agregarEstructura}
            />
          </div>

          {/* ════════════════════════
              🔹 SECCIÓN 2: LISTADO
              ════════════════════════ */}
          {materiales.length > 0 && (
            <>
              <h3 className="seccion-titulo">📋 Materiales Agregados</h3>
              <MaterialList materiales={materiales} onEliminar={eliminarMaterial} />
            </>
          )}

          {/* ════════════════════════
              🔹 SECCIÓN 3: TOTAL
              ════════════════════════ */}
          <div className="total-container">
            <h3>Total del Presupuesto</h3>
            <p style={{ fontSize: "2rem", margin: "0.5rem 0" }}>C${calcularTotal().toFixed(2)}</p>
          </div>

          {/* ════════════════════════
              🔹 SECCIÓN 4: ACCIONES
              ════════════════════════ */}
          <div className="acciones">
            <button onClick={generarPDF} className="btn-pdf">
              📄 Exportar PDF
            </button>
            <button onClick={guardarPresupuestoEnFirebase} className="btn-guardar">
              💾 Guardar Presupuesto
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PresupuestoCalculator;
