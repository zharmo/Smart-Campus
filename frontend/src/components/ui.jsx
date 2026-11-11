import { Loader2 } from 'lucide-react';

const STATUS_CLS = {
  Submitted: 'bg-slate-100 text-slate-700', 'Under Review': 'bg-amber-100 text-amber-800', Assigned: 'bg-sky-100 text-sky-800',
  'In Progress': 'bg-indigo-100 text-indigo-800', Resolved: 'bg-emerald-100 text-emerald-800', Rejected: 'bg-red-100 text-red-800',
};
const PRIORITY_CLS = { Low: 'bg-emerald-100 text-emerald-800', Medium: 'bg-amber-100 text-amber-800', High: 'bg-red-100 text-red-800' };

export const StatusBadge = ({ status }) => <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLS[status] || ''}`}>{status}</span>;
export const PriorityBadge = ({ priority }) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_CLS[priority] || ''}`}>{priority}</span>;

export const Spinner = ({ label = 'Loading...' }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-slate-500"><Loader2 className="animate-spin" size={20} />{label}</div>
);

export const ErrorBox = ({ message }) => (message ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div> : null);

export const StatCard = ({ label, value, icon: Icon, color = 'text-brand-600 bg-brand-50' }) => (
  <div className="card flex items-center gap-4">
    <div className={`rounded-lg p-3 ${color}`}><Icon size={22} /></div>
    <div><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-semibold">{value}</p></div>
  </div>
);

export function ConfirmDialog({ open, title, message, confirmText = 'Confirm', danger, busy, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>{busy && <Loader2 className="animate-spin" size={16} />}{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export const Pagination = ({ page, pages, onChange }) => (pages > 1 ? (
  <div className="flex items-center justify-between pt-2 text-sm">
    <button className="btn-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
    <span className="text-slate-500">Page {page} of {pages}</span>
    <button className="btn-secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
  </div>
) : null);

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
    <div><h1 className="text-2xl font-semibold">{title}</h1>{subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}</div>
    {children}
  </div>
);

export const Field = ({ label, error, children }) => (
  <div><label className="label">{label}</label>{children}{error && <p className="err">{error}</p>}</div>
);
