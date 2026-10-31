const db = require('../config/db');
const probabilityService = require('../services/probabilityService');

exports.getProbability = async (req, res, next) => {
  try {
    const bookingId = Number(req.query.booking_id);
    if (!Number.isInteger(bookingId) || bookingId < 1) {
      return res.status(400).json({ error: 'Choose a waitlisted booking to estimate its confirmation probability.' });
    }

    const [rows] = await db.query(`
      SELECT b.booking_id, r.route_id, b.class_type, w.queue_position,
        GREATEST(DATEDIFF(s.journey_date, CURDATE()), 0) AS days_remaining,
        s.journey_date, o.station_name AS origin_station, d.station_name AS destination_station
      FROM bookings b
      JOIN train_schedules s ON s.schedule_id = b.schedule_id
      JOIN train_routes r ON r.route_id = s.route_id
      JOIN stations o ON o.station_id = r.origin_station_id
      JOIN stations d ON d.station_id = r.destination_station_id
      JOIN waitlist_entries w ON w.booking_id = b.booking_id AND w.status = 'WAITING'
      WHERE b.booking_id = ? AND b.passenger_id = ? AND b.status = 'WAITLISTED'
      LIMIT 1`, [bookingId, req.user_id]);

    if (!rows.length) {
      return res.status(404).json({ error: 'A probability estimate is available only for your active waitlisted booking.' });
    }
    const booking = rows[0];
    const estimate = await probabilityService.estimate({
      routeId: Number(booking.route_id),
      classType: booking.class_type,
      position: Number(booking.queue_position),
      daysRemaining: Number(booking.days_remaining)
    });
    return res.json({ booking: {
      booking_id: Number(booking.booking_id),
      route_id: Number(booking.route_id),
      class_type: booking.class_type,
      waitlist_position: Number(booking.queue_position),
      days_remaining: Number(booking.days_remaining),
      journey_date: booking.journey_date,
      origin_station: booking.origin_station,
      destination_station: booking.destination_station
    }, ...estimate });
  } catch (error) { return next(error); }
};
