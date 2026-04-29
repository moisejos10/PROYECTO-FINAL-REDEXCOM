import { Router } from 'express';
import { logInSchema, verifyRouteSchema } from './auth.routes.schemas.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from '../user/user.repository.js';
import authRepository from './auth.repository.js';
import verificationRepository from './verification.repository.js';
import nodemailerService from '../../services/nodemailer.js';
import { authenticate } from './auth.middlewares.js';
const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  // 1. Validamos la data recibida
  const body = logInSchema.body.parse(req.body);

  // 2. Buscar el posible usuario en la base de datos
  const user = userRepository.findUserByEmail(body.email);

  if (!user) {
    return res.status(403).json({ error: 'Usuario o contraseña inválida' });
  }

  // 3. Verificar que el email esté verificado
  if (!user.email_verified) {
    return res.status(403).json({ error: 'Debes verificar tu correo electrónico antes de iniciar sesión' });
  }

  // 4. Comprobar la contraseña
  const isPasswordCorrect = await bcrypt.compare(body.password, user.password_hash);

  if (!isPasswordCorrect) {
    return res.status(403).json({ error: 'Usuario o contraseña inválida' });
  }

  // 5. Crear access token
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: '30m',
    },
  );

  // 6. Crear refresh token
  const refreshTokenId = crypto.randomUUID();

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '7d',
      jwtid: refreshTokenId,
    },
  );

  // 7. Guardar sesión en la base de datos
  authRepository.createSession({ jwtid: refreshTokenId, userId: user.id });

  // 8. Configurar cookie del refresh token
  const expireDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  res.cookie('refresh_token', refreshToken, {
    expires: expireDate,
    httpOnly: true,
    secure: process.env.ENV_MODE === 'prod',
    sameSite: 'strict',
  });

  return res.status(200).json({
    accessToken,
    userId: user.id,
    email: user.email,
    nombre: user.nombre,
    apellido: user.apellido,
    rol: user.rol,
  });
});

authRouter.post('/verify', async (req, res, next) => {
  try {
    // 1. Validar el body
    const { email, code } = verifyRouteSchema.body.parse(req.body);

    // 2. Buscar el usuario
    const user = userRepository.findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.email_verified) {
      return res.status(200).json({ message: 'El usuario ya está verificado.' });
    }

    // 3. Buscar el código de verificación válido
    const verificationCode = verificationRepository.findValidCode({
      code,
      userId: user.id,
    });

    if (!verificationCode) {
      return res.status(400).json({ error: 'Código de verificación inválido' });
    }

    // 4. Verificar que no haya expirado
    const now = new Date();
    const expiresAt = new Date(verificationCode.expires_at);

    if (now > expiresAt) {
      return res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' });
    }

    // 5. Marcar código como usado y verificar el email
    verificationRepository.markAsUsed(verificationCode.id);
    userRepository.updateEmailVerify(user.id);

    return res.status(200).json({ message: 'Cuenta verificada exitosamente.' });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/resend-code', async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = userRepository.findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.email_verified) {
      return res.status(200).json({ message: 'El usuario ya está verificado.' });
    }

    // Generar nuevo código
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();

    verificationRepository.createCode({
      code,
      userId: user.id,
      expiresAt,
    });

    // Enviar correo
    await nodemailerService.sendMail({
      to: user.email,
      subject: 'Nuevo código de verificación - Corporación RedexCom',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Corporación RedexCom</h1>
            <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">Sistema de Soporte Técnico</p>
          </div>
          <div style="padding: 32px; color: #e2e8f0;">
            <h2 style="color: #ffffff; margin-top: 0;">Nuevo código de verificación</h2>
            <p style="font-size: 16px; line-height: 1.6;">Hola ${user.nombre}, aquí tienes tu nuevo código:</p>
            <div style="background: #1e293b; border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">Tu código de verificación</p>
              <h1 style="color: #60a5fa; margin: 0; font-size: 40px; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</h1>
              <p style="color: #64748b; margin: 8px 0 0 0; font-size: 12px;">Expira en 1 hora</p>
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="http://localhost:4321/verificar?email=${encodeURIComponent(user.email)}" 
                 style="display: inline-block; background: linear-gradient(135deg, #2563eb, #3b82f6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Verificar mi cuenta
              </a>
            </div>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ message: 'Nuevo código enviado.' });
  } catch (error) {
    next(error);
  }
});

// Ruta para refrescar el token de acceso
authRouter.get('/refresh', async (req, res) => {
  // 1. Obtener el refresh token
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) return res.sendStatus(401);

  try {
    // 2. Decodificar el refresh token
    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // 3. Encontrar la session asociada al refresh token
    const session = authRepository.findSessionByJwtId({ jwtid: decodedToken.jti });
    if (!session) return res.sendStatus(401);

    // 4. Crear un nuevo token de acceso y refresh token
    const accessToken = jwt.sign(
      { id: decodedToken.id, email: decodedToken.email, rol: decodedToken.rol, nombre: decodedToken.nombre },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '30m' }
    );
    const refreshTokenId = crypto.randomUUID();
    const newRefreshToken = jwt.sign(
      { id: decodedToken.id, email: decodedToken.email, rol: decodedToken.rol, nombre: decodedToken.nombre },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d', jwtid: refreshTokenId }
    );

    // 5. Guardar el nuevo refresh token en las cookies y actualizar la session en la base de datos
    const expireDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    res.cookie('refresh_token', newRefreshToken, {
      expires: expireDate,
      httpOnly: true,
      secure: process.env.ENV_MODE === 'prod',
      sameSite: 'strict',
    });
    authRepository.updateSessionJwtId({ jwtid: refreshTokenId, id: session.id });

    // 6. Responder al cliente con el nuevo token de acceso
    return res.status(200).json({ accessToken, userId: decodedToken.id, email: decodedToken.email });
  } catch (err) {
    return res.sendStatus(403);
  }
});

// Ruta para obtener la información del usuario autenticado
authRouter.get('/user', authenticate, async (req, res) => {
  return res.status(200).json(req.user);
});

// Ruta para cerrar sesión
authRouter.get('/signout', authenticate, async (req, res) => {
  // 1. Obtener el refresh token
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) return res.sendStatus(401);

  try {
    // 2. Decodificar el refresh token
    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // 3. Encontrar la session asociada al refresh token
    const session = authRepository.findSessionByJwtId({ jwtid: decodedToken.jti });
    if (!session) return res.sendStatus(401);

    // 4. Eliminar el token de los cookies
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.ENV_MODE === 'prod',
      sameSite: 'strict',
    });

    // 5. Eliminar la session de la base de datos
    authRepository.deleteSession(session.id);

    // 6. Responder al cliente
    return res.sendStatus(204);
  } catch (error) {
    return res.sendStatus(403);
  }
});

export default authRouter;
