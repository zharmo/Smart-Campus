const db = require('../config/db');
const Requests = require('../models/requestModel');

exports.admin = async (req, res) => {
  const [totals, byCategory, byStatus, byPriority, overTime, byDept, recent] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status IN ('Submitted','Under Review'))::int AS pending,
      COUNT(*) FILTER (WHERE status='In Progress')::int AS in_progress,
      COUNT(*) FILTER (WHERE status='Resolved')::int AS resolved,
      COUNT(*) FILTER (WHERE priority='High')::int AS high_priority FROM requests`),
    db.query(`SELECT c.name, COUNT(r.id)::int AS value FROM categories c LEFT JOIN requests r ON r.category_id=c.id GROUP BY c.id ORDER BY c.id`),
    db.query(`SELECT s.status AS name, COUNT(r.id)::int AS value
      FROM unnest(ARRAY['Submitted','Under Review','Assigned','In Progress','Resolved','Rejected']) WITH ORDINALITY s(status, o)
      LEFT JOIN requests r ON r.status=s.status GROUP BY s.status, s.o ORDER BY s.o`),
    db.query(`SELECT p.priority AS name, COUNT(r.id)::int AS value
      FROM unnest(ARRAY['Low','Medium','High']) WITH ORDINALITY p(priority, o)
      LEFT JOIN requests r ON r.priority=p.priority GROUP BY p.priority, p.o ORDER BY p.o`),
    db.query(`SELECT to_char(d::date,'YYYY-MM-DD') AS date, COUNT(r.id)::int AS value
      FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day') d
      LEFT JOIN requests r ON r.created_at::date = d::date GROUP BY d ORDER BY d`),
    db.query(`SELECT d.name, COUNT(ra.id)::int AS value FROM departments d LEFT JOIN request_assignments ra ON ra.department_id=d.id GROUP BY d.id ORDER BY d.id`),
    Requests.search({ limit: 5 }),
  ]);
  res.json({ totals: totals.rows[0], byCategory: byCategory.rows, byStatus: byStatus.rows, byPriority: byPriority.rows,
    overTime: overTime.rows, byDepartment: byDept.rows, recent: recent.requests });
};

exports.student = async (req, res) => {
  const [totals, recent] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status IN ('Submitted','Under Review','Assigned'))::int AS pending,
      COUNT(*) FILTER (WHERE status='In Progress')::int AS in_progress,
      COUNT(*) FILTER (WHERE status='Resolved')::int AS resolved,
      COUNT(*) FILTER (WHERE status='Rejected')::int AS rejected FROM requests WHERE user_id=$1`, [req.user.id]),
    Requests.search({ userId: req.user.id, limit: 5 }),
  ]);
  res.json({ totals: totals.rows[0], recent: recent.requests });
};
