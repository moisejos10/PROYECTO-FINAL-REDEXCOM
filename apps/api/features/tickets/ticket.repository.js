import db from '../../db/index.js';
// eslint-disable-next-line no-unused-vars
import * as z from 'zod';
// eslint-disable-next-line no-unused-vars
import { ticketSchema } from './ticket.schemas.js';

/** @typedef { z.infer<typeof ticketSchema> } Ticket */

/**
 * Crea un ticket en la base de datos
 * @param {Object} payload
 * @param {Ticket['cliente_nombre']} payload.clienteNombre - Nombre del cliente
 * @param {Ticket['cliente_direccion']} payload.clienteDireccion - Dirección del cliente
 * @param {Ticket['cliente_telefono']} payload.clienteTelefono - Teléfono del cliente
 * @param {Ticket['falla_descripcion']} payload.fallaDescripcion - Descripción de la falla
 * @param {Ticket['tecnico_id']} payload.tecnicoId - ID del técnico asignado
 * @param {Ticket['creador_id']} payload.creadorId - ID del administrador que crea el ticket
 * @param {Ticket['fecha_visita']} payload.fechaVisita - Fecha programada de visita
 * @returns {Ticket}
 */
const createTicket = ({ clienteNombre, clienteDireccion, clienteTelefono, fallaDescripcion, tecnicoId, creadorId, fechaVisita }) => {
  const smtm = db.prepare(`
    INSERT INTO tickets (cliente_nombre, cliente_direccion, cliente_telefono, falla_descripcion, tecnico_id, creador_id, fecha_visita)
    VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *
  `);
  const createdTicket = smtm.get(clienteNombre, clienteDireccion, clienteTelefono, fallaDescripcion, tecnicoId, creadorId, fechaVisita || null);
  return createdTicket;
};

/**
 * Obtiene todos los tickets (para administradores)
 * Incluye el nombre del técnico asignado
 * @returns {Array}
 */
const findAllTickets = () => {
  const smtm = db.prepare(`
    SELECT tickets.*, users.nombre AS tecnico_nombre, users.apellido AS tecnico_apellido
    FROM tickets
    INNER JOIN users ON tickets.tecnico_id = users.id
    ORDER BY tickets.created_at DESC
  `);
  const tickets = smtm.all();
  return tickets;
};

/**
 * Obtiene los tickets asignados a un técnico específico
 * @param {Ticket['tecnico_id']} tecnicoId - ID del técnico
 * @returns {Array}
 */
const findTicketsByTecnicoId = (tecnicoId) => {
  const smtm = db.prepare(`
    SELECT tickets.*, users.nombre AS tecnico_nombre, users.apellido AS tecnico_apellido
    FROM tickets
    INNER JOIN users ON tickets.tecnico_id = users.id
    WHERE tickets.tecnico_id = ?
    ORDER BY tickets.created_at DESC
  `);
  const tickets = smtm.all(tecnicoId);
  return tickets;
};

/**
 * Busca un ticket por su ID
 * Incluye los datos del técnico asignado
 * @param {Ticket['id']} id - ID del ticket
 * @returns {Ticket|undefined}
 */
const findTicketById = (id) => {
  const smtm = db.prepare(`
    SELECT tickets.*, users.nombre AS tecnico_nombre, users.apellido AS tecnico_apellido, users.email AS tecnico_email
    FROM tickets
    INNER JOIN users ON tickets.tecnico_id = users.id
    WHERE tickets.id = ?
  `);
  const ticket = smtm.get(id);
  return ticket;
};

/**
 * Actualiza el estatus de un ticket
 * @param {Object} payload
 * @param {Ticket['id']} payload.id - ID del ticket
 * @param {Ticket['estatus']} payload.estatus - Nuevo estatus
 * @returns {Ticket}
 */
