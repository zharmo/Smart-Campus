const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { validate } = require('../utils/validators');

const sign = (u) => jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (u) => ({ id: u.id, full_name: u.full_name, email: u.email, role: u.role, student_id: u.student_id, phone: u.phone, department: u.department, created_at: u.created_at });

exports.register = async (req, res) => {
  validate(req.body, {
    full_name: { required: true, min: 2, max: 120, label: 'Full name' },
    email: { required: true, email: true, label: 'Email' },
    password: { required: true, min: 6, max: 72, label: 'Password' },
    student_id: { required: true, max: 40, label: 'Student ID' },
  });
  const { full_name, email, password, student_id, phone, department } = req.body;
  const hash = await bcrypt.hash(password, 10);
  // Public registration always creates a STUDENT; admins are created via seed/DB only.
  const { rows } = await db.query(
    `INSERT INTO users (full_name,email,password_hash,role,student_id,phone,department)
     VALUES ($1,LOWER($2),$3,'student',$4,$5,$6) RETURNING *`,
    [full_name.trim(), email.trim(), hash, student_id.trim(), phone || null, department || null]);
  res.status(201).json({ token: sign(rows[0]), user: publicUser(rows[0]) });
};

exports.login = async (req, res) => {
  validate(req.body, { email: { required: true, email: true, label: 'Email' }, password: { required: true, label: 'Password' } });
  const { rows } = await db.query('SELECT * FROM users WHERE email=LOWER($1)', [req.body.email.trim()]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) throw new AppError('Invalid email or password', 401);
  res.json({ token: sign(user), user: publicUser(user) });
};

exports.me = async (req, res) => {
  const { rows } = await db.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
  res.json({ user: publicUser(rows[0]) });
};

exports.updateProfile = async (req, res) => {
  validate(req.body, { full_name: { required: true, min: 2, max: 120, label: 'Full name' } });
  const { full_name, phone, department } = req.body;
  const { rows } = await db.query(
    'UPDATE users SET full_name=$1, phone=$2, department=$3 WHERE id=$4 RETURNING *',
    [full_name.trim(), phone || null, department || null, req.user.id]);
  res.json({ user: publicUser(rows[0]) });
};

exports.changePassword = async (req, res) => {
  validate(req.body, { current_password: { required: true, label: 'Current password' }, new_password: { required: true, min: 6, max: 72, label: 'New password' } });
  const { rows } = await db.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
  if (!(await bcrypt.compare(req.body.current_password, rows[0].password_hash))) throw new AppError('Current password is incorrect', 400);
  await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [await bcrypt.hash(req.body.new_password, 10), req.user.id]);
  res.json({ message: 'Password updated' });
};
