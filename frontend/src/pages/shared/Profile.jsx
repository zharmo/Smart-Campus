import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import api, { errMsg, fieldErrors } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Field, PageHeader } from '../../components/ui';
import { fmtDate } from '../../utils/format';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ full_name: user.full_name, phone: user.phone || '', department: user.department || '' });
  const [pw, setPw] = useState({ current_password: '', new_password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault(); setBusy(true); setErrors({});
    try { const r = await api.put('/auth/profile', form); setUser(r.data.user); toast.success('Profile updated'); }
    catch (err) { setErrors(fieldErrors(err)); toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  const savePw = async (e) => {
    e.preventDefault();
    try { await api.put('/auth/password', pw); toast.success('Password updated'); setPw({ current_password: '', new_password: '' }); }
    catch (err) { toast.error(Object.values(fieldErrors(err))[0] || errMsg(err)); }
  };

  return (
    <>
      <PageHeader title={user.role === 'admin' ? 'Admin Profile' : 'My Profile'} />
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="card space-y-4">
          <h2 className="font-semibold">Personal details</h2>
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
            <div><p className="text-xs text-slate-500">Email</p>{user.email}</div>
            <div><p className="text-xs text-slate-500">Role</p><span className="capitalize">{user.role}</span></div>
            <div><p className="text-xs text-slate-500">ID</p>{user.student_id || '-'}</div>
            <div><p className="text-xs text-slate-500">Member since</p>{fmtDate(user.created_at)}</div>
          </div>
          <Field label="Full name" error={errors.full_name}><input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
          <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Department"><input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
          <button className="btn-primary" disabled={busy}>{busy && <Loader2 className="animate-spin" size={16} />}Save profile</button>
        </form>
        <form onSubmit={savePw} className="card space-y-4 self-start">
          <h2 className="font-semibold">Change password</h2>
          <Field label="Current password"><input type="password" className="input" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></Field>
          <Field label="New password (min 6 characters)"><input type="password" className="input" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></Field>
          <button className="btn-primary">Update password</button>
        </form>
      </div>
    </>
  );
}
