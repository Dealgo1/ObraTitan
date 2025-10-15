import React, { useMemo, useState } from "react";
import { guardarProveedor } from "../../../../services/proveedoresService";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../../../components/Sidebar";
import "../../proveedores/ui/FormularioProveedor.css";
import { useAuth } from "../../../../context/authcontext";

/**
 * 📌 FormularioProveedor (teléfono NI + éxito + pagos opcionales)
 */
const FormularioProveedor = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const projectId = location.state?.projectId || localStorage.getItem("projectId");

  // --- UI feedback ---
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: "", msg: "" });
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const [formulario, setFormulario] = useState({
    nombre: "",
    empresa: "",
    servicios: "",
    telefono: "",
    historialPago: {
      monto: "",
      fecha: "",
      estado: "A tiempo",
    },
  });

  const [touched, setTouched] = useState({
    nombre: false,
    empresa: false,
    servicios: false,
    telefono: false,
    monto: false,
    fecha: false,
    estado: false,
  });

  if (!projectId) {
    return (
      <div className="layout-proveedores">
        <Sidebar />
        <h2 className="titulo-fondo-oscuro">⚠️ Proceso inválido</h2>
        <p style={{ color: "#fff" }}>
          No se detectó el ID del proyecto. Vuelve al dashboard del proyecto y desde allí ingresa a proveedores.
        </p>
      </div>
    );
  }

  // --- Helpers ---
  const onlyLetters = (v) =>
    v
      .replace(/\d/g, "")
      .replace(/\s+/g, " ")
      .replace(/[^\p{L}\s.'-ñÑáéíóúÁÉÍÓÚ]/gu, "")
      .trimStart();

  // "####-####" o "+505 ####-####"
  const formatTelefonoNI = (v) => {
    let digits = (v.match(/\d/g) || []).join("");
    let has505 = false;
    if (digits.startsWith("505")) {
      has505 = true;
      digits = digits.slice(3);
    }
    digits = digits.slice(0, 8);
    let local = digits;
    if (local.length > 4) local = `${local.slice(0, 4)}-${local.slice(4)}`;
    return has505 ? (local ? `+505 ${local}` : "+505 ") : local;
  };

  const validateTelefono = (v) => /^(?:\+505\s)?\d{4}-\d{4}$/.test(v);
  const normalizeMonto = (v) => (v ?? "").toString().replace(",", ".");
  const isFuture = (iso) => {
    if (!iso) return false;
    const sel = new Date(`${iso}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sel.getTime() > today.getTime();
  };

  // ¿El usuario está registrando algún pago?
  const montoRaw = normalizeMonto(formulario.historialPago.monto).trim();
  const fechaRaw = (formulario.historialPago.fecha || "").trim();
  const hasPago = (montoRaw !== "") || (fechaRaw !== "");

  // --- Errores ---
  const errors = useMemo(() => {
    const e = {};

    // campos obligatorios
    if (!formulario.nombre.trim()) e.nombre = "El nombre es obligatorio.";
    else if (/\d/.test(formulario.nombre)) e.nombre = "El nombre no debe contener números.";
    else if (formulario.nombre.trim().length < 3) e.nombre = "Mínimo 3 caracteres.";

    if (!formulario.empresa.trim()) e.empresa = "La empresa es obligatoria.";
    else if (/\d/.test(formulario.empresa)) e.empresa = "La empresa no debe contener números.";
    else if (formulario.empresa.trim().length < 2) e.empresa = "Mínimo 2 caracteres.";

    if (!formulario.servicios.trim()) e.servicios = "Describe los servicios ofrecidos.";
    else if (/\d/.test(formulario.servicios)) e.servicios = "No incluyas números en la descripción.";
    else if (formulario.servicios.trim().length < 5) e.servicios = "Mínimo 5 caracteres.";

    if (!formulario.telefono.trim()) e.telefono = "El contacto es obligatorio.";
    else if (!validateTelefono(formulario.telefono)) e.telefono = "Formato NI inválido. Ej: 8440-4123 o +505 8440-4123.";

    // pagos: SOLO se validan si el usuario escribió algo en monto o fecha
    if (hasPago) {
      if (montoRaw !== "") {
        const montoNum = Number(montoRaw);
        if (isNaN(montoNum)) e.monto = "Monto inválido.";
        else if (montoNum <= 0) e.monto = "El monto debe ser mayor que 0.";
        else if (!/^\d{1,9}(\.\d{1,2})?$/.test(montoRaw))
          e.monto = "Hasta 2 decimales y máximo 9 dígitos.";
      }
      if (fechaRaw !== "") {
        if (isFuture(fechaRaw)) e.fecha = "La fecha no puede ser futura.";
      }
      // estado: permitido sólo si hay pago; si usuario lo cambió, debe ser válido
      if (!["A tiempo", "Atrasado"].includes(formulario.historialPago.estado)) {
        e.estado = "Estado inválido.";
      }
    }

    return e;
  }, [formulario, hasPago, montoRaw, fechaRaw]);

  const hasErrors = Object.keys(errors).length > 0;

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("historialPago.")) {
      const campo = name.split(".")[1];
      setFormulario((prev) => ({
        ...prev,
        historialPago: {
          ...prev.historialPago,
          [campo]: campo === "monto" ? normalizeMonto(value) : value,
        },
      }));
      if (campo === "monto") setTouched((t) => ({ ...t, monto: true }));
      if (campo === "fecha") setTouched((t) => ({ ...t, fecha: true }));
      if (campo === "estado") setTouched((t) => ({ ...t, estado: true }));
      return;
    }

    if (name === "nombre" || name === "empresa" || name === "servicios") {
      setFormulario((prev) => ({ ...prev, [name]: onlyLetters(value) }));
    } else if (name === "telefono") {
      setFormulario((prev) => ({ ...prev, telefono: formatTelefonoNI(value) }));
    } else {
      setFormulario((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    if (name === "historialPago.monto") return setTouched((t) => ({ ...t, monto: true }));
    if (name === "historialPago.fecha") return setTouched((t) => ({ ...t, fecha: true }));
    if (name === "historialPago.estado") return setTouched((t) => ({ ...t, estado: true }));
    setTouched((t) => ({ ...t, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      nombre: true,
      empresa: true,
      servicios: true,
      telefono: true,
      monto: true,
      fecha: true,
      estado: true,
    });

    if (hasErrors) {
      setToast({ type: "error", msg: "Revisa los campos marcados en rojo." });
      return;
    }

    // Arma el payload
    let historialPago = null;
    if (hasPago) {
      historialPago = {
        // si alguno viene vacío, lo dejamos en null/"" según tipo
        monto: montoRaw !== "" ? Number(montoRaw) : null,
        fecha: fechaRaw !== "" ? fechaRaw : "",
        estado: formulario.historialPago.estado,
      };
    }

    const proveedor = {
      nombre: formulario.nombre.trim(),
      empresa: formulario.empresa.trim(),
      servicios: formulario.servicios.trim(),
      telefono: formulario.telefono.trim(),
      historialPago, // null si no se registró pago
    };

    try {
      setSaving(true);
      await guardarProveedor(proveedor, projectId, userData?.tenantId);

      setToast({ type: "success", msg: "✅ Proveedor registrado con éxito." });
      setShowSuccessBanner(true);

      setTimeout(() => {
        navigate("/proveedores", { state: { project: { id: projectId } } });
      }, 1200);
    } catch (error) {
      console.error("Error al guardar proveedor:", error?.message || error);
      setToast({
        type: "error",
        msg: error?.message || "No se pudo guardar el proveedor. Intenta de nuevo.",
      });
    } finally {
      setSaving(false);
    }
  };

  // --- UI helpers ---
  const ErrorMsg = ({ show, children }) =>
    show ? (
      <small className="input-error" style={{ color: "#ffb4b4", marginTop: "4px" }}>
        {children}
      </small>
    ) : null;

  const Toast = ({ type, msg }) =>
    type ? (
      <div
        className={`toast ${type}`}
        role="status"
        aria-live="polite"
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 1500,
          padding: "12px 16px",
          borderRadius: 12,
          background: type === "success" ? "rgba(16,185,129,.95)" : "rgba(239,68,68,.95)",
          color: "#fff",
          boxShadow: "0 6px 18px rgba(0,0,0,.25)",
          fontWeight: 600,
        }}
      >
        {msg}
      </div>
    ) : null;

  const SuccessBanner = () =>
    showSuccessBanner ? (
      <div
        className="success-banner"
        style={{
          marginBottom: 12,
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(16,185,129,.15)",
          color: "#10b981",
          fontWeight: 600,
          border: "1px solid rgba(16,185,129,.35)",
        }}
      >
        ✅ Proveedor registrado con éxito.
      </div>
    ) : null;

  return (
    <div className="layout-proveedores">
      <Sidebar />
      <h1 className="titulo-fondo-oscuro">Agregar Proveedor</h1>

      <div className="proveedores-container">
        <div className="proveedor-detalle-card">
          {/* Mensajes */}
          <SuccessBanner />
          <Toast type={toast.type} msg={toast.msg} />

          <form onSubmit={handleSubmit} className="fila-detalle-vertical" noValidate>
            {/* Nombre */}
            <div className="campo-horizontal">
              <label htmlFor="nombre">Nombre:</label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                className={`input-nombre ${touched.nombre && errors.nombre ? "input-invalid" : ""}`}
                value={formulario.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="Ej. Juan Pérez"
                autoComplete="name"
              />
              <ErrorMsg show={touched.nombre && !!errors.nombre}>{errors.nombre}</ErrorMsg>
            </div>

            {/* Empresa */}
            <div className="campo-horizontal">
              <label htmlFor="empresa">Empresa:</label>
              <input
                id="empresa"
                type="text"
                name="empresa"
                className={`input-empresa ${touched.empresa && errors.empresa ? "input-invalid" : ""}`}
                value={formulario.empresa}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="Ej. Constructora XYZ"
                autoComplete="organization"
              />
              <ErrorMsg show={touched.empresa && !!errors.empresa}>{errors.empresa}</ErrorMsg>
            </div>

            {/* Servicios */}
            <div className="campo-horizontal">
              <label htmlFor="servicios">Servicios que ofrece:</label>
              <textarea
                id="servicios"
                name="servicios"
                className={`input-servicios ${touched.servicios && errors.servicios ? "input-invalid" : ""}`}
                value={formulario.servicios}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="Ej. Albañilería, soldadura, electricidad…"
                rows={3}
              />
              <ErrorMsg show={touched.servicios && !!errors.servicios}>{errors.servicios}</ErrorMsg>
            </div>

            {/* Teléfono (Nicaragua) */}
            <div className="campo-horizontal">
              <label htmlFor="telefono">Contacto (NI):</label>
              <input
                id="telefono"
                type="tel"
                name="telefono"
                className={`input-telefono ${touched.telefono && errors.telefono ? "input-invalid" : ""}`}
                value={formulario.telefono}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="Ej. 8440-4123 o +505 8440-4123"
                inputMode="numeric"
                pattern="(?:\+505\s)?\d{4}-\d{4}"
                title="Formato válido: 8440-4123 o +505 8440-4123"
                autoComplete="tel"
              />
              <ErrorMsg show={touched.telefono && !!errors.telefono}>{errors.telefono}</ErrorMsg>
            </div>

            {/* Monto (opcional) */}
            <div className="campo-horizontal">
              <label htmlFor="monto">Monto del último pago <span style={{opacity:.8}}>(opcional)</span>:</label>
              <input
                id="monto"
                type="text"
                name="historialPago.monto"
                className={`input-monto ${touched.monto && errors.monto ? "input-invalid" : ""}`}
                value={formulario.historialPago.monto}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ej. 1200.50"
                inputMode="decimal"
              />
              <ErrorMsg show={touched.monto && !!errors.monto}>{errors.monto}</ErrorMsg>
            </div>

            {/* Fecha (opcional) */}
            <div className="campo-horizontal">
              <label htmlFor="fecha">Fecha del último pago <span style={{opacity:.8}}>(opcional)</span>:</label>
              <input
                id="fecha"
                type="date"
                name="historialPago.fecha"
                className={`input-fecha ${touched.fecha && errors.fecha ? "input-invalid" : ""}`}
                value={formulario.historialPago.fecha}
                onChange={handleChange}
                onBlur={handleBlur}
                max={new Date().toISOString().slice(0, 10)}
              />
              <ErrorMsg show={touched.fecha && !!errors.fecha}>{errors.fecha}</ErrorMsg>
            </div>

            {/* Estado (solo si hay pago) */}
            <div className="campo-horizontal">
              <label htmlFor="estado">Estado del pago:</label>
              <select
                id="estado"
                name="historialPago.estado"
                className={`input-estado ${touched.estado && errors.estado ? "input-invalid" : ""}`}
                value={formulario.historialPago.estado}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={!hasPago}
                aria-disabled={!hasPago}
                title={!hasPago ? "Habilítalo llenando Monto o Fecha" : undefined}
              >
                <option value="A tiempo">A tiempo</option>
                <option value="Atrasado">Atrasado</option>
              </select>
              <ErrorMsg show={touched.estado && !!errors.estado}>{errors.estado}</ErrorMsg>
            </div>

            {/* Botones */}
            <div className="botones-formulario">
              <button
                type="submit"
                className="btn-agregar"
                disabled={saving || hasErrors}
                aria-disabled={saving || hasErrors}
              >
                {saving ? "Guardando…" : "Agregar"}
              </button>
              <button
                type="button"
                className="btn-cancelar"
                onClick={() =>
                  navigate("/proveedores", { state: { project: { id: projectId } } })
                }
                disabled={saving}
              >
                Cancelar
              </button>
            </div>

            {hasErrors && (
              <div className="form-hint" style={{ marginTop: 8, color: "#ffd7d7", fontSize: 13 }}>
                Hay campos con errores. Corrígelos para habilitar el botón <b>Agregar</b>.
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Estilos mínimos */}
      <style>{`
        .input-invalid { border: 1.5px solid #ef4444 !important; outline: none; }
        .btn-agregar[disabled] { opacity: .6; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default FormularioProveedor;
