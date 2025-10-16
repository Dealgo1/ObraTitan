// src/modules/auth/components/LoginForm.jsx
const LoginForm = ({
  email,
  password,
  error,
  loading,
  setEmail,
  setPassword,
  showPassword,
  setShowPassword,
  onSubmit,
}) => {
  return (
    <form className="ot-login-form" onSubmit={onSubmit}>
      <h2 className="ot-title">Iniciar sesión</h2>

      {error && <div className="ot-alert">{error}</div>}

      <div className="ot-field">
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@obratitan.com"
          required
        />
      </div>

      <div className="ot-field">
        <label htmlFor="password">Contraseña</label>
        <div className="ot-password">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            required
          />
          <button
            type="button"
            className="ot-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="ot-btn"
        disabled={loading}
      >
        {loading ? "Ingresando..." : "Entrar"}
      </button>
    </form>
  );
};

export default LoginForm;
