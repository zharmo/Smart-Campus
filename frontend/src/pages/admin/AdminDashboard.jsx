import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, Loader } from 'lucide-react';
import api, { errMsg } from '../../api/client';
import { ErrorBox, PageHeader, Spinner, StatCard } from '../../components/ui';
import RecentTable from '../../components/RecentTable';

const COLORS = ['#6366f1', '#f59e0b', '#0ea5e9', '#8b5cf6', '#10b981', '#ef4444', '#14b8a6', '#64748b'];
const PRIORITY_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };

const ChartCard = ({ title, children }) => (<div className="card"><h2 className="mb-3 font-semibold">{title}</h2><div className="h-64">{children}</div></div>);

export default function AdminDashboard() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    const load = () => api.get('/stats/admin').then((r) => alive && setD(r.data)).catch((e) => alive && setError(errMsg(e)));
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!d) return <Spinner />;
  const t = d.totals;

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Live statistics from the database" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total requests" value={t.total} icon={ClipboardList} />
        <StatCard label="Pending" value={t.pending} icon={Clock} color="bg-amber-50 text-amber-600" />
        <StatCard label="In progress" value={t.in_progress} icon={Loader} color="bg-indigo-50 text-indigo-600" />
        <StatCard label="Resolved" value={t.resolved} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="High priority" value={t.high_priority} icon={AlertTriangle} color="bg-red-50 text-red-600" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Requests by category">
          <ResponsiveContainer><BarChart data={d.byCategory} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
            <Tooltip /><Bar dataKey="value" name="Requests" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Requests by status">
          <ResponsiveContainer><PieChart>
            <Pie data={d.byStatus.filter((s) => s.value > 0)} dataKey="value" nameKey="name" outerRadius={85} label={(e) => e.value}>
              {d.byStatus.filter((s) => s.value > 0).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip /><Legend />
          </PieChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Requests over time (last 14 days)">
          <ResponsiveContainer><LineChart data={d.overTime}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} />
            <Tooltip /><Line type="monotone" dataKey="value" name="Requests" stroke="#6366f1" strokeWidth={2} dot />
          </LineChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Priority distribution">
          <ResponsiveContainer><PieChart>
            <Pie data={d.byPriority} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} label={(e) => e.value}>
              {d.byPriority.map((p) => <Cell key={p.name} fill={PRIORITY_COLORS[p.name]} />)}
            </Pie><Tooltip /><Legend />
          </PieChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Requests assigned per department">
          <ResponsiveContainer><BarChart data={d.byDepartment}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} /><YAxis allowDecimals={false} />
            <Tooltip /><Bar dataKey="value" name="Assigned" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
          </BarChart></ResponsiveContainer>
        </ChartCard>
        <div className="card">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Recent requests</h2><Link to="/admin/requests" className="text-sm text-brand-600 hover:underline">View all</Link></div>
          <RecentTable rows={d.recent} base="/admin/requests" showStudent />
        </div>
      </div>
    </>
  );
}
