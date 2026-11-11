import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import api, { errMsg } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ErrorBox, PageHeader, Spinner, StatusBadge } from '../../components/ui';
import { fmtDateTime } from '../../utils/format';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const base = user.role === 'admin' ? '/admin/requests' : '/requests';

  const load = useCallback(() => api.get('/notifications').then((r) => { setData(r.data); setError(''); }).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const refresh = () => { load(); window.dispatchEvent(new Event('notif-updated')); };
  const markRead = async (n) => {
    try { if (!n.is_read) await api.patch(`/notifications/${n.id}/read`); refresh(); if (n.request_id) navigate(`${base}/${n.request_id}`); } catch (e) { toast.error(errMsg(e)); }
  };
  const markAll = async () => { try { await api.patch('/notifications/read-all'); toast.success('All notifications marked as read'); refresh(); } catch (e) { toast.error(errMsg(e)); } };

  if (!data) return error ? <ErrorBox message={error} /> : <Spinner />;
  return (
    <>
      <PageHeader title="Notifications" subtitle={`${data.unread} unread`}>
        <button className="btn-secondary" onClick={markAll} disabled={!data.unread}><CheckCheck size={16} />Mark all as read</button>
      </PageHeader>
      <div className="card divide-y divide-slate-100 p-0">
        {!data.notifications.length && <p className="py-12 text-center text-slate-500">No notifications yet.</p>}
        {data.notifications.map((n) => (
          <button key={n.id} onClick={() => markRead(n)} className={`flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-slate-50 ${n.is_read ? '' : 'bg-brand-50/60'}`}>
            <Bell size={18} className={n.is_read ? 'text-slate-400' : 'text-brand-600'} />
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${n.is_read ? '' : 'font-semibold'}`}>{n.message}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {n.request_code && <span>{n.request_code}</span>}{n.status && <StatusBadge status={n.status} />}<span>{fmtDateTime(n.created_at)}</span>
              </div>
            </div>
            {!n.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-brand-600" />}
          </button>
        ))}
      </div>
    </>
  );
}
