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

const ticketRepository = {
  createTicket,
  findAllTickets,
  findTicketsByTecnicoId,
  findTicketById,
  updateTicketStatus,
  deleteTicket,
  getTicketStats,
  getTicketStatsByTecnico,
};

export default ticketRepository;
