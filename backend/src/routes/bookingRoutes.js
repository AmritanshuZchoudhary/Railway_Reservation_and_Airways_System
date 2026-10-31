const router = require('express').Router();
const controller = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/authMiddleware');
router.get('/my', verifyToken, controller.myBookings);
router.post('/create', verifyToken, controller.createBooking);
router.post('/cancel', verifyToken, controller.cancelBooking);
module.exports = router;
