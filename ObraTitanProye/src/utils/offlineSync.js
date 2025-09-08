/**
 * Utilidad: Sincronización de proyectos en modo offline
 * ----------------------------------------------------------------
 * Este módulo permite detectar si el usuario creó un proyecto sin
 * conexión a Internet y guardarlo temporalmente en `localStorage`.
 * 
 * Cuando la conexión se restablece, se ejecuta la función
 * `syncOfflineProjects`, que:
 *   1. Revisa si existe un proyecto almacenado en `localStorage`
 *      bajo la clave `"offlineProject"`.
 *   2. Si lo encuentra, convierte la cadena JSON a objeto.
 *   3. Llama al servicio `createProject` para guardar el proyecto
 *      en la base de datos (Firebase / backend).
 *   4. Si la sincronización es exitosa, elimina el proyecto local.
 *   5. Si ocurre un error, lo muestra en consola para debug.
 *
 * 👉 Caso de uso:
 * - Guardar proyectos en local al estar offline.
 * - Al detectar reconexión (`window.addEventListener("online", ...)`)
 *   ejecutar `syncOfflineProjects()` para sincronizar automáticamente.
 */

import { createProject } from "../../../../services/projectsService";

/**
 * Sincroniza proyectos almacenados localmente al recuperar conexión.
 * 
 * @function syncOfflineProjects
 * @returns {Promise<void>} Nada explícito. Loguea el estado en consola.
 */
export const syncOfflineProjects = () => {
  // 1. Revisa si hay un proyecto en localStorage
  const offlineProject = localStorage.getItem("offlineProject");

  if (offlineProject) {
    const projectData = JSON.parse(offlineProject);

    // 2. Intenta guardarlo en la base de datos
    createProject(projectData)
      .then(() => {
        console.log("✅ Proyecto sincronizado correctamente");
        localStorage.removeItem("offlineProject"); // 3. Limpia el localStorage
      })
      .catch((err) => {
        console.error("❌ Error al sincronizar proyecto:", err);
      });
  }
};
