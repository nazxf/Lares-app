const DAY_MS = 24 * 60 * 60 * 1000;

type DashboardProduct = {
  id: string;
  name: string;
  category: string;
  stock: number;
  minimumStock: number;
  unitType?: string;
};

type DashboardTransaction = {
  type: string;
  totalAmount: number;
  createdAt: number;
};

export type DashboardSummary = ReturnType<typeof buildDashboardSummary>;

function normalizeTimezoneOffset(value: unknown): number {
  const offset = Number(value);
  if (!Number.isFinite(offset)) return 0;
  return Math.min(Math.max(Math.trunc(offset), -840), 840);
}

export function getDashboardRange(timezoneOffsetInput: unknown, now = Date.now()) {
  const timezoneOffset = normalizeTimezoneOffset(timezoneOffsetInput);
  const localNow = new Date(now - timezoneOffset * 60 * 1000);
  const todayLocalMidnight = Date.UTC(
    localNow.getUTCFullYear(),
    localNow.getUTCMonth(),
    localNow.getUTCDate()
  );
  const todayStart = todayLocalMidnight + timezoneOffset * 60 * 1000;
  const weekStart = todayStart - 6 * DAY_MS;
  const tomorrowStart = todayStart + DAY_MS;

  return {
    timezoneOffset,
    todayStart,
    weekStart,
    tomorrowStart,
  };
}

export function buildDashboardSummary(
  products: DashboardProduct[],
  transactions: DashboardTransaction[],
  timezoneOffsetInput: unknown,
  now = Date.now()
) {
  const { timezoneOffset, todayStart, weekStart, tomorrowStart } = getDashboardRange(
    timezoneOffsetInput,
    now
  );
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const sales = transactions.filter(
    transaction =>
      transaction.type === 'sale' &&
      transaction.createdAt >= weekStart &&
      transaction.createdAt < tomorrowStart
  );

  const todaySales = sales.filter(transaction => transaction.createdAt >= todayStart);
  const lowStockProducts = products
    .filter(product => product.stock <= product.minimumStock)
    .sort((a, b) => {
      const aRatio = a.stock / Math.max(a.minimumStock, 1);
      const bRatio = b.stock / Math.max(b.minimumStock, 1);
      return aRatio - bRatio;
    })
    .slice(0, 12);

  const weeklySalesData = Array.from({ length: 7 }, (_, index) => {
    const start = weekStart + index * DAY_MS;
    const end = start + DAY_MS;
    const localDate = new Date(start - timezoneOffset * 60 * 1000);
    const name = index === 6 ? 'Hari Ini' : dayNames[localDate.getUTCDay()];
    const daySales = sales
      .filter(transaction => transaction.createdAt >= start && transaction.createdAt < end)
      .reduce((sum, transaction) => sum + transaction.totalAmount, 0);

    return { name, sales: daySales };
  });

  return {
    omzetHariIni: todaySales.reduce((sum, transaction) => sum + transaction.totalAmount, 0),
    todaySalesCount: todaySales.length,
    totalWaterStock: products
      .filter(product => product.category === 'Water')
      .reduce((sum, product) => sum + product.stock, 0),
    totalGasStock: products
      .filter(product => product.category === 'Gas')
      .reduce((sum, product) => sum + product.stock, 0),
    lowStockProducts,
    weeklySalesData,
    generatedAt: now,
  };
}
