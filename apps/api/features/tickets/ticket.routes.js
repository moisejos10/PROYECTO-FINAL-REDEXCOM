import { Router } from 'express';
import { createTicketRouteSchema, updateTicketStatusRouteSchema } from './ticket.routes.schemas.js';
import ticketRepository from './ticket.repository.js';
import userRepository from '../user/user.repository.js';
import { authenticate, requireAdmin } from '../auth/auth.middlewares.js';
import nodemailerService from '../../services/nodemailer.js';

const ticketRouter = Router();

// ══════════════════════════════════════════════════
// Todas las rutas de tickets requieren autenticación
// ══════════════════════════════════════════════════
ticketRouter.use(authenticate);

// ── GET /api/tickets/stats ── Estadísticas del dashboard
ticketRouter.get('/stats', async (req, res, next) => {
  try {
    let stats;

    if (req.user.rol === 'admin' || req.user.rol === 'super_admin') {
      stats = ticketRepository.getTicketStats();
    } else {
      stats = ticketRepository.getTicketStatsByTecnico(req.user.id);
    }

    return res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
});

// ── GET /api/tickets ── Listar tickets (admin=todos, técnico=solo los suyos)
ticketRouter.get('/', async (req, res, next) => {
  try {
    let tickets;

    if (req.user.rol === 'admin' || req.user.rol === 'super_admin') {
      tickets = ticketRepository.findAllTickets();
    } else {
      tickets = ticketRepository.findTicketsByTecnicoId(req.user.id);
    }

    return res.status(200).json(tickets);
  } catch (error) {
    next(error);
  }
});

// ── GET /api/tickets/:id ── Detalle de un ticket
ticketRouter.get('/:id', async (req, res, next) => {
  try {
    const ticket = ticketRepository.findTicketById(Number(req.params.id));

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Si es técnico, solo puede ver sus propios tickets
    if (req.user.rol === 'tecnico' && ticket.tecnico_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para ver este ticket' });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
});

// ── POST /api/tickets ── Crear ticket (solo admin)
ticketRouter.post('/', requireAdmin, async (req, res, next) => {
  try {
    // 1. Validar los datos recibidos
    const body = createTicketRouteSchema.body.parse(req.body);

    // 2. Verificar que el técnico existe
    const tecnico = userRepository.findUserById(body.tecnico_id);
    if (!tecnico) {
      return res.status(404).json({ error: 'El técnico seleccionado no existe' });
    }

    // 3. Crear el ticket en la base de datos
    const createdTicket = ticketRepository.createTicket({
      clienteNombre: body.cliente_nombre,
      clienteDireccion: body.cliente_direccion,
      clienteTelefono: body.cliente_telefono,
      fallaDescripcion: body.falla_descripcion,
      tecnicoId: body.tecnico_id,
      creadorId: req.user.id,
      fechaVisita: body.fecha_visita,
    });

    // 4. Enviar correo al técnico asignado
    try {
      await nodemailerService.sendMail({
        to: tecnico.email,
        subject: 'Nuevo Ticket Asignado - Corporación RedexCom',
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Corporación RedexCom</h1>
              <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">Sistema de Soporte Técnico</p>
            </div>
            <div style="padding: 32px; color: #e2e8f0;">
              <h2 style="color: #ffffff; margin-top: 0;">🎫 Nuevo Ticket Asignado</h2>
              <p style="font-size: 16px; line-height: 1.6;">Hola ${tecnico.nombre}, se te ha asignado un nuevo ticket de soporte:</p>
              
              <div style="background: #1e293b; border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Ticket #</td>
                    <td style="padding: 8px 0; color: #60a5fa; font-weight: 600; font-size: 18px;">${createdTicket.id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Cliente</td>
                    <td style="padding: 8px 0; color: #ffffff;">${createdTicket.cliente_nombre}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Dirección</td>
                    <td style="padding: 8px 0; color: #ffffff;">${createdTicket.cliente_direccion}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Teléfono</td>
                    <td style="padding: 8px 0; color: #ffffff;">${createdTicket.cliente_telefono}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Descripción</td>
                    <td style="padding: 8px 0; color: #ffffff;">${createdTicket.falla_descripcion}</td>
                  </tr>
                  ${createdTicket.fecha_visita ? `
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Fecha de Visita</td>
                    <td style="padding: 8px 0; color: #f59e0b; font-weight: 600;">${createdTicket.fecha_visita}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <p style="font-size: 14px; color: #94a3b8;">
                Ingresa al sistema para ver más detalles sobre este ticket.
              </p>
              <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;">
              <p style="font-size: 12px; color: #64748b; text-align: center;">
                Este correo fue enviado automáticamente por el Sistema de Soporte Técnico de RedexCom.
              </p>
            </div>
          </div>
        `,
      });
      console.log(`📧 Correo enviado al técnico ${tecnico.email} por ticket #${createdTicket.id}`);
    } catch (emailError) {
      console.error('Error al enviar correo al técnico:', emailError.message);
      // No detenemos el flujo si falla el correo
    }

    return res.status(201).json(createdTicket);
  } catch (error) {
    next(error);
  }
});

// ── PATCH /api/tickets/:id/status ── Cambiar estatus (solo admin)
ticketRouter.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    // 1. Validar los datos recibidos
    const body = updateTicketStatusRouteSchema.body.parse(req.body);

    // 2. Verificar que el ticket existe
    const existingTicket = ticketRepository.findTicketById(Number(req.params.id));
    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // 3. Actualizar el estatus
    const updatedTicket = ticketRepository.updateTicketStatus({
      id: Number(req.params.id),
      estatus: body.estatus,
    });

    // 4. Si el ticket se resuelve, enviar correo al administrador que lo creó
    if (body.estatus === 'resuelto') {
      try {
        const creador = userRepository.findUserById(existingTicket.creador_id);
        if (creador) {
          await nodemailerService.sendMail({
            to: creador.email,
            subject: `Ticket #${existingTicket.id} Finalizado - Corporación RedexCom`,
            html: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Corporación RedexCom</h1>
                  <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 14px;">Sistema de Soporte Técnico</p>
                </div>
                <div style="padding: 32px; color: #e2e8f0;">
                  <h2 style="color: #10b981; margin-top: 0;">✅ Ticket Finalizado</h2>
                  <p style="font-size: 16px; line-height: 1.6;">
                    Hola ${creador.nombre}, el siguiente ticket ha sido marcado como <strong style="color: #10b981;">RESUELTO</strong>:
                  </p>
                  
                  <div style="background: #1e293b; border: 2px solid #10b981; border-radius: 12px; padding: 24px; margin: 24px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Ticket #</td>
                        <td style="padding: 8px 0; color: #10b981; font-weight: 600; font-size: 18px;">${existingTicket.id}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Cliente</td>
                        <td style="padding: 8px 0; color: #ffffff;">${existingTicket.cliente_nombre}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Técnico</td>
                        <td style="padding: 8px 0; color: #ffffff;">${existingTicket.tecnico_nombre} ${existingTicket.tecnico_apellido}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Descripción</td>
                        <td style="padding: 8px 0; color: #ffffff;">${existingTicket.falla_descripcion}</td>
                      </tr>
                    </table>
                  </div>

                  <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;">
                  <p style="font-size: 12px; color: #64748b; text-align: center;">
                    Este correo fue enviado automáticamente por el Sistema de Soporte Técnico de RedexCom.
                  </p>
                </div>
              </div>
            `,
          });
          console.log(`📧 Correo de ticket resuelto enviado al admin ${creador.email}`);
        }
      } catch (emailError) {
        console.error('Error al enviar correo de ticket resuelto:', emailError.message);
      }
    }

    return res.status(200).json(updatedTicket);
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/tickets/:id ── Eliminar ticket (solo admin)
ticketRouter.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    // 1. Verificar que el ticket existe
    const ticket = ticketRepository.findTicketById(Number(req.params.id));
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // 2. Eliminar el ticket
    ticketRepository.deleteTicket(Number(req.params.id));

    return res.status(200).json({ message: 'Ticket eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
});

export default ticketRouter;
