import 'dotenv/config';  // Esto carga las variables de entorno de .env
import pgPromise from 'pg-promise';

// Configuración de la conexión a la base de datos
const connection = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10), // Asegúrate de convertir el puerto a número
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
};

//Inicializacion del pg-promise
const pgp = pgPromise({
    capSQL: true, // Habilita la capacidad de SQL
    query(e) {
        if(typeof process.env.MOSTRAR_QUERY_LOGS !== 'undefined' && process.env.MOSTRAR_QUERY_LOGS !== null && parseInt(process.env.MOSTRAR_QUERY_LOGS) == 1){
            console.debug('QUERY: ' + e.query);
        } 
    },
    error(error, e) { //Un hook que maneja los errores que ocurren durante la ejecución de una consulta. Imprime el error y, si está disponible, la consulta que causó el error.
        console.error('Error en la base de datos:', error);
        if (e.query) {
            console.error('Query con error:', e.query);
        }
    },
    receive(e) {
        //Un hook que se ejecuta después de que se reciben los resultados de una consulta. Imprime la cantidad de filas retornadas.
        if(typeof process.env.MOSTRAR_QUERY_LOGS !== 'undefined' && process.env.MOSTRAR_QUERY_LOGS !== null && parseInt(process.env.MOSTRAR_QUERY_LOGS) == 1){
            console.info('Cantidad de filas retornadas:', e.result.rowCount);
        } 
    }
});

// Crear la instancia de la base de datos
let db;
try {
    db = pgp(connection);
    console.debug('Logré crear el objeto db con la configuración del sistema ...');
} catch (error) {
    console.error('Error al tratar de crear la conexión a la base de datos:', error);
}


// Funciones de consulta
//Verifica la conexión a la base de datos. Intenta obtener una conexión y devuelve 
//la versión del servidor de la base de datos si la conexión es exitosa. Si ocurre un error, se captura y se devuelve null.
async function verificarConexionBD() {
    try {
        const c = await db.connect();
        c.done(); // Libera la conexión
        return c.client.serverVersion;
    } catch (error) {
        console.error('Error al conectarse a la BD:', error);
        return null;
    }
}


//Ejecuta una consulta que debe devolver exactamente una fila. Lanza un error si no se encuentra ninguna fila o si se encuentran múltiples.
async function onePgMethod(query, values) {
    return db.one(query, values);
}


//Ejecuta una consulta que puede devolver una fila o ninguna. Lanza un error si se encuentran múltiples filas.
async function oneOrNonePgMethod(query, values) {
    return db.oneOrNone(query, values);
}

//Ejecuta una consulta que puede devolver múltiples filas o ninguna. No lanza un error si no se encuentran filas.
async function manyOrNonePgMethod(query, values) {
    return db.manyOrNone(query, values);
}


//Ejecuta una consulta que debe devolver múltiples filas. Lanza un error si no se encuentran filas.
async function manyPgMethod(query, values) {
    return db.many(query, values);
}

//Ejecuta una consulta que se utiliza para concatenar los resultados. Es útil para operaciones específicas que requieren concatenación de resultados.
async function concatPgMethod(query, values) {
    return db.concat(query, values);
}


//aneja una transacción de base de datos. Permite ejecutar múltiples consultas dentro de una transacción y 
//asegura que todas las consultas se ejecuten correctamente antes de confirmar la transacción. Captura y maneja errores durante la transacción.
async function txPgMethod(args, cb) {
    try {
        return await db.tx(args, cb);
    } catch (error) {
        console.error('Error en la transacción:', error);
        return error;
    }
}


// Maneja una tarea de base de datos que puede incluir varias consultas. 
//Permite agrupar consultas bajo una tarea que puede ser gestionada y manejada como una unidad. Captura y maneja errores durante la tarea.
async function taskPgMethod(args, cb) {
    try {
        return await db.task(args, cb);
    } catch (error) {
        console.error('Error en la tarea:', error);
        return error;
    }
}

// Función para insertar un solo registro
/*
const newUser = {
	name: 'John Doe',
	email: 'john.doe@example.com',
	age: 30
};
const insertedUser = await insertOne('users', newUser);
*/
async function insertOne(tableName, data, tx = null) {
    try {
        const columns = new pgp.helpers.ColumnSet(Object.keys(data), { table: tableName });
        const query = pgp.helpers.insert(data, columns) + ' RETURNING *';
        return await (tx || db).one(query);
    } catch (error) {
        console.error('Error al insertar un registro:', error);
        throw error; // Lanza el error
    }
}

// Función para insertar múltiples registros
/*
const newUsers = [
	{ name: 'John Doe', email: 'john.doe@example.com', age: 30 },
	{ name: 'Jane Smith', email: 'jane.smith@example.com', age: 25 },
	{ name: 'Bob Johnson', email: 'bob.johnson@example.com', age: 40 }
];
 const insertedUsers = await insertMany('users', newUsers);
*/
async function insertRange(tableName, dataList, tx = null) {
    try {
        const columns = new pgp.helpers.ColumnSet(Object.keys(dataList[0]), { table: tableName });
        const query = pgp.helpers.insert(dataList, columns) + ' RETURNING *';
        return await (tx || db).any(query);
    } catch (error) {
        console.error('Error al insertar múltiples registros:', error);
        throw error; // Lanza el error
    }
}

