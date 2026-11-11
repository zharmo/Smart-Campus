const db = require('../config/db');

const BASE_SELECT = `
  SELECT r.id, r.request_code, r.title, r.description, r.location, r.additional_info, r.priority,
         r.recommended_priority, r.priority_reason, r.status, r.admin_comment, r.created_at, r.updated_at,
         r.user_id, u.full_name AS student_name, u.email AS student_email, u.student_id,
         c.id AS category_id, c.name AS category,
         d.id AS department_id, d.name AS department
  FROM requests r
  JOIN users u ON u.id = r.user_id
  JOIN categories c ON c.id = r.category_id
  LEFT JOIN request_assignments ra ON ra.request_id = r.id
  LEFT JOIN departments d ON d.id = ra.department_id`;

// Builds a combined WHERE clause from any mix of filters
async function search({ userId, q, category_id, status, priority, department_id, date_from, date_to, page = 1, limit = 10 }) {
  const where = []; const p = [];
  const add = (sql, v) => { p.push(v); where.push(sql.replace('?', `$${p.length}`)); };
  if (userId) add('r.user_id = ?', userId);
  if (q) { p.push(`%${q}%`); const i = p.length; where.push(`(r.request_code ILIKE $${i} OR r.title ILIKE $${i} OR u.full_name ILIKE $${i} OR u.student_id ILIKE $${i})`); }
  if (category_id) add('r.category_id = ?', category_id);
  if (status) add('r.status = ?', status);
  if (priority) add('r.priority = ?', priority);
  if (department_id) add('ra.department_id = ?', department_id);
  if (date_from) add('r.created_at >= ?::date', date_from);
  if (date_to) add("r.created_at < (?::date + INTERVAL '1 day')", date_to);
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const lim = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const off = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;
  const total = await db.query(
    `SELECT COUNT(*)::int AS n FROM requests r JOIN users u ON u.id=r.user_id
     LEFT JOIN request_assignments ra ON ra.request_id=r.id ${w}`, p);
  const rows = await db.query(`${BASE_SELECT} ${w} ORDER BY r.created_at DESC LIMIT ${lim} OFFSET ${off}`, p);
  return { requests: rows.rows, total: total.rows[0].n, page: Math.floor(off / lim) + 1, pages: Math.max(Math.ceil(total.rows[0].n / lim), 1) };
}

async function findById(id) {
  const { rows } = await db.query(`${BASE_SELECT} WHERE r.id = $1`, [id]);
  return rows[0];
}

async function history(requestId) {
  const { rows } = await db.query(
    `SELECT h.*, u.full_name AS changed_by_name, u.role AS changed_by_role
     FROM request_status_history h LEFT JOIN users u ON u.id = h.changed_by
     WHERE h.request_id = $1 ORDER BY h.changed_at ASC, h.id ASC`, [requestId]);
  return rows;
}

module.exports = { search, findById, history };
