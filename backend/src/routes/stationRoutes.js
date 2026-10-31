const router = require('express').Router();
const controller = require('../controllers/scheduleController');
const { verifyToken } = require('../middleware/authMiddleware');
router.get('/', verifyToken, controller.listStations);
module.exports = router;
