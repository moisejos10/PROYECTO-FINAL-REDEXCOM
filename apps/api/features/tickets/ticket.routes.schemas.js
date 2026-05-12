import * as z from 'zod';

// ── Validaciones personalizadas ──

// Valida que el nombre tenga formato: "Nombre Apellido" (ambos con mayúscula inicial)
const nombreCompletoSchema = z.string()
  .min(3, { message: 'Debe ingresar el nombre completo del cliente' })
  .refine((val) => {
    const partes = val.trim().split(/\s+/);
    return partes.length >= 2;
  }, { message: 'Debe incluir nombre y apellido del cliente' })
  .refine((val) => {
    const partes = val.trim().split(/\s+/);
    return partes.every(p => /^[A-ZÁÉÍÓÚÑ]/.test(p));
  }, { message: 'Cada nombre y apellido debe comenzar con letra mayúscula' });

// Valida formato de teléfono venezolano: 0414-1234567, 04141234567, +584141234567
const telefonoVenezolanoSchema = z.string()
  .refine((val) => {
    const limpio = val.replace(/[\s\-\.\(\)]/g, '');
    return /^(0(412|414|416|424|426)\d{7}|\+58(412|414|416|424|426)\d{7})$/.test(limpio);
  }, { message: 'Debe ser un número de teléfono venezolano válido (Ej: 0414-1234567)' });

// Valida que la descripción no pase de 100 caracteres
const descripcionSchema = z.string()
  .min(10, { message: 'La descripción debe tener al menos 10 caracteres' })
  .max(100, { message: 'La descripción no puede superar los 100 caracteres' });

// Valida que la fecha de visita no sea anterior a hoy
const fechaVisitaSchema = z.string()
  .optional()
  .refine((val) => {
    if (!val) return true; // Es opcional
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVisita = new Date(val + 'T00:00:00');
    return fechaVisita >= hoy;
  }, { message: 'La fecha de visita no puede ser anterior al día de hoy' });

// ── Schemas de rutas ──

export const createTicketRouteSchema = {
  body: z.object({
    cliente_nombre: nombreCompletoSchema,
    cliente_direccion: z.string().min(5, { message: 'La dirección debe tener al menos 5 caracteres' }),
    cliente_telefono: telefonoVenezolanoSchema,
    falla_descripcion: descripcionSchema,
    tecnico_id: z.number({ error: 'Debe seleccionar un técnico' }),
    fecha_visita: fechaVisitaSchema,
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
