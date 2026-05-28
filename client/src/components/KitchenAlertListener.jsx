import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { playKitchenReadySound } from '../utils/kitchenSound';

/**
 * Polls for orders that just became "ready" and alerts staff on any page.
 */
export default function KitchenAlertListener() {
  const seenReady = useRef(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await api.get('/orders?status=ready&today=true');
        const currentIds = new Set(data.map((o) => o._id));

        if (!initialized.current) {
          data.forEach((o) => seenReady.current.add(o._id));
          initialized.current = true;
          return;
        }

        data.forEach((order) => {
          if (seenReady.current.has(order._id)) return;
          seenReady.current.add(order._id);

          const label = order.table?.number
            ? `Table ${order.table.number}`
            : order.type === 'takeaway'
              ? 'Takeaway'
              : order.orderNumber;

          playKitchenReadySound();
          toast.success(`${label} — food is ready!`, {
            duration: 6000,
            icon: '🍽️',
          });
        });

        seenReady.current.forEach((id) => {
          if (!currentIds.has(id)) seenReady.current.delete(id);
        });
      } catch {
        /* ignore */
      }
    };

    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
