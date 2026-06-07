import supabase from '../../db/index.js';

// ═══════════════════════════════════════════════════════════
// ── CRUD DE TICKETS ──
// ═══════════════════════════════════════════════════════════

/**
 * Crea un ticket en la base de datos
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
const createTicket = async ({ clienteNombre, clienteDireccion, clienteTelefono, fallaDescripcion, tecnicoId, creadorId, fechaVisita }) => {
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      cliente_nombre: clienteNombre,
      cliente_direccion: clienteDireccion,
      cliente_telefono: clienteTelefono,
      falla_descripcion: fallaDescripcion,
      tecnico_id: tecnicoId,
      creador_id: creadorId,
      fecha_visita: fechaVisita || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Obtiene todos los tickets (para administradores) con nombre del técnico
 * @returns {Promise<Array>}
 */
const findAllTickets = async () => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*, users!tickets_tecnico_id_fkey(nombre, apellido)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  // Aplanar el objeto del técnico para mantener compatibilidad
  return data.map(t => ({
    ...t,
    tecnico_nombre: t.users?.nombre,
    tecnico_apellido: t.users?.apellido,
    users: undefined,
  }));
};

/**
 * Obtiene los tickets asignados a un técnico específico
 * @param {number} tecnicoId
 * @returns {Promise<Array>}
 */
const findTicketsByTecnicoId = async (tecnicoId) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*, users!tickets_tecnico_id_fkey(nombre, apellido)')
    .eq('tecnico_id', tecnicoId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(t => ({
    ...t,
    tecnico_nombre: t.users?.nombre,
    tecnico_apellido: t.users?.apellido,
    users: undefined,
  }));
};

/**
 * Busca un ticket por su ID con datos del técnico
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findTicketById = async (id) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*, users!tickets_tecnico_id_fkey(nombre, apellido, email)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    tecnico_nombre: data.users?.nombre,
    tecnico_apellido: data.users?.apellido,
    tecnico_email: data.users?.email,
    users: undefined,
  };
};

/**
 * Actualiza el estatus de un ticket
 * @param {Object} payload
 * @param {number} payload.id
 * @param {string} payload.estatus
 * @returns {Promise<Object>}
 */
