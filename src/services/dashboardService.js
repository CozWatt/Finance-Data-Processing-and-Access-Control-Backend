const { FinancialRecord } = require('../models/FinancialRecord');

/**
 * Returns total income, total expenses, and net balance.
 */
const getSummary = async () => {
  const result = await FinancialRecord.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
      },
    },
  ]);

  const totals = result.reduce((acc, item) => {
    acc[item._id] = item.total;
    return acc;
  }, {});

  const totalIncome = totals.income || 0;
  const totalExpenses = totals.expense || 0;

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
  };
};

/**
 * Returns total amounts grouped by category.
 * Useful for pie/bar chart visualisations.
 */
const getCategoryTotals = async () => {
  const result = await FinancialRecord.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: { type: '$type', category: '$category' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.type',
        categories: {
          $push: {
            category: '$_id.category',
            total: '$total',
            count: '$count',
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Reshape for a cleaner API response
  return result.reduce((acc, item) => {
    acc[item._id] = item.categories.sort((a, b) => b.total - a.total);
    return acc;
  }, {});
};

/**
 * Returns the 5 most recent records.
 */
const getRecentTransactions = async (limit = 5) => {
  return FinancialRecord.find()
    .populate('createdBy', 'name')
    .sort({ date: -1 })
    .limit(limit);
};

/**
 * Returns income and expenses grouped by month for the given year.
 * Defaults to the current year.
 */
const getMonthlySummary = async (year = new Date().getFullYear()) => {
  const startOfYear = new Date(`${year}-01-01`);
  const endOfYear = new Date(`${year}-12-31T23:59:59`);

  const result = await FinancialRecord.aggregate([
    {
      $match: {
        deletedAt: null,
        date: { $gte: startOfYear, $lte: endOfYear },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);

  // Build a clean 12-month array
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: new Date(year, i, 1).toLocaleString('default', { month: 'long' }),
    income: 0,
    expense: 0,
    net: 0,
  }));

  result.forEach(({ _id, total }) => {
    const monthData = months[_id.month - 1];
    monthData[_id.type] = total;
  });

  // Calculate net for each month
  months.forEach((m) => {
    m.net = m.income - m.expense;
  });

  return { year, months };
};

/**
 * Aggregated dashboard: all summary data in one call.
 */
const getFullDashboard = async (year) => {
  const [summary, categoryTotals, recentTransactions, monthlySummary] = await Promise.all([
    getSummary(),
    getCategoryTotals(),
    getRecentTransactions(),
    getMonthlySummary(year),
  ]);

  return { summary, categoryTotals, recentTransactions, monthlySummary };
};

module.exports = {
  getSummary,
  getCategoryTotals,
  getRecentTransactions,
  getMonthlySummary,
  getFullDashboard,
};
