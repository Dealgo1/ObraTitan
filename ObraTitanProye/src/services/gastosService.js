// src/services/gastosService.js
// -----------------------------------------------------------------------------
// Servicio de gastos (gastos + ingresos) con seguridad multitenant.
// Este módulo cumple con tus reglas Firestore que exigen:
//  - Campo tenantId en los documentos.
//  - Campo proyectoId (¡no "projectId"!) para relacionar con /projects/{id}.
//  - Las lecturas filtran por tenantId y proyectoId.
// -----------------------------------------------------------------------------
//
// NOTA DE MIGRACIÓN:
// Si ya tienes documentos viejos con `projectId` y sin `tenantId`, esas
// lecturas/escrituras fallarán con "Missing or insufficient permissions".
// Migra esos documentos para que tengan:
//   { proyectoId: projectId, tenantId: <tenant del usuario> }
//
// POSIBLES ÍNDICES COMPUESTOS:
// La query por (tenantId, proyectoId) puede pedirte crear un índice compuesto.
// Si Firestore te muestra un enlace de "Create index", síguelo y créalo.
//

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
  serverTimestamp,
} from "firebase/firestore";

/**
 * Crea un nuevo registro de transacción (gasto o ingreso).
 *
 * Requisitos de las reglas:
 *  - Debe incluirse tenantId y proyectoId, y ambos deben pertenecer al usuario.
 *
 * @param {Object} data - Datos de la transacción.
 *   Ejemplo:
 *   {
 *     tipo: 'gasto' | 'ingreso',
 *     monto: number,
 *     moneda: 'NIO' | 'USD' | 'EUR',
 *     categoria?: string,
 *     nota?: string,
 *     fecha?: string | Date (opcional; si no, se usa serverTimestamp),
 *     ...cualquier otro metadato
 *   }
 * @param {string} tenantId - ID del tenant del usuario autenticado.
 * @param {string} proyectoId - ID del proyecto al que pertenece la transacción.
 * @returns {Promise<string>} id del documento creado.
 */
export const createGasto = async (data, tenantId, projectId) => {
   if (!tenantId) throw new Error("createGasto: falta tenantId");
  if (!projectId) throw new Error("createGasto: falta projectId");
   const { tenantId: _ti, projectId: _pi, createdAt: _ca, updatedAt: _ua, ...rest } = data || {};

  const ref = await addDoc(collection(db, "gastos"), {
    ...rest,
    tenantId,          // ← requerido por reglas
    projectId,        // ← requerido por reglas
    createdAt: serverTimestamp(),
  });

  return ref.id;
};

/**
 * Obtiene transacciones del proyecto del usuario (gastos + ingresos).
 * Filtra SIEMPRE por tenantId y proyectoId para cumplir las reglas.
 *
 * @param {string} proyectoId
 * @param {string} tenantId
 * @returns {Promise<Array<{id: string} & any>>}
 */
export const getGastos = async (projectId, tenantId) => {
  if (!tenantId) throw new Error("getGastos: falta tenantId");
  if (!projectId) throw new Error("getGastos: falta projectId");

  const q = query(
    collection(db, "gastos"),
    where("tenantId", "==", tenantId),
    where("projectId", "==", projectId)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * (Opcional) Obtiene solo gastos o solo ingresos.
 *
 * @param {string} proyectoId
 * @param {string} tenantId
 * @param {'gasto'|'ingreso'} tipo
 * @returns {Promise<Array<{id: string} & any>>}
 */
export const getGastosByTipo = async (projectId, tenantId, tipo) => {
  if (!tenantId) throw new Error("getGastosByTipo: falta tenantId");
 if (!projectId) throw new Error("getGastosByTipo: falta projectId");

  const q = query(
    collection(db, "gastos"),
    where("tenantId", "==", tenantId),
     where("projectId", "==", projectId),
    where("tipo", "==", tipo)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Actualiza una transacción existente.
 * Por seguridad, NO permitimos modificar tenantId ni proyectoId desde aquí.
 *
 * @param {string} gastoId
 * @param {Object} data - Campos a actualizar (sin tenantId/proyectoId)
 */
export const updateGasto = async (gastoId, data) => {
  if (!gastoId) throw new Error("updateGasto: falta gastoId");

  // Descartamos cambios de identidad
  const { tenantId: _ti, projectId: _pi, createdAt: _ca, ...rest } = data || {};

  await updateDoc(doc(db, "gastos", gastoId), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Elimina una transacción por id.
 * (Las reglas validarán tenantId/proyectoId del documento antes de permitir borrar)
 *
 * @param {string} gastoId
 */
export const deleteGasto = async (gastoId) => {
  if (!gastoId) throw new Error("deleteGasto: falta gastoId");
  await deleteDoc(doc(db, "gastos", gastoId));
};