const updateTicketStatus = async ({ id, estatus }) => {
  const { data, error } = await supabase
    .from('tickets')
    .update({ estatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Elimina un ticket por su ID
 * @param {number} id
 * @returns {Promise<void>}
 */
const deleteTicket = async (id) => {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ═══════════════════════════════════════════════════════════
// ── ESTADÍSTICAS ──
// ═══════════════════════════════════════════════════════════

/**
 * Obtiene estadísticas de los tickets
 * @returns {Promise<Object>}
 */
const getTicketStats = async () => {
  const { data, error } = await supabase.from('tickets').select('estatus');
  if (error) throw error;

  const total = data.length;
  const pendientes = data.filter(t => t.estatus === 'pendiente').length;
  const en_proceso = data.filter(t => t.estatus === 'en_proceso').length;
  const resueltos = data.filter(t => t.estatus === 'resuelto').length;

  return { total, pendientes, en_proceso, resueltos };
};

/**
 * Obtiene estadísticas de los tickets de un técnico
 * @param {number} tecnicoId
 * @returns {Promise<Object>}
 */
const getTicketStatsByTecnico = async (tecnicoId) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('estatus')
    .eq('tecnico_id', tecnicoId);
  if (error) throw error;

  const total = data.length;
  const pendientes = data.filter(t => t.estatus === 'pendiente').length;
  const en_proceso = data.filter(t => t.estatus === 'en_proceso').length;
  const resueltos = data.filter(t => t.estatus === 'resuelto').length;

  return { total, pendientes, en_proceso, resueltos };
};

// ═══════════════════════════════════════════════════════════
// ── TICKETS SEMANALES ──
// ═══════════════════════════════════════════════════════════

/**
 * Calcula las fechas del lunes y domingo de la semana actual
 * @returns {{ monday: string, sunday: string }}
 */
function getCurrentWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=dom, 1=lun
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);
  return {
    monday: monday.toISOString(),
    sunday: sunday.toISOString(),
  };
}

/**
 * Obtiene todos los tickets de la semana actual — Admin
 * @returns {Promise<Array>}
 */
const findWeeklyTickets = async () => {
  const { monday, sunday } = getCurrentWeekRange();
  const { data, error } = await supabase
    .from('tickets')
    .select('*, users!tickets_tecnico_id_fkey(nombre, apellido)')
    .gte('created_at', monday)
    .lt('created_at', sunday)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(t => ({
    ...t,
    tecnico_nombre: t.users?.nombre,
    tecnico_apellido: t.users?.apellido,
    users: undefined,
  }));
};

/**
 * Obtiene los tickets de la semana actual para un técnico
 * @param {number} tecnicoId
 * @returns {Promise<Array>}
 */
const findWeeklyTicketsByTecnico = async (tecnicoId) => {
  const { monday, sunday } = getCurrentWeekRange();
  const { data, error } = await supabase
    .from('tickets')
    .select('*, users!tickets_tecnico_id_fkey(nombre, apellido)')
    .eq('tecnico_id', tecnicoId)
    .gte('created_at', monday)
    .lt('created_at', sunday)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(t => ({
    ...t,
    tecnico_nombre: t.users?.nombre,
    tecnico_apellido: t.users?.apellido,
    users: undefined,
  }));
};

/**
 * Estadísticas de tickets de la semana actual — Admin
 * @returns {Promise<Object>}
 */
const getWeeklyTicketStats = async () => {
  const { monday, sunday } = getCurrentWeekRange();
  const { data, error } = await supabase
    .from('tickets')
    .select('estatus')
    .gte('created_at', monday)
    .lt('created_at', sunday);

  if (error) throw error;

  const total = data.length;
  const pendientes = data.filter(t => t.estatus === 'pendiente').length;
  const en_proceso = data.filter(t => t.estatus === 'en_proceso').length;
  const resueltos = data.filter(t => t.estatus === 'resuelto').length;

  return { total, pendientes, en_proceso, resueltos };
};

/**
 * Estadísticas de tickets de la semana actual por técnico
 * @param {number} tecnicoId
 * @returns {Promise<Object>}
 */
const getWeeklyTicketStatsByTecnico = async (tecnicoId) => {
  const { monday, sunday } = getCurrentWeekRange();
  const { data, error } = await supabase
    .from('tickets')
    .select('estatus')
    .eq('tecnico_id', tecnicoId)
    .gte('created_at', monday)
    .lt('created_at', sunday);

  if (error) throw error;

  const total = data.length;
  const pendientes = data.filter(t => t.estatus === 'pendiente').length;
  const en_proceso = data.filter(t => t.estatus === 'en_proceso').length;
  const resueltos = data.filter(t => t.estatus === 'resuelto').length;

  return { total, pendientes, en_proceso, resueltos };
};

// ═══════════════════════════════════════════════════════════
// ── CIERRES DE TICKET (Checklist de resolución) ──
// ═══════════════════════════════════════════════════════════

/**
 * Crea un registro de cierre de ticket (checklist)
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
const createTicketCierre = async ({ ticketId, cambioEquipo, testVelocidad, potenciaOptica, observaciones, cerradoPor }) => {
  const { data, error } = await supabase
    .from('ticket_cierres')
    .insert({
      ticket_id: ticketId,
      cambio_equipo: cambioEquipo,
      test_velocidad: testVelocidad,
      potencia_optica: potenciaOptica || null,
      observaciones,
      cerrado_por: cerradoPor,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Obtiene el registro de cierre de un ticket con datos del usuario que cerró
 * @param {number} ticketId
 * @returns {Promise<Object|null>}
 */
const findCierreByTicketId = async (ticketId) => {
  const { data, error } = await supabase
    .from('ticket_cierres')
    .select('*, users!ticket_cierres_cerrado_por_fkey(nombre, apellido)')
    .eq('ticket_id', ticketId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    cerrado_por_nombre: data.users?.nombre,
    cerrado_por_apellido: data.users?.apellido,
    users: undefined,
  };
};

// ═══════════════════════════════════════════════════════════
// ── COMENTARIOS INTERNOS ──
// ═══════════════════════════════════════════════════════════

/**
 * Crea un comentario interno en un ticket
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
const createComentario = async ({ ticketId, usuarioId, contenido }) => {
  const { data, error } = await supabase
    .from('ticket_comentarios')
    .insert({
      ticket_id: ticketId,
      usuario_id: usuarioId,
      contenido,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Obtiene todos los comentarios de un ticket (con datos del autor)
 * @param {number} ticketId
 * @returns {Promise<Array>}
 */
const findComentariosByTicketId = async (ticketId) => {
  const { data, error } = await supabase
    .from('ticket_comentarios')
    .select('*, users!ticket_comentarios_usuario_id_fkey(nombre, apellido, rol)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data.map(c => ({
    ...c,
    autor_nombre: c.users?.nombre,
    autor_apellido: c.users?.apellido,
    autor_rol: c.users?.rol,
    users: undefined,
  }));
};

