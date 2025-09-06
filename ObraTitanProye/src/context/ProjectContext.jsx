/**
 * ProjectContext.jsx
 * ------------------------------------------------------------
 * Contexto global para el manejo del "proyecto actual".
 *
 * Responsabilidades:
 * - Exponer el proyecto seleccionado (`project`) y su setter (`setProject`).
 * - Mantener persistencia en `localStorage` para que el proyecto
 *   no se pierda al recargar la página.
 *
 * Uso típico:
 *   const { project, setProject } = useProject();
 *   setProject({ id: '123', nombre: 'Proyecto Demo' });
 *
 * Beneficios:
 * - Evita pasar props manualmente a muchos niveles (prop drilling).
 * - Garantiza consistencia de estado en toda la aplicación.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// 1) Crear el contexto
const ProjectContext = createContext();

// 2) Hook de acceso rápido
export const useProject = () => useContext(ProjectContext);

// 3) Provider que envuelve a la app
export const ProjectProvider = ({ children }) => {
  /**
   * Estado inicial del proyecto
   * ------------------------------------------------------------
   * - Lee de localStorage para mantener la sesión persistente.
   * - Si no hay nada en storage → null (ningún proyecto cargado).
   */
  const [project, setProject] = useState(() => {
    const stored = localStorage.getItem("project");
    return stored ? JSON.parse(stored) : null;
  });

  /**
   * Sincronización con localStorage
   * ------------------------------------------------------------
   * Cada vez que `project` cambia:
   * - Si hay un valor válido, lo serializa en localStorage.
   * - Esto asegura que al recargar la página, el proyecto persista.
   */
  useEffect(() => {
    if (project) {
      localStorage.setItem("project", JSON.stringify(project));
    }
  }, [project]);

  /**
   * Proveedor del contexto
   * ------------------------------------------------------------
   * Expone:
   * - project: objeto del proyecto actual (o null si ninguno).
   * - setProject: función para cambiar el proyecto activo.
   */
  return (
    <ProjectContext.Provider value={{ project, setProject }}>
      {children}
    </ProjectContext.Provider>
  );
};
