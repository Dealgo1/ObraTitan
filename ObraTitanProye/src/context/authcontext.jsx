/**
 * authcontext.jsx
 * ------------------------------------------------------------
 * Contexto global de Autenticación + Estado de Conectividad + Perfil (userData).
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { appfirebase, db } from "../services/firebaseconfig"; // 👈 asegúrate que exportas db

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);               // Usuario Firebase
  const [isLoggedIn, setIsLoggedIn] = useState(false);  // Bool autenticación
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [loading, setLoading] = useState(true);         // 👈 Cargando auth + perfil
  const [userData, setUserData] = useState(null);       // 👈 Documento de perfil (rol, nombre, etc.)
  const [role, setRole] = useState(null);               // 👈 Rol derivado

  useEffect(() => {
    const auth = getAuth(appfirebase);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      setIsLoggedIn(!!fbUser);

      if (!fbUser) {
        // Sesión cerrada
        setUserData(null);
        setRole(null);
        setLoading(false);
        return;
      }

      // Sesión abierta: cargar perfil desde Firestore
      setLoading(true);
      setLoading(true);
try {
  // 1) Perfil principal en 'users/{uid}'
  const ref1 = doc(db, "users", fbUser.uid);
  let snap = await getDoc(ref1);

  // 2) Fallback opcional a 'usuarios/{uid}' SIN romper si falla permisos
  if (!snap.exists()) {
    try {
      const ref2 = doc(db, "usuarios", fbUser.uid);
      const snap2 = await getDoc(ref2);
      if (snap2.exists()) snap = snap2;
    } catch (_) {
      // silencio: no tenemos permisos/colección y seguimos sin abortar
    }
  }

  if (snap.exists()) {
    const data = { id: snap.id, ...snap.data() };
    setUserData(data);

    const derivedRole =
      data.rol ??
      data.role ??
      fbUser?.role ??
      fbUser?.claims?.role ??
      fbUser?.claims?.rol ??
      null;
    setRole(derivedRole);
  } else {
    setUserData(null);
    setRole(null);
  }
} catch (err) {
  console.error("Error cargando perfil de usuario:", err);
  setUserData(null);
  setRole(null);
} finally {
  setLoading(false);
}

    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    const auth = getAuth(appfirebase);
    await signOut(auth);
    setIsLoggedIn(false);
    setUserData(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, isOffline, loading, userData, role, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
