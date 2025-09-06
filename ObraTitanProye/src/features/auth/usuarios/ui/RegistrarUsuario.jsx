/**
 * src/components/usuarios/RegistrarUsuario.jsx
 * ------------------------------------------------------------
 * Formulario reutilizable para REGISTRAR o EDITAR usuarios en Firestore.
 *
 * Props:
 * - modoEdicion: boolean → true = edición, false = registro.
 * - datosUsuario: objeto con datos del usuario a editar (incluye id).
 * - onGuardar: callback opcional que se ejecuta tras guardar en modo edición.
 *
 * Lógica:
 * - En edición: precarga campos con `datosUsuario` y usa updateDoc('users/{id}').
 * - En registro: crea doc nuevo con setDoc('users/{timestamp}').
 *
 * Notas:
 * - Validación básica con `required` en inputs.
 * - Mensajes de éxito/error en el estado local.
 * - Ajusta reglas de Firestore para que solo roles autorizados puedan crear/editar.
 */

import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';

const RegistrarUsuario = ({ modoEdicion = false, datosUsuario = {}, onGuardar }) => {
  // === Estado de campos del formulario ===
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState('lector');

  // === Mensajería de la UI ===
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Instancia de Firestore (app ya inicializada)
  const db = getFirestore();

  /**
   * Precargar datos en modo edición.
   * - Si `modoEdicion` y `datosUsuario` existen, llenamos los campos.
   */
  useEffect(() => {
    if (modoEdicion && datosUsuario) {
      setNombre(datosUsuario.nombre || '');
      setApellido(datosUsuario.apellido || '');
      setTelefono(datosUsuario.telefono || '');
      setFechaNacimiento(datosUsuario.fechaNacimiento || '');
      setCorreo(datosUsuario.correo || '');
      setRol(datosUsuario.rol || 'lector');
    }
  }, [modoEdicion, datosUsuario]);

  /**
   * handleSubmit
   * ----------------------------------------------------------
   * - En edición: updateDoc en 'users/{id}'.
   * - En registro: setDoc en 'users/{timestamp}'.
   * - Muestra mensaje de éxito o error y ejecuta callbacks si aplica.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    try {
      if (modoEdicion) {
        // === Actualizar usuario existente ===
        await updateDoc(doc(db, 'users', datosUsuario.id), {
          nombre, apellido, telefono, fechaNacimiento, correo, rol,
        });
        setMensaje('✅ Usuario actualizado.');
        if (onGuardar) onGuardar(); // Notificar al padre (por ejemplo, cerrar modal/recargar lista)
      } else {
        // === Registrar nuevo usuario ===
        const newId = `${Date.now()}`; // ID simple basado en timestamp (puedes usar uuid si prefieres)
        await setDoc(doc(db, 'users', newId), {
          nombre, apellido, telefono, fechaNacimiento, correo, rol,
        });
        setMensaje('✅ Usuario registrado.');

        // Limpiar formulario tras registrar
        setNombre('');
        setApellido('');
        setTelefono('');
        setFechaNacimiento('');
        setCorreo('');
        setRol('lector');
      }
    } catch {
      setError('❌ Error al guardar. Verifica los campos.');
    }
  };

  return (
    <div className="usuarios-card">
      <form className="usuarios-form" onSubmit={handleSubmit}>
        <h2>{modoEdicion ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</h2>

        {/* Mensajes de feedback */}
        {mensaje && <p className="success-message">{mensaje}</p>}
        {error && <p className="error-message">{error}</p>}

        {/* Campos de formulario */}
        <label>Nombre:</label>
        <input
          placeholder="Ej: Juan"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <label>Apellido:</label>
        <input
          placeholder="Ej: Pérez"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          required
        />

        <label>Teléfono:</label>
        <input
          placeholder="Ej: 88888888"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
        />

        <label>Fecha de nacimiento:</label>
        <input
          type="date"
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
          required
        />

        <label>Correo electrónico:</label>
        <input
          placeholder="Ej: correo@dominio.com"
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />

        <label>Rol:</label>
        <select value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="lector">Lector</option>
          <option value="administrador">Administrador</option>
          <option value="ingeniero">Ingeniero</option>
          <option value="contador">Contador</option>
        </select>

        {/* CTA principal */}
        <button type="submit">
          {modoEdicion ? 'Guardar Cambios' : 'Registrar Usuario'}
        </button>
      </form>
    </div>
  );
};

export default RegistrarUsuario;
