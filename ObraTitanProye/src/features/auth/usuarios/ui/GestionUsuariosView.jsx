import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Sidebar from "../../../../components/Sidebar";
import { useAuth } from "../../../../context/authcontext";
import FormularioUsuario from "../../usuarios/ui/FormularioUsuario";
import RegistrarUsuarioModal from "./RegistrarUsuarioModal"; // ✅ IMPORTA EL MODAL
import editIcon from "../../../../assets/iconos/edit.png";
import deleteIcon from "../../../../assets/iconos/delete.png";
import "../ui/GestionUsuariosView.css";

// ✅ Componente de confirmación simple
const ConfirmPopup = ({ mensaje, onConfirmar, onCancelar }) => (
  <div className="popup-overlay">
    <div className="popup-card">
      <p>{mensaje}</p>
      <div className="popup-actions">
        <button className="btn btn-danger" onClick={onConfirmar}>
          Eliminar
        </button>
        <button className="btn btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  </div>
);

const GestionUsuariosView = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState(null);
  const [mostrarRegistrar, setMostrarRegistrar] = useState(false);
  const [error, setError] = useState("");

  const db = getFirestore();
  const { userData } = useAuth(); // ← debe tener tenantId

  // 🔄 Cargar usuarios del tenant
  useEffect(() => {
    if (!userData?.tenantId) return;

    const q = query(
      collection(db, "users"),
      where("tenantId", "==", userData.tenantId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsuarios(data);
        setError("");
      },
      (err) => {
        console.error("Error al cargar usuarios:", err);
        setError("Error al obtener la lista de usuarios.");
      }
    );

    return () => unsubscribe();
  }, [db, userData?.tenantId]);

  // 🧾 Abrir formulario de edición
  const abrirFormulario = (usuario = null) => {
    setUsuarioSeleccionado(usuario);
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setUsuarioSeleccionado(null);
    setMostrarFormulario(false);
  };

  // 🗑️ Eliminar usuario
  const confirmarEliminacion = (id) => {
    setIdAEliminar(id);
    setMostrarPopup(true);
  };

  const handleConfirmarEliminar = async () => {
    try {
      if (idAEliminar) await deleteDoc(doc(db, "users", idAEliminar));
    } catch (error) {
      console.error("Error eliminando:", error);
      alert("No se pudo eliminar el usuario.");
    } finally {
      setMostrarPopup(false);
      setIdAEliminar(null);
    }
  };

  const handleCancelarEliminar = () => {
    setMostrarPopup(false);
    setIdAEliminar(null);
  };

  return (
    <div className="usuarios-container">
      <div className="dashboard-container">
        <Sidebar />

        <div className="contenido-principal">
          <h1 className="titulo-modulo-izquierda">Gestión de Usuarios</h1>

          <div className="acciones-header">
            <button className="btn btn-primary" onClick={() => setMostrarRegistrar(true)}>
               Registrar usuario (login)
            </button>
            {/* Si quieres mantener el alta manual, habilita esta */}
            {/* <button className="btn" onClick={() => abrirFormulario(null)}>+ Crear manualmente</button> */}
          </div>

          {error && <div className="alerta-error">{error}</div>}

          <div className="tabla-contenedor">
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
                  {usuarios.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", opacity: 0.8 }}>
                        No hay usuarios registrados.
                      </td>
                    </tr>
                  ) : (
                    usuarios.map((usuario) => (
                      <tr key={usuario.id}>
                        <td>{usuario.nombre}</td>
                        <td>{usuario.apellido}</td>
                        <td>{usuario.correo}</td>
                        <td>{usuario.telefono}</td>
                        <td>{usuario.rol}</td>
                        <td>
                          <div className="usuarios-iconos">
                            <button
                              className="btn-accion editar"
                              onClick={() => abrirFormulario(usuario)}
                            >
                              <img src={editIcon} alt="Editar" />
                            </button>

                            <button
                              className="btn-accion eliminar"
                              onClick={() => confirmarEliminacion(usuario.id)}
                            >
                              <img src={deleteIcon} alt="Eliminar" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {mostrarFormulario && (
            <FormularioUsuario
              usuario={usuarioSeleccionado}
              cerrarFormulario={cerrarFormulario}
            />
          )}

          {mostrarPopup && (
            <ConfirmPopup
              mensaje="¿Estás seguro de eliminar este usuario?"
              onConfirmar={handleConfirmarEliminar}
              onCancelar={handleCancelarEliminar}
            />
          )}

          {mostrarRegistrar && (
            <RegistrarUsuarioModal onClose={() => setMostrarRegistrar(false)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionUsuariosView;
