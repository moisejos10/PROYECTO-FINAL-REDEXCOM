import { Router } from 'express';
import { logInSchema, verifyRouteSchema } from './auth.routes.schemas.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from '../user/user.repository.js';
import authRepository from './auth.repository.js';
import verificationRepository from './verification.repository.js';
import nodemailerService from '../../services/nodemailer.js';
import { email, codeBox, btn } from '../../services/emailTemplate.js';
import { authenticate } from './auth.middlewares.js';
const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  // 1. Validamos la data recibida
  const body = logInSchema.body.parse(req.body);

  // 2. Buscar el posible usuario en la base de datos
  const user = await userRepository.findUserByEmail(body.email);

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
  await authRepository.createSession({ jwtid: refreshTokenId, userId: user.id });

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
    const user = await userRepository.findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.email_verified) {
      return res.status(200).json({ message: 'El usuario ya está verificado.' });
    }

    // 3. Buscar el código de verificación válido
    const verificationCode = await verificationRepository.findValidCode({
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
    await verificationRepository.markAsUsed(verificationCode.id);
    await userRepository.updateEmailVerify(user.id);

    return res.status(200).json({ message: 'Cuenta verificada exitosamente.' });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/resend-code', async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await userRepository.findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.email_verified) {
      return res.status(200).json({ message: 'El usuario ya está verificado.' });
    }

    // Generar nuevo código
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();

    await verificationRepository.createCode({
      code,
      userId: user.id,
      expiresAt,
    });

    // Enviar correo
    await nodemailerService.sendMail({
      to: user.email,
      subject: 'Nuevo código de verificación — Corporación RedexCom',
      html: email(`
        <h2 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a">Nuevo Código de Verificación</h2>
        <p style="margin:0 0 20px;color:#475569">Hola ${user.nombre}, has solicitado un nuevo código para activar tu cuenta:</p>
        ${codeBox(code)}
        <p style="margin:0 0 4px;color:#475569;font-size:14px">O verifica directamente:</p>
        ${btn('Verificar mi cuenta', 'http://localhost:4321/verificar?email=' + encodeURIComponent(user.email))}
        <hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0 14px"/>
        <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">Si no solicitaste este código, ignora este correo.</p>
      `),
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
    const session = await authRepository.findSessionByJwtId({ jwtid: decodedToken.jti });
    if (!session) return res.sendStatus(401);

    // 3.5 Buscar datos frescos del usuario
    const user = await userRepository.findUserById(decodedToken.id);
    if (!user) return res.sendStatus(401);

    // 4. Crear un nuevo token de acceso y refresh token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '30m' }
    );
    const refreshTokenId = crypto.randomUUID();
    const newRefreshToken = jwt.sign(
      { id: user.id, email: user.email },
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
    await authRepository.updateSessionJwtId({ jwtid: refreshTokenId, id: session.id });

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
    const session = await authRepository.findSessionByJwtId({ jwtid: decodedToken.jti });
    if (!session) return res.sendStatus(401);

    // 4. Eliminar el token de los cookies
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.ENV_MODE === 'prod',
      sameSite: 'strict',
    });

    // 5. Eliminar la session de la base de datos
    await authRepository.deleteSession(session.id);

    // 6. Responder al cliente
    return res.sendStatus(204);
  } catch (error) {
    return res.sendStatus(403);
  }
});

export default authRouter;
