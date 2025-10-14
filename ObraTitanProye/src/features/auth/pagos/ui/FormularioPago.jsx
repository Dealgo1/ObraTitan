/**
 * src/components/.../FormularioPago.jsx
 * ------------------------------------------------------------
 * Formulario para registrar un pago asociado a un proyecto.
 * Versión con VALIDACIONES EXHAUSTIVAS + Accesibilidad + Mensajitos de error.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import "../ui/FormularioPago.css";
import { obtenerProveedores } from "../../../../services/firebaseProveedores";
import { useAuth } from "../../../../context/authcontext";

const METODOS_PERMITIDOS = ["Efectivo", "Transferencia", "Cheque", "Tarjeta"];
const MONEDAS_PERMITIDAS = ["C$", "USD", "EUR"];
const MontoMaximo = 9_999_999.99;

const hoyLocalYMD = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// -------- Utilidades de validación/sanitización --------
const colapsarEspacios = (s) => s.replace(/\s+/g, " ").trim();
const normalizarNombre = (s) =>
  colapsarEspacios(s).replace(/[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ.\-'\s]/g, "");
const normalizarMontoTexto = (s) =>
  colapsarEspacios(String(s ?? "")).replace(",", ".").replace(/[^0-9.]/g, "");

const validarNombre = (v) => {
  const value = colapsarEspacios(v || "");
  if (!value) return "El nombre del proveedor/empleado es obligatorio.";
  if (value.length < 3) return "Debe tener al menos 3 caracteres.";
  if (value.length > 60) return "No puede exceder 60 caracteres.";
  if (!/^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ.\-'\s]+$/.test(value))
    return "Solo letras, espacios y ( . - ' ) son permitidos.";
  return null;
};

const validarMetodo = (v) => {
  if (!v) return "Seleccione un método de pago.";
  if (!METODOS_PERMITIDOS.includes(v)) return "Método de pago no válido.";
  return null;
};

const validarMoneda = (v) => {
  if (!v) return "Seleccione una moneda.";
  if (!MONEDAS_PERMITIDAS.includes(v)) return "Moneda no válida.";
  return null;
};

const validarMonto = (v) => {
  const t = normalizarMontoTexto(v);
  if (!t) return "El monto es obligatorio.";
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return "Monto inválido (máx. 2 decimales).";
  const n = parseFloat(t);
  if (!isFinite(n) || n <= 0) return "El monto debe ser mayor que 0.";
  if (n > MontoMaximo)
    return `El monto no puede exceder ${MontoMaximo.toLocaleString()}.`;
  return null;
};

const validarFecha = (v) => {
  if (!v) return "La fecha es obligatoria.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v))
    return "Formato de fecha inválido (YYYY-MM-DD).";
  const [y, m, d] = v.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  if (Number.isNaN(fecha.getTime())) return "Fecha inválida.";
  const hoy = new Date();
  fecha.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);
  if (fecha > hoy) return "La fecha no puede ser futura.";
  return null;
};

const FormularioPago = ({ onSubmit, nombreProyecto, projectId }) => {
  const { userData } = useAuth(); // userData.tenantId

  // Estado del formulario
  const [proveedorEmpleado, setProveedorEmpleado] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("C$");
  const [fecha, setFecha] = useState("");

  // Proveedores
  const [proveedores, setProveedores] = useState([]);

  // Errores/UX
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [enviando, setEnviando] = useState(false);

  // --- NUEVO: banner/alerta de errores ---
  const [alerta, setAlerta] = useState(null); // { tipo: 'error'|'ok', msg: string }
  const limpiarAlerta = () => setAlerta(null);

  // Refs para enfocar el primer campo inválido
  const refNombre = useRef(null);
  const refMetodo = useRef(null);
  const refMonto = useRef(null);
  const refMoneda = useRef(null);
  const refFecha = useRef(null);

  // Carga proveedores
  useEffect(() => {
    const cargarProveedores = async () => {
      try {
        const lista = await obtenerProveedores(projectId, userData?.tenantId);
        setProveedores(Array.isArray(lista) ? lista : []);
      } catch (error) {
        console.error("Error al cargar proveedores:", error);
      }
    };
    if (projectId && userData?.tenantId) cargarProveedores();
  }, [projectId, userData?.tenantId]);

  // Validación derivada
  const currentErrors = useMemo(() => {
    return {
      proveedorEmpleado: validarNombre(proveedorEmpleado),
      metodoPago: validarMetodo(metodoPago),
      monto: validarMonto(monto),
      moneda: validarMoneda(moneda),
      fecha: validarFecha(fecha),
    };
  }, [proveedorEmpleado, metodoPago, monto, moneda, fecha]);

  const formInvalido = useMemo(
    () => Object.values(currentErrors).some((e) => e !== null),
    [currentErrors]
  );

  // Manejo de cambios con sanitización ligera
  const onNombreChange = (e) => {
    if (/\d/.test(e.key || "")) e.preventDefault?.();
    const val = e.target.value;
    setProveedorEmpleado(normalizarNombre(val));
  };

  const onNombrePaste = (e) => {
    e.preventDefault();
    const texto = (e.clipboardData || window.clipboardData).getData("text");
    setProveedorEmpleado(normalizarNombre(texto));
  };

  const onMontoChange = (e) => {
    const limpio = normalizarMontoTexto(e.target.value);
    setMonto(limpio);
  };

  const focusPrimerError = () => {
    if (currentErrors.proveedorEmpleado) return refNombre.current?.focus();
    if (currentErrors.metodoPago) return refMetodo.current?.focus();
    if (currentErrors.monto) return refMonto.current?.focus();
    if (currentErrors.moneda) return refMoneda.current?.focus();
    if (currentErrors.fecha) return refFecha.current?.focus();
  };

  const primeraFraseError = () => {
    // arma un mensaje amigable con el primer error encontrado
    const orden = [
      "proveedorEmpleado",
      "metodoPago",
      "monto",
      "moneda",
      "fecha",
    ];
    for (const k of orden) {
      if (currentErrors[k]) return currentErrors[k];
    }
    return "Revise los campos resaltados.";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({
      proveedorEmpleado: true,
      metodoPago: true,
      monto: true,
      moneda: true,
      fecha: true,
    });

    if (formInvalido) {
      setErrors(currentErrors);
      focusPrimerError();

      // --- NUEVO: mostrar mensajito/banner arriba ---
      setAlerta({
        tipo: "error",
        msg: `No pudimos agregar el pago. ${primeraFraseError()}`,
      });
      // Ocultar automáticamente en 4s
      window.clearTimeout(handleSubmit._t);
      handleSubmit._t = window.setTimeout(limpiarAlerta, 4000);
      return;
    }

    setEnviando(true);
    try {
      const nombre = colapsarEspacios(proveedorEmpleado);
      const montoText = normalizarMontoTexto(monto);
      const [year, month, day] = fecha.split("-");
      const fechaLocal = new Date(Number(year), Number(month) - 1, Number(day));

      onSubmit({
        proveedorEmpleado: nombre,
        metodoPago,
        monto: montoText, // si necesitas número: parseFloat(montoText)
        moneda,
        fecha: fechaLocal,
      });

      // Mensajito de éxito (opcional)
      setAlerta({
        tipo: "ok",
        msg: "Pago agregado correctamente.",
      });
      window.clearTimeout(handleSubmit._t);
      handleSubmit._t = window.setTimeout(limpiarAlerta, 3000);

      // Si quieres limpiar el formulario, descomenta:
      // setProveedorEmpleado(""); setMetodoPago(""); setMonto(""); setMoneda("C$"); setFecha("");
      // setTouched({});
    } finally {
      setEnviando(false);
    }
  };

  // Sincroniza errores cuando el usuario interactúa
  useEffect(() => {
    setErrors((prev) => ({ ...prev, ...currentErrors }));
  }, [currentErrors]);

  return (
    <form className="formulario-pago" onSubmit={handleSubmit} noValidate>
      {/* Banner/alerta superior */}
      {alerta && (
        <div
          className={`form-alert ${alerta.tipo === "error" ? "is-error" : "is-ok"}`}
          role="alert"
          aria-live="assertive"
        >
          {alerta.msg}
        </div>
      )}

      {/* Encabezado con el nombre del proyecto */}
      <h3 className="form-nombre-proyecto">
        {nombreProyecto || "Proyecto Sin Nombre"}
      </h3>

      {/* Proveedor/Empleado con datalist (autocompletar) */}
      <label htmlFor="inp-proveedor">Proveedor/Empleado:</label>
      <input
        id="inp-proveedor"
        list="proveedores"
        value={proveedorEmpleado}
        onChange={onNombreChange}
        onKeyDown={(e) => {
          if (/\d/.test(e.key)) e.preventDefault();
        }}
        onPaste={onNombrePaste}
        onBlur={() => setTouched((t) => ({ ...t, proveedorEmpleado: true }))}
        aria-invalid={touched.proveedorEmpleado && !!errors.proveedorEmpleado}
        aria-describedby="err-proveedor"
        ref={refNombre}
        inputMode="text"
        autoComplete="name"
        placeholder="Ej. Constructora Juigalpa S.A."
      />
      <datalist id="proveedores">
        {proveedores.map((p) => (
          <option key={p.id} value={p.nombre} />
        ))}
      </datalist>
      {touched.proveedorEmpleado && errors.proveedorEmpleado && (
        <p id="err-proveedor" className="error-message">
          {errors.proveedorEmpleado}
        </p>
      )}

      {/* Método de pago */}
      <label htmlFor="sel-metodo">Método de pago:</label>
      <select
        id="sel-metodo"
        value={metodoPago}
        onChange={(e) => setMetodoPago(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, metodoPago: true }))}
        className="form-select-input"
        aria-invalid={touched.metodoPago && !!errors.metodoPago}
        aria-describedby="err-metodo"
        ref={refMetodo}
      >
        <option value="">Seleccione un método</option>
        {METODOS_PERMITIDOS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      {touched.metodoPago && errors.metodoPago && (
        <p id="err-metodo" className="error-message">
          {errors.metodoPago}
        </p>
      )}

      {/* Monto + Moneda */}
      <label htmlFor="inp-monto">Monto:</label>
      <div className="form-monto-con-moneda">
        <input
          id="inp-monto"
          type="text"
          inputMode="decimal"
          value={monto}
          onChange={onMontoChange}
          onBlur={() => setTouched((t) => ({ ...t, monto: true }))}
          placeholder="0.00"
          aria-invalid={touched.monto && !!errors.monto}
          aria-describedby="err-monto"
          ref={refMonto}
        />
        <select
          id="sel-moneda"
          value={moneda}
          onChange={(e) => setMoneda(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, moneda: true }))}
          className="form-moneda-select"
          aria-invalid={touched.moneda && !!errors.moneda}
          aria-describedby="err-moneda"
          ref={refMoneda}
        >
          {MONEDAS_PERMITIDAS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      {touched.monto && errors.monto && (
        <p id="err-monto" className="error-message">
          {errors.monto}
        </p>
      )}
      {touched.moneda && errors.moneda && (
        <p id="err-moneda" className="error-message">
          {errors.moneda}
        </p>
      )}

      {/* Fecha del pago */}
      <label htmlFor="inp-fecha">Fecha:</label>
      <input
        id="inp-fecha"
        type="date"
        value={fecha}
        max={hoyLocalYMD()}
        onChange={(e) => setFecha(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, fecha: true }))}
        aria-invalid={touched.fecha && !!errors.fecha}
        aria-describedby="err-fecha"
        ref={refFecha}
      />
      {touched.fecha && errors.fecha && (
        <p id="err-fecha" className="error-message">
          {errors.fecha}
        </p>
      )}

      {/* CTA */}
      <div className="form-botones-derecha">
        <button
          type="submit"
          className="form-btn-agregar"
          disabled={formInvalido || enviando}
          aria-disabled={formInvalido || enviando}
          title={formInvalido ? "Complete los campos requeridos" : "Agregar Pago"}
        >
          {enviando ? "Guardando..." : "Agregar Pago"}
        </button>
      </div>
    </form>
  );
};

export default FormularioPago;
