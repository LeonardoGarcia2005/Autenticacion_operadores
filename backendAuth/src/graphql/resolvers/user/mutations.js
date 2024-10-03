import { loggerGlobal } from "../../../globalServices/logging/loggerManager.js";
import { User } from "../../../models/businessLogic/user.js";
import { verifyAccessToken } from "../../../globalServices/security/jwt.js";

const userMutations = {
  createUser: async (_, { input }, { ip }) => {
    try {
      // Añadir la IP al input del usuario
      const inputWithIp = {
        ...input,
        last_ip: ip,
      };

      const user = await User.createUser(inputWithIp);
      return user;
    } catch (error) {
      loggerGlobal.error("Error al crear usuario: ", error);
      throw error;
    }
  },
  loginUser: async (_, { loginInput }, { ip }) => {
    try {
      // Añadir la IP al input del usuario
      const loginInputWithIp = {
        ...loginInput,
        last_ip: ip,
      };
      const values = await User.loginUser(loginInputWithIp);
      return values;
    } catch (error) {
      loggerGlobal.error("Error al iniciar sesión: ", error);
      throw error;
    }
  },

  verifyToken: async (_, { token }) => {
    try {
      const user = await verifyAccessToken(token); // Validar el token ingresado es valido con la llave privada

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      };
    } catch (error) {
      return {
        success: false,
        user: null,
      };
    }
  },
};

export { userMutations };
