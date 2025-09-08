import React, { useEffect, useState } from "react";
import { db } from "../../database/firebaseconfig";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import MaterialForm from "./MaterialForm";
import MaterialList from "./MaterialList";
import "../../PresupuestoCss/PresupuestoCalculator.css";

const EstructuraForm = ({ estructuraEnEdicion, setEstructuraEnEdicion }) => {
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

  // 📌 Función para agregar un material a la lista
  const agregarMaterial = (material) => {
    setMateriales([...materiales, material]);
  };

  // 📌 Función para eliminar un material de la lista según el índice
  const eliminarMaterial = (index) => {
    setMateriales(materiales.filter((_, i) => i !== index));
  };

  // 📌 Función para guardar o actualizar la estructura en Firestore
  const guardarEstructura = async () => {
    // Validación: nombre y al menos un material
    if (!nombre.trim() || materiales.length === 0) {
      alert("Nombre de la estructura y al menos un material son obligatorios.");
      return;
    }

    try {
      if (estructuraEnEdicion) {
        // 🔄 Actualizar estructura existente
        const ref = doc(db, "estructuras", estructuraEnEdicion.id);
        await updateDoc(ref, {
          nombre,
          materiales,
          actualizado: new Date() // Fecha de actualización
        });
        alert("✅ Estructura actualizada correctamente");
        setEstructuraEnEdicion(null); // Salimos del modo edición
      } else {
        // ➕ Crear nueva estructura
        await addDoc(collection(db, "estructuras"), {
          nombre,
          materiales,
          creado: new Date() // Fecha de creación
        });
        alert("✅ Estructura guardada correctamente");
      }

      // Limpiar campos después de guardar
      setNombre("");
      setMateriales([]);
    } catch (err) {
      console.error(err);
      alert("Error al guardar la estructura");
    }
  };

  return (
    <div className="calculadora-container">
      {/* Título dinámico: cambia si estamos editando o creando */}
      <h2>{estructuraEnEdicion ? "Editar Estructura" : "Crear Nueva Estructura"}</h2>

      {/* Input para el nombre de la estructura */}
      <input
        className="input"
        placeholder="Nombre de la estructura"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />

      {/* Formulario para agregar materiales */}
      <MaterialForm onAgregar={agregarMaterial} />

      {/* Lista de materiales agregados */}
      <MaterialList materiales={materiales} onEliminar={eliminarMaterial} />

      {/* Botones de acción */}
      <div className="acciones">
        <button onClick={guardarEstructura} className="btn-guardar-estructura-unica">
          {estructuraEnEdicion ? "Actualizar Estructura" : "Guardar Estructura"}
        </button>

        {/* Botón para cancelar si estamos editando */}
        {estructuraEnEdicion && (
          <button
            onClick={() => {
              setEstructuraEnEdicion(null);
              setNombre("");
              setMateriales([]);
            }}
            className="btn-pdf"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

export default EstructuraForm;
