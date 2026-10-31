const router = require('express').Router();
const controller = require('../controllers/dashboardController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
router.get('/summary', verifyToken, controller.getSummary);
router.get('/admin/summary', verifyToken, requireAdmin, controller.getAdminSummary);
router.post('/admin/finalize-history', verifyToken, requireAdmin, controller.finalizeWaitlistHistory);
module.exports = router;
