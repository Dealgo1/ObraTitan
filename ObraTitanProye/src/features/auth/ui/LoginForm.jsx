/**
 * LoginForm.jsx
 * ------------------------------------------------------------
 * Formulario de inicio de sesión basado en React-Bootstrap.
 *
 * Props:
 * - email: string → valor actual del campo correo.
 * - password: string → valor actual del campo contraseña.
 * - error: string → mensaje de error a mostrar (si existe).
 * - setEmail: función para actualizar el estado del correo.
 * - setPassword: función para actualizar el estado de la contraseña.
 * - handleSubmit: función callback que se ejecuta al enviar el formulario.
 *
 * UI:
 * - Utiliza componentes de React-Bootstrap (Row, Col, Card, Form, Alert, Button).
 * - Estructura centrada y responsiva.
 */

import React from "react";
import { Row, Col, Form, Button, Card, Alert } from "react-bootstrap";

import "../App.css";

const LoginForm = ({ email, password, error, setEmail, setPassword, handleSubmit }) => {
  return (
    <Row className="w-100 justify-content-center">
      {/* Columna centrada, ajusta ancho según el viewport */}
      <Col md={6} lg={5} xl={4}>
        <Card className="p-4 shadow-lg">
          <Card.Body>
            <h3 className="text-center mb-4">Iniciar Sesión</h3>

            {/* Mensaje de error (si existe) */}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Formulario principal */}
            <Form onSubmit={handleSubmit}>
              {/* Campo correo */}
              <Form.Group className="mb-3" controlId="emailUsuario">
                <Form.Label>Correo Electrónico</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Ingresa tu correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              {/* Campo contraseña */}
              <Form.Group className="mb-3" controlId="contraseñaUsuario">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              {/* Botón CTA */}
              <Button variant="primary" type="submit" className="w-100">
                Iniciar Sesión
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default LoginForm;
