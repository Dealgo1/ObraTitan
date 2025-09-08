// 📦 Importaciones necesarias
import React from "react";
import Sidebar from "../../../../components/Sidebar"; // Barra lateral de navegación
import { AlertCircle } from "lucide-react"; // Icono de alerta de la librería lucide-react
import "../ui/NoAutorizado.css"; // Estilos específicos de esta vista

// 🛑 Vista para mostrar mensaje de acceso denegado
const NoAutorizado = () => {
  return (
    <div className="dashboard-container">
      {/* 📌 Sidebar reutilizable */}
      <Sidebar />

      {/* Contenido principal de la vista */}
      <div className="contenido-principal no-autorizado">
        <div className="no-autorizado-card">
          {/* Icono de advertencia */}
          <AlertCircle className="icono-alerta" size={64} />

          {/* Mensaje principal */}
          <h1>Acceso Denegado</h1>
          <p>No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    </div>
  );
};

// Exportamos la vista para poder usarla en rutas u otros componentes
export default NoAutorizado;
