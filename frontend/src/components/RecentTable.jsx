import { Link } from 'react-router-dom';
import { PriorityBadge, StatusBadge } from './ui';
import { fmtDate } from '../utils/format';

export default function RecentTable({ rows, base, showStudent }) {
  if (!rows?.length) return <p className="py-8 text-center text-sm text-slate-500">No requests yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-500"><tr>
          <th className="py-2 pr-4">ID</th><th className="py-2 pr-4">Title</th>{showStudent && <th className="py-2 pr-4">Student</th>}
          <th className="py-2 pr-4">Priority</th><th className="py-2 pr-4">Status</th><th className="hidden py-2 sm:table-cell">Date</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap py-2 pr-4"><Link className="font-medium text-brand-600 hover:underline" to={`${base}/${r.id}`}>{r.request_code}</Link></td>
              <td className="max-w-[200px] truncate py-2 pr-4">{r.title}</td>
              {showStudent && <td className="py-2 pr-4">{r.student_name}</td>}
              <td className="py-2 pr-4"><PriorityBadge priority={r.priority} /></td>
              <td className="py-2 pr-4"><StatusBadge status={r.status} /></td>
              <td className="hidden whitespace-nowrap py-2 sm:table-cell">{fmtDate(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
