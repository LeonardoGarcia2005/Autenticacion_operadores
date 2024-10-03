import dotenv from "dotenv";
dotenv.config();
import config from "../../../config.js";

let configurationProvider;

if (!configurationProvider) {
  configurationProvider = {
    db: {
      host: config.get("db.host"),
      port: config.get("db.port"),
      database: config.get("db.name"),
      user: config.get("db.user"),
      password: config.get("db.password"),
      ssl: false,
      max: config.get("pgPromise.max"),
      idleTimeoutMillis: config.get("pgPromise.idleTimeoutMillis"),
      connectionTimeoutMillis: config.get("pgPromise.connectionTimeoutMillis"),
      maxUses: config.get("pgPromise.maxUses"),
    },
    security: {
      jwtSecret: config.get("security.jwtSecret"),
      jwtExpirationTime: config.get("security.jwtExpirationTime"),
    },
    services: {
      host: config.get("services.host"),
      port: config.get("services.port"),
    },
    maxLogLevel: config.get("maxLogLevel"),
  };
}

export { configurationProvider };
