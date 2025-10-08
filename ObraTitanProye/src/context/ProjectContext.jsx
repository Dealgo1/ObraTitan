// ProjectContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

// 1) Crear el contexto
const ProjectContext = createContext();

// 2) Hook de acceso rápido
export const useProject = () => useContext(ProjectContext);

// Helper: convierte posibles Timestamp/Date/obj a ISO string para storage
const normalizeForStorage = (p) => {
  if (!p) return null;
  const copy = { ...p };

  const maybeDates = ["fechaInicio", "fechaFin", "createdAt", "updatedAt"];
  maybeDates.forEach((k) => {
    const v = copy[k];
    if (!v) return;

    // Firestore Timestamp (has toDate)
    if (typeof v?.toDate === "function") {
      try {
        copy[k] = v.toDate().toISOString();
      } catch {
        copy[k] = "";
      }
      return;
    }

    // Objeto con seconds (posible forma serializada de Firestore)
    if (typeof v === "object" && v !== null && typeof v.seconds === "number") {
      try {
        copy[k] = new Date(v.seconds * 1000).toISOString();
      } catch {
        copy[k] = "";
      }
      return;
    }

    // Date nativo
    if (v instanceof Date) {
      copy[k] = v.toISOString();
      return;
    }

    // Si ya es string, dejamos tal cual (asumimos ISO)
    if (typeof v === "string") {
      copy[k] = v;
      return;
    }

    // Para cualquier otro tipo, lo convertimos a string por seguridad
    copy[k] = String(v);
  });

  return copy;
};

// Lee el stored project desde localStorage (no re-hidrates timestamps a Date,
// dejamos ISO strings porque el componente consumidor (formatFechaParaInput)
// acepta strings o Timestamps)
const readFromStorage = () => {
  try {
    const raw = localStorage.getItem("project");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error leyendo project desde localStorage:", err);
    return null;
  }
};

// 3) Provider que envuelve a la app
export const ProjectProvider = ({ children }) => {
  /**
   * Estado inicial del proyecto
   * - Lee de localStorage para mantener la sesión persistente.
   */
  const [project, setProject] = useState(() => {
    return readFromStorage();
  });

  /**
   * Sincronización con localStorage
   * - Cada vez que `project` cambia, lo normalizamos y guardamos en storage.
   */
  useEffect(() => {
    try {
      if (project) {
        const normalized = normalizeForStorage(project);
        localStorage.setItem("project", JSON.stringify(normalized));
      } else {
        localStorage.removeItem("project");
      }
    } catch (err) {
      console.error("Error guardando project en localStorage:", err);
    }
  }, [project]);

  /**
   * Opcional: efecto para detectar si el project en storage cambió (p. ej. en otra pestaña)
   * si querés sincronizar entre pestañas. Lo dejo comentado como referencia.
   */
  /*
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "project") {
        setProject(readFromStorage());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  */

  return (
    <ProjectContext.Provider value={{ project, setProject }}>
      {children}
    </ProjectContext.Provider>
  );
};
