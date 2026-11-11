import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, Clock, Loader, CheckCircle2, XCircle, FilePlus2 } from 'lucide-react';
import api, { errMsg } from '../../api/client';
import { ErrorBox, PageHeader, Spinner, StatCard } from '../../components/ui';
import RecentTable from '../../components/RecentTable';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    const load = () => api.get('/stats/student').then((r) => alive && setData(r.data)).catch((e) => alive && setError(errMsg(e)));
    load();
    const t = setInterval(load, 15000); // real-time status tracking
    return () => { alive = false; clearInterval(t); };
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <Spinner />;
  const t = data.totals;
  return (
    <>
      <PageHeader title="My Dashboard" subtitle="Live overview of your requests (auto-refreshes)">
        <Link to="/requests/new" className="btn-primary"><FilePlus2 size={16} />New Request</Link>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total" value={t.total} icon={ListChecks} />
        <StatCard label="Pending" value={t.pending} icon={Clock} color="bg-amber-50 text-amber-600" />
        <StatCard label="In Progress" value={t.in_progress} icon={Loader} color="bg-indigo-50 text-indigo-600" />
        <StatCard label="Resolved" value={t.resolved} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Rejected" value={t.rejected} icon={XCircle} color="bg-red-50 text-red-600" />
      </div>
      <div className="card mt-6">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Recent requests</h2><Link to="/requests" className="text-sm text-brand-600 hover:underline">View all</Link></div>
        <RecentTable rows={data.recent} base="/requests" />
      </div>
    </>
  );
}