const updateTicketStatus = ({ id, estatus }) => {
  const smtm = db.prepare(`
    UPDATE tickets
    SET estatus = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    RETURNING *
  `);
  const updatedTicket = smtm.get(estatus, id);
  return updatedTicket;
};

/**
 * Elimina un ticket por su ID
 * @param {Ticket['id']} id - ID del ticket
 * @returns {void}
 */
const deleteTicket = (id) => {
  const smtm = db.prepare('DELETE FROM tickets WHERE id = ?');
  smtm.run(id);
};

/**
 * Obtiene estadísticas de los tickets
 * @returns {Object} - { total, pendientes, en_proceso, resueltos }
 */
const getTicketStats = () => {
  const total = db.prepare('SELECT COUNT(*) AS count FROM tickets').get();
  const pendientes = db.prepare("SELECT COUNT(*) AS count FROM tickets WHERE estatus = 'pendiente'").get();
  const enProceso = db.prepare("SELECT COUNT(*) AS count FROM tickets WHERE estatus = 'en_proceso'").get();
  const resueltos = db.prepare("SELECT COUNT(*) AS count FROM tickets WHERE estatus = 'resuelto'").get();

  return {
    total: total.count,
    pendientes: pendientes.count,
    en_proceso: enProceso.count,
    resueltos: resueltos.count,
  };
};

/**
 * Obtiene estadísticas de los tickets de un técnico específico
 * @param {number} tecnicoId - ID del técnico
 * @returns {Object} - { total, pendientes, en_proceso, resueltos }
 */
const getTicketStatsByTecnico = (tecnicoId) => {
  const total = db.prepare('SELECT COUNT(*) AS count FROM tickets WHERE tecnico_id = ?').get(tecnicoId);
  const pendientes = db.prepare("SELECT COUNT(*) AS count FROM tickets WHERE estatus = 'pendiente' AND tecnico_id = ?").get(tecnicoId);
  const enProceso = db.prepare("SELECT COUNT(*) AS count FROM tickets WHERE estatus = 'en_proceso' AND tecnico_id = ?").get(tecnicoId);
  const resueltos = db.prepare("SELECT COUNT(*) AS count FROM tickets WHERE estatus = 'resuelto' AND tecnico_id = ?").get(tecnicoId);

  return {
    total: total.count,
    pendientes: pendientes.count,
    en_proceso: enProceso.count,
    resueltos: resueltos.count,
  };
};

/**
 * Obtiene todos los tickets de la semana actual (lunes a domingo) — Admin
 * @returns {Array}
 */
const findWeeklyTickets = () => {
  const smtm = db.prepare(`
    SELECT tickets.*, users.nombre AS tecnico_nombre, users.apellido AS tecnico_apellido
    FROM tickets
    INNER JOIN users ON tickets.tecnico_id = users.id
    WHERE tickets.created_at >= date('now', 'weekday 1', '-7 days')
      AND tickets.created_at < date('now', 'weekday 1')
    ORDER BY tickets.created_at DESC
  `);
  return smtm.all();
};

/**
 * Obtiene los tickets de la semana actual para un técnico específico
 * @param {number} tecnicoId
 * @returns {Array}
 */
const findWeeklyTicketsByTecnico = (tecnicoId) => {
  const smtm = db.prepare(`
    SELECT tickets.*, users.nombre AS tecnico_nombre, users.apellido AS tecnico_apellido
    FROM tickets
    INNER JOIN users ON tickets.tecnico_id = users.id
    WHERE tickets.tecnico_id = ?
      AND tickets.created_at >= date('now', 'weekday 1', '-7 days')
      AND tickets.created_at < date('now', 'weekday 1')
    ORDER BY tickets.created_at DESC
  `);
  return smtm.all(tecnicoId);
};

/**
 * Estadísticas de tickets de la semana actual — Admin
 * @returns {Object}
 */
