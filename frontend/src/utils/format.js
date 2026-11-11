export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '-');
export const STATUS_STEPS = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];
