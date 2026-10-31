const router = require('express').Router();
const controller = require('../controllers/probabilityController');
const { verifyToken } = require('../middleware/authMiddleware');
router.get('/', verifyToken, controller.getProbability);
module.exports = router;
