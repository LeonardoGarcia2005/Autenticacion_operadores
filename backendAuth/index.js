import { expressMiddleware } from "@apollo/server/express4";
import pkg1 from "body-parser";
const { json } = pkg1;
import cors from "cors";
import { configurationProvider } from "./src/globalServices/config/configurationManager.js";
import { loggerGlobal } from "./src/globalServices/logging/loggerManager.js";
import { app, apolloServer } from "./app.js";
import { exit } from "node:process";
import contextJwt from "./src/globalServices/context/context.js";

// Puerto del servidor web
const PUERTO_WEB = configurationProvider.services.port;
loggerGlobal.debug(`Tengo el puerto web: ${PUERTO_WEB}`);

try {
  loggerGlobal.info("Iniciando el Apollo Server...");
  await apolloServer.start();
} catch (error) {
  loggerGlobal.error(
    "Error al iniciar el servidor GraphQL; No se podrá iniciar el sistema...",
    error
  );
  exit(-1);
}

//configuracion de cors para que no ocurra el conflicto de los dos puertos distintos
const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
  allowedHeaders: ["sessionID", "content-type", "authorization"], // Agrega esta línea para permitir el encabezado Authorization
};

// Configura el límite de tamaño para el middleware `json`
const jsonParser = json({ limit: "50mb" }); // Ajusta el límite según sea necesario

// Añadir la lógica para obtener la IP en el contexto
app.use(
  "/graphql",
  cors(corsOptions),
  jsonParser,
  expressMiddleware(apolloServer, {
    context: async ({ req, res }) => {
      // Obtener la IP del cliente
      let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      // Si la IP es "::1" (localhost en IPv6), convertirla a "127.0.0.1" (localhost en IPv4)
      if (ip === "::1") {
        ip = "127.0.0.1";
      }

      // Si es una dirección IPv6, extraer la parte IPv4 si es posible
      if (ip.includes(":")) {
        const ipv4 = ip.split(":").pop();
        if (ipv4) {
          ip = ipv4;
        }
      }

      // Contexto de JWT para la autenticación
      const jwtContext = await contextJwt({ req, res });

      // Devuelve el contexto incluyendo la IP, sesión, JWT y DataLoaders
      return {
        session: req.session,
        ip, // Incluye la IP en formato IPv4
        ...jwtContext, // Incluye el contexto de JWT (autenticación)
      };
    },
  })
);

// Iniciar el servidor Express
app.listen(PUERTO_WEB, () => {
  loggerGlobal.info(
    `🚀 Server listo en http://localhost:${PUERTO_WEB}/graphql`
  );
});
