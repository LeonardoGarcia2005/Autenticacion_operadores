import { ApolloServer } from '@apollo/server';
import express from 'express';
import http from 'http';
import { schema } from './src/graphql/schema.js';
import { graphqlErrorManager } from './src/graphql/errors/graphQLErrorManager.js';
import { dbConnectionProvider } from './src/models/db/db.js';
import { loggerGlobal } from './src/globalServices/logging/loggerManager.js';
import { exit } from 'process';

// Configuración de variables de entorno
import 'dotenv/config';

// Verificar si el logger está disponible
if (!loggerGlobal) {
  console.error('No se pudo crear el logger global: No podrá iniciarse el sistema.');
  exit(-1);
}

// Verificar conexión a la base de datos
const conectoServerBD = await dbConnectionProvider.verificarConexionBD();
if (conectoServerBD == null) {
  loggerGlobal.error('No se logró establecer conexión a la BD; NO se podrá iniciar el servidor');
  exit(-1);
} else {
  loggerGlobal.info('Se logró conectar a la BD ...');
}

// Configuración del servidor Express
const app = express();
const httpServer = http.createServer(app);
loggerGlobal.info('Creado el servidor web para HTTP con Express ...');

// Configuración del servidor Apollo
const apolloServer = new ApolloServer({
  typeDefs: schema.typeDefs,
  resolvers: schema.resolvers,
  formatError: graphqlErrorManager.errorsFormatter,
  // No se usan plugins adicionales aquí
});



export { app, apolloServer,httpServer };