const getWeeklyTicketStats = () => {
  const weekFilter = "AND created_at >= date('now', 'weekday 1', '-7 days') AND created_at < date('now', 'weekday 1')";
  const total = db.prepare(`SELECT COUNT(*) AS count FROM tickets WHERE 1=1 ${weekFilter}`).get();
  const pendientes = db.prepare(`SELECT COUNT(*) AS count FROM tickets WHERE estatus = 'pendiente' ${weekFilter}`).get();
  const enProceso = db.prepare(`SELECT COUNT(*) AS count FROM tickets WHERE estatus = 'en_proceso' ${weekFilter}`).get();
  const resueltos = db.prepare(`SELECT COUNT(*) AS count FROM tickets WHERE estatus = 'resuelto' ${weekFilter}`).get();

  return {
    total: total.count,
    pendientes: pendientes.count,
    en_proceso: enProceso.count,
    resueltos: resueltos.count,
  };
};

/**
 * Estadísticas de tickets de la semana actual por técnico
 * @param {number} tecnicoId
 * @returns {Object}
 */
const getWeeklyTicketStatsByTecnico = (tecnicoId) => {
  const weekFilter = "AND created_at >= date('now', 'weekday 1', '-7 days') AND created_at < date('now', 'weekday 1')";
  const total = db.prepare(`SELECT COUNT(*) AS count FROM tickets WHERE tecnico_id = ? ${weekFilter}`).get(tecnicoId);
  const pendientes = db.prepare(`SELECT COUNT(*) AS count FROM tickets WHERE estatus = 'pendiente' AND tecnico_id = ? ${weekFilter}`).get(tecnicoId);
  const enProceso = db.prepare(`SELECT COUNT(*) AS count FROM tickets WHERE estatus = 'en_proceso' AND tecnico_id = ? ${weekFilter}`).get(tecnicoId);
  const resueltos = db.prepare(`SELECT COUNT(*) AS count FROM tickets WHERE estatus = 'resuelto' AND tecnico_id = ? ${weekFilter}`).get(tecnicoId);

  return {
    total: total.count,
    pendientes: pendientes.count,
    en_proceso: enProceso.count,
    resueltos: resueltos.count,
  };
};

// ═══════════════════════════════════════════════════════════
// ── CIERRES DE TICKET (Checklist de resolución) ──
// ═══════════════════════════════════════════════════════════

/**
 * Crea un registro de cierre de ticket (checklist)
 * @param {Object} payload
 * @returns {Object}
 */
const createTicketCierre = ({ ticketId, cambioEquipo, testVelocidad, potenciaOptica, observaciones, cerradoPor }) => {
  const smtm = db.prepare(`
    INSERT INTO ticket_cierres (ticket_id, cambio_equipo, test_velocidad, potencia_optica, observaciones, cerrado_por)
    VALUES (?, ?, ?, ?, ?, ?) RETURNING *
  `);
  return smtm.get(ticketId, cambioEquipo ? 1 : 0, testVelocidad ? 1 : 0, potenciaOptica || null, observaciones, cerradoPor);
};

/**
 * Obtiene el registro de cierre de un ticket
 * @param {number} ticketId
 * @returns {Object|undefined}
 */
const findCierreByTicketId = (ticketId) => {
  const smtm = db.prepare(`
    SELECT ticket_cierres.*, users.nombre AS cerrado_por_nombre, users.apellido AS cerrado_por_apellido
    FROM ticket_cierres
    INNER JOIN users ON ticket_cierres.cerrado_por = users.id
    WHERE ticket_cierres.ticket_id = ?
  `);
  return smtm.get(ticketId);
};

// ═══════════════════════════════════════════════════════════
// ── COMENTARIOS INTERNOS ──
// ═══════════════════════════════════════════════════════════

/**
 * Crea un comentario interno en un ticket
 * @param {Object} payload
 * @returns {Object}
 */
