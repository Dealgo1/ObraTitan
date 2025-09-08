import { db } from "../services/firebaseconfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

/**
 * 📌 createGasto
 * Crea un nuevo gasto en la colección `gastos`.
 * 
 * @param {Object} gastoData - Datos del gasto (monto, fecha, categoría, projectId, etc.)
 * @returns {string} - ID autogenerado del documento creado.
 */
export const createGasto = async (gastoData) => {
  const docRef = await addDoc(collection(db, "gastos"), {
    ...gastoData,
    createdAt: new Date(), // se registra cuándo se creó
  });
  return docRef.id;
};

/**
 * 📌 getGastos
 * Obtiene todos los gastos de la colección `gastos`.
 * Si se recibe un `projectId`, filtra solo los gastos de ese proyecto.
 * 
 * @param {string} [projectId] - ID del proyecto (opcional)
 * @returns {Array} - Lista de objetos gasto [{id, ...data}]
 */
export const getGastos = async (projectId) => {
  let q;

  if (projectId) {
    // Filtra por proyecto
    q = query(collection(db, "gastos"), where("projectId", "==", projectId));
  } else {
    // Obtiene todos los gastos sin filtro
    q = collection(db, "gastos");
  }

  const querySnapshot = await getDocs(q);
  const gastos = [];

  querySnapshot.forEach((docu) => {
    gastos.push({ id: docu.id, ...docu.data() });
  });

  return gastos;
};

/**
 * 📌 updateGasto
 * Actualiza los datos de un gasto existente.
 * También guarda la fecha de edición en el campo `updatedAt`.
 * 
 * @param {string} gastoId - ID del documento a actualizar
 * @param {Object} gastoData - Nuevos datos del gasto
 */
export const updateGasto = async (gastoId, gastoData) => {
  const gastoDoc = doc(db, "gastos", gastoId);
  await updateDoc(gastoDoc, {
    ...gastoData,
    updatedAt: new Date(), // se registra cuándo fue modificado
  });
};

/**
 * 📌 deleteGasto
 * Elimina un gasto de la colección `gastos` usando su ID.
 * 
 * @param {string} gastoId - ID del documento a eliminar
 */
export const deleteGasto = async (gastoId) => {
  const gastoDoc = doc(db, "gastos", gastoId);
  await deleteDoc(gastoDoc);
};
