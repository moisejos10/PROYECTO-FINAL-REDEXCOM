import { Router } from 'express';
import { createTicketRouteSchema, updateTicketStatusRouteSchema } from './ticket.routes.schemas.js';
import ticketRepository from './ticket.repository.js';
import userRepository from '../user/user.repository.js';
import { authenticate, requireAdmin } from '../auth/auth.middlewares.js';
import nodemailerService from '../../services/nodemailer.js';
import { email, ficha, badge, btn } from '../../services/emailTemplate.js';

const ticketRouter = Router();


// Todas las rutas de tickets requieren autenticación

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

// ── GET /api/tickets/weekly/stats ── Estadísticas semanales
ticketRouter.get('/weekly/stats', async (req, res, next) => {
  try {
    let stats;

    if (req.user.rol === 'admin' || req.user.rol === 'super_admin') {
      stats = ticketRepository.getWeeklyTicketStats();
    } else {
      stats = ticketRepository.getWeeklyTicketStatsByTecnico(req.user.id);
    }

    return res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
});

// ── GET /api/tickets/weekly ── Tickets de la semana actual
ticketRouter.get('/weekly', async (req, res, next) => {
  try {
    let tickets;

    if (req.user.rol === 'admin' || req.user.rol === 'super_admin') {
      tickets = ticketRepository.findWeeklyTickets();
    } else {
      tickets = ticketRepository.findWeeklyTicketsByTecnico(req.user.id);
    }

    return res.status(200).json(tickets);
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
        subject: `Ticket #${createdTicket.id} Asignado — Corporación RedexCom`,
        html: email(`
          <h2 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a">Nuevo Ticket Asignado</h2>
          <p style="margin:0 0 24px;color:#475569">Hola ${tecnico.nombre}, se te ha asignado un nuevo ticket de soporte técnico.</p>
          ${ficha([
            ['Ticket', '<span style="color:#E31E24;font-weight:700;font-size:16px">#' + createdTicket.id + '</span>'],
            ['Estado', badge('Pendiente', '#fef2f2', '#E31E24')],
            ['Cliente', createdTicket.cliente_nombre],
            ['Dirección', createdTicket.cliente_direccion],
            ['Contacto', createdTicket.cliente_telefono],
            ...(createdTicket.fecha_visita ? [['Fecha de Visita', '<span style="color:#d97706;font-weight:600">' + createdTicket.fecha_visita + '</span>']] : []),
            ['Descripción', createdTicket.falla_descripcion],
          ])}
          ${btn('Ver Ticket en el Sistema', 'http://localhost:4321/dashboard')}
        `),
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
            subject: `Ticket #${existingTicket.id} Finalizado — Corporación RedexCom`,
            html: email(`
              <h2 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a">✅ Ticket Finalizado</h2>
              <p style="margin:0 0 24px;color:#475569">Hola ${creador.nombre}, el siguiente ticket ha sido completado con éxito.</p>
              ${ficha([
                ['Ticket', '<span style="color:#059669;font-weight:700;font-size:16px">#' + existingTicket.id + '</span>'],
                ['Estado', badge('Resuelto', '#ecfdf5', '#059669')],
                ['Cliente', existingTicket.cliente_nombre],
                ['Técnico', existingTicket.tecnico_nombre + ' ' + existingTicket.tecnico_apellido],
                ['Descripción', existingTicket.falla_descripcion],
              ])}
              ${btn('Ver Detalles', 'http://localhost:4321/dashboard', '#059669')}
            `, '#059669'),
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
