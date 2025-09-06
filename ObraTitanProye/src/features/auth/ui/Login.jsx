/**
 * Login.jsx
 * ------------------------------------------------------------
 * Pantalla de autenticación con dos modos:
 *  - Iniciar Sesión
 *  - Registrarse (crea usuario en Firebase Auth y documento en Firestore)
 *
 * Flujo:
 * - Login: signInWithEmailAndPassword → lee rol desde Firestore (users/{uid}) → redirige por rol.
 * - Registro: createUserWithEmailAndPassword → crea documento users/{uid} con datos básicos y rol "lector".
 *
 * UI:
 * - Tarjeta "flip" (frontal: login | reverso: registro).
 * - Mensajes de error/success.
 *
 * Requisitos:
 * - Firebase inicializado en `../database/firebaseconfig` exportando `appfirebase`.
 * - Colección "users" en Firestore con documentos por UID que contengan `rol`.
 * - Estilos en `../logincss/LoginRegister.css`.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { appfirebase } from "../database/firebaseconfig";
import "../logincss/LoginRegister.css";

const Login = () => {
  // === Estado de UI ===
  const [isFlipped, setIsFlipped] = useState(false); // true → vista de registro, false → login

  // === Campos de formulario ===
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");

  // === Mensajería ===
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // === Navegación y Firebase ===
  const navigate = useNavigate();
  const auth = getAuth(appfirebase);
  const db = getFirestore();

  /** Limpia todos los campos y errores para evitar "arrastre" entre vistas */
  const clearFields = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setNombre("");
    setApellido("");
    setTelefono("");
    setError(null);
  };

  /** Cambia de Login ↔ Registro y resetea campos */
  const handleToggleFlip = (flipState) => {
    setIsFlipped(flipState);
    clearFields();
  };

  /**
   * handleLogin
   * ----------------------------------------------------------
   * 1) Autentica con Firebase Auth (email/password).
   * 2) Busca documento en Firestore: users/{uid}.
   * 3) Lee `rol` y redirige según rol.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // 1) Autenticación
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2) Lectura de datos de usuario (rol) en Firestore
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const { rol } = userSnap.data();

        // 3) Redirección por rol
        if (rol === "lector") navigate("/inicio");
        else if (rol === "contador") navigate("/gastos-overview");
        else if (rol === "ingeniero") navigate("/inicio");
        else if (rol === "administrador") navigate("/inicio");
        else navigate("/inicio"); // Fallback
      } else {
        setError("⚠ Usuario no registrado en la base de datos.");
      }
    } catch (err) {
      setError("⚠ Error al iniciar sesión: " + err.message);
    }
  };

  /**
   * handleRegister
   * ----------------------------------------------------------
   * 1) Validaciones básicas (requeridos y contraseña coincidente).
   * 2) Crea usuario en Firebase Auth.
   * 3) Crea documento de usuario en Firestore con rol "lector".
   * 4) Muestra éxito, resetea y vuelve a la vista de login.
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    // 1) Validaciones
    if (!email || !password || !confirmPassword || !nombre || !apellido || !telefono) {
      return setError("⚠ Todos los campos son obligatorios.");
    }

    if (password !== confirmPassword) {
      return setError("⚠ Las contraseñas no coinciden.");
    }

    try {
      // 2) Crear cuenta en Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 3) Crear documento en Firestore
      await setDoc(doc(db, "users", uid), {
        uid,
        nombre,
        apellido,
        correo: email,
        telefono,
        rol: "lector" // Rol por defecto; ajusta según tu flujo
      });

      // 4) UI de éxito y volver a login
      setSuccessMessage("✅ Registro exitoso");
      setTimeout(() => {
        setSuccessMessage("");
        handleToggleFlip(false);
      }, 2000);
    } catch (err) {
      setError("⚠ Error al registrarse: " + err.message);
    }
  };

  return (
    <div className={`login-container ${isFlipped ? "flipped" : ""}`}>
      {/* Mensaje de éxito flotante */}
      {successMessage && <div className="popup-success">{successMessage}</div>}

      {/* Toggle Login/Registro */}
      <div className="form-toggle mb-4">
        <span
          className={!isFlipped ? "activo" : ""}
          onClick={() => handleToggleFlip(false)}
        >
          Iniciar Sesión
        </span>

        <label className="switch">
          <input
            type="checkbox"
            checked={isFlipped}
            onChange={() => handleToggleFlip(!isFlipped)}
          />
          <span className="slider" />
        </label>

        <span
          className={isFlipped ? "activo" : ""}
          onClick={() => handleToggleFlip(true)}
        >
          Registrarse
        </span>
      </div>

      {/* Tarjeta con caras (frente: login | reverso: registro) */}
      <div className="card-login">
        <div className="card-login-inner">
          {/* ==================== Iniciar Sesión ==================== */}
          <div className="card-front">
            <h2 className="titulo-formulario">Iniciar Sesión</h2>
            {error && <p className="error-msg">{error}</p>}

            <form onSubmit={handleLogin}>
              <div className="input-icon">
                <span className="icon">📧</span>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-icon">
                <span className="icon">🔒</span>
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-formulario">Iniciar Sesión</button>
            </form>
          </div>

          {/* ====================== Registro ======================= */}
          <div className="card-back">
            <h2 className="titulo-formulario">Registrarse</h2>
            {error && <p className="error-msg">{error}</p>}

            <form onSubmit={handleRegister}>
              <div className="input-icon">
                <span className="icon">👤</span>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="input-icon">
                <span className="icon">👥</span>
                <input
                  type="text"
                  placeholder="Apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                />
              </div>

              <div className="input-icon">
                <span className="icon">📧</span>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-icon">
                <span className="icon">📱</span>
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                />
              </div>

              <div className="input-icon">
                <span className="icon">🔒</span>
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="input-icon">
                <span className="icon">🔁</span>
                <input
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-formulario">Registrar</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
