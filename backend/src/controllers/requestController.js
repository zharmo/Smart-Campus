const db = require('../config/db');
const AppError = require('../utils/AppError');
const { validate } = require('../utils/validators');
const { STATUSES, PRIORITIES } = require('../utils/constants');
const Requests = require('../models/requestModel');
const { recommendPriority } = require('../services/priorityService');
const { notify, notifyAdmins } = require('../services/notificationService');

async function categoryName(id) {
  const { rows } = await db.query('SELECT name FROM categories WHERE id=$1', [id]);
  if (!rows[0]) throw new AppError('Category not found', 400);
  return rows[0].name;
}

// Students may only touch their own requests
async function loadAccessible(req) {
  const r = await Requests.findById(req.params.id);
  if (!r || (req.user.role === 'student' && r.user_id !== req.user.id)) throw new AppError('Request not found', 404);
  return r;
}

exports.recommend = async (req, res) => {
  validate(req.body, { description: { required: true, min: 5, label: 'Description' }, category_id: { type: 'int' } });
  const name = req.body.category_id ? await categoryName(req.body.category_id) : '';
  res.json(recommendPriority({ title: req.body.title || '', description: req.body.description, categoryName: name }));
};

exports.create = async (req, res) => {
  validate(req.body, {
    title: { required: true, min: 5, max: 200, label: 'Title' },
    description: { required: true, min: 10, label: 'Description' },
    category_id: { required: true, type: 'int', label: 'Category' },
    priority: { oneOf: PRIORITIES, label: 'Priority' },
    location: { max: 160, label: 'Location' },
  });
  const { title, description, category_id, location, additional_info } = req.body;
  const rec = recommendPriority({ title, description, categoryName: await categoryName(category_id) });
  const priority = req.body.priority || rec.priority; // student choice, otherwise recommendation
  const id = await db.transaction(async (c) => {
    const { rows } = await c.query(
      `INSERT INTO requests (user_id,category_id,title,description,location,additional_info,priority,recommended_priority,priority_reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, request_code`,
      [req.user.id, category_id, title.trim(), description.trim(), location || null, additional_info || null, priority, rec.priority, rec.reason]);
    await c.query(
      'INSERT INTO request_status_history (request_id,old_status,new_status,new_priority,comment,changed_by) VALUES ($1,NULL,$2,$3,$4,$5)',
      [rows[0].id, 'Submitted', priority, 'Request submitted', req.user.id]);
    await notifyAdmins(rows[0].id, `New request ${rows[0].request_code} submitted by ${req.user.full_name}`, c);
    return rows[0].id;
  });
  res.status(201).json({ request: await Requests.findById(id) });
};

exports.list = async (req, res) => {
  const f = { ...req.query };
  if (req.user.role === 'student') f.userId = req.user.id; // forced scope
  res.json(await Requests.search(f));
};

exports.get = async (req, res) => {
  const request = await loadAccessible(req);
  res.json({ request, history: await Requests.history(request.id) });
};

// Admin: change status, priority, department, comment in one atomic save
exports.adminUpdate = async (req, res) => {
  validate(req.body, {
    status: { oneOf: STATUSES, label: 'Status' },
    priority: { oneOf: PRIORITIES, label: 'Priority' },
    department_id: { type: 'int', label: 'Department' },
    admin_comment: { max: 2000, label: 'Comment' },
  });
  const current = await Requests.findById(req.params.id);
  if (!current) throw new AppError('Request not found', 404);
  const { status = current.status, priority = current.priority, admin_comment } = req.body;
  const deptId = req.body.department_id ? Number(req.body.department_id) : null;
  const statusChanged = status !== current.status;
  const priorityChanged = priority !== current.priority;
  const deptChanged = deptId && deptId !== current.department_id;
  const comment = admin_comment && admin_comment.trim() ? admin_comment.trim() : null;
  if (!statusChanged && !priorityChanged && !deptChanged && !comment) throw new AppError('No changes to save', 400);

  await db.transaction(async (c) => {
    await c.query(
      'UPDATE requests SET status=$1, priority=$2, admin_comment=COALESCE($3, admin_comment), updated_at=NOW() WHERE id=$4',
      [status, priority, comment, current.id]);
    let note = comment;
    if (deptChanged) {
      const d = await c.query('SELECT name FROM departments WHERE id=$1', [deptId]);
      if (!d.rows[0]) throw new AppError('Department not found', 400);
      await c.query(
        `INSERT INTO request_assignments (request_id,department_id,assigned_by) VALUES ($1,$2,$3)
         ON CONFLICT (request_id) DO UPDATE SET department_id=EXCLUDED.department_id, assigned_by=EXCLUDED.assigned_by, assigned_at=NOW()`,
        [current.id, deptId, req.user.id]);
      note = [note, `Assigned to ${d.rows[0].name}`].filter(Boolean).join(' | ');
    }
    if (priorityChanged) note = [note, `Priority changed ${current.priority} -> ${priority}`].filter(Boolean).join(' | ');
    await c.query(
      `INSERT INTO request_status_history (request_id,old_status,new_status,old_priority,new_priority,comment,changed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [current.id, current.status, status, current.priority, priority, note, req.user.id]);
    if (statusChanged) {
      await notify(current.user_id, current.id, `Your request ${current.request_code} status changed to "${status}".`, c);
    }
  });
  res.json({ request: await Requests.findById(current.id), history: await Requests.history(current.id) });
};

// Students can delete their own request only while it is still "Submitted"
exports.remove = async (req, res) => {
  const r = await loadAccessible(req);
  if (req.user.role === 'student' && r.status !== 'Submitted') throw new AppError('Only requests that are still Submitted can be deleted', 400);
  await db.query('DELETE FROM requests WHERE id=$1', [r.id]);
  res.json({ message: 'Request deleted' });
};