// ═══════════════════════════════════════════════════════════
// ── ESTADÍSTICAS AVANZADAS (Reportes) ──
// ═══════════════════════════════════════════════════════════

/**
 * Ranking de tickets resueltos por técnico
 * @returns {Promise<Array>}
 */
const getTicketsByTecnicoRanking = async () => {
  // Obtener todos los tickets resueltos con datos del técnico
  const { data, error } = await supabase
    .from('tickets')
    .select('tecnico_id, users!tickets_tecnico_id_fkey(nombre, apellido)')
    .eq('estatus', 'resuelto');

  if (error) throw error;

  // Agrupar y contar por técnico en JavaScript
  const countMap = {};
  for (const t of data) {
    const key = t.tecnico_id;
    if (!countMap[key]) {
      countMap[key] = {
        tecnico_nombre: t.users?.nombre,
        tecnico_apellido: t.users?.apellido,
        resueltos: 0,
      };
    }
    countMap[key].resueltos++;
  }

  return Object.values(countMap).sort((a, b) => b.resueltos - a.resueltos);
};

/**
 * Tendencia de tickets creados por semana (últimas 8 semanas)
 * Intenta usar la función RPC de Supabase, si no existe, calcula en JS
 * @returns {Promise<Array>}
 */
const getWeeklyTicketTrend = async () => {
  // Intentar usar la función RPC si existe
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_weekly_ticket_trend');
  if (!rpcError && rpcData) return rpcData;

  // Fallback: calcular en JavaScript
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const { data, error } = await supabase
    .from('tickets')
    .select('created_at')
    .gte('created_at', eightWeeksAgo.toISOString());

  if (error) throw error;

  // Agrupar por semana ISO
  const weekMap = {};
  for (const t of data) {
    const d = new Date(t.created_at);
    const year = d.getFullYear();
    // Calcular semana ISO
    const jan4 = new Date(year, 0, 4);
    const daysSinceJan4 = Math.floor((d - jan4) / 86400000);
    const weekNum = Math.ceil((daysSinceJan4 + jan4.getDay() + 1) / 7);
    const key = `${year}-W${String(weekNum).padStart(2, '0')}`;
    weekMap[key] = (weekMap[key] || 0) + 1;
  }

  return Object.entries(weekMap)
    .map(([semana, total]) => ({ semana, total }))
    .sort((a, b) => a.semana.localeCompare(b.semana));
};

/**
 * Tiempo promedio de resolución en horas
 * @returns {Promise<Object>}
 */
const getAverageResolutionTime = async () => {
  // Intentar usar la función RPC si existe
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_avg_resolution_time');
  if (!rpcError && rpcData && rpcData.length > 0) {
    return { promedio_horas: rpcData[0].promedio_horas || 0 };
  }

  // Fallback: calcular en JavaScript
  const { data, error } = await supabase
    .from('tickets')
    .select('created_at, updated_at')
    .eq('estatus', 'resuelto');

  if (error) throw error;

  if (data.length === 0) return { promedio_horas: 0 };

  const totalHours = data.reduce((sum, t) => {
    const created = new Date(t.created_at);
    const updated = new Date(t.updated_at);
    return sum + (updated - created) / (1000 * 60 * 60);
  }, 0);

  return { promedio_horas: Math.round((totalHours / data.length) * 10) / 10 };
};

/**
 * Técnico con más tickets resueltos
 * @returns {Promise<Object|null>}
 */
const getTopTecnico = async () => {
  const ranking = await getTicketsByTecnicoRanking();
  if (ranking.length === 0) return null;

  return {
    nombre: ranking[0].tecnico_nombre,
    apellido: ranking[0].tecnico_apellido,
    resueltos: ranking[0].resueltos,
  };
};

// ═══════════════════════════════════════════════════════════

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
