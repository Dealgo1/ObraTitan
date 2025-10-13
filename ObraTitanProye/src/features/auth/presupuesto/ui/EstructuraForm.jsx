import React, { useEffect, useState } from "react";
import { db } from "../../../../services/firebaseconfig";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { useProject } from "../../../../context/ProjectContext";
import { useAuth } from "../../../../context/authcontext";
import MaterialForm from "../ui/MaterialForm";
import MaterialList from "../ui/MaterialList";
import "../ui/PresupuestoCalculator.css";

const EstructuraForm = ({ estructuraEnEdicion, setEstructuraEnEdicion }) => {
  const { project } = useProject();
  const projectId = project?.id;
  const { userData } = useAuth();
  const tenantId = userData?.tenantId;

  // Estado para el nombre de la estructura
  const [nombre, setNombre] = useState("");
  // Estado que almacena los materiales agregados
  const [materiales, setMateriales] = useState([]);

  // 📌 Si recibimos una estructura para editar, cargamos sus datos
  useEffect(() => {
    if (estructuraEnEdicion) {
      setNombre(estructuraEnEdicion.nombre);
      setMateriales(estructuraEnEdicion.materiales || []);
    }
  }, [estructuraEnEdicion]);

  // 📌 Agregar/eliminar material
  const agregarMaterial = (material) =>
    setMateriales((prev) => [...prev, material]);
  const eliminarMaterial = (index) =>
    setMateriales((prev) => prev.filter((_, i) => i !== index));

  // 📌 Guardar/actualizar estructura en Firestore
  const guardarEstructura = async () => {
    if (!nombre.trim() || materiales.length === 0) {
      alert("Nombre de la estructura y al menos un material son obligatorios.");
      return;
    }
    if (!projectId || !tenantId) {
      alert("Falta projectId o tenantId para guardar.");
      return;
    }

    try {
      if (estructuraEnEdicion) {
        // 🔄 Actualizar estructura existente
        const ref = doc(db, "estructuras", estructuraEnEdicion.id);
        await updateDoc(ref, {
          nombre,
          materiales,
           projectId,
          tenantId,
          actualizado: new Date(), // Fecha de actualización
        });
        alert("✅ Estructura actualizada correctamente");
        setEstructuraEnEdicion(null);
      } else {
        // ➕ Crear nueva estructura
        await addDoc(collection(db, "estructuras"), {
          nombre,
          materiales,
          projectId,
         tenantId,
          creado: new Date(), // Fecha de creación
        });
        alert("✅ Estructura guardada correctamente");
      }

      // Limpieza
      setNombre("");
      setMateriales([]);
    } catch (err) {
      console.error(err);
      alert("Error al guardar la estructura");
    }
  };

  return (
    <div className="calculadora-container">
      {/* ════════════════════════
          🔹 ENCABEZADO
          ════════════════════════ */}
      <h2 style={{ margin: 0 }}>
        {estructuraEnEdicion ? "Editar Estructura" : "Crear Nueva Estructura"}
      </h2>

      {/* ════════════════════════
          🔹 NOMBRE DE ESTRUCTURA
          ════════════════════════ */}
      <div className="bloque-titulo">Nombre de la estructura</div>
      <div className="fila-form">
        <input
          className="input"
          placeholder="Nombre de la estructura"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      {/* ════════════════════════
          🔹 AGREGAR MATERIALES
          ════════════════════════ */}
      <div className="bloque-titulo materiales">
        Agregar materiales a la estructura
      </div>
      <div className="fila-form">
        <MaterialForm onAgregar={agregarMaterial} />
      </div>

      {/* ════════════════════════
          🔹 LISTA DE MATERIALES
          ════════════════════════ */}
      {materiales.length > 0 && (
        <>
          <h3 className="seccion-titulo">📋 Materiales agregados</h3>
          <MaterialList materiales={materiales} onEliminar={eliminarMaterial} />
        </>
      )}

      {/* ════════════════════════
          🔹 ACCIONES
          ════════════════════════ */}
      <div className="acciones">
        <button
          onClick={guardarEstructura}
          className="btn-guardar-estructura-unica"
        >
          {estructuraEnEdicion ? "Actualizar Estructura" : "Guardar Estructura"}
        </button>

        {estructuraEnEdicion && (
          <button
            onClick={() => {
              setEstructuraEnEdicion(null);
              setNombre("");
              setMateriales([]);
            }}
            className="btn-cancelar"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

export default EstructuraForm;
