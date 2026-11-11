import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, LayoutDashboard, FilePlus2, ListChecks, User, LogOut, Menu, X, GraduationCap, ClipboardList } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from './ui';

const studentNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/requests/new', label: 'Submit New Request', icon: FilePlus2 },
  { to: '/requests', label: 'My Requests', icon: ListChecks, end: true },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'My Profile', icon: User },
];
const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/requests', label: 'All Requests', icon: ClipboardList },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/profile', label: 'Admin Profile', icon: User },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const isAdmin = user.role === 'admin';
  const nav = isAdmin ? adminNav : studentNav;
  const notifPath = isAdmin ? '/admin/notifications' : '/notifications';

  useEffect(() => {
    let alive = true;
    const load = () => api.get('/notifications/unread-count').then((r) => alive && setUnread(r.data.unread)).catch(() => {});
    load();
    const t = setInterval(load, 15000);
    window.addEventListener('notif-updated', load);
    return () => { alive = false; clearInterval(t); window.removeEventListener('notif-updated', load); };
  }, []);

  const sidebar = (
    <div className="flex h-full flex-col bg-brand-900 text-indigo-100">
      <div className="flex items-center gap-2 px-5 py-5 text-lg font-semibold text-white"><GraduationCap /> Smart Campus</div>
      <p className="px-5 pb-2 text-xs uppercase tracking-wider text-indigo-300">{isAdmin ? 'Admin Panel' : 'Student Panel'}</p>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-brand-700/60'}`}>
            <Icon size={18} />{label}
            {label === 'Notifications' && unread > 0 && <span className="ml-auto rounded-full bg-red-500 px-2 text-xs text-white">{unread}</span>}
          </NavLink>
        ))}
      </nav>
      <button onClick={() => setConfirm(true)} className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-brand-700/60"><LogOut size={18} />Logout</button>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 lg:block"><div className="fixed inset-y-0 w-64">{sidebar}</div></aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
          <span className="hidden text-sm text-slate-500 lg:block">Welcome back, <b className="text-slate-800">{user.full_name}</b></span>
          <div className="flex items-center gap-4">
            <button className="relative" onClick={() => navigate(notifPath)} aria-label="Notifications">
              <Bell size={22} className="text-slate-600" />
              {unread > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">{unread}</span>}
            </button>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium capitalize text-brand-700">{user.role}</span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-6"><Outlet /></main>
      </div>
      <ConfirmDialog open={confirm} title="Log out?" message="You will need to sign in again to continue." confirmText="Logout"
        onCancel={() => setConfirm(false)} onConfirm={() => { logout(); navigate('/login'); }} />
    </div>
  );
}
