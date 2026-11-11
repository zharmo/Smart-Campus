const { recommendPriority } = require('../src/services/priorityService');
const cases = [
  ['The classroom projector is not working', 'Classroom Issues', 'Medium'],
  ['The entire university network is down', 'IT Support', 'High'],
  ['There is a fire in the laboratory', 'Maintenance', 'High'],
  ['I lost my student ID card', 'Lost and Found', 'Medium'],
  ['I need information about a university service', 'Administrative Services', 'Low'],
];
let ok = true;
for (const [d, c, exp] of cases) {
  const r = recommendPriority({ title: '', description: d, categoryName: c });
  const pass = r.priority === exp; ok = ok && pass;
  console.log(pass ? 'PASS' : 'FAIL', `"${d}" -> ${r.priority} (expected ${exp})`);
}
process.exit(ok ? 0 : 1);
