const db = require('../config/db');

exports.getSummary = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT COUNT(*) AS total_bookings,
        COALESCE(SUM(status = 'CONFIRMED'), 0) AS confirmed_bookings,
        COALESCE(SUM(status = 'WAITLISTED'), 0) AS waitlisted_bookings,
        COALESCE(SUM(status = 'CANCELLED'), 0) AS cancelled_bookings,
        COALESCE(SUM(CASE WHEN status IN ('CONFIRMED', 'WAITLISTED') THEN fare ELSE 0 END), 0) AS active_fare_total
      FROM bookings WHERE passenger_id = ?`, [req.user_id]);
    return res.json({ summary: rows[0] });
  } catch (error) { return next(error); }
};

exports.getAdminSummary = async (_req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'PASSENGER') AS passengers,
        (SELECT COUNT(*) FROM trains WHERE status = 'ACTIVE') AS active_trains,
        (SELECT COUNT(*) FROM train_schedules WHERE journey_date >= CURDATE() AND booking_status = 'OPEN') AS open_schedules,
        (SELECT COUNT(*) FROM bookings) AS total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'WAITLISTED') AS current_waitlist,
        (SELECT COUNT(*) FROM cancellations) AS cancellations,
        (SELECT COUNT(*) FROM waitlist_entries WHERE status = 'PROMOTED') AS promotions,
        (SELECT COUNT(*) FROM waitlist_probability_history WHERE data_source = 'SIMULATED_DEMO') AS simulated_history_rows,
        (SELECT COUNT(*) FROM waitlist_probability_history WHERE data_source = 'RECORDED_OUTCOME') AS recorded_history_rows`);
    return res.json({ summary: rows[0] });
  } catch (error) { return next(error); }
};


exports.finalizeWaitlistHistory = async (_req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.query('CALL sp_finalize_waitlist_history(@inserted_history_count)');
    const [rows] = await connection.query('SELECT @inserted_history_count AS inserted_count');
    const insertedCount = Number(rows[0]?.inserted_count || 0);
    return res.json({
      message: insertedCount
        ? `Recorded ${insertedCount} completed waitlist outcome(s) from past demo journeys.`
        : 'No new completed waitlist outcomes were ready to record. Only journeys dated before today are finalized.',
      inserted_count: insertedCount
    });
  } catch (error) {
    if (error.sqlState === '45000' || error.code === 'ER_SIGNAL_EXCEPTION') {
      return res.status(400).json({ error: error.sqlMessage || 'Could not finalize historical outcomes.' });
    }
    return next(error);
  } finally {
    if (connection) connection.release();
  }
};
