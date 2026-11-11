import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RotateCcw } from 'lucide-react';
import api, { errMsg } from '../api/client';
import { PriorityBadge, StatusBadge, Spinner, ErrorBox, Pagination } from './ui';
import { fmtDate } from '../utils/format';

const empty = { q: '', category_id: '', status: '', priority: '', department_id: '', date_from: '', date_to: '' };

// Used by "My Requests" (student) and "All Requests" (admin: search + combined filters)
export default function RequestList({ admin }) {
  const [filters, setFilters] = useState(empty);
  const [debounced, setDebounced] = useState(empty);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ categories: [], departments: [], statuses: [], priorities: [] });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const base = admin ? '/admin/requests' : '/requests';

  useEffect(() => { api.get('/meta').then((r) => setMeta(r.data)).catch(() => {}); }, []);
  useEffect(() => { const t = setTimeout(() => { setDebounced(filters); setPage(1); }, 350); return () => clearTimeout(t); }, [filters]);

  useEffect(() => {
    let alive = true;
    const load = (first) => {
      if (first) setLoading(true);
      const params = Object.fromEntries(Object.entries({ ...debounced, page }).filter(([, v]) => v !== ''));
      api.get('/requests', { params }).then((r) => { if (alive) { setData(r.data); setError(''); } })
        .catch((e) => alive && setError(errMsg(e))).finally(() => alive && setLoading(false));
    };
    load(true);
    const t = setInterval(() => load(false), 20000); // live status refresh
    return () => { alive = false; clearInterval(t); };
  }, [debounced, page]);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input className="input pl-9" placeholder={admin ? 'Search by request ID, title or student name' : 'Search by request ID or title'} value={filters.q} onChange={set('q')} />
        </div>
        <select className="input" value={filters.category_id} onChange={set('category_id')}>
          <option value="">All categories</option>{meta.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" value={filters.status} onChange={set('status')}>
          <option value="">All statuses</option>{meta.statuses.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input" value={filters.priority} onChange={set('priority')}>
          <option value="">All priorities</option>{meta.priorities.map((p) => <option key={p}>{p}</option>)}
        </select>
        {admin && (
          <select className="input" value={filters.department_id} onChange={set('department_id')}>
            <option value="">All departments</option>{meta.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
        <input type="date" className="input" value={filters.date_from} onChange={set('date_from')} title="From date" />
        <input type="date" className="input" value={filters.date_to} onChange={set('date_to')} title="To date" />
        <button className="btn-secondary" onClick={() => setFilters(empty)}><RotateCcw size={16} /> Reset</button>
      </div>

      <ErrorBox message={error} />
      <div className="card overflow-x-auto p-0">
        {loading ? <Spinner /> : !data?.requests.length ? (
          <p className="py-12 text-center text-slate-500">No requests found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Request ID</th><th className="px-4 py-3">Title</th>
                {admin && <th className="px-4 py-3">Student</th>}
                <th className="hidden px-4 py-3 md:table-cell">Category</th><th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>{admin && <th className="hidden px-4 py-3 lg:table-cell">Department</th>}
                <th className="hidden px-4 py-3 sm:table-cell">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium"><Link className="text-brand-600 hover:underline" to={`${base}/${r.id}`}>{r.request_code}</Link></td>
                  <td className="max-w-[220px] truncate px-4 py-3">{r.title}</td>
                  {admin && <td className="px-4 py-3">{r.student_name}</td>}
                  <td className="hidden px-4 py-3 md:table-cell">{r.category}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  {admin && <td className="hidden px-4 py-3 lg:table-cell">{r.department || <span className="text-slate-400">Unassigned</span>}</td>}
                  <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell">{fmtDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data && <p className="text-xs text-slate-500">{data.total} request(s) found</p>}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </div>
  );
}
