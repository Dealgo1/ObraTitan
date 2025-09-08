// src/utils/offlineProjectSync.js

import { updateProject, deleteProject } from "../../../../services/projectsService";

/**
 * Utilidad: Sincronización de cambios en proyectos mientras el usuario estaba offline
 * ------------------------------------------------------------------------------
 * Esta función permite que las operaciones hechas sin conexión (offline)
 * se sincronicen automáticamente con la base de datos al restablecer Internet.
 * 
 * Se manejan **dos tipos de cambios pendientes**:
 * 
 * 1. **Actualizaciones de proyectos**
 *    - Se guardan temporalmente en `localStorage` bajo la clave
 *      `"offlineProjectUpdates"`.
 *    - Formato esperado: un array de objetos `{ id, data }`, donde:
 *        - `id`: string → ID del proyecto a actualizar.
 *        - `data`: object → Campos con los valores modificados.
 *    - Cada proyecto se actualiza usando `updateProject`.
 *    - Si todas las actualizaciones son exitosas, la clave se elimina del storage.
 * 
 * 2. **Eliminación de un proyecto**
 *    - Se guarda temporalmente en `localStorage` bajo la clave
 *      `"offlineProjectDeletion"`.
 *    - Contiene un único string con el ID del proyecto que debe eliminarse.
 *    - Al reconectarse, se llama a `deleteProject(id)` y luego se limpia del storage.
 *
 * 👉 Caso de uso:
 * - Usuario edita o elimina proyectos estando sin conexión.
 * - La app guarda esos cambios en localStorage.
 * - Al volver online, `syncOfflineProjectChanges()` sincroniza automáticamente.
 *
 * @async
 * @function syncOfflineProjectChanges
 * @returns {Promise<void>} No retorna nada explícito. Maneja estado en consola.
 */
export const syncOfflineProjectChanges = async () => {
  // 1. Sincronizar actualizaciones
  const updatesRaw = localStorage.getItem("offlineProjectUpdates");
  if (updatesRaw) {
    try {
      const updates = JSON.parse(updatesRaw);

      for (const { id, data } of updates) {
        await updateProject(id, data);
        console.log(`✅ Proyecto ${id} actualizado.`);
      }

      localStorage.removeItem("offlineProjectUpdates");
    } catch (error) {
      console.error("❌ Error al sincronizar actualizaciones:", error);
    }
  }

  // 2. Sincronizar eliminación
  const deletion = localStorage.getItem("offlineProjectDeletion");
  if (deletion) {
    try {
      await deleteProject(deletion);
      localStorage.removeItem("offlineProjectDeletion");
      console.log(`🗑️ Proyecto ${deletion} eliminado.`);
    } catch (error) {
      console.error("❌ Error al sincronizar eliminación:", error);
    }
  }
};
