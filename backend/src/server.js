const app = require('./app');
const db = require('./config/db');
const port = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) { console.error('JWT_SECRET is missing in .env'); process.exit(1); }
db.query('SELECT 1')
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((e) => { console.error('Cannot connect to PostgreSQL:', e.message); process.exit(1); });
