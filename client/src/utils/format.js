export const formatMoney = (amount, symbol = '$') =>
  `${symbol}${Number(amount || 0).toFixed(2)}`;

export const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const formatDate = (date) =>
  new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

export const statusColor = {
  available: 'bg-emerald-400 text-white border-emerald-500 shadow-sm',
  occupied: 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm',
  reserved: 'bg-violet-500 text-white border-violet-600 shadow-sm',
  cleaning: 'bg-slate-400 text-white border-slate-500',
  open: 'bg-cyan-400 text-cyan-950',
  sent: 'bg-blue-500 text-white',
  preparing: 'bg-orange-500 text-white',
  ready: 'bg-emerald-500 text-white',
  paid: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
  cancelled: 'bg-rose-500 text-white',
};

export const categoryGradients = [
  'from-orange-500 to-rose-500',
  'from-violet-500 to-fuchsia-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
];
