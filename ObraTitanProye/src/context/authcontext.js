/**
 * authcontext.jsx
 * ------------------------------------------------------------
 * Contexto global de Autenticación + Estado de Conectividad.
 *
 * Responsabilidades:
 * - Exponer el usuario autenticado de Firebase (`user`) y flags útiles:
 *   - `isLoggedIn`: booleano derivado de `user`.
 *   - `isOffline`: booleano de conectividad (offline/online).
 * - Suscribirse a cambios de sesión con `onAuthStateChanged`.
 * - Detectar cambios de conectividad con eventos `online`/`offline`.
 * - Proveer `logout()` usando `signOut` de Firebase Auth.
 *
 * Cómo usar:
 *   const { user, isLoggedIn, isOffline, logout } = useAuth();
 *
 * Requisitos:
 * - Haber inicializado Firebase en `./firebaseconfig` exportando `appfirebase`.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { appfirebase } from "./firebaseconfig";

// 1) Crear el contexto
const AuthContext = createContext();

// 2) Hook de comodidad para consumir el contexto
export const useAuth = () => useContext(AuthContext);

// 3) Provider que envuelve a la app y expone el valor del contexto
export const AuthProvider = ({ children }) => {
  // === Estado ===
  const [user, setUser] = useState(null);              // Objeto de usuario Firebase o null
  const [isLoggedIn, setIsLoggedIn] = useState(false); // true si hay usuario autenticado
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // true si está sin conexión

  useEffect(() => {
    // Instancia de Auth a partir de la app de Firebase
    const auth = getAuth(appfirebase);

    /**
     * Handlers de conectividad
     * - Se disparan cuando cambia el estado de la red del navegador.
     */
    const handleOnline = () => {
      setIsOffline(false);
      console.log("¡Conexión restablecida!");
      alert("¡Conexión restablecida!"); // TIP: podrías reemplazar 'alert' por un toast no bloqueante
    };

    const handleOffline = () => {
      setIsOffline(true);
      console.log("Estás offline. Los cambios se sincronizarán cuando vuelvas a conectarte.");
      alert("Estás offline. Los cambios se sincronizarán cuando vuelvas a conectarte.");
    };

    // Suscripción a eventos del navegador
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Inicializa el flag de conectividad por si el efecto monta en estado offline
    setIsOffline(!navigator.onLine);

    /**
     * Suscripción a cambios de autenticación de Firebase.
     * - Actualiza `user` y `isLoggedIn` en tiempo real.
     * - Devuelve `unsubscribe` para limpiar la suscripción al desmontar.
     */
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoggedIn(!!user);
    });

    // Limpieza: evita fugas de memoria y handlers duplicados
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, []); // Se ejecuta solo una vez al montar el provider

  /**
   * logout()
   * ----------------------------------------------------------
   * Cierra la sesión del usuario actual en Firebase.
   * - Resetea `isLoggedIn` localmente después de `signOut`.
   */
  const logout = async () => {
    const auth = getAuth(appfirebase);
    await signOut(auth);   // Firebase se encargará de invalidar la sesión
    setIsLoggedIn(false);  // Refleja el estado local inmediatamente
  };

  // Valor expuesto al resto de la aplicación
  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isOffline, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
