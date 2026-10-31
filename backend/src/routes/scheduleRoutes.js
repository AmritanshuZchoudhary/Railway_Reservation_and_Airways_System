const router = require('express').Router();
const controller = require('../controllers/scheduleController');
const { verifyToken } = require('../middleware/authMiddleware');
router.get('/search', verifyToken, controller.searchSchedules);
module.exports = router;
