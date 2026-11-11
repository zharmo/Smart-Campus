/**
 * Priority recommendation service (Bonus challenge).
 * Keyword-based today. To switch to an ML model later, keep the same signature:
 *   recommendPriority({ title, description, categoryName })
 *     -> { priority: 'Low'|'Medium'|'High', reason: string, keywords: string[] }
 * and replace the body (or call an ML service from here).
 */
const HIGH_KEYWORDS = ['fire', 'smoke', 'explosion', 'gas leak', 'electric shock', 'short circuit', 'injury', 'injured',
  'accident', 'emergency', 'urgent', 'threat', 'harassment', 'unsafe', 'danger', 'flood', 'collapse',
  'network is down', 'entire', 'server down', 'all students', 'no electricity', 'power outage', 'blackout', 'stolen', 'theft'];
const MEDIUM_KEYWORDS = ['not working', 'broken', 'lost', 'leak', 'leakage', 'delay', 'late', 'projector', 'wifi', 'internet',
  'printer', 'air conditioner', 'fan', 'light', 'cannot', "can't", 'unable', 'error', 'damaged', 'missing', 'id card', 'exam', 'fee'];
const LOW_KEYWORDS = ['information', 'inquiry', 'enquiry', 'question', 'how to', 'suggestion', 'feedback', 'certificate',
  'request for', 'curious', 'wondering', 'schedule', 'guidance', 'tutoring'];

// Used only when no keyword matches: 0 = Low, 1 = Medium
const CATEGORY_BASE = {
  'IT Support': 1, 'Classroom Issues': 1, 'Transportation': 1, 'Maintenance': 1,
  'Lost and Found': 1, 'Academic Support': 0, 'Administrative Services': 0, Other: 0,
};
const LEVELS = ['Low', 'Medium', 'High'];

const find = (text, list) => list.filter((k) => text.includes(k));

function recommendPriority({ title = '', description = '', categoryName = '' }) {
  const text = ` ${title} ${description} `.toLowerCase();
  const high = find(text, HIGH_KEYWORDS);
  const medium = find(text, MEDIUM_KEYWORDS);
  const low = find(text, LOW_KEYWORDS);

  let score; let reason;
  if (high.length) {
    score = 2;
    reason = `High priority: it contains urgent or safety keywords (${high.slice(0, 4).join(', ')}).`;
  } else if (medium.length) {
    score = 1;
    reason = `Medium priority: it reports a problem (${medium.slice(0, 4).join(', ')}) that needs attention.`;
  } else if (low.length) {
    score = 0;
    reason = `Low priority: it looks like a general inquiry (${low.slice(0, 3).join(', ')}).`;
  } else {
    score = CATEGORY_BASE[categoryName] ?? 0;
    reason = `No strong keywords found, so the priority is based on the "${categoryName || 'selected'}" category.`;
  }
  return { priority: LEVELS[score], reason, keywords: [...high, ...medium, ...low] };
}

module.exports = { recommendPriority };
