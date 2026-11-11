const db = require('../config/db');
const AppError = require('../utils/AppError');

exports.list = async (req, res) => {
  const { rows } = await db.query(
    `SELECT n.id, n.message, n.is_read, n.created_at, n.request_id, r.request_code, r.status
     FROM notifications n LEFT JOIN requests r ON r.id = n.request_id
     WHERE n.user_id=$1 ORDER BY n.created_at DESC, n.id DESC LIMIT 100`, [req.user.id]);
  const unread = rows.filter((n) => !n.is_read).length;
  res.json({ notifications: rows, unread });
};

exports.unreadCount = async (req, res) => {
  const { rows } = await db.query('SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id=$1 AND is_read=FALSE', [req.user.id]);
  res.json(rows[0]);
};

exports.markRead = async (req, res) => {
  const { rowCount } = await db.query('UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  if (!rowCount) throw new AppError('Notification not found', 404);
  res.json({ message: 'Marked as read' });
};

exports.markAllRead = async (req, res) => {
  await db.query('UPDATE notifications SET is_read=TRUE WHERE user_id=$1 AND is_read=FALSE', [req.user.id]);
  res.json({ message: 'All notifications marked as read' });
};
