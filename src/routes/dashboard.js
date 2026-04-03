const express = require('express');
const router = express.Router();
const {
  getFullDashboard,
  getSummary,
  getCategoryTotals,
  getRecentTransactions,
  getMonthlySummary,
} = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

// All dashboard routes: authenticated + analyst or admin
router.use(authenticate, authorize('analyst', 'admin'));

router.get('/', getFullDashboard);
router.get('/summary', getSummary);
router.get('/categories', getCategoryTotals);
router.get('/recent', getRecentTransactions);
router.get('/monthly', getMonthlySummary);

module.exports = router;
