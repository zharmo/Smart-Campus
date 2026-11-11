const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const db = require('../config/db');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AppError('Authentication required', 401);
    let payload;
    try { payload = jwt.verify(token, process.env.JWT_SECRET); }
    catch { throw new AppError('Invalid or expired token', 401); }
    const { rows } = await db.query('SELECT id, full_name, email, role FROM users WHERE id=$1', [payload.id]);
    if (!rows[0]) throw new AppError('User no longer exists', 401);
    req.user = rows[0];
    next();
  } catch (e) { next(e); }
}

const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new AppError('You do not have permission to do this', 403));

module.exports = { authenticate, authorize };
