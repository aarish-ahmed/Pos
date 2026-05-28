export default function BarChart({ data, valueKey = 'revenue', labelKey = 'label', formatValue, height = 160 }) {
  if (!data?.length) {
    return <p className="text-sm text-slate-500 py-8 text-center">No data for this view</p>;
  }

  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);

  return (
    <div className="flex items-end gap-1.5 sm:gap-2" style={{ minHeight: height }}>
      {data.map((row, i) => {
        const val = row[valueKey] || 0;
        const pct = Math.max(4, (val / max) * 100);
        const label = row[labelKey] ?? row.date ?? row.name ?? row.method ?? row.type ?? i;
        return (
          <div key={`${label}-${i}`} className="flex-1 min-w-0 flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-brand-700 truncate w-full text-center">
              {formatValue ? formatValue(val) : val}
            </span>
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-brand-700 to-brand-400 transition-all"
              style={{ height: `${pct}%`, minHeight: 4, maxHeight: height - 40 }}
              title={`${label}: ${formatValue ? formatValue(val) : val}`}
            />
            <span className="text-[9px] sm:text-[10px] text-slate-500 truncate w-full text-center leading-tight">
              {String(label).length > 8 ? `${String(label).slice(0, 7)}…` : label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
