const db = require('../config/db');
const VALID_CLASSES = new Set(['SLEEPER', 'AC', 'CHAIR_CAR']);

exports.listStations = async (_req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT station_id, station_code, station_name, city FROM stations ORDER BY city, station_name'
    );
    return res.json({ stations: rows });
  } catch (error) { return next(error); }
};

exports.searchSchedules = async (req, res, next) => {
  try {
    const originId = Number(req.query.origin_station_id);
    const destinationId = Number(req.query.destination_station_id);
    const journeyDate = String(req.query.journey_date || '');
    const classType = String(req.query.class_type || 'SLEEPER').toUpperCase();

    if (!Number.isInteger(originId) || originId < 1 || !Number.isInteger(destinationId) || destinationId < 1) {
      return res.status(400).json({ error: 'Choose both an origin and destination station.' });
    }
    if (originId === destinationId) return res.status(400).json({ error: 'Origin and destination must be different.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(journeyDate) || Number.isNaN(Date.parse(`${journeyDate}T00:00:00Z`))) {
      return res.status(400).json({ error: 'Choose a valid journey date.' });
    }
    if (!VALID_CLASSES.has(classType)) return res.status(400).json({ error: 'Choose a supported travel class.' });

    const sql = `
      SELECT
        s.schedule_id, s.journey_date, TIME_FORMAT(s.departure_time, '%H:%i') AS departure_time,
        TIME_FORMAT(s.arrival_time, '%H:%i') AS arrival_time, s.base_fare,
        t.train_id, t.train_number, t.train_name, r.route_id,
        o.station_id AS origin_station_id, o.station_name AS origin_station, o.city AS origin_city,
        d.station_id AS destination_station_id, d.station_name AS destination_station, d.city AS destination_city,
        ? AS class_type,
        COUNT(DISTINCT seat.seat_id) AS total_seats,
        COUNT(DISTINCT alloc.seat_id) AS occupied_seats,
        COUNT(DISTINCT seat.seat_id) - COUNT(DISTINCT alloc.seat_id) AS available_seats
      FROM train_schedules s
      JOIN train_routes r ON r.route_id = s.route_id
      JOIN trains t ON t.train_id = r.train_id AND t.status = 'ACTIVE'
      JOIN stations o ON o.station_id = r.origin_station_id
      JOIN stations d ON d.station_id = r.destination_station_id
      LEFT JOIN train_seats seat ON seat.train_id = t.train_id AND seat.class_type = ?
      LEFT JOIN seat_allocations alloc ON alloc.schedule_id = s.schedule_id AND alloc.seat_id = seat.seat_id
      WHERE r.origin_station_id = ? AND r.destination_station_id = ?
        AND s.journey_date = ? AND s.journey_date >= CURDATE() AND s.booking_status = 'OPEN'
      GROUP BY s.schedule_id, s.journey_date, s.departure_time, s.arrival_time, s.base_fare,
        t.train_id, t.train_number, t.train_name, r.route_id, o.station_id, o.station_name, o.city,
        d.station_id, d.station_name, d.city
      HAVING COUNT(DISTINCT seat.seat_id) > 0
      ORDER BY s.departure_time ASC`;
    const [schedules] = await db.query(sql, [classType, classType, originId, destinationId, journeyDate]);
    return res.json({ schedules, search: { origin_station_id: originId, destination_station_id: destinationId, journey_date: journeyDate, class_type: classType } });
  } catch (error) { return next(error); }
};
