// src/modules/auth/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { appfirebase } from "../../../services/firebaseconfig";
import LoginForm from "./LoginForm";
import "./Login.css";
import logo from "../../../assets/iconos/Logo.png"; // tu logo lateral

const Login = () => {
  const navigate = useNavigate();
  const auth = getAuth(appfirebase);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/inicio");
    } catch (err) {
      setError("Credenciales inválidas o usuario no encontrado.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return setError("Por favor, ingresa tu correo primero.");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Te enviamos un enlace para restablecer tu contraseña.");
    } catch {
      setError("No se pudo enviar el enlace de recuperación.");
    }
  };

  return (
    <div className="ot-login-page">
      <div className="ot-login-card">
        <div className="ot-left">
          <img src={logo} alt="ObraTitan" className="ot-logo" />
          <h1 className="ot-brand">ObraTitan</h1>
          <p className="ot-description">
            Control total de tu obra, sin planillas eternas.
          </p>
          <ul className="ot-features">
            <li>📊 Dashboard y KPIs en tiempo real</li>
            <li>💸 Caja, gastos e ingresos unificados</li>
            <li>📁 Gestión de documentos y planos</li>
          </ul>
        </div>

        <div className="ot-right">
          <LoginForm
            email={email}
            password={password}
            error={error}
            loading={loading}
            setEmail={setEmail}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onSubmit={handleSubmit}
          />

          <button
            className="ot-link"
            onClick={handleForgotPassword}
            type="button"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
