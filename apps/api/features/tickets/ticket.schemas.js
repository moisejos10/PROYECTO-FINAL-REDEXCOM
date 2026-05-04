import * as z from 'zod';

export const ticketSchema = z.object({
  id: z.number(),
  cliente_nombre: z.string(),
  cliente_direccion: z.string(),
  cliente_telefono: z.string(),
  falla_descripcion: z.string(),
  estatus: z.enum(['pendiente', 'en_proceso', 'resuelto']),
  fecha_visita: z.string().nullable(),
  tecnico_id: z.number(),
  creador_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});
