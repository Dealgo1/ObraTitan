// firebaseProveedores.js
import { db } from "../services/firebaseconfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

// ✅ Referencia a la colección "proveedores"
const coleccion = collection(db, "proveedores");

/**
 * ✅ Crear un nuevo proveedor en Firestore
 *
 * Esta función guarda un documento en la colección "proveedores"
 * con los datos que se le pasan como argumento.
 *
 * @async
 * @function guardarProveedor
 * @param {Object} proveedor - Objeto con la información del proveedor (nombre, contacto, etc.)
 * @returns {Promise<void>} - No devuelve nada, solo confirma la escritura
 */
export const guardarProveedor = async (proveedor) => {
  await addDoc(coleccion, {
   ...proveedor,
   tenantId,      // <- obligatorio
   projectId,     // <- obligatorio
});
};

/**
 * ✅ Obtener proveedores filtrados por proyecto
 *
 * Esta función consulta todos los proveedores asociados a un `idProyecto`
 * específico dentro de la colección "proveedores".
 *
 * @async
 * @function obtenerProveedores
 * @param {string} idProyecto - ID del proyecto al que pertenecen los proveedores
 * @returns {Promise<Object[]>} - Lista de proveedores en formato de objetos
 *                                con su `id` de documento incluido
 */
export const obtenerProveedores = async (projectId, tenantId) => {
   const q = query(
     coleccion,
     where("tenantId", "==", tenantId),
     where("projectId", "==", projectId)
   );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * ✅ Eliminar un proveedor de Firestore
 *
 * Esta función elimina un documento de la colección "proveedores"
 * usando su ID único.
 *
 * @async
 * @function eliminarProveedor
 * @param {string} id - ID del documento del proveedor a eliminar
 * @returns {Promise<void>} - No devuelve nada, solo confirma la eliminación
 */
export const eliminarProveedor = async (id) => {
  const ref = doc(db, "proveedores", id);
  await deleteDoc(ref);
};

/**
 * ✅ Actualizar los datos de un proveedor
 *
 * Esta función actualiza la información de un proveedor existente
 * en Firestore, sobrescribiendo los campos proporcionados.
 *
 * @async
 * @function actualizarProveedor
 * @param {string} id - ID del documento del proveedor a actualizar
 * @param {Object} datosActualizados - Objeto con los campos a modificar
 * @returns {Promise<void>} - No devuelve nada, solo confirma la actualización
 */
export const actualizarProveedor = async (id, datosActualizados) => {
  const ref = doc(db, "proveedores", id);
  await updateDoc(ref, datosActualizados);
};
