/**
 * FormularioUsuario.jsx
 * ------------------------------------------------------------
 * Formulario para CREAR o EDITAR usuarios en Firestore.
 *
 * Props:
 * - usuario: objeto existente para edición (o null para crear).
 *   Espera forma { id, nombre, apellido, correo, telefono, fechaNacimiento, rol }
 * - cerrarFormulario: función para cerrar el modal/panel después de guardar o cancelar.
 *
 * Lógica:
 * - Si `usuario` existe → precarga el formulario y hace updateDoc('users/{id}').
 * - Si `usuario` es null → crea un nuevo doc con setDoc('users/{uuid}').
 *
 * Notas:
 * - El ID se genera con uuidv4() en creaciones.
 * - Requiere reglas de seguridad en Firestore para controlar quién puede crear/editar.
 * - Validación básica con `required` en inputs.
 */

import React, { useEffect, useState } from "react";
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

const FormularioUsuario = ({ usuario = null, cerrarFormulario }) => {
  // === Estado local de los campos ===
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [rol, setRol] = useState("lector");

  // Instancia de Firestore (app ya inicializada en otra parte)
  const db = getFirestore();

  /**
   * Efecto de carga de datos:
   * - Si llega `usuario`, precarga todos los campos (modo edición).
   * - Si no, mantiene valores por defecto (modo creación).
   */
  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre || "");
      setApellido(usuario.apellido || "");
      setCorreo(usuario.correo || "");
      setTelefono(usuario.telefono || "");
      setFechaNacimiento(usuario.fechaNacimiento || "");
      setRol(usuario.rol || "lector");
    }
  }, [usuario]);

  /**
   * handleSubmit
   * ----------------------------------------------------------
   * - Arma el payload con los campos del formulario.
   * - Si hay `usuario` → updateDoc en /users/{id}.
   * - Si no hay → setDoc en /users/{uuid}.
   * - Cierra el formulario al finalizar.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Payload normalizado (puedes normalizar email/telefono aquí si lo deseas)
    const usuarioData = {
      nombre,
      apellido,
      correo,
      telefono,
      fechaNacimiento,
      rol,
    };

    try {
      if (usuario) {
        // Edición
        await updateDoc(doc(db, "users", usuario.id), usuarioData);
      } else {
        // Creación con UUID como id de documento
        const id = uuidv4();
        await setDoc(doc(db, "users", id), usuarioData);
      }
      // Cerrar modal/panel tras guardar
      cerrarFormulario();
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      // Aquí podrías mostrar un toast/alert al usuario
    }
  };

  return (
    <div className="modal-form">
      <form className="formulario-usuario" onSubmit={handleSubmit}>
        <h2>{usuario ? "Editar Usuario" : "Crear Usuario"}</h2>

        {/* Grid del formulario */}
        <div className="formulario-grid">
          <div>
            <label>Nombre:</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div>
            <label>Apellido:</label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>

          <div className="input-full">
            <label>Correo:</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          <div>
            <label>Teléfono:</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
            />
          </div>

          <div>
            <label>Fecha de nacimiento:</label>
            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              required
            />
          </div>

          <div className="input-full">
            <label>Rol:</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="lector">Lector</option>
              <option value="administrador">Administrador</option>
              <option value="ingeniero">Ingeniero</option>
              <option value="contador">Contador</option>
            </select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="formulario-botones">
          <button type="submit" className="botonguardarsexy">Guardar</button>
          <button type="button" className="cancelarsexy" onClick={cerrarFormulario}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioUsuario;
