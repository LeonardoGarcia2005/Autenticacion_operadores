import { UserDAO } from "../dataAccessObjects/UserDAO.js";
import {
  encryptPassword,
  comparePassword,
} from "../../globalServices/security/bcrypt.js";
import { loggerGlobal } from "../../globalServices/logging/loggerManager.js";
import { createAccessToken } from "../../globalServices/security/jwt.js";

// Función para crear un nuevo usuario
const createNewUser = async (newUserInput) => {
  try {
    const { password } = newUserInput;
    const hashedPassword = await encryptPassword(password);

    const userWithHashedPassword = {
      ...newUserInput,
      password: hashedPassword,
    };

    const usuario = await UserDAO.createUser(userWithHashedPassword);
    return usuario;
  } catch (error) {
    loggerGlobal.error("Error al crear un nuevo usuario:", error);
    // Lanzar error normal para que se muestre en el playground
    throw new Error("Error al crear el usuario");
  }
};

// Función para iniciar sesión de usuario
const loginUser = async (loginInputWithIp) => {
  try {
    const { username, password, last_ip } = loginInputWithIp;

    const user = await UserDAO.getUserByUsername(username);

    if (!user) {
      await UserDAO.handleFailedAttempt(null, last_ip);
      // Lanzar error de autenticación si el usuario no es encontrado
      throw new Error("Nombre de usuario o contraseña incorrectos.");
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      await UserDAO.handleFailedAttempt(user.id, last_ip);
      // Lanzar error de autenticación si la contraseña no coincide
      throw new Error("Nombre de usuario o contraseña incorrectos.");
    }

    const activeSession = await UserDAO.getActiveSession(user.id);
    if (activeSession && activeSession.ip !== last_ip) {
      // Lanzar error si ya hay una sesión activa en otra IP
      throw new Error("Ya hay una sesión activa");
    }

    // Crear el token JWT
    const token = createAccessToken(user);

    // Guardar o actualizar la sesión del usuario
    await UserDAO.upsertSession(user.id, token, last_ip, activeSession);

    const usuario = {
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      last_login: user.last_login,
      last_ip: user.last_ip,
      token,
    };

    return usuario;
  } catch (error) {
    loggerGlobal.error("Error al iniciar sesión:", error);
    // Lanzar el error normal en caso de error
    throw error;
  }
};

// Exportar las funciones de usuario
const User = {
  createUser: createNewUser,
  loginUser,
};

export { User };
