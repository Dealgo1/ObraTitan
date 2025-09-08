/**
 * Inicio.jsx
 * ------------------------------------------------------------
 * Pantalla de bienvenida de ObraTitan.
 *
 * Funcionalidad:
 * - Muestra animación Lottie (grúa).
 * - Botón para ir a la gestión de proyectos.
 * - Soporte PWA:
 *    - Escucha 'beforeinstallprompt' para mostrar/deferrer el prompt de instalación (Android/desktop).
 *    - Detección de iOS y mensaje educativo para instalar vía "Compartir → Agregar a pantalla de inicio".
 *
 * Notas:
 * - iOS no dispara 'beforeinstallprompt' (Apple limita el flujo PWA), por eso se muestra un tip visual.
 * - El prompt diferido (deferredPrompt) se guarda y se dispara en el click del botón.
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Estilos
import "../ui/Inicio.css";

// Animación (Lottie)
import Lottie from "lottie-react";
import GruaAnimacion from "../../../../assets/iconos/animaciongrua.json";

const Inicio = () => {
  const navigate = useNavigate();

  // === Estado ===
  const [deferredPrompt, setDeferredPrompt] = useState(null); // evento 'beforeinstallprompt' almacenado
  const [isIOS, setIsIOS] = useState(false);                  // detección de iOS
  const [showIOSMessage, setShowIOSMessage] = useState(false); // controla visibilidad del tip de iOS

  useEffect(() => {
    // Detección simple por userAgent (suficiente para hint de instalación)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isiOS);

    // Si es iOS, mostrar tip temporal de instalación
    if (isiOS) {
      setShowIOSMessage(true);
      const t = setTimeout(() => setShowIOSMessage(false), 10000); // Ocultar después de 10s
      // Limpieza por si el componente desmonta antes
      return () => clearTimeout(t);
    }

    // Escucha el evento que permite controlar cuándo mostrar el prompt PWA (Android/desktop)
    const handleBeforeInstall = (e) => {
      e.preventDefault();       // Evita que el navegador muestre el prompt automáticamente
      setDeferredPrompt(e);     // Guardamos el evento para usarlo bajo interacción del usuario
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Limpieza
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  /**
   * handleGoToProjects
   * ----------------------------------------------------------
   * 1) Si hay un deferredPrompt (Android/desktop), lanza el prompt de instalación.
   * 2) Independientemente del resultado, resetea el evento y navega a /proyecto.
   */
  const handleGoToProjects = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Muestra el prompt nativo de instalación
      const result = await deferredPrompt.userChoice; // { outcome: 'accepted' | 'dismissed', platform: ... }
      console.log("Instalación:", result.outcome);
      setDeferredPrompt(null); // Se debe limpiar, el evento no es reutilizable
    }

    // Ir a la vista de proyectos
    navigate("/proyecto");
  };

  return (
    <div className="inicio-container">
      <div className="inicio-contenido-vertical">
        {/* Animación principal */}
        <div className="inicio-animacion">
          <Lottie animationData={GruaAnimacion} loop={true} />
        </div>

        {/* Título y descripción */}
        <h1 className="inicio-titulo">Bienvenido a ObraTitan</h1>

        <p className="inicio-descripcion">
          Gestiona tus proyectos de construcción de forma integral.<br />
          Accede rápidamente a tus proyectos, revisa el progreso y administra documentos.
        </p>

        {/* CTA principal */}
        <button className="btn-principal" onClick={handleGoToProjects}>
          Ir a Gestión de Proyectos
        </button>
      </div>

      {/* Mensaje flotante para iOS con indicaciones de instalación manual */}
      {isIOS && showIOSMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#e3a008",
            color: "#0a0a0a",
            padding: "0.9rem 1.3rem",
            borderRadius: "12px",
            fontSize: "0.95rem",
            fontFamily: "Arapey, serif",
            boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
            maxWidth: "260px",
            zIndex: 1000,
            animation: "fadeinout 10s forwards" // define en CSS global si quieres suavizar
          }}
        >
          Para instalar esta app en iOS:<br />
          Toca <strong>Compartir</strong> y luego <strong>“Agregar a pantalla de inicio”</strong>.
        </div>
      )}
    </div>
  );
};

export default Inicio;
