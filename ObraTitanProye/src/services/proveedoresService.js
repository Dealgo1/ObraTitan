// src/services/proveedoresService.js
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

// 📌 Referencia a la colección principal de proveedores
const coleccion = collection(db, "proveedores");

/**
 * ✅ guardarProveedor
 * Crea un nuevo proveedor en la colección `proveedores`.
 *
 * @param {Object} proveedor - Datos del proveedor (nombre, empresa, servicios, etc.)
 */
export const guardarProveedor = async (proveedor) => {
  await addDoc(coleccion, proveedor);
};

/**
 * ✅ obtenerProveedores
 * Obtiene todos los proveedores asociados a un proyecto específico.
 *
 * @param {string} idProyecto - ID del proyecto al que están vinculados los proveedores.
 * @returns {Array} - Lista de proveedores [{id, ...data}]
 */
export const obtenerProveedores = async (idProyecto) => {
  const q = query(coleccion, where("proyectoId", "==", idProyecto));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * ✅ eliminarProveedor
 * Elimina un proveedor de la colección `proveedores` usando su ID.
 *
 * @param {string} id - ID del proveedor a eliminar.
 */
export const eliminarProveedor = async (id) => {
  const ref = doc(db, "proveedores", id);
  await deleteDoc(ref);
};

/**
 * ✅ actualizarProveedor
 * Actualiza los datos de un proveedor existente.
 *
 * @param {string} id - ID del proveedor a actualizar.
 * @param {Object} datosActualizados - Nuevos valores para actualizar.
 */
export const actualizarProveedor = async (id, datosActualizados) => {
  const ref = doc(db, "proveedores", id);
  await updateDoc(ref, datosActualizados);
};
