import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ChefHat,
  ClipboardList,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'cashier', 'waiter'], accent: 'from-amber-400 to-orange-500' },
  { to: '/pos', icon: UtensilsCrossed, label: 'Floor & Orders', roles: ['admin', 'manager', 'cashier', 'waiter'], accent: 'from-rose-400 to-pink-600' },
  { to: '/kitchen', icon: ChefHat, label: 'Kitchen', roles: ['admin', 'manager', 'cashier', 'waiter'], accent: 'from-orange-400 to-red-500' },
  { to: '/orders', icon: ClipboardList, label: 'Order History', roles: ['admin', 'manager', 'cashier'], accent: 'from-cyan-400 to-blue-500' },
  { to: '/reservations', icon: CalendarDays, label: 'Reservations', roles: ['admin', 'manager', 'cashier', 'waiter'], accent: 'from-violet-400 to-purple-600' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menu', roles: ['admin', 'manager'], accent: 'from-emerald-400 to-teal-500' },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'manager'], accent: 'from-fuchsia-400 to-purple-600' },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'manager'], accent: 'from-slate-400 to-slate-600' },
];

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const todayLabel = new Date().toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNav = navItems.filter((item) => hasRole(...item.roles));

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 flex-shrink-0 bg-sidebar text-white flex flex-col shadow-vivid">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-violet-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold tracking-tight">Bistro POS</h1>
              <p className="text-xs text-violet-200">Restaurant Suite</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNav.map(({ to, icon: Icon, label, accent }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${accent} text-white shadow-lg scale-[1.02]`
                    : 'text-violet-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="px-3 py-2 mb-2 rounded-xl bg-white/10">
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-violet-200 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-rose-200 hover:bg-rose-500/20 hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 px-8 py-3 flex items-center justify-between border-b border-white/60 bg-white/50 backdrop-blur-md">
          <p className="text-sm font-medium text-ink-800">
            Hey <span className="text-brand-600 font-bold">{user?.name?.split(' ')[0] || 'Team'}</span> 👋
          </p>
          <span className="text-xs font-semibold px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-500 to-grape-500 text-white shadow-md">
            {todayLabel}
          </span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