const createComentario = ({ ticketId, usuarioId, contenido }) => {
  const smtm = db.prepare(`
    INSERT INTO ticket_comentarios (ticket_id, usuario_id, contenido)
    VALUES (?, ?, ?) RETURNING *
  `);
  return smtm.get(ticketId, usuarioId, contenido);
};

/**
 * Obtiene todos los comentarios de un ticket (con datos del autor)
 * @param {number} ticketId
 * @returns {Array}
 */
const findComentariosByTicketId = (ticketId) => {
  const smtm = db.prepare(`
    SELECT ticket_comentarios.*, users.nombre AS autor_nombre, users.apellido AS autor_apellido, users.rol AS autor_rol
    FROM ticket_comentarios
    INNER JOIN users ON ticket_comentarios.usuario_id = users.id
    WHERE ticket_comentarios.ticket_id = ?
    ORDER BY ticket_comentarios.created_at ASC
  `);
  return smtm.all(ticketId);
};

// ═══════════════════════════════════════════════════════════
// ── ESTADÍSTICAS AVANZADAS (Reportes) ──
// ═══════════════════════════════════════════════════════════

/**
 * Ranking de tickets resueltos por técnico
 * @returns {Array} [{ tecnico_nombre, tecnico_apellido, resueltos }]
 */
const getTicketsByTecnicoRanking = () => {
  const smtm = db.prepare(`
    SELECT users.nombre AS tecnico_nombre, users.apellido AS tecnico_apellido, COUNT(*) AS resueltos
    FROM tickets
    INNER JOIN users ON tickets.tecnico_id = users.id
    WHERE tickets.estatus = 'resuelto'
    GROUP BY tickets.tecnico_id
    ORDER BY resueltos DESC
  `);
  return smtm.all();
};

/**
 * Tendencia de tickets creados por semana (últimas 8 semanas)
 * @returns {Array} [{ semana, total }]
 */
const getWeeklyTicketTrend = () => {
  const smtm = db.prepare(`
    SELECT strftime('%Y-W%W', created_at) AS semana,
           COUNT(*) AS total
    FROM tickets
    WHERE created_at >= date('now', '-56 days')
    GROUP BY semana
    ORDER BY semana ASC
  `);
  return smtm.all();
};

/**
 * Tiempo promedio de resolución en horas
 * @returns {Object} { promedio_horas }
 */
const getAverageResolutionTime = () => {
  const smtm = db.prepare(`
    SELECT ROUND(AVG((julianday(updated_at) - julianday(created_at)) * 24), 1) AS promedio_horas
    FROM tickets
    WHERE estatus = 'resuelto'
  `);
  const result = smtm.get();
  return { promedio_horas: result.promedio_horas || 0 };
};

/**
 * Técnico con más tickets resueltos
 * @returns {Object|null} { nombre, apellido, resueltos }
 */
const getTopTecnico = () => {
  const smtm = db.prepare(`
    SELECT users.nombre, users.apellido, COUNT(*) AS resueltos
    FROM tickets
    INNER JOIN users ON tickets.tecnico_id = users.id
    WHERE tickets.estatus = 'resuelto'
    GROUP BY tickets.tecnico_id
    ORDER BY resueltos DESC
    LIMIT 1
  `);
  return smtm.get() || null;
};

const ticketRepository = {
  createTicket,
  findAllTickets,
  findTicketsByTecnicoId,
  findTicketById,
  updateTicketStatus,
  deleteTicket,
  getTicketStats,
  getTicketStatsByTecnico,
  findWeeklyTickets,
  findWeeklyTicketsByTecnico,
  getWeeklyTicketStats,
  getWeeklyTicketStatsByTecnico,
  // Cierres
  createTicketCierre,
  findCierreByTicketId,
  // Comentarios
  createComentario,
  findComentariosByTicketId,
  // Estadísticas avanzadas
  getTicketsByTecnicoRanking,
  getWeeklyTicketTrend,
  getAverageResolutionTime,
  getTopTecnico,
};

export default ticketRepository;

