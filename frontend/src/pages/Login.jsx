import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../api/client';
import { ErrorBox } from '../components/ui';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Email and password are required');
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome, ${u.full_name}`);
      navigate(u.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };
  const fill = (email) => setForm({ email, password: 'Password123' });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 to-brand-600 p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <GraduationCap className="mx-auto text-brand-600" size={40} />
          <h1 className="mt-2 text-2xl font-semibold">Smart Campus Assistance</h1>
          <p className="text-sm text-slate-500">Sign in to continue</p>
        </div>
        <ErrorBox message={error} />
        <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="label">Password</label><input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" size={16} />}Sign in</button>
        <p className="text-center text-sm text-slate-500">New student? <Link to="/register" className="text-brand-600 hover:underline">Create an account</Link></p>
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          Demo accounts (click to fill):{' '}
          <button type="button" className="text-brand-600 underline" onClick={() => fill('student@campus.edu')}>Student</button>{' / '}
          <button type="button" className="text-brand-600 underline" onClick={() => fill('admin@campus.edu')}>Admin</button>
        </div>
      </form>
    </div>
  );
}
