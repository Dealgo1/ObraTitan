import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../../../../services/firebaseconfig";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Sidebar from "../../../../components/Sidebar";
import PantallaCarga from "../../../../components/PantallaCarga"; // ⬅️ IMPORTANTE
import flecha from "../../../../assets/iconos/flecha.png";
import iconoBuscar from "../../../../assets/iconos/search.png";
import { } from "../../../../services/proveedoresService";
import "../../proveedores/ui/ProveedoresOverview.css";
import { useAuth } from "../../../../context/authcontext";

const ProveedoresOverview = () => {
  const [proveedores, setProveedores] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isLoading, setIsLoading] = useState(true); // ⬅️ Loader ON

  const navigate = useNavigate();
  const location = useLocation();

  // Evita crash si no viene state
  const { project } = (location && location.state) || {};
  const projectId = project?.id || localStorage.getItem("projectId");

  const { userData } = useAuth(); // tenantId aquí

  // Conectividad
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Mantén loader si falta contexto
  useEffect(() => {
    if (!projectId || !userData?.tenantId) setIsLoading(true);
  }, [projectId, userData?.tenantId]);

  // Snapshot (apaga loader al primer resultado)
  useEffect(() => {
    if (!projectId || !userData?.tenantId) return;

    setIsLoading(true);
    const q = query(
      collection(db, "proveedores"),
      where("tenantId", "==", userData.tenantId),
      where("projectId", "==", projectId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProveedores(data);
        setIsLoading(false); // ⬅️ ya cargó
        if (isOffline) console.log("Offline: datos desde caché.");
      },
      (error) => {
        console.error("Error al escuchar proveedores:", error);
        setIsLoading(false);
        if (!isOffline) alert("Error al cargar proveedores: " + error.message);
      }
    );

    return () => unsubscribe();
  }, [projectId, userData?.tenantId, isOffline]);

  const handleSelectProveedor = (proveedor) => {
    navigate("/detalle-proveedor", { state: { proveedor } });
  };

  const handleAgregarProveedor = () => {
    navigate("/agregar-proveedor", { state: { projectId } });
  };

  const proveedoresFiltrados = proveedores.filter((prov) => {
    const empresa = prov.empresa?.toLowerCase() || "";
    const nombre = prov.nombre?.toLowerCase() || "";
    const needle = filtro.toLowerCase();
    return empresa.includes(needle) || nombre.includes(needle);
  });

  // === Renders con loader/guards ===
  if (!projectId || !userData?.tenantId) {
    return (
      <div className="layout-proveedores">
        <Sidebar />
        <PantallaCarga mensaje="Obteniendo contexto del proyecto..." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="layout-proveedores">
        <Sidebar />
        <PantallaCarga mensaje="Cargando proveedores..." />
      </div>
    );
  }

  return (
    <div className="layout-proveedores">
      <Sidebar />
      <h1 className="titulo-fondo-oscuro">Proveedores</h1>

      <div className="proveedores-container">
        <div className="proveedores-card">
          {/* 🔍 Búsqueda */}
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
            {isOffline && (
              <span className="badge-offline" title="Modo sin conexión">Offline</span>
            )}
          </div>

          {/* 📋 Lista */}
          <div className="lista-proveedores">
            {proveedoresFiltrados.length === 0 ? (
              <div className="estado-vacio">
                {filtro
                  ? "No se encontraron proveedores que coincidan con la búsqueda."
                  : "Aún no has agregado proveedores en este proyecto."}
              </div>
            ) : (
              proveedoresFiltrados.map((prov) => (
                <div
                  key={prov.id}
                  className="proveedor-item"
                  onClick={() => handleSelectProveedor(prov)}
                >
                  <div className="proveedor-nombre">{prov.empresa || prov.nombre}</div>
                  <div className="proveedor-arrow">
                    <img src={flecha} alt="Flecha" className="flecha-derecha" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ➕ Agregar */}
          <div className="contenedor-boton-agregar">
            <button className="btn-agregar-proveedor" onClick={handleAgregarProveedor}>
              + Agregar Proveedor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProveedoresOverview;
