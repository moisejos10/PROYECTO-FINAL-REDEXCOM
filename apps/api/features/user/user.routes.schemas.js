import { z } from 'zod';

export const createUserRouteSchema = {
  body: z.object({
    email: z.string().email("El formato del correo no es válido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres")
  })
};