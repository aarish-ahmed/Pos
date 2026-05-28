import { statusColor } from '../utils/format';

export default function Badge({ status, children }) {
  const cls = statusColor[status] || 'bg-sage-100 text-sage-700';
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {children || status}
    </span>
  );
}
