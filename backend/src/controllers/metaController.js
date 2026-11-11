const db = require('../config/db');
const { STATUSES, PRIORITIES } = require('../utils/constants');

exports.getMeta = async (req, res) => {
  const [c, d] = await Promise.all([
    db.query('SELECT id, name, description FROM categories ORDER BY id'),
    db.query('SELECT id, name, description FROM departments ORDER BY id'),
  ]);
  res.json({ categories: c.rows, departments: d.rows, statuses: STATUSES, priorities: PRIORITIES });
};
