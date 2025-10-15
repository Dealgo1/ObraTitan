import React, { useEffect, useMemo, useRef, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../../../services/firebaseconfig"; // <-- ajusta si tu config exporta diferente
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../../../context/authcontext";

const ROLES_PERMITIDOS = ["administrador", "ingeniero", "contador", "lector"];
const EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NOMBRE_REGEX =
  /^[A-Za-zÁ-ÖØ-öø-ÿÑñ'.\-\s]{3,60}$/; // letras, espacios, tildes, . - '
const TEL_REGEX = /^[0-9+\-\s()]{7,20}$/;

const defaultForm = {
  nombre: "",
  apellido: "",
  correo: "",
  telefono: "",
  rol: "",
  password: "",
  confirmPassword: "",
};

const RegistrarUsuarioModal = ({ onClose }) => {
  const { userData } = useAuth(); // debe contener tenantId y (opcional) info del admin
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef(null);
  const firstFieldRef = useRef(null);

  // ---- Accesibilidad: enfocar primer campo y manejar ESC
  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ---- Cerrar si hacen click fuera de la tarjeta
  const onOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  // ---- Validaciones
  const validate = (draft = form) => {
    const v = {};

    // nombre / apellido
    const nombre = (draft.nombre || "").trim().replace(/\s+/g, " ");
    const apellido = (draft.apellido || "").trim().replace(/\s+/g, " ");
    if (!nombre) v.nombre = "Nombre es requerido.";
    else if (!NOMBRE_REGEX.test(nombre))
      v.nombre = "Solo letras/espacios (3–60).";
    if (!apellido) v.apellido = "Apellido es requerido.";
    else if (!NOMBRE_REGEX.test(apellido))
      v.apellido = "Solo letras/espacios (3–60).";

    // correo
    if (!draft.correo) v.correo = "Correo es requerido.";
    else if (!EMAIL_REGEX.test(draft.correo))
      v.correo = "Formato de correo inválido.";

    // teléfono
    if (draft.telefono && !TEL_REGEX.test(draft.telefono))
      v.telefono = "Teléfono inválido.";

    // rol
    if (!draft.rol) v.rol = "Rol es requerido.";
    else if (!ROLES_PERMITIDOS.includes(draft.rol))
      v.rol = "Rol no permitido.";

    // password
    // Reglas: min 8, al menos 1 may, 1 min, 1 número
    const pass = draft.password || "";
    if (!pass) v.password = "Contraseña requerida.";
    else {
      if (pass.length < 8) v.password = "Mínimo 8 caracteres.";
      if (!/[a-z]/.test(pass) || !/[A-Z]/.test(pass) || !/[0-9]/.test(pass)) {
        v.password = (v.password ? v.password + " " : "") +
          "Debe incluir mayúscula, minúscula y número.";
      }
    }

    if (!draft.confirmPassword) v.confirmPassword = "Confirma la contraseña.";
    else if (draft.confirmPassword !== draft.password)
      v.confirmPassword = "Las contraseñas no coinciden.";

    // tenantId
    if (!userData?.tenantId) v.tenant = "Falta tenantId del usuario actual.";

    return v;
  };

  const isValid = useMemo(() => Object.keys(validate()).length === 0, [form]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onBlurField = (e) => {
    const { name } = e.target;
    const nextErrors = validate();
    setErrors((prev) => ({ ...prev, [name]: nextErrors[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      // Enfoca el primer campo con error
      const firstErrorKey = Object.keys(nextErrors)[0];
      const el = modalRef.current?.querySelector(`[name="${firstErrorKey}"]`);
      el?.focus();
      return;
    }

    setSubmitting(true);
    try {
      // 1) Crear en Firebase Auth
      const cred = await createUserWithEmailAndPassword(
        auth,
        form.correo,
        form.password
      );

      // 2) Crear documento en Firestore
      const uid = cred.user.uid;
      const payload = {
        uid,
        nombre: form.nombre.trim().replace(/\s+/g, " "),
        apellido: form.apellido.trim().replace(/\s+/g, " "),
        correo: form.correo.toLowerCase(),
        telefono: form.telefono || "",
        rol: form.rol,
        tenantId: userData.tenantId,
        estado: "activo",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // flags útiles en tu app
        mustChangePassword: false,
      };

      await setDoc(doc(db, "users", uid), payload);

      // 3) Feedback y cerrar
      alert("Usuario registrado correctamente.");
      onClose?.();
    } catch (err) {
      console.error("Error registrando usuario:", err);
      let msg = "No se pudo registrar el usuario.";
      // mensajes más amigables
      if (String(err?.code).includes("auth/email-already-in-use")) {
        msg = "Ese correo ya está registrado.";
      }
      if (String(err?.code).includes("auth/weak-password")) {
        msg = "La contraseña es demasiado débil.";
      }
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="registrar-modal__overlay" onClick={onOverlayClick}>
      <div className="registrar-modal__card" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="reg-title">
        <header className="registrar-modal__header">
          <h2 id="reg-title">Registrar usuario (login)</h2>
          <button
            className="registrar-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <form className="registrar-modal__form" onSubmit={handleSubmit} noValidate>
          <div className="registrar-modal__grid">
            <div className="registrar-field">
              <label htmlFor="nombre">Nombre*</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                ref={firstFieldRef}
                value={form.nombre}
                onChange={onChange}
                onBlur={onBlurField}
                placeholder="Nombre"
                autoComplete="given-name"
              />
              {errors.nombre && <small className="error">{errors.nombre}</small>}
            </div>

            <div className="registrar-field">
              <label htmlFor="apellido">Apellido*</label>
              <input
                id="apellido"
                name="apellido"
                type="text"
                value={form.apellido}
                onChange={onChange}
                onBlur={onBlurField}
                placeholder="Apellido"
                autoComplete="family-name"
              />
              {errors.apellido && <small className="error">{errors.apellido}</small>}
            </div>

            <div className="registrar-field">
              <label htmlFor="correo">Correo*</label>
              <input
                id="correo"
                name="correo"
                type="email"
                value={form.correo}
                onChange={onChange}
                onBlur={onBlurField}
                placeholder="ejemplo@correo.com"
                autoComplete="email"
              />
              {errors.correo && <small className="error">{errors.correo}</small>}
            </div>

            <div className="registrar-field">
              <label htmlFor="telefono">Teléfono</label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={form.telefono}
                onChange={onChange}
                onBlur={onBlurField}
                placeholder="+505 8888-8888"
                autoComplete="tel"
              />
              {errors.telefono && <small className="error">{errors.telefono}</small>}
            </div>

            <div className="registrar-field">
              <label htmlFor="rol">Rol*</label>
              <select
                id="rol"
                name="rol"
                value={form.rol}
                onChange={onChange}
                onBlur={onBlurField}
              >
                <option value="">Seleccione un rol…</option>
                {ROLES_PERMITIDOS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {errors.rol && <small className="error">{errors.rol}</small>}
            </div>

            <div className="registrar-field registrar-field--password">
              <label htmlFor="password">Contraseña*</label>
              <div className="password-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={onChange}
                  onBlur={onBlurField}
                  placeholder="Mín. 8 caracteres"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && <small className="error">{errors.password}</small>}
            </div>

            <div className="registrar-field registrar-field--password">
              <label htmlFor="confirmPassword">Confirmar contraseña*</label>
              <div className="password-wrap">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPass2 ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={onChange}
                  onBlur={onBlurField}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass2((s) => !s)}
                  aria-label={showPass2 ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass2 ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.confirmPassword && (
                <small className="error">{errors.confirmPassword}</small>
              )}
            </div>
          </div>

          <div className="registrar-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={submitting || !isValid}
              aria-busy={submitting ? "true" : "false"}
            >
              {submitting ? "Registrando…" : "Registrar usuario"}
            </button>
          </div>

          {/* Hint de reglas de password */}
          <p className="password-hint">
            La contraseña debe tener al menos 8 caracteres e incluir
            mayúsculas, minúsculas y números.
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegistrarUsuarioModal;
