import * as z from 'zod';

export const logInSchema = {
  body: z.object({ email: z.string(), password: z.string() }),
  params: null,
  query: null,
};

export const verifyRouteSchema = {
  body: z.object({
    email: z.email({ error: 'Debe ser un email válido' }),
    code: z.string().length(6, { message: 'El código debe tener 6 dígitos' }),
  }),
  params: null,
  query: null,
};
