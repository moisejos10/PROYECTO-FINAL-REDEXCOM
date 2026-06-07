import { Router } from 'express';
import { createTicketRouteSchema, updateTicketStatusRouteSchema, resolveTicketChecklistSchema, createComentarioSchema } from './ticket.routes.schemas.js';
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
      stats = await ticketRepository.getTicketStats();
    } else {
      stats = await ticketRepository.getTicketStatsByTecnico(req.user.id);
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
      stats = await ticketRepository.getWeeklyTicketStats();
    } else {
      stats = await ticketRepository.getWeeklyTicketStatsByTecnico(req.user.id);
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
      tickets = await ticketRepository.findWeeklyTickets();
    } else {
      tickets = await ticketRepository.findWeeklyTicketsByTecnico(req.user.id);
    }

    return res.status(200).json(tickets);
  } catch (error) {
    next(error);
  }
});

// ── GET /api/tickets/stats/advanced ── Estadísticas avanzadas (solo admin)
ticketRouter.get('/stats/advanced', requireAdmin, async (req, res, next) => {
  try {
    const stats = await ticketRepository.getTicketStats();
    const ranking = await ticketRepository.getTicketsByTecnicoRanking();
    const trend = await ticketRepository.getWeeklyTicketTrend();
    const avgTime = await ticketRepository.getAverageResolutionTime();
    const topTecnico = await ticketRepository.getTopTecnico();

    return res.status(200).json({
      distribucion: stats,
      ranking_tecnicos: ranking,
      tendencia_semanal: trend,
      tiempo_promedio: avgTime,
      top_tecnico: topTecnico,
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/tickets ── Listar tickets (admin=todos, técnico=solo los suyos)
ticketRouter.get('/', async (req, res, next) => {
  try {
    let tickets;

    if (req.user.rol === 'admin' || req.user.rol === 'super_admin') {
      tickets = await ticketRepository.findAllTickets();
    } else {
      tickets = await ticketRepository.findTicketsByTecnicoId(req.user.id);
    }

    return res.status(200).json(tickets);
  } catch (error) {
    next(error);
  }
});

// ── GET /api/tickets/:id ── Detalle de un ticket
ticketRouter.get('/:id', async (req, res, next) => {
  try {
    const ticket = await ticketRepository.findTicketById(Number(req.params.id));

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
    const tecnico = await userRepository.findUserById(body.tecnico_id);
    if (!tecnico) {
      return res.status(404).json({ error: 'El técnico seleccionado no existe' });
    }

    // 3. Crear el ticket en la base de datos
    const createdTicket = await ticketRepository.createTicket({
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

// ── PATCH /api/tickets/:id/status ── Cambiar estatus
ticketRouter.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    // 1. Validar los datos recibidos
    const body = updateTicketStatusRouteSchema.body.parse(req.body);

    // 2. Verificar que el ticket existe
    const existingTicket = await ticketRepository.findTicketById(Number(req.params.id));
    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // 3. Si se resuelve, validar y guardar el checklist de cierre
    if (body.estatus === 'resuelto') {
      const checklistData = resolveTicketChecklistSchema.parse({
        cambio_equipo: body.cambio_equipo,
        test_velocidad: body.test_velocidad,
        potencia_optica: body.potencia_optica,
        observaciones: body.observaciones,
      });

      // Guardar el registro de cierre
      await ticketRepository.createTicketCierre({
        ticketId: Number(req.params.id),
        cambioEquipo: checklistData.cambio_equipo,
        testVelocidad: checklistData.test_velocidad,
        potenciaOptica: checklistData.potencia_optica,
        observaciones: checklistData.observaciones,
        cerradoPor: req.user.id,
      });
    }

    // 4. Actualizar el estatus
    const updatedTicket = await ticketRepository.updateTicketStatus({
      id: Number(req.params.id),
      estatus: body.estatus,
    });

    // 5. Si el ticket se resuelve, enviar correo al administrador que lo creó
    if (body.estatus === 'resuelto') {
      try {
        const creador = await userRepository.findUserById(existingTicket.creador_id);
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

// ── GET /api/tickets/:id/cierre ── Obtener checklist de cierre de un ticket
ticketRouter.get('/:id/cierre', async (req, res, next) => {
  try {
    const ticket = await ticketRepository.findTicketById(Number(req.params.id));
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Si es técnico, solo puede ver sus propios tickets
    if (req.user.rol === 'tecnico' && ticket.tecnico_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para ver este ticket' });
    }

    const cierre = await ticketRepository.findCierreByTicketId(Number(req.params.id));
    if (!cierre) {
      return res.status(404).json({ error: 'Este ticket no tiene registro de cierre' });
    }

    return res.status(200).json(cierre);
  } catch (error) {
    next(error);
  }
});

// ── GET /api/tickets/:id/comentarios ── Listar comentarios de un ticket
ticketRouter.get('/:id/comentarios', async (req, res, next) => {
  try {
    const ticket = await ticketRepository.findTicketById(Number(req.params.id));
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Si es técnico, solo puede ver sus propios tickets
    if (req.user.rol === 'tecnico' && ticket.tecnico_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para ver este ticket' });
    }

    const comentarios = await ticketRepository.findComentariosByTicketId(Number(req.params.id));
    return res.status(200).json(comentarios);
  } catch (error) {
    next(error);
  }
});

// ── POST /api/tickets/:id/comentarios ── Crear comentario interno
ticketRouter.post('/:id/comentarios', async (req, res, next) => {
  try {
    const body = createComentarioSchema.body.parse(req.body);

    const ticket = await ticketRepository.findTicketById(Number(req.params.id));
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Si es técnico, solo puede comentar en sus propios tickets
    if (req.user.rol === 'tecnico' && ticket.tecnico_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para comentar en este ticket' });
    }

    const comentario = await ticketRepository.createComentario({
      ticketId: Number(req.params.id),
      usuarioId: req.user.id,
      contenido: body.contenido,
    });

    // Enviar correos de notificación de forma asíncrona (sin bloquear la respuesta)
    (async () => {
      try {
        const tecnico = await userRepository.findUserById(ticket.tecnico_id);
        const creador = await userRepository.findUserById(ticket.creador_id);
        const autor = req.user; // { id, email, rol, nombre }

        const subject = `Nuevo comentario en Ticket #${ticket.id} — RedexCom`;
        const actionUrl = `http://localhost:4321/dashboard/tickets/${ticket.id}`;
        
        const isCommenterAdmin = autor.rol === 'admin' || autor.rol === 'super_admin';
        const roleLabel = isCommenterAdmin ? 'Administrador' : 'Técnico';

        // 1. Si el autor NO es el técnico, enviar al técnico
        if (tecnico && autor.id !== tecnico.id) {
          const emailBody = email(`
            <h2 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a">Hola ${tecnico.nombre},</h2>
            <p style="margin:0 0 16px;color:#475569;font-size:15px">Se ha agregado una nueva nota interna al ticket asignado <strong>#${ticket.id}</strong>.</p>
            <p style="margin:0 0 12px;color:#334155;font-weight:600">${autor.nombre} (${roleLabel}) escribió:</p>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #E31E24; border-radius:8px; padding:16px; margin:16px 0; font-style:italic; color:#334155; font-size:14px; line-height:1.5;">
              "${body.contenido}"
            </div>
            <p style="margin:20px 0 8px;color:#334155;font-weight:600;font-size:14px;">Detalles del Ticket:</p>
            ${ficha([
              ['Cliente', ticket.cliente_nombre],
              ['Dirección', ticket.cliente_direccion],
              ['Falla', ticket.falla_descripcion],
              ['Estatus', ticket.estatus.toUpperCase()],
            ])}
            ${btn('Ver Ticket en el Dashboard', actionUrl)}
          `);

          await nodemailerService.sendMail({
            to: tecnico.email,
            subject,
            html: emailBody,
          });
        }

        // 2. Si el autor NO es el creador (admin), enviar al creador
        if (creador && autor.id !== creador.id && (tecnico ? creador.email !== tecnico.email : true)) {
          const emailBody = email(`
            <h2 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a">Hola ${creador.nombre},</h2>
            <p style="margin:0 0 16px;color:#475569;font-size:15px">Se ha agregado una nueva nota interna al ticket creado <strong>#${ticket.id}</strong>.</p>
            <p style="margin:0 0 12px;color:#334155;font-weight:600">${autor.nombre} (${roleLabel}) escribió:</p>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #E31E24; border-radius:8px; padding:16px; margin:16px 0; font-style:italic; color:#334155; font-size:14px; line-height:1.5;">
              "${body.contenido}"
            </div>
            <p style="margin:20px 0 8px;color:#334155;font-weight:600;font-size:14px;">Detalles del Ticket:</p>
            ${ficha([
              ['Cliente', ticket.cliente_nombre],
              ['Dirección', ticket.cliente_direccion],
              ['Falla', ticket.falla_descripcion],
              ['Estatus', ticket.estatus.toUpperCase()],
            ])}
            ${btn('Ver Ticket en el Dashboard', actionUrl)}
          `);

          await nodemailerService.sendMail({
            to: creador.email,
            subject,
            html: emailBody,
          });
        }
      } catch (err) {
        console.error('Error al enviar notificaciones de comentarios por correo:', err);
      }
    })();

    return res.status(201).json(comentario);
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/tickets/:id ── Eliminar ticket (solo admin)
ticketRouter.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    // 1. Verificar que el ticket existe
    const ticket = await ticketRepository.findTicketById(Number(req.params.id));
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // 2. Eliminar el ticket
    await ticketRepository.deleteTicket(Number(req.params.id));

    return res.status(200).json({ message: 'Ticket eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
});

export default ticketRouter;
