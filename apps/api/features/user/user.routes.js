import { Router } from 'express';
import { createUserRouteSchema } from './user.routes.schemas.js';
import bcrypt from 'bcrypt';
import userRepository from './user.repository.js';
import verificationRepository from '../auth/verification.repository.js';
import nodemailerService from '../../services/nodemailer.js';
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
    createdUser = userRepository.createUser({
      nombre: body.nombre,
      apellido: body.apellido,
      email: body.email,
      passwordHash,
    });

    // 4. Generar código de verificación de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hora

    verificationRepository.createCode({
      code,
      userId: createdUser.id,
      expiresAt,
    });

    // 5. Enviar correo con el código de verificación
    await nodemailerService.sendMail({
      to: createdUser.email,
      subject: 'Verificación de cuenta - Corporación RedexCom',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Corporación RedexCom</h1>
            <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">Sistema de Soporte Técnico</p>
          </div>
          <div style="padding: 32px; color: #e2e8f0;">
            <h2 style="color: #ffffff; margin-top: 0;">¡Bienvenido/a, ${createdUser.nombre}!</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Tu cuenta ha sido creada exitosamente. Para activarla, usa el siguiente código de verificación:
            </p>
            <div style="background: #1e293b; border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">Tu código de verificación</p>
              <h1 style="color: #60a5fa; margin: 0; font-size: 40px; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</h1>
              <p style="color: #64748b; margin: 8px 0 0 0; font-size: 12px;">Expira en 1 hora</p>
            </div>
            <p style="font-size: 14px; color: #94a3b8;">
              También puedes verificar tu cuenta haciendo clic en el siguiente enlace:
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="http://localhost:4321/verificar?email=${encodeURIComponent(createdUser.email)}" 
                 style="display: inline-block; background: linear-gradient(135deg, #2563eb, #3b82f6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Verificar mi cuenta
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;">
            <p style="font-size: 12px; color: #64748b; text-align: center;">
              Si no solicitaste esta cuenta, puedes ignorar este correo.
            </p>
          </div>
        </div>
      `,
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
        // Debemos eliminar los códigos primero para no violar Foreign Keys
        const db = (await import('../../db/index.js')).default;
        db.prepare('DELETE FROM verification_codes WHERE user_id = ?').run(createdUser.id);
        userRepository.deleteUserById(createdUser.id);
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
    const tecnicos = userRepository.findTecnicos();
    return res.status(200).json(tecnicos);
  } catch (error) {
    next(error);
  }
});

export default userRouter;
