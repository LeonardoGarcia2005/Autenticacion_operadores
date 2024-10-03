import { loggerGlobal } from "../../globalServices/logging/loggerManager.js";
import { dbConnectionProvider } from "../db/db.js";
import { FabricaErrores } from "../errors/errorsManager.js";

const createNewUser = async (userNewInput) => {
  const { username, password, email, role_id, last_ip } = userNewInput;

  try {
    // Verificar si el username o el email ya existen en la base de datos
    const existingUser = await dbConnectionProvider.oneOrNone(
      `SELECT id FROM users WHERE username = $1 OR email = $2`,
      [username, email]
    );

    // Si el usuario ya existe, lanza un error
    if (existingUser) {
      throw FabricaErrores.crearError(
        FabricaErrores.TipoError.ErrorValidacion,
        "El usuario o email ya están registrados."
      );
    }

    // Crear un nuevo usuario con la contraseña ya hasheada
    const newUser = {
      username,
      password, // Recibe la contraseña ya encriptada
      email,
      role_id,
      last_ip,
    };

    // Guardar el usuario en la base de datos
    const insertedUser = await dbConnectionProvider.insertOne("users", newUser);

    // Devolver el usuario insertado
    return insertedUser;
  } catch (error) {
    loggerGlobal.error("Error al crear el nuevo usuario:", error);
    throw error;
  }
};

// Obtener un usuario por su nombre de usuario
const getUserByUsername = async (username) => {
  try {
    return await dbConnectionProvider.oneOrNone(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );
  } catch (error) {
    throw FabricaErrores.crearError(
      FabricaErrores.TipoError.ErrorValidacion,
      "Error al obtener el usuario por nombre de usuario:"
    );
  }
};

// Manejar intento fallido de autenticación
const handleFailedAttempt = async (userId, ip) => {
  try {
    const attempt = await dbConnectionProvider.oneOrNone(
      `SELECT * FROM failed_attempts WHERE user_id = $1 AND ip = $2`,
      [userId, ip]
    );

    if (attempt) {
      // Actualizar el intento fallido
      await dbConnectionProvider.updateOne(
        "failed_attempts",
        { attempts: attempt.attempts + 1 },
        { id: attempt.id }
      );
    } else {
      const newAttempt = {
        user_id: userId,
        ip,
        attempts: 1,
      };
      await dbConnectionProvider.insertOne("failed_attempts", newAttempt);
    }
  } catch (error) {
    // Determinar el tipo de error y usar la fábrica de errores
    let customError;

    if (error instanceof pgPromise.errors.QueryResultError) {
      customError = FabricaErrores.crearError(
        FabricaErrores.TipoError.ErrorDatosNoEncontrados,
        "No se encontraron datos de intentos fallidos",
        error
      );
    } else if (error instanceof pgPromise.errors.ConnectionError) {
      customError = FabricaErrores.crearError(
        FabricaErrores.TipoError.ErrorConfiguracionDatos,
        "Error de conexión con la base de datos",
        error
      );
    } else {
      customError = FabricaErrores.crearError(
        FabricaErrores.TipoError.ErrorGenericoNoManejado,
        "Error desconocido al manejar intento fallido",
        error
      );
    }

    // Lanzar el error personalizado
    throw customError;
  }
};

// Obtener sesión activa de un usuario
const getActiveSession = async (userId) => {
  try {
    return await dbConnectionProvider.oneOrNone(
      `SELECT * FROM sessions WHERE user_id = $1 AND is_active = TRUE`,
      [userId]
    );
  } catch (error) {
    throw new Error("Error al obtener sesión activa: " + error.message);
  }
};

// Insertar o actualizar la sesión del usuario
const upsertSession = async (userId, token, ip, activeSession) => {
  try {
    if (activeSession) {
      await dbConnectionProvider.updateOne(
        "sessions",
        { token: token },
        { user_id: userId }
      );
    } else {
      const newSession = {
        user_id: userId,
        token: token,
        ip,
        is_active: true,
      };
      await dbConnectionProvider.insertOne("sessions", newSession);
    }
  } catch (error) {
    throw new Error(
      "Error al insertar o actualizar la sesión: " + error.message
    );
  }
};

const UserDAO = {
  createUser: createNewUser,
  getUserByUsername,
  handleFailedAttempt,
  getActiveSession,
  upsertSession,
};

export { UserDAO };
