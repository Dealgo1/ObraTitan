// 📦 Importaciones de librerías y componentes necesarios
import React, { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import FormularioUsuario from "../../usuarios/ui/FormularioUsuario";
import Sidebar from "../../../../components/Sidebar";
import editIcon from "../assets/iconos/edit.png";
import deleteIcon from "../assets/iconos/delete.png";
import "../ui/GestionUsuariosView.css";

// 🏗️ Vista principal de gestión de usuarios
const GestionUsuariosView = () => {
  // 📌 Estados locales
  const [usuarios, setUsuarios] = useState([]); // Lista de usuarios obtenidos desde Firestore
  const [mostrarFormulario, setMostrarFormulario] = useState(false); // Controla la visibilidad del formulario
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null); // Usuario que se va a editar
  const [mostrarPopup, setMostrarPopup] = useState(false); // Controla visibilidad del popup de confirmación
  const [idAEliminar, setIdAEliminar] = useState(null); // ID del usuario a eliminar

  const db = getFirestore(); // Inicializamos Firestore

  // 🔄 Efecto para escuchar cambios en la colección "users"
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      // Convertimos documentos en objetos JS con id + datos
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsuarios(data);
    });

    // 🔙 Limpiamos el listener al desmontar el componente
    return () => unsubscribe();
  }, []);

  // 📂 Abrir formulario (para crear o editar usuario)
  const abrirFormulario = (usuario = null) => {
    setUsuarioSeleccionado(usuario);
    setMostrarFormulario(true);
  };

  // ❌ Cerrar formulario y limpiar selección
  const cerrarFormulario = () => {
    setUsuarioSeleccionado(null);
    setMostrarFormulario(false);
  };

  // ⚠️ Mostrar popup de confirmación para eliminar
  const confirmarEliminacion = (id) => {
    setIdAEliminar(id);
    setMostrarPopup(true);
  };

  // ✅ Confirmar y eliminar usuario en Firestore
  const handleConfirmarEliminar = async () => {
    if (idAEliminar) {
      await deleteDoc(doc(db, "users", idAEliminar));
      setMostrarPopup(false);
      setIdAEliminar(null);
    }
  };

  // ❌ Cancelar eliminación
  const handleCancelarEliminar = () => {
    setMostrarPopup(false);
    setIdAEliminar(null);
  };

  return (
    <div className="usuarios-container">
      <div className="dashboard-container">
        {/* 📌 Sidebar de navegación */}
        <Sidebar />

        {/* 📍 Contenido principal */}
        <div className="contenido-principal">
          <h1 className="titulo-modulo-izquierda">Gestión de Usuarios</h1>

          {/* 📊 Contenedor de tabla */}
          <div className="tabla-contenedor">
            <div className="encabezado-tabla"></div>

            {/* 🖥️ Tabla de usuarios */}
            <div className="tabla-responsive">
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
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>{usuario.nombre}</td>
                      <td>{usuario.apellido}</td>
                      <td>{usuario.correo}</td>
                      <td>{usuario.telefono}</td>
                      <td>{usuario.rol}</td>
                      <td>
                        <div className="usuarios-iconos">
                          {/* ✏️ Botón de edición */}
                          <button
                            className="btn-accion editar"
                            onClick={() => abrirFormulario(usuario)}
                          >
                            <img src={editIcon} alt="Editar" />
                          </button>

                          {/* 🗑️ Botón de eliminación */}
                          <button
                            className="btn-accion eliminar"
                            onClick={() => confirmarEliminacion(usuario.id)}
                          >
                            <img src={deleteIcon} alt="Eliminar" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 📋 Formulario de creación/edición */}
          {mostrarFormulario && (
            <FormularioUsuario
              usuario={usuarioSeleccionado}
              cerrarFormulario={cerrarFormulario}
            />
          )}

          {/* ⚠️ Popup de confirmación */}
          {mostrarPopup && (
            <ConfirmPopup
              mensaje="¿Estás seguro de eliminar este usuario?"
              onConfirmar={handleConfirmarEliminar}
              onCancelar={handleCancelarEliminar}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Exportamos la vista
export default GestionUsuariosView;
