/** Keep in sync with server/src/config/permissions.js */
export const PERMISSIONS = {
  'dashboard.view': ['admin', 'manager', 'cashier', 'waiter'],
  'dashboard.financial': ['admin', 'manager', 'cashier'],
  'pos.access': ['admin', 'manager', 'cashier', 'waiter'],
  'orders.create': ['admin', 'manager', 'cashier', 'waiter'],
  'orders.add_items': ['admin', 'manager', 'cashier', 'waiter'],
  'orders.remove_items': ['admin', 'manager', 'cashier', 'waiter'],
  'orders.edit_after_sent': ['admin', 'manager'],
  'orders.send_kitchen': ['admin', 'manager', 'cashier', 'waiter'],
  'orders.pay': ['admin', 'manager', 'cashier'],
  'orders.discount': ['admin', 'manager', 'cashier'],
  'orders.cancel': ['admin', 'manager'],
  'orders.history': ['admin', 'manager', 'cashier'],
  'tables.status': ['admin', 'manager', 'cashier'],
  'tables.configure': ['admin', 'manager'],
  'kitchen.view': ['admin', 'manager', 'cashier', 'waiter'],
  'kitchen.update': ['admin', 'manager'],
  'reservations.manage': ['admin', 'manager', 'cashier', 'waiter'],
  'reservations.cancel': ['admin', 'manager', 'cashier'],
  'menu.manage': ['admin', 'manager'],
  'reports.view': ['admin', 'manager'],
  'settings.general': ['admin', 'manager'],
  'settings.staff': ['admin'],
};

export const can = (role, permission) => {
  if (!role) return false;
  const allowed = PERMISSIONS[permission];
  return Array.isArray(allowed) && allowed.includes(role);
};

export const ROLE_LABELS = {
  admin: 'Admin — full access',
  manager: 'Manager — operations & reports',
  cashier: 'Cashier — payments & floor',
  waiter: 'Waiter — orders & reservations',
};

/** First screen after login or when access is denied */
export const getDefaultPath = (role) => {
  if (can(role, 'dashboard.view') && can(role, 'dashboard.financial')) return '/';
  if (can(role, 'pos.access')) return '/pos';
  return '/login';
};
