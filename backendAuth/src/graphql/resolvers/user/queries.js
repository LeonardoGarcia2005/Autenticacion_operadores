import { loggerGlobal } from "../../../globalServices/logging/loggerManager.js";

const userQuery = {
  buscarUsuarioPorId: async (_, { id }) => {
    try {
      console.log("El id que me llego es: " + id);
      return;
    } catch (error) {
      loggerGlobal.error("Error al consultar usuario: ", error);
      throw error;
    }
  },
};

export { userQuery };
