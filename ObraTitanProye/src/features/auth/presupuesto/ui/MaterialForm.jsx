import React, { useState } from "react";

const MaterialForm = ({ onAgregar, predefinidos = [], estructuras = [], onAgregarEstructura }) => {
  // 📌 Estado local para manejar los valores del material a ingresar
  const [material, setMaterial] = useState({
    nombre: "",
    precio: "",
    cantidad: "",
    unidad: "m2",
    imagen: ""
  });

  // 📌 Convierte un archivo en formato Base64 para poder almacenarlo como string
  const convertirBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // lee el archivo como URL Base64
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // 📌 Maneja la selección de imagen y la guarda en el estado como Base64
  const handleImagen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await convertirBase64(file);
    setMaterial({ ...material, imagen: base64 });
  };

  // 📌 Maneja los cambios en los inputs del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setMaterial({ ...material, [name]: value });
  };

  // 📌 Envía el material al componente padre y resetea el formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    onAgregar({
      ...material,
      precio: parseFloat(material.precio),   // convertir a número
      cantidad: parseFloat(material.cantidad) // convertir a número
    });
    // 🔄 Reiniciar formulario
    setMaterial({ nombre: "", precio: "", cantidad: "", unidad: "m2", imagen: "" });
  };

  // 📌 Permite seleccionar un material predefinido y cargarlo en el formulario
  const handleSeleccionPredefinido = (e) => {
    const seleccionado = predefinidos.find((m) => m.nombre === e.target.value);
    if (seleccionado) setMaterial({ ...seleccionado });
  };

  // 📌 Permite seleccionar una estructura guardada y enviarla al padre
  const handleSeleccionEstructura = (e) => {
    const seleccionada = estructuras.find((est) => est.nombre === e.target.value);
    if (seleccionada) onAgregarEstructura(seleccionada);
  };

  return (
    <form className="formulario-material" onSubmit={handleSubmit}>
      {/* Dropdown de estructuras (ejemplo: muros, techos, etc.) */}
      {estructuras.length > 0 && (
        <select onChange={handleSeleccionEstructura} className="dropdown-estructura">
          <option value="">Agregar estructura (ej. Muro)</option>
          {estructuras.map((est, idx) => (
            <option key={idx} value={est.nombre}>{est.nombre}</option>
          ))}
        </select>
      )}

      {/* Dropdown de materiales predefinidos */}
      {predefinidos.length > 0 && (
        <select onChange={handleSeleccionPredefinido} className="dropdown-predefinido">
          <option value="">Seleccionar material predefinido</option>
          {predefinidos.map((mat, idx) => (
            <option key={idx} value={mat.nombre}>
              {mat.nombre} - C${mat.precio}/{mat.unidad}
            </option>
          ))}
        </select>
      )}

      {/* Inputs del formulario */}
      <input
        name="nombre"
        placeholder="Nombre del material"
        value={material.nombre}
        onChange={handleChange}
        required
      />
      <input
        name="precio"
        type="number"
        placeholder="Precio unitario"
        value={material.precio}
        onChange={handleChange}
        required
      />
      <input
        name="cantidad"
        type="number"
        placeholder="Cantidad o m²"
        value={material.cantidad}
        onChange={handleChange}
        required
      />
      <select name="unidad" value={material.unidad} onChange={handleChange}>
        <option value="m2">m²</option>
        <option value="kg">kg</option>
        <option value="unidad">unidad</option>
        <option value="saco">saco</option>
        <option value="lata">lata</option>
      </select>

      {/* Cargar imagen del material */}
      <input type="file" accept="image/*" onChange={handleImagen} />

      {/* Botón para enviar el formulario */}
      <button type="submit">Agregar Material</button>
    </form>
  );
};

export default MaterialForm;
