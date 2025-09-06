// src/utils/exportarGastos.js
import { Document, Packer, Paragraph, TextRun, ImageRun } from "docx";
import htmlToImage from "html-to-image";

/**
 * 📄 generarDocumentoGastos
 * 
 * Genera un archivo Word (.docx) con el resumen de gastos de un proyecto.
 * Incluye:
 *  - Encabezado con el nombre del proyecto
 *  - Imagen de la tabla de gastos capturada del DOM (id="tabla-gastos")
 *  - Totales de ingresos, egresos y balance final
 *
 * @param {Array<Object>} gastos - Lista de objetos con { tipo, monto }
 * @param {string} nombreProyecto - Nombre del proyecto a mostrar en el reporte
 * @returns {Promise<Blob>} Documento en formato .docx listo para descargar
 */
export const generarDocumentoGastos = async (gastos, nombreProyecto) => {
  try {
    // 🔎 Captura del nodo de la tabla por ID
    const tablaNode = document.getElementById("tabla-gastos");
    if (!tablaNode) throw new Error("No se encontró la tabla de gastos");

    // 📸 Convertimos el nodo HTML en imagen PNG
    const dataUrl = await htmlToImage.toPng(tablaNode);

    // 📦 Pasamos de dataURL → Blob → ArrayBuffer (docx espera buffer en ImageRun)
    const response = await fetch(dataUrl);
    const blobImage = await response.blob();
    const arrayBuffer = await blobImage.arrayBuffer();

    // 🧮 Cálculos de resumen
    const totalIngresos = gastos
      .filter((g) => g.tipo === "ingreso")
      .reduce((acc, g) => acc + Number(g.monto || 0), 0);

    const totalEgresos = gastos
      .filter((g) => g.tipo === "gasto")
      .reduce((acc, g) => acc + Number(g.monto || 0), 0);

    const balance = totalIngresos - totalEgresos;

    // 📑 Construcción del documento Word
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Encabezado
            new Paragraph({
              children: [
                new TextRun({
                  text: `Resumen de Gastos - ${nombreProyecto}`,
                  bold: true,
                  size: 32,       // tamaño de fuente (medio punto → 16pt aprox.)
                  color: "2E74B5" // azul corporativo
                }),
              ],
              spacing: { after: 300 },
            }),

            // Imagen de la tabla
            new Paragraph({
              children: [
                new ImageRun({
                  data: arrayBuffer,
                  transformation: {
                    width: 650,
                    height: 300,
                  },
                }),
              ],
              spacing: { after: 400 },
            }),

            // Totales
            new Paragraph({
              children: [
                new TextRun({ text: `Total Ingresos: ${totalIngresos} NIO`, bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Total Egresos: ${totalEgresos} NIO`, bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Balance Final: ${balance} NIO`, bold: true }),
              ],
            }),
          ],
        },
      ],
    });

    // 💾 Empaquetar el documento en un Blob descargable
    const blob = await Packer.toBlob(doc);
    return blob;
  } catch (error) {
    console.error("Error al generar documento:", error);
    throw error;
  }
};
