export const calcTotals = (items, settings, discount = 0) => {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const taxRate = settings?.taxRate ?? Number(process.env.TAX_RATE) ?? 0.08;
  const serviceRate =
    settings?.serviceChargeEnabled !== false
      ? settings?.serviceChargeRate ?? Number(process.env.SERVICE_CHARGE_RATE) ?? 0.1
      : 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * taxRate * 100) / 100;
  const serviceCharge = Math.round(taxable * serviceRate * 100) / 100;
  const total = Math.round((taxable + tax + serviceCharge) * 100) / 100;
  return { subtotal, tax, serviceCharge, discount, total };
};

export const generateOrderNumber = async (Order) => {
  const today = new Date();
  const prefix = `ORD${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const count = await Order.countDocuments({
    createdAt: {
      $gte: new Date(today.setHours(0, 0, 0, 0)),
      $lt: new Date(today.setHours(23, 59, 59, 999)),
    },
  });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};
