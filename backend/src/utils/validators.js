const AppError = require('./AppError');

const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// rules: { field: { required, type:'int', min, max, email, oneOf, label } }
function validate(body, rules) {
  const errors = {};
  for (const [field, r] of Object.entries(rules)) {
    let v = body[field];
    if (typeof v === 'string') v = v.trim();
    const label = r.label || field;
    if (v === undefined || v === null || v === '') {
      if (r.required) errors[field] = `${label} is required`;
      continue;
    }
    if (r.type === 'int' && !Number.isInteger(Number(v))) errors[field] = `${label} must be a number`;
    else if (r.email && !isEmail(v)) errors[field] = `${label} must be a valid email`;
    else if (r.min && String(v).length < r.min) errors[field] = `${label} must be at least ${r.min} characters`;
    else if (r.max && String(v).length > r.max) errors[field] = `${label} must be at most ${r.max} characters`;
    else if (r.oneOf && !r.oneOf.includes(v)) errors[field] = `${label} must be one of: ${r.oneOf.join(', ')}`;
  }
  if (Object.keys(errors).length) throw new AppError('Validation failed', 422, errors);
}

module.exports = { validate };
