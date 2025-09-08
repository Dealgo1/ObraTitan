import { db } from "../database/firebaseconfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * ✅ Obtener categorías por proyecto desde Firestore
 *
 * Esta función consulta un documento en la colección "categorias"
 * utilizando el ID del proyecto como identificador.
 *
 * - Si el documento existe, devuelve el arreglo de categorías guardado en la propiedad `lista`.
 * - Si el documento no existe, devuelve un conjunto de categorías por defecto:
 *   ["Materiales", "Mano de obra", "Transporte"].
 *
 * @param {string} projectId - ID único del proyecto
 * @returns {Promise<string[]>} - Lista de categorías asociadas al proyecto
 */
export const getCategoriasPorProyecto = async (projectId) => {
  const ref = doc(db, "categorias", projectId); // Referencia al documento
  const snap = await getDoc(ref); // Obtener snapshot del documento

  if (snap.exists()) {
    // Si el documento existe, retornar las categorías guardadas
    return snap.data().lista || [];
  } else {
    // Si no existe, retornar categorías por defecto
    return ["Materiales", "Mano de obra", "Transporte"];
  }
};

/**
 * ✅ Guardar una nueva categoría en Firestore
 *
 * Esta función agrega una nueva categoría al listado de categorías
 * de un proyecto dentro de la colección "categorias".
 *
 * - Si el documento no existe, se inicializa con las categorías por defecto.
 * - Si la categoría no existe ya en la lista, se agrega y se sobrescribe el documento.
 * - Si la categoría ya existe, simplemente se devuelve la lista sin cambios.
 *
 * @param {string} projectId - ID único del proyecto
 * @param {string} nuevaCategoria - Nombre de la nueva categoría a agregar
 * @returns {Promise<string[]>} - Lista actualizada de categorías
 */
export const guardarNuevaCategoria = async (projectId, nuevaCategoria) => {
  const ref = doc(db, "categorias", projectId); // Referencia al documento
  const snap = await getDoc(ref); // Obtener snapshot del documento

  // Categorías por defecto en caso de que no exista el documento
  let categorias = ["Materiales", "Mano de obra", "Transporte"];

  if (snap.exists()) {
    // Si el documento existe, recuperar la lista actual
    categorias = snap.data().lista || categorias;
  }

  // Verificar si la categoría ya está en la lista
  if (!categorias.includes(nuevaCategoria)) {
    categorias.push(nuevaCategoria); // Agregar nueva categoría
    await setDoc(ref, { lista: categorias }); // Guardar lista actualizada en Firestore
  }

  return categorias; // Devolver lista final (actualizada o no)
};
