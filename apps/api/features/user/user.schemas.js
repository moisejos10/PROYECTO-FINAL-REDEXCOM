import * as z from 'zod';

export const UserSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.email(),
  password_hash: z.string(),
  rol: z.enum(['super_admin', 'admin', 'tecnico']),
  email_verified: z.boolean().default(false),
  created_at: z.string(),
});
