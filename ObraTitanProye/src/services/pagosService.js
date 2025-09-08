// src/services/pagosService.js
import { collection, addDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../services/firebaseconfig";

/**
 * 📌 registrarPagoComoGasto
 * Registra un pago y lo relaciona directamente con la colección de gastos.
 *
 * Flujo:
 * 1. Crea un documento en `gastos` con los datos del pago.
 * 2. Crea un documento en `pagos` que referencia al gasto creado.
 * 3. (Opcional) Duplica el gasto en la subcolección `pagos` dentro del proyecto.
 *
 * @param {Object} pago - Datos del pago realizado.
 * @param {string} projectId - ID del proyecto al que pertenece el pago.
 */
export const registrarPagoComoGasto = async (pago, projectId) => {
  // Convierte la fecha a string legible (YYYY-MM-DD)
  const fechaStr = pago.fecha.toISOString().split("T")[0];

  // 1️⃣ Crear gasto (se guarda en la colección principal "gastos")
  const gastoData = {
    tipo: "gasto",
    categoria: pago.metodoPago || "Pago",
    proveedorEmpleado: pago.proveedorEmpleado,
    monto: parseFloat(pago.monto),
    moneda: pago.moneda === "C$" ? "NIO" : pago.moneda, // normaliza moneda
    fecha: fechaStr,
    projectId,
    esPago: true, // marca que este gasto proviene de un pago
    createdAt: Timestamp.now(),
  };

  const gastoRef = await addDoc(collection(db, "gastos"), gastoData);

  // 2️⃣ Crear pago (referencia directa al gasto creado)
  const pagoDoc = {
    proveedorEmpleado: pago.proveedorEmpleado,
    metodoPago: pago.metodoPago,
    monto: parseFloat(pago.monto),
    moneda: pago.moneda,
    fecha: Timestamp.fromDate(pago.fecha),
    creado: Timestamp.now(),
    projectId,
    gastoId: gastoRef.id, // Relación directa al gasto
  };

  await addDoc(collection(db, "pagos"), pagoDoc);

  // 3️⃣ Guardar en subcolección del proyecto (opcional)
  const subref = collection(doc(db, "projects", projectId), "pagos");
  await addDoc(subref, gastoData);
};
