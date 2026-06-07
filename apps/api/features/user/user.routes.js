import { Router } from 'express';
import { createUserRouteSchema } from './user.routes.schemas.js';
import bcrypt from 'bcrypt';
import userRepository from './user.repository.js';
import verificationRepository from '../auth/verification.repository.js';
import nodemailerService from '../../services/nodemailer.js';
import { email, codeBox, btn } from '../../services/emailTemplate.js';
import { authenticate, requireAdmin } from '../auth/auth.middlewares.js';
const userRouter = Router();

userRouter.post('/', async (req, res, next) => {
  let createdUser = null;
  try {
    // 1. Validar el requerimiento
    const body = createUserRouteSchema.body.parse(req.body);

    // 2. Encriptar la contraseña
    const passwordHash = await bcrypt.hash(body.password, 10);

    // 3. Guardar en la base de datos
    createdUser = await userRepository.createUser({
      nombre: body.nombre,
      apellido: body.apellido,
      email: body.email,
      passwordHash,
    });

    // 4. Generar código de verificación de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hora

    await verificationRepository.createCode({
      code,
      userId: createdUser.id,
      expiresAt,
    });

    // 5. Enviar correo con el código de verificación
    await nodemailerService.sendMail({
      to: createdUser.email,
      subject: 'Verificación de cuenta — Corporación RedexCom',
      html: email(`
        <h2 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a">¡Bienvenido/a, ${createdUser.nombre}!</h2>
        <p style="margin:0 0 4px;color:#64748b;font-size:13px">Tu cuenta ha sido creada con éxito en el Sistema de Soporte Técnico.</p>
        <p style="margin:0 0 20px;color:#475569">Para activarla, ingresa el siguiente código en la pantalla de verificación:</p>
        ${codeBox(code)}
        <p style="margin:0 0 4px;color:#475569;font-size:14px">También puedes verificar directamente con el botón:</p>
        ${btn('Verificar mi cuenta', 'http://localhost:4321/verificar?email=' + encodeURIComponent(createdUser.email))}
        <hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0 14px"/>
        <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">Si no solicitaste esta cuenta, ignora este correo.</p>
      `),
    });

    res.status(201).json({
      id: createdUser.id,
      nombre: createdUser.nombre,
      apellido: createdUser.apellido,
      email: createdUser.email,
      rol: createdUser.rol,
    });
  } catch (error) {
    if (createdUser) {
      console.log('Error tras crear usuario - eliminando datos revertidos');
      try {
        // Eliminar códigos de verificación y luego el usuario
        const supabase = (await import('../../db/index.js')).default;
        await supabase.from('verification_codes').delete().eq('user_id', createdUser.id);
        await userRepository.deleteUserById(createdUser.id);
      } catch (rollbackError) {
        console.error('Error al hacer rollback', rollbackError);
      }
    }
    next(error);
  }
});

// ── GET /api/user/tecnicos ── Obtener lista de técnicos (solo admin)
userRouter.get('/tecnicos', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const tecnicos = await userRepository.findTecnicos();
    return res.status(200).json(tecnicos);
  } catch (error) {
    next(error);
  }
});

export default userRouter;
