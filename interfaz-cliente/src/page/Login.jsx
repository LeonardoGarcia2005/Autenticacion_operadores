import { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../img/pangea.png";
import "../App.css";
import "../styles/Login.css";
import { useThemeContext } from "../context/ThemeContext";
import { LOGIN_USER } from "../graphql/mutations";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Modal } from "react-bootstrap";
import { MdOutlineNoEncryptionGmailerrorred } from "react-icons/md";

const LoginComponent = () => {
  const { contextTheme } = useThemeContext();
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [loginUser] = useMutation(LOGIN_USER);
  const { authenticate } = useAuth();
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const navigate = useNavigate();

  // Validación de Formik para asegurarse que los campos esten llenos
  const validate = (values) => {
    const errors = {};
    if (!values.username) {
      errors.username = "El nombre de usuario es obligatorio";
    }
    if (!values.password) {
      errors.password = "La contraseña es obligatoria";
    }
    return errors;
  };

  // Maneja el envío del formulario
  const handleSubmit = async (values) => {
    if (!values.username || !values.password) {
      return; // No envía si hay campos vacíos
    }

    try {
      setButtonEnabled(true);
      const { data } = await loginUser({
        variables: {
          loginInput: {
            username: values.username,
            password: values.password,
          },
        },
      });

      const token = data.loginUser.token;
      const userInfo = {
        id: data.loginUser.id,
        username: data.loginUser.username,
        email: data.loginUser.email,
        rol_id: data.loginUser.role_id,
      };

      authenticate(token, userInfo);
      navigate("/homepage");
    } catch (error) {
      setButtonEnabled(false);
      setShowAlert(true);

      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        setAlertMessage(error.graphQLErrors[0].message);
      } else {
        setAlertMessage("Error en el inicio de sesión");
      }
    }
  };

  //Si el usuario se encuentra ya autenticado devolver a la pagina de inicio
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      navigate("/homepage"); // Redirigir a la página principal
    }
  }, [navigate]);

  return (
    <div
      id={contextTheme}
      className={`${
        contextTheme === "dark"
          ? "d-flex justify-content-center align-items-center vh-100 fondo-theme"
          : "d-flex justify-content-center align-items-center vh-100 imagenApp"
      }`}
    >
      <div
        id={contextTheme}
        className={`${
          contextTheme === "dark"
            ? "p-5 rounded-5 cardFormularioLogin position-relative shadow-blue fondo-theme"
            : "p-5 rounded-5 bg-light cardFormularioLogin position-relative shadow-blue"
        }`}
      >
        <header className="form-block__header">
          <img
            src={logo}
            className="mb-3 d-flex mx-auto imagenPangeaLogoUser"
            alt="Pangea Logo"
          />
          <p className="text-center text-primary titleLoguin mb-3">
            Pangea Flow
          </p>
        </header>

        <Formik
          initialValues={{
            username: "",
            password: "",
          }}
          validate={validate} // Agrega la validación aquí
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form>
              <div
                className="form-block__input-wrapper fondo-theme"
                id={contextTheme}
              >
                <div className={`form-group form-group--login`}>
                  <div className="mb-2 text-black registroSession">
                    <label htmlFor="username" className="text-primary">
                      Usuario
                    </label>
                    <Field
                      type="text"
                      name="username"
                      id="username"
                      maxLength="25"
                      placeholder="Ingrese el usuario"
                      className="form-control fontplaceholder"
                    />
                    {errors.username && touched.username && (
                      <small
                        className="text-danger"
                        style={{ fontSize: "10px" }}
                      >
                        {errors.username}
                      </small>
                    )}
                  </div>
                  <div className="mb-2 text-black registroSession">
                    <label htmlFor="password" className="text-primary">
                      Contraseña
                    </label>
                    <Field
                      type="password"
                      name="password"
                      id="password"
                      maxLength="16"
                      placeholder="Ingrese la contraseña"
                      className="form-control fontplaceholder"
                    />
                    {errors.password && touched.password && (
                      <small
                        className="text-danger"
                        style={{ fontSize: "10px" }}
                      >
                        {errors.password}
                      </small>
                    )}
                  </div>

                  <div className="d-grid mt-4 registroSession">
                    <button
                      className="btn btn-primary rounded-3 mb-2"
                      type="submit"
                      disabled={buttonEnabled} // Deshabilitar el botón mientras se procesa
                    >
                      {buttonEnabled ? (
                        <div className="text-white spinner-border spinner-border-sm mt-1"></div>
                      ) : (
                        "Iniciar Sesión"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Formik>
        {/* Mensaje de error */}
        <Modal show={showAlert} centered>
          <div className="p-5 text-center fonts-letter rounded-1">
            <div className="d-flex flex-column">
              <MdOutlineNoEncryptionGmailerrorred
                className="mx-auto text-secondary mb-1 text-danger"
                size={75}
              />
              <span className="fs-4">¡Ups!</span>
              <p className="text-secondary">{alertMessage}</p>
            </div>
            <div className="d-flex justify-content-center">
              <button
                className="btn bg-danger text-white d-flex justify-content-center text-white mx-2 px-5"
                type="button"
                style={{ width: "40%" }}
                onClick={() => setShowAlert(false)}
              >
                <span className="my-auto">OK</span>
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default LoginComponent;
