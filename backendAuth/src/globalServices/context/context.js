import jwt from "jsonwebtoken";
import { FabricaErrores } from "../../models/errors/errorsManager.js";
import { loggerGlobal } from "../logging/loggerManager.js";

const getUser = async (token) => {
  try {
    if (token) {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      return user;
    }
    return null;
  } catch (error) {
    return null; // Manejamos los errores de verificación retornando null
  }
};

const contextJwt = async ({ req, res }) => {
  try {
    if (req.body.operationName === "IntrospectionQuery") {
      return {};
    }

    // Permitir que las mutaciones 'RegisterUser', 'LoginUser' y 'VerifyToken' pasen sin token
    if (
      req.body.operationName === "RegisterUser" ||
      req.body.operationName === "LoginUser" ||
      req.body.operationName === "VerifyToken"
    ) {
      return {};
    }

    // Obtener el token desde los headers de autorización
    const token = req.headers.authorization || "";

    // Intentar recuperar al usuario usando el token
    const user = await getUser(token);

    if (!user) {
      // Lanzar un error personalizado si no hay usuario autenticado
      throw FabricaErrores.crearError(
        FabricaErrores.TipoError.ErrorSeguridad,
        "El usuario no está autenticado"
      );
    }

    // Si el usuario está autenticado, añadirlo al contexto
    return { user, token };
  } catch (error) {
    // Si ocurre algún error, capturarlo y lanzar un error personalizado
    loggerGlobal.error("Error al crear el contexto JWT:", error.message);

    // Aquí puedes asegurarte de que cualquier error sea el que devuelve la fábrica de errores
    throw FabricaErrores.crearError(
      FabricaErrores.TipoError.ErrorSeguridad,
      error.message || "Error en la autenticación"
    );
  }
};

export default contextJwt;
