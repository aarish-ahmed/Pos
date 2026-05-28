import { can } from '../config/permissions.js';

/** Paid/cancelled orders cannot be edited */
export const isOrderClosed = (order) => ['paid', 'cancelled'].includes(order.status);

/** Waiters/cashiers cannot change items after kitchen has the ticket */
export const isOrderLockedForUser = (order, user) => {
  if (isOrderClosed(order)) return true;
  if (order.status === 'open') return false;
  return !can(user.role, 'orders.edit_after_sent');
};
