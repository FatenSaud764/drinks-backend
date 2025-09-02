export function normaliseOrder(order) {
  return {
    id: Number(order.id),
    userId: order.user,
    note: order.note,
    status: order.status,
    totalAmount: parseFloat(order.total_price ?? order.totalAmount ?? 0),
    items: order.items ?? [],
    orderTime: new Date(order.created_at ?? order.orderTime),
    lastUpdated: new Date(order.updated_at ?? order.lastUpdated),
    orderNumber: `#${order.id}`,
  };
}
