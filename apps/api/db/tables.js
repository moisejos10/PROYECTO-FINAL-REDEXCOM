/**
 * ═══════════════════════════════════════════════════════════
 * REFERENCIA — SQL para crear tablas en Supabase (PostgreSQL)
 * ═══════════════════════════════════════════════════════════
 * 
 * Este archivo ya NO se ejecuta desde la aplicación.
 * Las tablas se crean desde el SQL Editor del dashboard de Supabase.
 * 
 * Copiar y pegar el siguiente SQL en:
 * https://supabase.com/dashboard → SQL Editor → New Query
 * 
 * ─────────────────────────────────────────────────────────
 * 
 * CREATE TABLE IF NOT EXISTS users (
 *   id SERIAL PRIMARY KEY,
 *   nombre TEXT NOT NULL,
 *   apellido TEXT NOT NULL,
 *   email TEXT UNIQUE NOT NULL,
 *   password_hash TEXT NOT NULL,
 *   rol TEXT NOT NULL DEFAULT 'tecnico',
 *   email_verified BOOLEAN DEFAULT false,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE TABLE IF NOT EXISTS sessions (
 *   id SERIAL PRIMARY KEY,
 *   jwtid TEXT UNIQUE NOT NULL,
 *   user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
 * );
 * 
 * CREATE TABLE IF NOT EXISTS verification_codes (
 *   id SERIAL PRIMARY KEY,
 *   code TEXT NOT NULL,
 *   user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   expires_at TIMESTAMPTZ NOT NULL,
 *   used BOOLEAN DEFAULT false
 * );
 * 
 * CREATE TABLE IF NOT EXISTS tickets (
 *   id SERIAL PRIMARY KEY,
 *   cliente_nombre TEXT NOT NULL,
 *   cliente_direccion TEXT NOT NULL,
 *   cliente_telefono TEXT NOT NULL,
 *   falla_descripcion TEXT NOT NULL,
 *   estatus TEXT NOT NULL DEFAULT 'pendiente',
 *   fecha_visita TEXT,
 *   tecnico_id INTEGER NOT NULL REFERENCES users(id),
 *   creador_id INTEGER NOT NULL REFERENCES users(id),
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE TABLE IF NOT EXISTS ticket_cierres (
 *   id SERIAL PRIMARY KEY,
 *   ticket_id INTEGER NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
 *   cambio_equipo BOOLEAN NOT NULL DEFAULT false,
 *   test_velocidad BOOLEAN NOT NULL DEFAULT false,
 *   potencia_optica TEXT,
 *   observaciones TEXT NOT NULL,
 *   cerrado_por INTEGER NOT NULL REFERENCES users(id),
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE TABLE IF NOT EXISTS ticket_comentarios (
 *   id SERIAL PRIMARY KEY,
 *   ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
 *   usuario_id INTEGER NOT NULL REFERENCES users(id),
 *   contenido TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * ─────────────────────────────────────────────────────────
 * IMPORTANTE: Desactivar RLS en todas las tablas:
 * 
 * ALTER TABLE users DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE verification_codes DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE ticket_cierres DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE ticket_comentarios DISABLE ROW LEVEL SECURITY;
 * 
 * ─────────────────────────────────────────────────────────
 * FUNCIONES RPC para estadísticas avanzadas:
 * 
 * -- Tendencia semanal de tickets (últimas 8 semanas)
 * CREATE OR REPLACE FUNCTION get_weekly_ticket_trend()
 * RETURNS TABLE(semana TEXT, total BIGINT)
 * LANGUAGE sql STABLE
 * AS $$
 *   SELECT to_char(created_at, 'IYYY-"W"IW') AS semana,
 *          COUNT(*) AS total
 *   FROM tickets
 *   WHERE created_at >= NOW() - INTERVAL '56 days'
 *   GROUP BY semana
 *   ORDER BY semana ASC;
 * $$;
 * 
 * -- Tiempo promedio de resolución en horas
 * CREATE OR REPLACE FUNCTION get_avg_resolution_time()
 * RETURNS TABLE(promedio_horas NUMERIC)
 * LANGUAGE sql STABLE
 * AS $$
 *   SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::NUMERIC, 1) AS promedio_horas
 *   FROM tickets
 *   WHERE estatus = 'resuelto';
 * $$;
 * 
 * ═══════════════════════════════════════════════════════════
 */

console.log('⚠️  Este archivo es solo de referencia.');
console.log('   Las tablas se crean desde el SQL Editor de Supabase.');
console.log('   Consulta el código fuente de este archivo para ver el SQL.');
