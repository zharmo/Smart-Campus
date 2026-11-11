// Creates tables and inserts demo users + sample requests.  Run: npm run db:setup
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { recommendPriority } = require('../src/services/priorityService');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    const hash = await bcrypt.hash('Password123', 10);
    const users = [
      ['System Admin', 'admin@campus.edu', 'admin', 'ADM-001'],
      ['Support Admin', 'admin2@campus.edu', 'admin', 'ADM-002'],
      ['Ahmed Hassan', 'student@campus.edu', 'student', '221-35-001'],
      ['Fatima Noor', 'fatima@campus.edu', 'student', '221-35-002'],
      ['Omar Ali', 'omar@campus.edu', 'student', '221-35-003'],
    ];
    for (const [n, e, r, s] of users) {
      await pool.query(
        'INSERT INTO users (full_name,email,password_hash,role,student_id,department) VALUES ($1,$2,$3,$4,$5,$6)',
        [n, e, hash, r, s, r === 'admin' ? 'Administration' : 'Software Engineering']);
    }
    const students = (await pool.query("SELECT id FROM users WHERE role='student' ORDER BY id")).rows.map((x) => x.id);
    const cats = {};
    (await pool.query('SELECT id,name FROM categories')).rows.forEach((c) => (cats[c.name] = c.id));
    const samples = [
      ['The entire university network is down', 'Nobody can connect to WiFi in any building since morning.', 'IT Support', 'Submitted', 0],
      ['Projector not working in room 402', 'The classroom projector is not working and the class is delayed.', 'Classroom Issues', 'Under Review', 1],
      ['I lost my student ID card', 'I lost my student ID card near the library yesterday.', 'Lost and Found', 'Assigned', 2],
      ['Fire in the chemistry laboratory', 'There is a fire in the laboratory, smoke in the corridor!', 'Maintenance', 'In Progress', 0],
      ['Information about scholarship service', 'I need information about a university service for scholarships.', 'Administrative Services', 'Resolved', 1],
      ['Bus route 5 is always late', 'The bus on route 5 arrives 30 minutes late every day.', 'Transportation', 'Rejected', 2],
      ['Water leakage in corridor', 'Water leakage from the ceiling near room 210.', 'Maintenance', 'Submitted', 1],
      ['Need tutoring for algorithms', 'Looking for extra academic support for the algorithms course.', 'Academic Support', 'Submitted', 0],
    ];
    const adminId = (await pool.query("SELECT id FROM users WHERE email='admin@campus.edu'")).rows[0].id;
    const deptOf = { 'IT Support': 'IT Department', Maintenance: 'Maintenance Department', Transportation: 'Transportation Department' };
    let i = 0;
    for (const [title, desc, cat, status, si] of samples) {
      const rec = recommendPriority({ title, description: desc, categoryName: cat });
      const created = new Date(Date.now() - (samples.length - i) * 86400000 * 2);
      const r = await pool.query(
        `INSERT INTO requests (user_id,category_id,title,description,priority,recommended_priority,priority_reason,status,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$8) RETURNING id`,
        [students[si], cats[cat], title, desc, rec.priority, rec.reason, status, created]);
      await pool.query(
        'INSERT INTO request_status_history (request_id,old_status,new_status,new_priority,comment,changed_by,changed_at) VALUES ($1,NULL,$2,$3,$4,$5,$6)',
        [r.rows[0].id, 'Submitted', rec.priority, 'Request submitted', students[si], created]);
      if (status !== 'Submitted') {
        await pool.query(
          'INSERT INTO request_status_history (request_id,old_status,new_status,old_priority,new_priority,comment,changed_by) VALUES ($1,$2,$3,$4,$4,$5,$6)',
          [r.rows[0].id, 'Submitted', status, rec.priority, 'Status updated by admin', adminId]);
      }
      if (['Assigned', 'In Progress', 'Resolved'].includes(status)) {
        const d = await pool.query('SELECT id FROM departments WHERE name=$1', [deptOf[cat] || 'Administration Department']);
        await pool.query('INSERT INTO request_assignments (request_id,department_id,assigned_by) VALUES ($1,$2,$3)', [r.rows[0].id, d.rows[0].id, adminId]);
      }
      i++;
    }
    console.log('Database ready. Demo accounts (password Password123): admin@campus.edu, student@campus.edu');
  } catch (e) {
    console.error('Setup failed:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
