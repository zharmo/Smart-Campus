import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errMsg, fieldErrors } from '../api/client';
import { ErrorBox, Field } from '../components/ui';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ full_name: '', email: '', student_id: '', phone: '', department: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const v = {};
    if (form.full_name.trim().length < 2) v.full_name = 'Full name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) v.email = 'Enter a valid email';
    if (!form.student_id.trim()) v.student_id = 'Student ID is required';
    if (form.password.length < 6) v.password = 'Password must be at least 6 characters';
    if (form.confirm !== form.password) v.confirm = 'Passwords do not match';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const { confirm, ...payload } = form;
      await register(payload);
      toast.success('Account created');
      navigate('/dashboard');
    } catch (err) { setErrors(fieldErrors(err)); setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 to-brand-600 p-4">
      <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center"><GraduationCap className="mx-auto text-brand-600" size={36} /><h1 className="mt-2 text-2xl font-semibold">Student Registration</h1></div>
        <ErrorBox message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.full_name}><input className="input" value={form.full_name} onChange={set('full_name')} /></Field>
          <Field label="Student ID" error={errors.student_id}><input className="input" value={form.student_id} onChange={set('student_id')} /></Field>
          <Field label="Email" error={errors.email}><input type="email" className="input" value={form.email} onChange={set('email')} /></Field>
          <Field label="Phone (optional)"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
          <div className="sm:col-span-2"><Field label="Department (optional)"><input className="input" value={form.department} onChange={set('department')} /></Field></div>
          <Field label="Password" error={errors.password}><input type="password" className="input" value={form.password} onChange={set('password')} /></Field>
          <Field label="Confirm password" error={errors.confirm}><input type="password" className="input" value={form.confirm} onChange={set('confirm')} /></Field>
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" size={16} />}Create account</button>
        <p className="text-center text-sm text-slate-500">Already registered? <Link to="/login" className="text-brand-600 hover:underline">Sign in</Link></p>
      </form>
    </div>
  );
}
