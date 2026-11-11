import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Lightbulb, Trash2 } from 'lucide-react';
import api, { errMsg } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog, ErrorBox, PriorityBadge, Spinner, StatusBadge } from '../../components/ui';
import { STATUS_STEPS, fmtDateTime } from '../../utils/format';

const Info = ({ label, children }) => (<div><p className="text-xs uppercase text-slate-500">{label}</p><div className="mt-0.5 text-sm">{children || '-'}</div></div>);

function Tracker({ status }) {
  if (status === 'Rejected') return <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">This request was rejected.</div>;
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <ol className="flex items-start justify-between gap-1">
      {STATUS_STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col items-center text-center">
          <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${i <= idx ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{i < idx ? <Check size={16} /> : i + 1}</span>
          <span className={`mt-1 text-[11px] leading-tight sm:text-xs ${i === idx ? 'font-semibold text-brand-700' : 'text-slate-500'}`}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export default function RequestDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState({ departments: [], statuses: [], priorities: [] });
  const [form, setForm] = useState({ status: '', priority: '', department_id: '', admin_comment: '' });
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null); // 'save' | 'delete'
  const [busy, setBusy] = useState(false);
  const back = isAdmin ? '/admin/requests' : '/requests';

  const load = useCallback((initial) => api.get(`/requests/${id}`).then((r) => {
    setData(r.data); setError('');
    if (initial) setForm({ status: r.data.request.status, priority: r.data.request.priority, department_id: r.data.request.department_id || '', admin_comment: '' });
  }).catch((e) => setError(errMsg(e))), [id]);

  useEffect(() => {
    load(true);
    if (isAdmin) api.get('/meta').then((r) => setMeta(r.data)).catch(() => {});
    const t = setInterval(() => load(false), 15000); // live status updates (students)
    return () => clearInterval(t);
  }, [load, isAdmin]);

  const save = async () => {
    setBusy(true);
    try {
      const body = { status: form.status, priority: form.priority, admin_comment: form.admin_comment };
      if (form.department_id) body.department_id = Number(form.department_id);
      const r = await api.put(`/requests/${id}`, body);
      setData(r.data);
      setForm({ ...form, admin_comment: '' });
      toast.success('Request updated');
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); setConfirm(null); }
  };

  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/requests/${id}`); toast.success('Request deleted'); navigate(back); }
    catch (e) { toast.error(errMsg(e)); setConfirm(null); } finally { setBusy(false); }
  };

  if (error && !data) return <><Link to={back} className="mb-4 inline-flex items-center gap-1 text-sm text-brand-600"><ArrowLeft size={16} />Back</Link><ErrorBox message={error} /></>;
  if (!data) return <Spinner />;
  const { request: r, history } = data;

  return (
    <div className="space-y-6">
      <Link to={back} className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"><ArrowLeft size={16} />Back to requests</Link>
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-sm font-medium text-brand-600">{r.request_code}</p><h1 className="text-xl font-semibold">{r.title}</h1></div>
          <div className="flex gap-2"><PriorityBadge priority={r.priority} /><StatusBadge status={r.status} /></div>
        </div>
        <div className="my-6"><Tracker status={r.status} /></div>
        <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm">{r.description}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Category">{r.category}</Info>
          <Info label="Submitted">{fmtDateTime(r.created_at)}</Info>
          <Info label="Last updated">{fmtDateTime(r.updated_at)}</Info>
          <Info label="Location">{r.location}</Info>
          <Info label="Assigned department">{r.department || 'Not assigned yet'}</Info>
          <Info label="Student">{r.student_name} ({r.student_id})</Info>
          <div className="sm:col-span-2 lg:col-span-3"><Info label="Additional information">{r.additional_info}</Info></div>
          {r.admin_comment && <div className="sm:col-span-2 lg:col-span-3"><Info label="Latest administrator comment">{r.admin_comment}</Info></div>}
        </div>
        {!isAdmin && r.status === 'Submitted' && (
          <button className="btn-danger mt-5" onClick={() => setConfirm('delete')}><Trash2 size={16} />Delete request</button>
        )}
      </div>

      {isAdmin && (
        <div className="card space-y-4">
          <h2 className="font-semibold">Manage request</h2>
          {r.recommended_priority && (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <Lightbulb className="mt-0.5 shrink-0 text-amber-600" size={18} />
              <div><span className="font-medium">System recommended: </span><PriorityBadge priority={r.recommended_priority} /><p className="mt-1 text-slate-600">{r.priority_reason} You can override it below.</p></div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{meta.statuses.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><label className="label">Priority</label><select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{meta.priorities.map((p) => <option key={p}>{p}</option>)}</select></div>
            <div><label className="label">Assign to department</label><select className="input" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}><option value="">Not assigned</option>{meta.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          </div>
          <div><label className="label">Administrative comment</label><textarea rows={3} className="input" value={form.admin_comment} onChange={(e) => setForm({ ...form, admin_comment: e.target.value })} placeholder="Visible in the request history" /></div>
          <button className="btn-primary" onClick={() => setConfirm('save')}>Save changes</button>
        </div>
      )}

      <div className="card">
        <h2 className="mb-4 font-semibold">Request history</h2>
        <ol className="relative space-y-5 border-l-2 border-slate-200 pl-5">
          {history.map((h) => (
            <li key={h.id} className="relative">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-brand-600" />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {h.old_status && h.old_status !== h.new_status ? <><StatusBadge status={h.old_status} /><span>&rarr;</span></> : null}
                <StatusBadge status={h.new_status} />
                <span className="text-xs text-slate-500">{fmtDateTime(h.changed_at)}</span>
              </div>
              {h.comment && <p className="mt-1 text-sm text-slate-600">{h.comment}</p>}
              <p className="text-xs text-slate-400">by {h.changed_by_name || 'System'}{h.changed_by_role ? ` (${h.changed_by_role})` : ''}</p>
            </li>
          ))}
        </ol>
      </div>

      <ConfirmDialog open={confirm === 'save'} title="Save changes?" message={form.status !== r.status ? `The status will change to "${form.status}" and the student will be notified.` : 'Your changes will be saved to the request history.'} busy={busy} onConfirm={save} onCancel={() => setConfirm(null)} />
      <ConfirmDialog open={confirm === 'delete'} danger title="Delete request?" message="This cannot be undone." confirmText="Delete" busy={busy} onConfirm={remove} onCancel={() => setConfirm(null)} />
    </div>
  );
}
