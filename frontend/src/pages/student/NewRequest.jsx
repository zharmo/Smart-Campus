import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lightbulb } from 'lucide-react';
import api, { errMsg, fieldErrors } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog, ErrorBox, Field, PageHeader, PriorityBadge } from '../../components/ui';

export default function NewRequest() {
  const navigate = useNavigate();
  const toast = useToast();
  const [meta, setMeta] = useState({ categories: [], priorities: [] });
  const [form, setForm] = useState({ title: '', category_id: '', description: '', location: '', additional_info: '', priority: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [rec, setRec] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => { api.get('/meta').then((r) => setMeta(r.data)).catch((e) => setError(errMsg(e))); }, []);

  // Automatic priority recommendation (debounced)
  useEffect(() => {
    if (form.description.trim().length < 5) { setRec(null); return undefined; }
    const t = setTimeout(() => {
      api.post('/requests/recommend-priority', { title: form.title, description: form.description, category_id: form.category_id || undefined })
        .then((r) => setRec(r.data)).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [form.title, form.description, form.category_id]);

  const validate = (e) => {
    e.preventDefault();
    const v = {};
    if (form.title.trim().length < 5) v.title = 'Title must be at least 5 characters';
    if (!form.category_id) v.category_id = 'Select a category';
    if (form.description.trim().length < 10) v.description = 'Describe the issue in at least 10 characters';
    setErrors(v);
    if (!Object.keys(v).length) setConfirm(true);
  };

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const payload = { ...form, category_id: Number(form.category_id) };
      if (!payload.priority) delete payload.priority; // let the system recommend
      const { data } = await api.post('/requests', payload);
      toast.success(`Request ${data.request.request_code} submitted`);
      navigate(`/requests/${data.request.id}`);
    } catch (e) { setConfirm(false); setErrors(fieldErrors(e)); setError(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Submit New Request" subtitle="Tell us what you need help with" />
      <form onSubmit={validate} className="card max-w-3xl space-y-4">
        <ErrorBox message={error} />
        <Field label="Request title" error={errors.title}><input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Projector not working in room 402" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" error={errors.category_id}>
            <select className="input" value={form.category_id} onChange={set('category_id')}><option value="">Select category</option>{meta.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </Field>
          <Field label="Priority" error={errors.priority}>
            <select className="input" value={form.priority} onChange={set('priority')}><option value="">Automatic (recommended)</option>{meta.priorities.map((p) => <option key={p}>{p}</option>)}</select>
          </Field>
        </div>
        <Field label="Detailed description" error={errors.description}><textarea rows={5} className="input" value={form.description} onChange={set('description')} placeholder="Explain the problem in detail" /></Field>
        {rec && (
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <Lightbulb className="mt-0.5 shrink-0 text-amber-600" size={18} />
            <div><div className="flex items-center gap-2 font-medium">Recommended priority: <PriorityBadge priority={rec.priority} /></div><p className="mt-1 text-slate-600">{rec.reason}</p></div>
          </div>
        )}
        <Field label="Location (optional)"><input className="input" value={form.location} onChange={set('location')} placeholder="Building / room" /></Field>
        <Field label="Additional information (optional)"><textarea rows={2} className="input" value={form.additional_info} onChange={set('additional_info')} placeholder="Anything else that helps (item description, bus number, course code...)" /></Field>
        <button className="btn-primary">Submit request</button>
      </form>
      <ConfirmDialog open={confirm} title="Submit this request?" message="Your request will be sent to the university administration." confirmText="Submit" busy={busy} onConfirm={submit} onCancel={() => setConfirm(false)} />
    </>
  );
}
