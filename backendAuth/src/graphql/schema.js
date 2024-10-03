import { readdirSync, readFileSync } from 'fs';
import {resolvers} from './resolvers/indexResolvers.js'
import { buildSchema } from 'graphql';

let typeDefs = '';

const gqlFiles = readdirSync(new URL('./typeDefs',import.meta.url));

gqlFiles.forEach((file) => {
  const archivo = new URL('./typeDefs/'+file,import.meta.url);
  //console.log('archivo es: '+archivo);
  typeDefs += readFileSync(archivo, {
      encoding: 'utf8',
  });
});

try {
  buildSchema(typeDefs);
} catch (error) {
  console.error('Error en el esquema:', error);
}
//console.log('typedefs es: '+typeDefs);

const resolversGot = resolvers;

const schema={
    typeDefs:typeDefs,
    resolvers:resolversGot,
 };

 //export default schema;
 export {schema};



