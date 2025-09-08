import React from "react";

const MaterialList = ({ materiales, onEliminar }) => {
  return (
    <div className="lista-materiales">
      {/* 🔄 Recorremos la lista de materiales */}
      {materiales.map((mat, index) => (
        <div key={index} className="material-item">
          
          {/* 📸 Mostrar imagen en miniatura si existe */}
          {mat.imagen && (
            <img src={mat.imagen} alt={mat.nombre} className="imagen-mini" />
          )}

          {/* 📋 Información del material */}
          <div>
            <strong>{mat.nombre}</strong> ({mat.unidad}) <br />
            Costo unitario: C${mat.precio} × {mat.cantidad} ={" "}
            <b>C${(mat.precio * mat.cantidad).toFixed(2)}</b>
          </div>

          {/* ❌ Botón para eliminar un material de la lista */}
          <button
            onClick={() => onEliminar(index)}
            className="btn-eliminar"
          >
            ❌
          </button>
        </div>
      ))}
    </div>
  );
};

export default MaterialList;
