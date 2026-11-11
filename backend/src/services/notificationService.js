const db = require('../config/db');

// client is optional: pass a transaction client to keep it atomic
async function notify(userId, requestId, message, client = db) {
  await client.query('INSERT INTO notifications (user_id, request_id, message) VALUES ($1,$2,$3)', [userId, requestId, message]);
}

async function notifyAdmins(requestId, message, client = db) {
  await client.query(
    "INSERT INTO notifications (user_id, request_id, message) SELECT id, $1, $2 FROM users WHERE role='admin'",
    [requestId, message]);
}

module.exports = { notify, notifyAdmins };
