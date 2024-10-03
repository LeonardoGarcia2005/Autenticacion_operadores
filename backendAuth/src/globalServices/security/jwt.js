//importacion del jsonwebtoken, para las validaciones de paginas
import jwt from 'jsonwebtoken'

//Creacion del jwt
export function createAccessToken(user) {
  try {
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    )
    return token
  } catch (error) {
    throw new Error('Error al crear el token: ' + error.message)
  }
}

// Verificación del jwt
export const verifyAccessToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded
  } catch (error) {
    throw new Error('Error al verificar el token: ' + error.message)
  }
}
