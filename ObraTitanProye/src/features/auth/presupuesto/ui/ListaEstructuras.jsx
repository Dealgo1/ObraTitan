import React, { useEffect, useState } from "react";
import { db } from "../../../../services/firebaseconfig";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { useProject } from "../../../../context/ProjectContext";
import { useAuth } from "../../../../context/authcontext";

/* Popup mínimo (si ya tienes uno, puedes quitar este) */
const ConfirmPopup = ({ mensaje, onConfirmar, onCancelar, loading }) => (
  <div className="popup-backdrop" onClick={onCancelar}>
    <div className="popup-card" onClick={(e) => e.stopPropagation()}>
      <p>{mensaje}</p>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <button type="button" className="btn-cancelar" onClick={onCancelar}>Cancelar</button>
        <button
          type="button"
          className="btn-guardar-estructura-unica"
          onClick={onConfirmar}
          disabled={loading}
        >
          {loading ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </div>
  </div>
);

const ListaEstructuras = ({ setEstructuraEnEdicion }) => {
    const { project } = useProject();
  const projectId = project?.id;
  const { userData } = useAuth();
  const tenantId = userData?.tenantId;
  const [estructuras, setEstructuras] = useState([]);
  const [estructuraAEliminar, setEstructuraAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarEstructuras = async () => {
    if (!projectId || !tenantId) return setEstructuras([]);
   const q = query(
      collection(db, "estructuras"),
     where("projectId", "==", projectId),
      where("tenantId", "==", tenantId)
    );
    const snapshot = await getDocs(q);
    setEstructuras(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const confirmarEliminar = (estructura, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setEstructuraAEliminar(estructura);
  };

  const eliminarEstructura = async () => {
    if (!estructuraAEliminar) return;
    try {
      setEliminando(true);
      await deleteDoc(doc(db, "estructuras", estructuraAEliminar.id));
      setEstructuras((prev) => prev.filter((e) => e.id !== estructuraAEliminar.id));
    } catch (err) {
      console.error("Error eliminando estructura:", err);
      alert("No se pudo eliminar. Intenta de nuevo.");
    } finally {
      setEliminando(false);
      setEstructuraAEliminar(null);
    }
  };

  useEffect(() => {
    cargarEstructuras();
  }, []);

  return (
    <div className="lista-estructuras">
      <h2 className="subtitulo">Lista de Estructuras</h2>

      {estructuras.length === 0 ? (
        <div className="estado-vacio">
          <p>No hay estructuras registradas.</p>
        </div>
      ) : (
        <div className="tabla-container">
          <table className="tabla-estructuras">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Materiales</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estructuras.map((est) => (
                <tr key={est.id}>
                  <td>{est.nombre}</td>
                  <td>{est.materiales?.length ?? 0}</td>
                  <td>
                    <button
                      type="button"                           /* 🔒 evita submit */
                      className="btn-editar"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEstructuraEnEdicion(est);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"                           /* 🔒 evita submit */
                      className="btn-eliminar"
                      onClick={(e) => confirmarEliminar(est, e)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {estructuraAEliminar && (
        <ConfirmPopup
          mensaje={`¿Seguro que deseas eliminar "${estructuraAEliminar.nombre}"?`}
          onConfirmar={eliminarEstructura}
          onCancelar={() => setEstructuraAEliminar(null)}
          loading={eliminando}
        />
      )}
    </div>
  );
};

export default ListaEstructuras;
