import React, { useEffect, useState } from "react";
import { db } from "../../../../services/firebaseconfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";


const ListaEstructuras = ({ setEstructuraEnEdicion }) => {
  // 📌 Estado que guarda la lista de estructuras obtenidas de Firestore
  const [estructuras, setEstructuras] = useState([]);
  // 📌 Estado temporal para almacenar la estructura seleccionada para eliminar
  const [estructuraAEliminar, setEstructuraAEliminar] = useState(null);

  // 📌 Función para cargar todas las estructuras desde Firestore
  const cargarEstructuras = async () => {
    const snapshot = await getDocs(collection(db, "estructuras"));
    setEstructuras(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // 📌 Abre el popup de confirmación de eliminación
  const confirmarEliminar = (estructura) => {
    setEstructuraAEliminar(estructura);
  };

  // 📌 Elimina una estructura seleccionada de Firestore y actualiza el estado local
  const eliminarEstructura = async () => {
    await deleteDoc(doc(db, "estructuras", estructuraAEliminar.id));
    setEstructuras(prev => prev.filter(e => e.id !== estructuraAEliminar.id));
    setEstructuraAEliminar(null); // cerrar popup
  };

  // 📌 Cargar estructuras al montar el componente
  useEffect(() => {
    cargarEstructuras();
  }, []);

  return (
    <div className="lista-estructuras">
      <h2 className="subtitulo">Estructuras guardadas</h2>

      {/* ✅ Si no hay estructuras, mostrar mensaje */}
      {estructuras.length === 0 ? (
        <p style={{ color: "#ccc" }}>No hay estructuras registradas.</p>
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
                  {/* Cantidad de materiales en esa estructura */}
                  <td>{est.materiales.length}</td>
                  <td>
                    {/* Botón para editar una estructura */}
                    <button
                      className="btn-editar"
                      onClick={() => setEstructuraEnEdicion(est)}
                    >
                      Editar
                    </button>
                    {/* Botón para abrir confirmación de eliminación */}
                    <button
                      className="btn-eliminar"
                      onClick={() => confirmarEliminar(est)}
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

      {/* ✅ Popup de confirmación para eliminar una estructura */}
      {estructuraAEliminar && (
        <ConfirmPopup
          mensaje={`¿Seguro que deseas eliminar "${estructuraAEliminar.nombre}"?`}
          onConfirmar={eliminarEstructura}
          onCancelar={() => setEstructuraAEliminar(null)}
        />
      )}
    </div>
  );
};

export default ListaEstructuras;
