// src/utils/exportarGastosPDF.js
import jsPDF from "jspdf";

/**
 * 📄 generarPDFGastos
 * 
 * Genera un archivo PDF con el detalle de los gastos de un proyecto.
 * 
 * Estructura:
 *  - Encabezado con el nombre del proyecto
 *  - Listado de cada gasto (categoría, tipo, fecha, monto y archivo adjunto)
 *  - Paginación automática si el contenido supera el alto del documento
 *
 * @param {Array<Object>} gastos - Lista de gastos con estructura { categoria, tipo, fecha, monto, moneda, nombreArchivo }
 * @param {string} nombreProyecto - Nombre del proyecto (aparece en el encabezado)
 * @returns {Blob} - Documento PDF en formato Blob (listo para descarga/guardar)
 */
export const generarPDFGastos = (gastos = [], nombreProyecto = "Proyecto") => {
  // 📄 Crear documento en blanco
  const doc = new jsPDF();

  // 📝 Encabezado
  doc.setFontSize(18);
  doc.text(`Resumen de Gastos - ${nombreProyecto}`, 20, 20);

  // Posición inicial en Y
  let y = 40;

  // 🔁 Iteramos sobre cada gasto
  gastos.forEach((gasto, index) => {
    doc.setFontSize(14);
    doc.text(`#${index + 1} - ${gasto.categoria || "Sin categoría"}`, 20, y);
    y += 8;

    doc.setFontSize(12);
    doc.text(`Tipo: ${gasto.tipo || "N/A"}`, 25, y); y += 6;
    doc.text(`Fecha: ${gasto.fecha || "N/A"}`, 25, y); y += 6;
    doc.text(`Monto: ${gasto.monto} ${gasto.moneda || ""}`, 25, y); y += 6;
    doc.text(`Archivo: ${gasto.nombreArchivo || "N/A"}`, 25, y); y += 10;

    // 📌 Si llegamos al final de la página → añadir nueva página
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  // 💾 Exportar como Blob para descarga o subida
  return doc.output("blob");
};
