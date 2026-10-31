const db = require('../config/db');
const VALID_CLASSES = new Set(['SLEEPER', 'AC', 'CHAIR_CAR']);

exports.createBooking = async (req, res, next) => {
  let connection;
  try {
    const scheduleId = Number(req.body.schedule_id);
    const classType = String(req.body.class_type || '').toUpperCase();
    if (!Number.isInteger(scheduleId) || scheduleId < 1) return res.status(400).json({ error: 'Choose a valid scheduled journey.' });
    if (!VALID_CLASSES.has(classType)) return res.status(400).json({ error: 'Choose a supported travel class.' });

    // OUT parameters are session-scoped, so CALL and SELECT must use the same connection.
    connection = await db.getConnection();
    await connection.query('CALL sp_create_booking(?, ?, ?, @booking_id, @final_status)', [req.user_id, scheduleId, classType]);
    const [result] = await connection.query('SELECT @booking_id AS booking_id, @final_status AS final_status');
    const created = result[0];
    return res.status(201).json({
      message: created.final_status === 'WAITLISTED' ? 'You have been added to the waitlist.' : 'Your seat is confirmed.',
      booking_id: Number(created.booking_id),
      status: created.final_status
    });
  } catch (error) {
    if (error.sqlState === '45000' || error.code === 'ER_SIGNAL_EXCEPTION') {
      return res.status(400).json({ error: error.sqlMessage || 'The booking could not be completed.' });
    }
    return next(error);
  } finally {
    if (connection) connection.release();
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const bookingId = Number(req.body.booking_id);
    if (!Number.isInteger(bookingId) || bookingId < 1) return res.status(400).json({ error: 'Enter a valid booking ID.' });
    await db.query('CALL sp_cancel_booking(?, ?)', [bookingId, req.user_id]);
    return res.json({ message: 'Booking cancelled. If an eligible passenger was waiting, the database trigger has promoted the next passenger.' });
  } catch (error) {
    if (error.sqlState === '45000' || error.code === 'ER_SIGNAL_EXCEPTION') {
      return res.status(400).json({ error: error.sqlMessage || 'The booking could not be cancelled.' });
    }
    return next(error);
  }
};

exports.myBookings = async (req, res, next) => {
  try {
    const [bookings] = await db.query(`
      SELECT b.booking_id, b.schedule_id, b.class_type, b.status, b.fare, b.booking_time,
        t.train_number, t.train_name, r.route_id,
        o.station_name AS origin_station, d.station_name AS destination_station,
        s.journey_date, TIME_FORMAT(s.departure_time, '%H:%i') AS departure_time,
        TIME_FORMAT(s.arrival_time, '%H:%i') AS arrival_time,
        seat.coach_number, seat.seat_number,
        w.queue_position, w.status AS waitlist_status
      FROM bookings b
      JOIN train_schedules s ON s.schedule_id = b.schedule_id
      JOIN train_routes r ON r.route_id = s.route_id
      JOIN trains t ON t.train_id = r.train_id
      JOIN stations o ON o.station_id = r.origin_station_id
      JOIN stations d ON d.station_id = r.destination_station_id
      LEFT JOIN seat_allocations a ON a.booking_id = b.booking_id
      LEFT JOIN train_seats seat ON seat.seat_id = a.seat_id
      LEFT JOIN waitlist_entries w ON w.booking_id = b.booking_id
      WHERE b.passenger_id = ?
      ORDER BY b.booking_time DESC, b.booking_id DESC`, [req.user_id]);
    return res.json({ bookings });
  } catch (error) { return next(error); }
};
