const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * GET /api/dashboard — All analytics roles (analyst, admin)
 * Returns a combined dashboard payload in one call.
 */
const getFullDashboard = async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    const data = await dashboardService.getFullDashboard(year);
    return sendSuccess(res, data, 'Dashboard data fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/summary — analyst, admin
 * Total income, total expenses, net balance.
 */
const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary();
    return sendSuccess(res, data, 'Summary fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/categories — analyst, admin
 */
const getCategoryTotals = async (req, res, next) => {
  try {
    const data = await dashboardService.getCategoryTotals();
    return sendSuccess(res, data, 'Category totals fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/recent — analyst, admin
 */
const getRecentTransactions = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const data = await dashboardService.getRecentTransactions(limit);
    return sendSuccess(res, data, 'Recent transactions fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/monthly?year=2024 — analyst, admin
 */
const getMonthlySummary = async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    const data = await dashboardService.getMonthlySummary(year);
    return sendSuccess(res, data, 'Monthly summary fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFullDashboard,
  getSummary,
  getCategoryTotals,
  getRecentTransactions,
  getMonthlySummary,
};
