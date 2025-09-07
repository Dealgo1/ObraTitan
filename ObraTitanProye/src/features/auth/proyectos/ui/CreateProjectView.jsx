// Importaciones necesarias de React y componentes
import React from "react";
// Importamos el formulario de proyecto (lógica del formulario está en este componente)
import ProjectForm from "../components/ProyectoFuncionalidad/ProjectForm";
// Importamos los estilos específicos para esta vista
import "../ui/CrearProyecto.css"; 

// 🏗️ Vista principal para la creación de proyectos
const CreateProjectView = () => {
  return (
    // Contenedor general con layout definido en CSS
    <div className="layout-proyectos">
      
      {/* Contenedor específico para el formulario de creación */}
      <div className="crear-proyecto-container">
        {/* Componente reutilizable que contiene el formulario */}
        <ProjectForm />
      </div>
    </div>
  );
};

// Exportamos el componente para que pueda ser usado en otras partes de la app
export default CreateProjectView;
