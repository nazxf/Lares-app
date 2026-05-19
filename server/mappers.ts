// Database row to object mappers

type SqlValue = string | number | null;

export function rowToUser(row: Record<string, SqlValue>) {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    role: row.role === 'cashier' ? ('cashier' as const) : ('owner' as const),
    storeId: row.storeId ? String(row.storeId) : undefined,
    createdAt: Number(row.createdAt),
  };
}

export function rowToProduct(row: Record<string, SqlValue>) {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    sellingPrice: Number(row.sellingPrice),
    purchasePrice: Number(row.purchasePrice),
    stock: Number(row.stock),
    minimumStock: Number(row.minimumStock),
    unitType: String(row.unitType),
    status: String(row.status),
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  };
}

export function rowToTransaction(row: Record<string, SqlValue>) {
  return {
    id: String(row.id),
    type: row.type === 'stock_in' ? ('stock_in' as const) : ('sale' as const),
    items: JSON.parse(String(row.itemsJson || '[]')),
    totalAmount: Number(row.totalAmount),
    cashierId: String(row.cashierId),
    notes: String(row.notes || ''),
    createdAt: Number(row.createdAt),
  };
}

export function rowToMovement(row: Record<string, SqlValue>) {
  return {
    id: String(row.id),
    productId: String(row.productId),
    type: row.type === 'stock_in' ? ('stock_in' as const) : ('sale' as const),
    quantity: Number(row.quantity),
    notes: String(row.notes || ''),
    createdAt: Number(row.createdAt),
  };
}
