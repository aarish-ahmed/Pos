import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { formatDate, formatTime } from '../utils/format';

const splitDateTime = (isoOrLocal) => {
  const d = new Date(isoOrLocal);
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return {
      date: now.toISOString().slice(0, 10),
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    };
  }
  return {
    date: d.toISOString().slice(0, 10),
    time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  };
};

const combineDateTime = (date, time) => {
  if (!date || !time) return '';
  return `${date}T${time}`;
};

export default function DateTimePicker({ value, onChange, label = 'Date & time', required }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [draft, setDraft] = useState({ date: '', time: '' });
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    const { date: d, time: t } = splitDateTime(value || new Date());
    setDate(d);
    setTime(t);
    setDraft({ date: d, time: t });
    setConfirmed(value ? new Date(value) : null);
  }, [value]);

  const apply = () => {
    const combined = combineDateTime(draft.date, draft.time);
    if (!combined) return;
    const parsed = new Date(combined);
    if (Number.isNaN(parsed.getTime())) return;
    onChange(combined);
    setDate(draft.date);
    setTime(draft.time);
    setConfirmed(parsed);
  };

  return (
    <div className="space-y-2">
      <label className="label">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-xs text-slate-500 font-medium">Date</span>
          <input
            type="date"
            className="input mt-1"
            value={draft.date}
            onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))}
            required={required}
          />
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium">Time</span>
          <input
            type="time"
            className="input mt-1"
            value={draft.time}
            onChange={(e) => setDraft((p) => ({ ...p, time: e.target.value }))}
            required={required}
          />
        </div>
      </div>
      <button type="button" onClick={apply} className="btn-secondary w-full text-sm py-2">
        <Check className="w-4 h-4" />
        Apply date & time
      </button>
      {confirmed && (
        <p className="text-xs text-emerald-700 font-medium bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200">
          Selected: {formatDate(confirmed)} at {formatTime(confirmed)}
        </p>
      )}
    </div>
  );
}
