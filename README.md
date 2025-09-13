# 🏗️ ObraTitan

![Status](https://img.shields.io/badge/Status-En%20Desarrollo-orange)
![Hackathon](https://img.shields.io/badge/Event-Hackatón%202025-blueviolet)
![License](https://img.shields.io/badge/Licencia-Privada-red)

> **ObraTitan** es un sistema web desarrollado durante el **Hackatón 2025**...

> **ObraTitan** es un sistema web desarrollado durante el **Hackatón 2025** para la **gestión integral de proyectos de construcción**.  
> Permite administrar **presupuestos, gastos, pagos, proveedores, usuarios y KPIs** en una sola plataforma.  
> El sistema está preparado como **PWA (Progressive Web App)**: accesible desde cualquier navegador y **con opción de instalación** en móviles y PC.

---

## 📑 Tabla de Contenidos

- [✨ Características principales](#-características-principales)
- [🧩 Arquitectura & Stack](#-arquitectura--stack)
- [📂 Estructura del proyecto](#-estructura-del-proyecto)
- [⚙️ Instalación local](#️-instalación-local)
- [☁️ Despliegue (Hosting)](#️-despliegue-hosting)
- [📲 Instalación como App (PWA)](#-instalación-como-app-pwa)
- [⚙️ Configuración técnica de PWA](#️-configuración-técnica-de-pwa)
- [📄 Ejemplo de manifest.webmanifest](#-ejemplo-de-manifestwebmanifest)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [🧪 Evidencia de control de versiones](#-evidencia-de-control-de-versiones)
- [👥 Equipo de desarrollo](#-equipo-de-desarrollo)
- [🗺️ Roadmap](#️-roadmap)
- [🖊️ Licencia](#️-licencia)

---

<p align="center">
  <img src="https://img.shields.io/badge/React-18+-61DAFB?logo=react&labelColor=20232a" />
  <img src="https://img.shields.io/badge/Vite-5+-646CFF?logo=vite&labelColor=1a1a1a" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-FFCA28?logo=firebase&labelColor=20232a" />
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&labelColor=1a1a1a" />
  <img src="https://img.shields.io/badge/License-MIT-2ea44f?labelColor=1a1a1a" />
</p>

---

## ✨ Características principales
- 📊 **Gestión de proyectos**: creación, edición y panel de estado.  
- 💰 **Presupuestos**: cálculo de costos, materiales y estructuras.  
- 💸 **Gastos & Pagos**: registro, filtros, exportación y reportes PDF/Excel.  
- 🏢 **Proveedores**: alta, listado y detalle.  
- 👥 **Usuarios y roles**: autenticación con Firebase.  
- 📈 **KPIs y estadísticas**: saldo de caja, pagos mensuales, etc.  
- 🌐 **Modo offline**: sincronización con Firestore aun sin internet.  
- 📲 **PWA lista para instalar** en Android, iOS y escritorio.  

---

## 🧩 Arquitectura & Stack
- **Frontend:** React + Vite  
- **Estado global:** Context API (AuthContext, ProjectContext)  
- **Backend as a Service:** Firebase (Auth, Firestore, Hosting opcional)  
- **UI & Gráficas:** CSS modular, Shadcn/UI, Recharts  
- **Hosting recomendado:** Vercel | Netlify | Firebase Hosting  
- **Control de versiones:** GitHub (rama `main`)  

---

## 📂 Estructura del proyecto
```plaintex
ObraTitanProye/
├─ public/
│  ├─ manifest.webmanifest
│  └─ icons/
│     ├─ icon-192.png
│     └─ icon-512.png
├─ src/
│  ├─ app/
│  │  ├─ App.jsx
│  │  └─ main.jsx
│  ├─ components/
│  │  ├─ Sidebar.jsx
│  │  └─ PantallaCarga.jsx
│  ├─ context/
│  │  ├─ authcontext.jsx
│  │  ├─ ProjectContext.jsx
│  │  └─ ProtectedRoute.jsx
│  ├─ features/
│  │  ├─ gastos/ui/...
│  │  ├─ presupuesto/ui/...
│  │  ├─ proveedores/ui/...
│  │  ├─ proyectos/ui/...
│  │  └─ usuarios/ui/...
│  ├─ services/
│  │  ├─ gastosService.js
│  │  ├─ pagosService.js
│  │  ├─ projectsService.js
│  │  ├─ firebaseconfig.js
│  │  └─ proveedoresService.js
│  └─ utils/
│     ├─ exportarGastos.js
│     ├─ offlineSync.js
│     └─ syncProjectChanges.js
└─ package.json
```
---
⚙️ Instalación local
Requisitos

Node.js 18+

NPM o PNPM
```
# 1. Clonar el repositorio
git clone https://github.com/<tu-usuario>/ObraTitan.git
cd ObraTitan/ObraTitanProye

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus claves de Firebase
```
---
.env.example
```jsx
VITE_APIKEY=xxxxx
VITE_AUTHDOMAIN=xxxxx.firebaseapp.com
VITE_PROJECTID=xxxxx
VITE_STORAGEBUCKET=xxxxx.appspot.com
VITE_MESSAGINGSENDERID=xxxxx
VITE_APPID=1:xxxx:web:xxxx
```
---
Ejecutar en desarrollo
```
npm run dev
```
---
App disponible en:
---
Build de producción
```
npm run build
npm run preview
```
---
☁️ Despliegue (Hosting)

La app puede desplegarse en cualquier servicio con HTTPS (requisito PWA).

🔹 Vercel

- Framework detectado: Vite

- Build command: npm run build

- Output: dist

- Variables ENV: VITE_* en Project Settings → Environment Variables
---
🔹 Netlify

- Build command: npm run build

- Publish directory: dist

- Variables ENV: VITE_*
---
🔹 Firebase Hosting
```jsx
npm install -g firebase-tools
firebase login
firebase init hosting   # carpeta 'dist', SPA: Yes
npm run build
firebase deploy
```
---
SPA fallback: configurar _redirects (Netlify) o rewrites (Firebase) → todas las rutas apuntan a index.html

---
## 📲 Instalación como App (PWA)

**ObraTitan** está diseñada como **Progressive Web App (PWA)**, lo que permite a los usuarios instalarla en dispositivos móviles y de escritorio para usarla como si fuera una aplicación nativa.

### 🔹 Pasos de instalación por plataforma

- **📱 Android (Chrome / Edge):**  
  Abrir el sitio → Menú ⋮ → **“Instalar app”**  
  *(En algunos casos aparecerá un banner automático con la opción de instalación).*

- **🍏 iOS (Safari):**  
  Abrir el sitio → Botón **Compartir** → **“Añadir a pantalla de inicio”**

- **💻 Escritorio (Chrome / Edge):**  
  Abrir el sitio → Icono de instalación 📥 en la barra de direcciones → **“Instalar ObraTitan”**

✨ Una vez instalada, la aplicación funcionará en **modo standalone**, sin barra del navegador, y se podrá abrir directamente desde el **menú de apps, pantalla de inicio o dock** del dispositivo

---
## ⚙️ Configuración técnica de PWA

Para que **ObraTitan** sea instalable como aplicación, deben cumplirse estos requisitos:

1. 🌐 **Servir el proyecto bajo HTTPS**  
   (obligatorio para que los navegadores permitan instalación como PWA).

2. 📄 **Tener un archivo `manifest.webmanifest` válido**  
   Incluyendo nombre, short_name, íconos, start_url y theme_color.

3. 🔧 **Registrar un Service Worker en producción**  
   Este archivo se encarga de manejar caché, offline y actualización de la app.

### Ejemplo de registro del Service Worker (`main.jsx`)
```jsx
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => console.log('✅ Service Worker registrado correctamente'))
      .catch(err => console.error('❌ Error al registrar el SW:', err));
  });
}

```
---

## 📄 Ejemplo de `manifest.webmanifest`

Este archivo define la configuración de la PWA y cómo se instalará en los dispositivos del usuario.  

```json
{
  "name": "ObraTitan",
  "short_name": "ObraTitan",
  "description": "Sistema web para la gestión integral de proyectos de construcción: presupuestos, gastos, pagos, proveedores y KPIs.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#0d47a1",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}

```
---

## 🛠️ Troubleshooting

Algunos problemas comunes y cómo resolverlos:

- ❌ **No aparece la opción “Instalar app”**  
  ✔️ Verifica que el sitio esté en **HTTPS**, que el **Service Worker** se haya registrado correctamente y que exista un `manifest.webmanifest` válido.  
  👉 Revisa en **DevTools → Application → Manifest / Service Workers**.

- ❌ **Error: SW MIME type (`text/html`)**  
  ✔️ Asegúrate de que `/sw.js` se sirva como **`text/javascript`** y no como HTML.  
  👉 Este error suele ocurrir cuando el hosting devuelve un `index.html` en lugar del archivo real del SW.

- ❌ **Firebase: `auth/invalid-api-key`**  
  ✔️ Verifica que las variables en `.env` estén correctas y que el dominio (localhost o producción) esté agregado en  
  **Firebase Console → Authentication → Settings → Authorized domains**.

- ❌ **Rutas rotas en hosting (404 en páginas internas)**  
  ✔️ Habilita **SPA fallback** a `index.html`.  
  👉 Ejemplos:  
  - **Netlify:** agregar un archivo `_redirects` con la línea:  
    ```
    /*    /index.html   200
    ```  
  - **Firebase Hosting:** en `firebase.json` configurar:  
    ```json
    {
      "hosting": {
        "rewrites": [
          { "source": "**", "destination": "/index.html" }
        ]
      }
    }
    ```



---

## 🧪 Evidencia de control de versiones

El proyecto **ObraTitan** se gestionó íntegramente en **GitHub**, aplicando buenas prácticas de control de versiones:

- 📂 **Repositorio central en GitHub** → todo el código fuente se encuentra alojado de forma pública y accesible.  
- 🌿 **Trabajo colaborativo en la rama `main`** → estrategia elegida para el hackatón, priorizando la rapidez de integración.  
- 📝 **Commits frecuentes y descriptivos** → cada avance documentado con mensajes claros, facilitando la trazabilidad del desarrollo.  
- 📊 **Participación validada en `Insights → Contributors`** → evidencia de la colaboración activa de los integrantes.  
- ⚡ **Resolución de conflictos en local** → se optó por integrar directamente en `main` y resolver conflictos antes de cada *push*, reduciendo riesgos durante el tiempo limitado del hackatón.  

---




## 👥 Equipo de desarrollo

El éxito de **ObraTitan** fue posible gracias a la sinergia, compromiso y habilidades complementarias de sus integrantes:

- 👩‍💻 **Daniela Baltodano**  
  *Especialista en gestión de usuarios y proyectos.*  
  Lideró la **arquitectura de sincronización offline** y la integración de contextos globales, garantizando una experiencia fluida incluso sin conexión a internet.  

- 👨‍💻 **Yamil García**  
  *Especialista en finanzas y analítica de datos.*  
  Responsable de los módulos de **gastos, proveedores, pagos y KPIs**, asegurando el control preciso de la información financiera del sistema.  

✨ Juntos conformamos un equipo ágil, orientado a resultados y con la visión de llevar **ObraTitan** a convertirse en una plataforma robusta para la gestión integral de proyectos de construcción.


---

## 🗺️ Roadmap

La evolución de **ObraTitan** contempla nuevas funcionalidades que potenciarán su valor y alcance:

- 🔐 **Roles avanzados y auditoría de cambios**  
  Mayor control sobre permisos y registro detallado de actividades para garantizar seguridad y trazabilidad.

- 📤 **Exportaciones configurables (CSV / XLSX / PDF)**  
  Flexibilidad para generar reportes personalizados según las necesidades de cada proyecto.

- 🔔 **Notificaciones y recordatorios**  
  Alertas automáticas sobre plazos, pagos pendientes y actualizaciones clave en los proyectos.

- 🏢 **Soporte multiempresa / multicuenta**  
  Escalabilidad para que una misma plataforma administre distintos proyectos y organizaciones de forma independiente.



---


## 🖊️ Licencia

Este proyecto es **propiedad exclusiva del equipo desarrollador de ObraTitan**.  
Queda **prohibida su copia, distribución, uso o modificación** sin la autorización expresa de sus creadores.  

© 2025 **ObraTitan** — Todos los derechos reservados.  
*Innovando en la gestión de la construcción con tecnología propia, pensada para crecer y ser comercializada como una solución profesional.*


