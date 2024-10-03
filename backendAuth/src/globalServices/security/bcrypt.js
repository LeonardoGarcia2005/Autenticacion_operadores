// Importa la biblioteca "bcryptjs" para la encriptación de contraseñas
import bcrypt from "bcrypt"

// Función para encriptar una contraseña
export const encryptPassword = async (password) => {
  // Genera un "salt" con un costo de cálculo de 10
  const salt = await bcrypt.genSalt(10);
  
  // Calcula el hash de la contraseña utilizando el "salt"
  return bcrypt.hash(password, salt);
};

// Función para comparar una contraseña con un hash almacenado
export const comparePassword = async (password, hash) => {
  // Compara la contraseña proporcionada con el hash almacenado
  return await bcrypt.compare(password, hash);
};
