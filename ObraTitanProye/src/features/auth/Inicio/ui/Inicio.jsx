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
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSMessage, setShowIOSMessage] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isiOS);

    if (isiOS) {
      setShowIOSMessage(true);
      setTimeout(() => {
        setShowIOSMessage(false);
      }, 10000); // Ocultar después de 10s
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleGoToProjects = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      console.log("Instalación:", result.outcome);
      setDeferredPrompt(null);
    }

    navigate("/proyecto");
  };

  return (
    <div className="inicio-container">
      <div className="inicio-contenido-vertical">
        <div className="inicio-animacion">
          <Lottie animationData={GruaAnimacion} loop={true} />
        </div>

        <h1 className="inicio-titulo">Bienvenido a ObraTitan</h1>

        <p className="inicio-descripcion">
          Gestiona tus proyectos de construcción de forma integral.<br />
          Accede rápidamente a tus proyectos, revisa el progreso y administra documentos.
        </p>

        <button className="btn-principal" onClick={handleGoToProjects}>
          Ir a Gestión de Proyectos
        </button>
      </div>

      {/* ✅ Mensaje flotante solo en iOS con animación */}
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
            animation: "fadeinout 10s forwards"
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
