import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../../../../services/firebaseconfig"; // Configuración de Firebase
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Sidebar from "../../../../components/Sidebar";
import flecha from "../../../../assets/iconos/Flecha.png";
import iconoBuscar from "../../../../assets/iconos/search.png";
import {  } from "../../../../services/proveedoresService"; // Reservado por si necesitas servicios extra
import "../../proveedores/ui/ProveedoresOverview.css";

/**
 * 📌 Componente: ProveedoresOverview
 * Vista que muestra el listado de proveedores de un proyecto,
 * permite filtrarlos por nombre/empresa, detecta estado offline
 * y redirige a detalles o agregar un nuevo proveedor.
 */
const ProveedoresOverview = () => {
  // Estado para la lista de proveedores obtenidos de Firestore
  const [proveedores, setProveedores] = useState([]);

  // Estado para el filtro de búsqueda
  const [filtro, setFiltro] = useState("");

  // Estado que indica si el usuario está offline
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const navigate = useNavigate();
  const location = useLocation();

  // Obtenemos el proyecto desde la navegación o localStorage
  const { project } = location.state || {};
  const projectId = project?.id || localStorage.getItem("projectId");

  /**
   * 📌 Hook: detección de conexión
   * Escucha cambios en la conexión a internet y actualiza isOffline.
   */
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Eventos para detectar conexión
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Estado inicial
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /**
   * 📌 Hook: escucha en tiempo real de proveedores
   * Se suscribe a Firestore para recibir cambios en la colección de proveedores
   * del proyecto actual, con soporte para caché offline.
   */
  useEffect(() => {
    const q = query(
      collection(db, "proveedores"),
      where("proyectoId", "==", projectId) // Solo proveedores del proyecto actual
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Mapea los datos de Firestore en un array con id incluido
        const data = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setProveedores(data);

        if (isOffline) {
          console.log("Offline: mostrando datos desde la caché local.");
        }
      },
      (error) => {
        console.error("Error al escuchar proveedores:", error);
        if (isOffline) {
          console.log("Offline: mostrando datos cacheados si están disponibles.");
        } else {
          alert("Error al cargar proveedores: " + error.message);
        }
      }
    );

    return () => unsubscribe(); // Limpieza al desmontar
  }, [projectId, isOffline]);

  /**
   * 📌 handleSelectProveedor
   * Redirige al detalle de un proveedor seleccionado.
   */
  const handleSelectProveedor = (proveedor) => {
    navigate("/detalle-proveedor", { state: { proveedor } });
  };

  /**
   * 📌 handleAgregarProveedor
   * Redirige al formulario para agregar un nuevo proveedor.
   */
  const handleAgregarProveedor = () => {
    navigate("/agregar-proveedor", { state: { projectId } });
  };

  /**
   * 📌 Filtrado de proveedores
   * Se filtra por nombre o empresa en minúsculas.
   */
  const proveedoresFiltrados = proveedores.filter((prov) => {
    const empresa = prov.empresa?.toLowerCase() || "";
    const nombre = prov.nombre?.toLowerCase() || "";
    return (
      empresa.includes(filtro.toLowerCase()) ||
      nombre.includes(filtro.toLowerCase())
    );
  });

  // 📌 Renderizado
  return (
    <div className="layout-proveedores">
      <Sidebar />
      <h1 className="titulo-fondo-oscuro">Proveedores</h1>

      <div className="proveedores-container">
        <div className="proveedores-card">

          {/* 🔍 Barra de búsqueda */}
          <div className="barra-superior-proveedores">
            <div className="input-con-icono">
              <img src={iconoBuscar} alt="Buscar" className="icono-dentro-input" />
              <input
                type="text"
                className="input-busqueda"
                placeholder="Buscar proveedor ..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
          </div>

          {/* 📋 Lista de proveedores */}
          <div className="lista-proveedores">
            {proveedoresFiltrados.map((prov) => (
              <div
                key={prov.id}
                className="proveedor-item"
                onClick={() => handleSelectProveedor(prov)}
              >
                <div className="proveedor-nombre">{prov.empresa}</div>
                <div className="proveedor-arrow">
                  <img src={flecha} alt="Flecha" className="flecha-derecha" />
                </div>
              </div>
            ))}
          </div>

          {/* ➕ Botón para agregar nuevo proveedor */}
          <div className="contenedor-boton-agregar">
            <button
              className="btn-agregar-proveedor"
              onClick={handleAgregarProveedor}
            >
              + Agregar Proveedor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProveedoresOverview;
