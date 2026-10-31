USE railway_db;
CREATE OR REPLACE VIEW vw_booking_overview AS
SELECT
  b.booking_id,
  b.passenger_id,
  u.full_name AS passenger_name,
  u.email AS passenger_email,
  b.schedule_id,
  t.train_number,
  t.train_name,
  o.station_name AS origin_station,
  d.station_name AS destination_station,
  s.journey_date,
  s.departure_time,
  s.arrival_time,
  b.class_type,
  b.status AS booking_status,
  b.fare,
  seat.coach_number,
  seat.seat_number,
  w.queue_position,
  w.status AS waitlist_status,
  b.booking_time
FROM bookings b
JOIN users u ON u.user_id = b.passenger_id
JOIN train_schedules s ON s.schedule_id = b.schedule_id
JOIN train_routes r ON r.route_id = s.route_id
JOIN trains t ON t.train_id = r.train_id
JOIN stations o ON o.station_id = r.origin_station_id
JOIN stations d ON d.station_id = r.destination_station_id
LEFT JOIN seat_allocations a ON a.booking_id = b.booking_id
LEFT JOIN train_seats seat ON seat.seat_id = a.seat_id
LEFT JOIN waitlist_entries w ON w.booking_id = b.booking_id;

CREATE OR REPLACE VIEW vw_schedule_occupancy AS
SELECT
  s.schedule_id,
  s.journey_date,
  t.train_number,
  t.train_name,
  o.station_name AS origin_station,
  d.station_name AS destination_station,
  seat.class_type,
  COUNT(DISTINCT seat.seat_id) AS total_seats,
  COUNT(DISTINCT a.seat_id) AS occupied_seats,
  COUNT(DISTINCT seat.seat_id) - COUNT(DISTINCT a.seat_id) AS available_seats
FROM train_schedules s
JOIN train_routes r ON r.route_id = s.route_id
JOIN trains t ON t.train_id = r.train_id
JOIN stations o ON o.station_id = r.origin_station_id
JOIN stations d ON d.station_id = r.destination_station_id
JOIN train_seats seat ON seat.train_id = t.train_id
LEFT JOIN seat_allocations a ON a.schedule_id = s.schedule_id AND a.seat_id = seat.seat_id
GROUP BY s.schedule_id, s.journey_date, t.train_number, t.train_name,
         o.station_name, d.station_name, seat.class_type;

CREATE OR REPLACE VIEW vw_probability_outcome_summary AS
SELECT
  route_id,
  class_type,
  CASE
    WHEN waitlist_position_at_observation <= 2 THEN '1-2'
    WHEN waitlist_position_at_observation <= 5 THEN '3-5'
    WHEN waitlist_position_at_observation <= 10 THEN '6-10'
    WHEN waitlist_position_at_observation <= 20 THEN '11-20'
    ELSE '21+'
  END AS position_band,
  COUNT(*) AS known_outcomes,
  SUM(final_outcome = 'CONFIRMED') AS confirmed_outcomes,
  ROUND(100 * SUM(final_outcome = 'CONFIRMED') / NULLIF(COUNT(*), 0), 1) AS observed_confirmation_percent
FROM waitlist_probability_history
WHERE final_outcome IN ('CONFIRMED', 'NOT_CONFIRMED')
GROUP BY route_id, class_type, position_band;
