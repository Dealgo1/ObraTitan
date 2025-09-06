// utils/googleDrive.js
import { gapi } from "gapi-script";

// ⚙️ Configuración de OAuth (cliente web de Google)
const CLIENT_ID =
  "893767644955-smtsidj7upr0sdic3k4ghi66e7r1u5ic.apps.googleusercontent.com";

// 🔐 Alcance mínimo: permite crear/gestionar archivos creados por tu app
// (no da acceso a todos los archivos del usuario)
const SCOPES = "https://www.googleapis.com/auth/drive.file";

/**
 * 🚀 iniciarGapi
 * Carga e inicializa el cliente de Google API + Auth2.
 * Debe llamarse una vez al inicio (por ejemplo en App.jsx) antes de subir archivos.
 *
 * @returns {Promise<void>} Resuelve cuando gapi quedó listo.
 */
export const iniciarGapi = () => {
  return new Promise((resolve, reject) => {
    gapi.load("client:auth2", () => {
      gapi.auth2
        .init({
          client_id: CLIENT_ID,
          scope: SCOPES,
        })
        .then(() => resolve())
        .catch((err) => {
          console.error("Error al inicializar gapi.auth2:", err);
          reject(err);
        });
    });
  });
};

/**
 * ⬆️ subirArchivoADrive
 * Sube un archivo a Google Drive usando `multipart upload` y lo deja con permiso de lectura pública.
 *
 * @param {Blob} blob         Archivo en blob (por ejemplo, el .docx que generaste con docx)
 * @param {string} nombreArchivo  Nombre final en Drive (ej: "Resumen_Gastos.docx")
 * @param {Object} [opciones]
 * @param {string} [opciones.mimeType]   MIME del archivo (por defecto .docx)
 * @param {string} [opciones.folderId]   ID de carpeta destino en Drive (opcional)
 * @returns {Promise<string>} URL de visualización en Drive
 */
export const subirArchivoADrive = async (
  blob,
  nombreArchivo,
  opciones = {}
) => {
  // 1) Asegurar sesión iniciada
  const auth = gapi.auth2.getAuthInstance();
  if (!auth.isSignedIn.get()) {
    await auth.signIn(); // puede abrir un popup (ojo con bloqueadores)
  }

  // 2) Access Token actual
  const accessToken = gapi.auth.getToken().access_token;

  // 3) Metadatos del archivo
  const {
    mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    folderId,
  } = opciones;

  const metadata = {
    name: nombreArchivo,
    mimeType,
    ...(folderId ? { parents: [folderId] } : {}), // si se pasa folderId, sube dentro de esa carpeta
  };

  // 4) Construir cuerpo multipart (metadata + archivo)
  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", blob);

  // 5) Subida a Drive (multipart)
  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    console.error("Error al subir archivo:", errorText);
    throw new Error("Falló la subida del archivo a Google Drive");
  }

  const { id: fileId } = await uploadRes.json();

  // 6) Permiso público (cualquiera con el enlace puede VER)
  const permRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    }
  );

  if (!permRes.ok) {
    const errorText = await permRes.text();
    console.error("Error al asignar permisos:", errorText);
    throw new Error("El archivo se subió, pero no se pudo hacerlo público");
  }

  // 7) URL de visualización
  return `https://drive.google.com/file/d/${fileId}/view`;
};
