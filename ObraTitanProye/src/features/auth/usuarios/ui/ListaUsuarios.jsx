/**
 * ListaUsuarios.jsx
 * ------------------------------------------------------------
 * Vista para gestionar usuarios almacenados en Firestore.
 *
 * Funcionalidad:
 * - Botón inicial para mostrar/ocultar la tabla (lazy render).
 * - Suscripción en tiempo real (onSnapshot) a la colección "users".
 * - Edición de usuario: abre <FormularioUsuario /> con el registro seleccionado.
 * - Eliminación de usuario: confirma y borra el doc en Firestore.
 *
 * Notas:
 * - La suscripción solo se activa cuando `mostrarTabla` es true (optimiza lecturas).
 * - El cleanup del efecto (unsub) evita fugas de memoria y listeners duplicados.
 */

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import FormularioUsuario from './FormularioUsuario';

const ListaUsuarios = () => {
  // === Estado de la vista ===
  const [usuarios, setUsuarios] = useState([]);            // Lista de usuarios (realtime)
  const [mostrarTabla, setMostrarTabla] = useState(false); // Controla render de tabla y suscripción
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState(null); // Usuario seleccionado para editar

  // Instancia de Firestore (de la app ya inicializada)
  const db = getFirestore();

  useEffect(() => {
    // Si la tabla no está visible, no suscribimos (ahorro de lecturas)
    if (!mostrarTabla) return;

    // Suscribir a cambios en tiempo real de la colección "users"
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setUsuarios(data);
    });

    // Cleanup: cancelar la suscripción al desmontar o al ocultar la tabla
    return () => unsub();
  }, [mostrarTabla, db]);

  /**
   * handleEliminar
   * ----------------------------------------------------------
   * Confirma y elimina un usuario por id (documento en la colección 'users').
   * Requiere reglas de seguridad que limiten quién puede borrar.
   */
  const handleEliminar = async (id) => {
    if (window.confirm('¿Deseas eliminar este usuario?')) {
      await deleteDoc(doc(db, 'users', id));
      // No es necesario setUsuarios manualmente; onSnapshot actualizará la tabla.
    }
  };

  return (
    <div className="usuarios-container">
      {/* CTA inicial para no cargar la tabla hasta que el usuario lo pida */}
      {!mostrarTabla && (
        <button className="btn-crear" onClick={() => setMostrarTabla(true)}>
          Ver Lista de Usuarios
        </button>
      )}

      {/* Formulario de edición (se muestra cuando hay un usuario seleccionado) */}
      {usuarioEnEdicion && (
        <FormularioUsuario
          usuario={usuarioEnEdicion}
          cerrarFormulario={() => setUsuarioEnEdicion(null)}
        />
      )}

      {/* Tabla de usuarios (visible solo cuando mostrarTabla = true) */}
      {mostrarTabla && (
        <>
          <h1>Gestión de Usuarios</h1>

          <div className="tabla-contenedor">
            <table className="usuarios-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nombre}</td>
                    <td>{u.apellido}</td>
                    <td>{u.correo}</td>
                    <td>{u.telefono}</td>
                    <td>{u.rol}</td>
                    <td>
                      <div className="usuarios-iconos">
                        {/* Editar: abre el formulario con el usuario como prop */}
                        <button
                          onClick={() => setUsuarioEnEdicion(u)}
                          aria-label={`Editar usuario ${u.nombre} ${u.apellido}`}
                          title="Editar"
                        >
                          {/* Asegúrate de tener estos íconos en /public/iconos */}
                          <img src="/iconos/edit.png" alt="Editar" />
                        </button>

                        {/* Eliminar: confirma y borra */}
                        <button
                          onClick={() => handleEliminar(u.id)}
                          aria-label={`Eliminar usuario ${u.nombre} ${u.apellido}`}
                          title="Eliminar"
                        >
                          <img src="/iconos/delete.png" alt="Eliminar" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Si no hay usuarios, muestra un estado vacío */}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', opacity: 0.7 }}>
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ListaUsuarios;
