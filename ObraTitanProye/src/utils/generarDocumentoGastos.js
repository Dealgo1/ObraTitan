import { Document, Packer, Paragraph, TextRun, ImageRun } from "docx";
import * as htmlToImage from "html-to-image";

/**
 * 📄 generarDocumentoGastos
 * Genera un archivo .docx con:
 *  - Título del reporte (nombre del proyecto)
 *  - Captura en imagen de la tabla HTML de gastos (id="tabla-gastos-export")
 *  - Resumen de totales (ingresos, egresos y balance)
 *
 * @param {Array<Object>} gastos - Lista de movimientos. Cada item debe incluir al menos { tipo: "ingreso"|"gasto", monto }
 * @param {string} nombreProyecto - Nombre del proyecto para el encabezado del reporte
 * @returns {Promise<Blob>} - Blob del documento .docx listo para descargar/guardar
 */
export const generarDocumentoGastos = async (gastos, nombreProyecto) => {
  // 🧮 Cálculo de totales a partir del arreglo de gastos
  const totalIngresos = gastos
    .filter((g) => g.tipo === "ingreso")
    .reduce((sum, g) => sum + Number(g.monto || 0), 0);

  const totalEgresos = gastos
    .filter((g) => g.tipo === "gasto")
    .reduce((sum, g) => sum + Number(g.monto || 0), 0);

  const balance = totalIngresos - totalEgresos;

  // 🔎 Buscamos la tabla HTML que queremos exportar como imagen dentro del Word
  const tabla = document.getElementById("tabla-gastos-export");
  if (!tabla) throw new Error("La tabla no está disponible para exportar.");

  // 📸 Convertimos la tabla HTML → imagen PNG en base64 (dataURL)
  const dataUrl = await htmlToImage.toPng(tabla);

  // 🧱 Pasamos el dataURL a Blob y luego a ArrayBuffer (formato que docx espera para ImageRun)
  const imageBlob = await fetch(dataUrl).then((res) => res.blob());
  const imageBuffer = await imageBlob.arrayBuffer();

  // 🧾 Construcción del documento .docx
  const doc = new Document({
    sections: [
      {
        children: [
          // Título del reporte
          new Paragraph({
            children: [
              new TextRun({
                text: `Resumen de Gastos - ${nombreProyecto}`,
                bold: true,
                size: 32,        // tamaño de fuente (medio punto: 32 => 16pt aprox.)
                color: "2E74B5", // azul tipo encabezado
              }),
            ],
          }),

          // Espacio en blanco
          new Paragraph(" "),

          // Inserción de la imagen con la tabla capturada
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 600, // ancho de la imagen en px dentro del documento
                  height: 320 // alto de la imagen en px (ajusta según proporción real)
                },
              }),
            ],
          }),

          // Espacio en blanco
          new Paragraph(" "),

          // Totales
          new Paragraph({
            children: [
              new TextRun({
                text: `Total Ingresos: ${totalIngresos} NIO`,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Total Egresos: ${totalEgresos} NIO`,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Balance Final: ${balance} NIO`,
                bold: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  // 💾 Devuelve el Blob del .docx (útil para descargar o subir)
  return await Packer.toBlob(doc);
};
