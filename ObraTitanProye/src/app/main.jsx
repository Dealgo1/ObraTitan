/**
 * main.jsx / index.jsx
 * ------------------------------------------------------------
 * Punto de montaje de la aplicación React.
 * - Carga estilos globales.
 * - Crea la raíz de React 18 con createRoot.
 * - Monta <App /> dentro de <StrictMode /> para detectar prácticas inseguras en dev.
 * - Registra el Service Worker (SW) para habilitar PWA (caché, offline, instalación).
 *
 * NOTA: El registro del SW debe ocurrir DESPUÉS del render para no bloquear el arranque.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Estilos globales (orden importa: primero resets/base, luego frameworks, luego CSS propios)
import '../styles/index.css';                                 // Estilos base/globales de tu proyecto
import 'bootstrap/dist/css/bootstrap.min.css';        // Framework CSS (Bootstrap)
import '../features/auth/gastos/ui/GastosForm.css';                  // Estilos específicos del módulo de gastos

// Raíz de la app
import App from './App.jsx';

/**
 * Montaje de la aplicación
 * ------------------------------------------------------------
 * React 18 recomienda createRoot (concurrent features).
 * - document.getElementById('root') debe existir en tu index.html.
 * - StrictMode solo afecta desarrollo: renderiza doble "en silencio"
 *   algunos métodos para ayudarte a detectar side effects no deseados.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/**
 * Registro del Service Worker (PWA)
 * ------------------------------------------------------------
 * - Se ejecuta tras el evento 'load' del window para no bloquear el primer render.
 * - 'serviceWorker' en navigator indica soporte en el navegador.
 * - Ruta '/sw.js': debe estar servida en el scope raíz si quieres controlar toda la app.
 *   (En Vite/Build, asegúrate de copiar/mover sw.js a la carpeta de salida pública).
 *
 * Beneficios del SW:
 * - Cache de assets (mejora performance).
 * - Soporte offline (estrategia cache-first/network-first según tu implementación).
 * - Instalación como app (Add to Home Screen).
 *
 * Requisitos:
 * - HTTPS en producción (o localhost en desarrollo).
 * - Considera versionar tu SW (cambiar el nombre o una constante de versión) para forzar actualización.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js') // Usa '/' si el SW debe controlar toda la origin. Si tu app vive en subcarpeta, ajusta el scope.
      .then(reg => {
        console.log('✅ Service Worker registrado:', reg);

       
      })
      .catch(err => console.error('❌ Error al registrar el Service Worker:', err));
  });
}

