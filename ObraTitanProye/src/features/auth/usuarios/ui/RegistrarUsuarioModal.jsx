import React, { useState, useMemo } from "react";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getApp, initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { useAuth } from "../../../../context/authcontext";
import "../ui/RegistrarUsuarioModal.css";

const ROLES_PERMITIDOS = new Set(["lector", "administrador", "ingeniero", "contador"]);

// Helpers de validación
const emailRegex =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
const phoneRegex = /^\d{4}-\d{4}$/;

const limpiarEspacios = (s) => s?.replace(/\s+/g, " ").trim() ?? "";

/** Formatea a ####-#### mientras escribe */
const formatearTelefono = (raw) => {
  const digits = (raw || "").replace(/\D/g, "").slice(0, 8); // solo 8 dígitos
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

const RegistrarUsuarioModal = ({ onClose }) => {
  const db = getFirestore();
  const { userData, user } = useAuth();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [rol, setRol] = useState("lector");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const campos = useMemo(
    () => ({
      nombre: limpiarEspacios(nombre),
      apellido: limpiarEspacios(apellido),
      correo: limpiarEspacios(correo).toLowerCase(),
      telefono: telefono, // ya viene formateado por onChange
      fechaNacimiento,
      rol,
      password,
      password2,
    }),
    [nombre, apellido, correo, telefono, fechaNacimiento, rol, password, password2]
  );

  const validar = () => {
    if (!userData?.tenantId) return "No se encontró el tenantId.";
    if (!campos.nombre || campos.nombre.length < 2) return "Ingresa un nombre válido (mínimo 2 caracteres).";
    if (!campos.apellido || campos.apellido.length < 2) return "Ingresa un apellido válido (mínimo 2 caracteres).";
    if (!campos.correo || !emailRegex.test(campos.correo)) return "Correo inválido.";
    if (!ROLES_PERMITIDOS.has(campos.rol)) return "Rol no permitido.";
    // Teléfono es opcional, pero si viene debe cumplir ####-####
    if (campos.telefono && !phoneRegex.test(campos.telefono)) return "El teléfono debe tener formato 8440-4123.";
    if (!campos.password || campos.password.length < 6)
      return "La contraseña debe tener mínimo 6 caracteres.";
    if (campos.password !== campos.password2) return "Las contraseñas no coinciden.";
    // fechaNacimiento opcional; si quieres, puedes validar rango aquí
    return "";
  };

  const handlePhoneChange = (e) => setTelefono(formatearTelefono(e.target.value));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg("");

    const error = validar();
    if (error) {
      setErrorMsg(error);
      return;
    }

    setLoading(true);
    let secondaryApp;

    try {
      // Inicializar app secundaria para no afectar la sesión del admin actual
      const primaryApp = getApp();
      secondaryApp = initializeApp(primaryApp.options, "secondary-" + Date.now());
      const secondaryAuth = getAuth(secondaryApp);

      // Crear usuario en Auth
      const cred = await createUserWithEmailAndPassword(secondaryAuth, campos.correo, campos.password);
      const uid = cred.user.uid;

      // Guardar perfil en /users
      await setDoc(doc(db, "users", uid), {
        nombre: campos.nombre,
        apellido: campos.apellido,
        correo: campos.correo,
        telefono: campos.telefono || null,
        fechaNacimiento: campos.fechaNacimiento || null,
        rol: campos.rol,
        tenantId: userData.tenantId,
        creadoPor: user?.uid || null,
        creadoEn: serverTimestamp(),
      });

      // Cerrar sesión del app secundario y limpiar
      try {
        await signOut(secondaryAuth);
      } catch (e) {
        // ignorar error de signOut en app secundaria
        console.warn("Warn signOut secondary:", e);
      }
      try {
        await deleteApp(secondaryApp);
      } catch (e) {
        console.warn("Warn deleteApp secondary:", e);
      }

      alert("✅ Usuario registrado correctamente.");
      onClose?.();
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Error al registrar usuario.");
      // Limpieza del app secundario si quedó vivo
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (e) {
          console.warn("Warn deleteApp (catch):", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Registrar nuevo usuario</h2>

        {errorMsg && <div className="alerta-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="form-grid" noValidate>
          <div>
            <label>Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              minLength={2}
              autoComplete="given-name"
            />
          </div>

          <div>
            <label>Apellido</label>
            <input
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
              minLength={2}
              autoComplete="family-name"
            />
          </div>

          <div className="full">
            <label>Correo</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              inputMode="email"
              autoComplete="email"
            />
          </div>

          <div>
            <label>Teléfono (opcional)</label>
            <input
              value={telefono}
              onChange={handlePhoneChange}
              inputMode="numeric"
              maxLength={9}                  /* ####-#### */
              pattern="\d{4}-\d{4}"
              title="Formato: 8440-4123"
             
            />
          </div>

          <div>
            <label>Fecha nacimiento (opcional)</label>
            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
            />
          </div>

          <div className="full">
            <label>Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="lector">Lector</option>
              <option value="administrador">Administrador</option>
              <option value="ingeniero">Ingeniero</option>
              <option value="contador">Contador</option>
            </select>
          </div>

          <div>
            <label>Contraseña</label>
            <div className="password-field">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPass ? "Ocultar" : "Mostrar"}
              >
                {showPass ? "🧱" : "🚧"}
              </button>
            </div>
          </div>

          <div>
            <label>Repetir contraseña</label>
            <div className="password-field">
              <input
                type={showPass2 ? "text" : "password"}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPass2((s) => !s)}
                aria-label={showPass2 ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPass2 ? "Ocultar" : "Mostrar"}
              >
                {showPass2 ? "🧱" : "🚧"}
              </button>
            </div>
          </div>

          <div className="acciones full">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Registrando..." : "Registrar"}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrarUsuarioModal;