// Función para actualizar un registro con una condición flexible en el WHERE
/*
const updatedUserData = {
	name: 'Alice Doe',
	age: 30
};

//Si se envia como un objeto el where
const whereClause = {
	id: 1,
	status: 'active',
	_operator: 'AND' // Este campo define si usamos 'AND' o 'OR'. Por defecto es 'AND'.
};

//Si se envia como un string el where (puede ser más compleja)
const whereClause = "where email = 'bob@example.com' AND is_verified = true";

const updatedUser = await updateOne('users', updatedUserData, whereClause);
Si se envia como un string el where
*/
async function updateOne(tableName, data, whereClause, tx = null) {
    try {
        const columns = new pgp.helpers.ColumnSet(Object.keys(data), { table: tableName });
        let whereCondition = '';
        let whereValues = [];

        if (typeof whereClause === 'string') {
            whereCondition = whereClause;
        } else {
            const operator = whereClause._operator || 'AND';
            const conditions = Object.entries(whereClause)
                .filter(([key]) => key !== '_operator')
                .map(([key, value], index) => {
                    whereValues.push(value);
                    return `${key} = $${index + 1}`;
                });
            whereCondition = conditions.join(` ${operator} `);
        }

        const query = pgp.helpers.update(data, columns) + ` WHERE ${whereCondition} RETURNING *`;
        return await (tx || db).any(query, whereValues);
    } catch (error) {
        console.error('Error al actualizar el registro:', error);
        throw error; // Lanzamos el error
    }
}

// Función para actualizar múltiples registros
/* 
let updatedDataList = [
    { id: 5, nombre: 'PRUEBAS1', descripcion: 'Pruebas1' },
    { id: 6, nombre: 'PRUEBAS2', descripcion: 'Pruebas2' }
];

let whereClauseList = [
    { id: 5, estado: true, _operator: 'AND' },  // Usamos un objeto
    "id = 6 OR estado = false"                  // Usamos un string
];

let actualizar = await dbConnectionProvider.updateRange('canal', updatedDataList, whereClauseList);
*/
// Función para actualizar múltiples registros
async function updateRange(tableName, dataList, whereClauseList, tx = null) {
    try {
        const queries = dataList.map((data, index) => {
            const columns = new pgp.helpers.ColumnSet(Object.keys(data), { table: tableName });

            let whereClause = whereClauseList[index];
            let whereCondition = '';
            let whereValues = [];

            if (typeof whereClause === 'string') {
                whereCondition = whereClause; 
            } else {
                const operator = whereClause._operator || 'AND';
                const conditions = Object.entries(whereClause)
                    .filter(([key]) => key !== '_operator')
                    .map(([key, value], i) => {
                        whereValues.push(value);
                        return `${key} = $${i + 1}`;
                    });

                whereCondition = conditions.join(` ${operator} `);
            }

            const query = pgp.helpers.update(data, columns) + ` WHERE ${whereCondition} RETURNING *`;
            return { query, whereValues };
        });

        const executeBatch = t => t.batch(queries.map(q => t.any(q.query, q.whereValues)));

        // Usamos la transacción existente (tx) o creamos una nueva con db.tx
        const result = tx ? await executeBatch(tx) : await db.tx(executeBatch);

        const filteredResult = result.map(res => {
            if (res.length === 1) {
                return res[0];
            } else if (res.length > 1) {
                return res;
            } else {
                return null;
            }
        });

        return filteredResult;

    } catch (error) {
        console.error('Error al actualizar múltiples registros:', error);
        throw error;
    }
}


// Función que retorna el primer resultado encontrado o null si no hay registros
async function firstOrDefault(query, values = []) {
    try {
        const results = await db.manyOrNone(query, values);

        if (results.length === 0) {
            return null; // Retorna null si no hay registros
        }

        return results[0]; // Retorna el primer resultado
    } catch (error) {
        console.error('Error en firstOrDefault:', error);
        throw error; // Lanza el error si la consulta o conexión falla
    }
}

// Función que retorna todos los registros encontrados o null si no hay registros
async function getAll(query, values = []) {
    try {
        const results = await db.manyOrNone(query, values);

        if (results.length === 0) {
            return null; // Retorna null si no hay registros
        }

        return results; // Retorna todos los resultados
    } catch (error) {
        console.error('Error en getAll:', error);
        throw error; // Lanza el error si la consulta o conexión falla
    }
}

// Proporciona un objeto que encapsula las funciones y propiedades necesarias para interactuar con la base de datos usando pg-promise
const dbConnectionProvider = {
    helpers: pgp.helpers,
    pgpErrors: pgp.errors,
    one: onePgMethod,
    manyOrNone: manyOrNonePgMethod,
    many: manyPgMethod,
    oneOrNone: oneOrNonePgMethod,
    concat: concatPgMethod,
    tx: txPgMethod,
    task: taskPgMethod,
    verificarConexionBD: verificarConexionBD,
    insertOne,
    insertRange,
    updateOne,
    updateRange,
    firstOrDefault,
    getAll
};

export { dbConnectionProvider };