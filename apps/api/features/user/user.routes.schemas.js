import * as z from 'zod';

export const createUserRouteSchema = {
  body: z.object({
    nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    apellido: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres' }),
    email: z.email({ error: 'Tiene que ser un email válido' }),
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\S]{8,}$/, {
      error: 'La contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número',
    }),
  }),
  params: null,
  query: null,
};
