import * as z from 'zod';

export const createTicketRouteSchema = {
  body: z.object({
    cliente_nombre: z.string().min(2, { message: 'El nombre del cliente debe tener al menos 2 caracteres' }),
    cliente_direccion: z.string().min(5, { message: 'La dirección debe tener al menos 5 caracteres' }),
    cliente_telefono: z.string().min(7, { message: 'El teléfono debe tener al menos 7 caracteres' }),
    falla_descripcion: z.string().min(10, { message: 'La descripción de la falla debe tener al menos 10 caracteres' }),
    tecnico_id: z.number({ error: 'Debe seleccionar un técnico' }),
    fecha_visita: z.string().optional(),
  }),
  params: null,
  query: null,
};

export const updateTicketStatusRouteSchema = {
  body: z.object({
    estatus: z.enum(['pendiente', 'en_proceso', 'resuelto'], {
      error: 'El estatus debe ser: pendiente, en_proceso o resuelto',
    }),
  }),
  params: z.object({
    id: z.string(),
  }),
  query: null,
};
