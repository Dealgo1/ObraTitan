// services/projectsService.js
import { db } from "../services/firebaseconfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Obtiene el tenantId del usuario actual.
 * 1) Intenta leerlo de localStorage (OBT_TENANT)
 * 2) Si no está, lo busca en Firestore: users/{uid}.tenantId
 * 3) Si lo encuentra, lo guarda en localStorage para próximas veces.
 */
export const getTenantId = async () => {
  const auth = getAuth();
  const uid = auth.currentUser?.uid || null;

  let tenantId = localStorage.getItem("OBT_TENANT") || null;
  if (!tenantId && uid) {
    try {
      const uref = doc(db, "users", uid);
      const usnap = await getDoc(uref);
      if (usnap.exists()) {
        tenantId = usnap.data()?.tenantId || null;
        if (tenantId) localStorage.setItem("OBT_TENANT", tenantId);
      }
    } catch (_) {
      // Silencioso: si falla, retornará null y el caller decidirá qué hacer.
    }
  }
  return tenantId;
};

/**
 * Crea un nuevo proyecto (con documentos base64 opcionales)
 * projectData: { nombre, descripcion, cliente, presupuesto, moneda, ... }
 * Siempre agrega: tenantId y createdAt (serverTimestamp).
 */
export const createProject = async (projectData) => {
  const tenantId =
    projectData?.tenantId || localStorage.getItem("OBT_TENANT");

  if (!tenantId) {
    throw new Error("Falta tenantId (no hay sesión/tenant).");
  }

  const newProject = {
    ...projectData,
    tenantId,
    createdAt: serverTimestamp(), // timestamp del servidor
  };

  const ref = await addDoc(collection(db, "projects"), newProject);
  return ref.id;
};

/**
 * Lista proyectos SOLO del tenant actual.
 * - Si no pasas tenantId, lo intentará resolver con getTenantId().
 * - sortByCreated=true agrega orderBy('createdAt','desc') → REQUIERE índice compuesto.
 */
export async function getProjects(tenantId, sortByCreatedAt = false) {
  const q = query(
    collection(db, "projects"),
    where("tenantId", "==", tenantId)
  );
  const snap = await getDocs(q);
  let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (sortByCreatedAt) {
    data.sort((a, b) => {
      const A = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ?? 0) * 1000;
      const B = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ?? 0) * 1000;
      return B - A; // desc
    });
  }
  return data;
}

/**
 * Actualiza un proyecto.
 * - Evita sobrescribir tenantId accidentalmente.
 * - Si envías base64Files, se guardan en projectData.documentos.
 */
export const updateProject = async (projectId, projectData, base64Files) => {
  const update = { ...projectData };
  if (base64Files && base64Files.length > 0) {
    update.documentos = base64Files;
  }
  delete update.tenantId; // nunca permitir cambiar tenantId

  const projectDocRef = doc(db, "projects", projectId);
  await updateDoc(projectDocRef, update);
};

/** Elimina un proyecto por ID. */
export const deleteProject = async (projectId) => {
  const projectDocRef = doc(db, "projects", projectId);
  await deleteDoc(projectDocRef);
};

/** Obtiene un proyecto por ID (o null si no existe). */
export const getProjectById = async (projectId) => {
  if (!projectId) return null;
  const ref = doc(db, "projects", projectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};
