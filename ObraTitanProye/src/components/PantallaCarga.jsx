/**
 * src/components/PantallaCarga.jsx
 * ------------------------------------------------------------
 * Componente visual de "pantalla de carga".
 *
 * Props:
 * - mensaje: string → texto mostrado debajo del loader (default: "Cargando...").
 *
 * Estructura:
 * - Contenedor principal con clase `.pantalla-carga`.
 * - Animación tipo "olas" (wave-loader) compuesta por varios div `.wave`.
 * - Texto de estado debajo de la animación.
 *
 * Estilos:
 * - Los estilos de la animación se definen en PantallaCarga.css.
 * - Cada `.wave` puede tener delays diferentes para simular el movimiento.
 */

import React from "react";
import "../components/PantallaCarga.css"; // Asegúrate que la ruta es correcta

const PantallaCarga = ({ mensaje = "Cargando..." }) => (
  <div className="pantalla-carga">
    {/* Loader con ondas */}
    <div className="wave-loader">
      <div className="wave"></div>
      <div className="wave"></div>
      <div className="wave"></div>
      <div className="wave"></div>
      <div className="wave"></div>
    </div>

    {/* Texto opcional debajo de la animación */}
    <p className="texto-cargando">{mensaje}</p>
  </div>
);

export default PantallaCarga;
