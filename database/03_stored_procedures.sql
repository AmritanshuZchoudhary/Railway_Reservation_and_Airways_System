USE railway_db;
DROP PROCEDURE IF EXISTS sp_create_booking;
DROP PROCEDURE IF EXISTS sp_cancel_booking;
DROP PROCEDURE IF EXISTS sp_finalize_waitlist_history;
DELIMITER $$

CREATE PROCEDURE sp_create_booking(
  IN p_user_id BIGINT UNSIGNED,
  IN p_schedule_id BIGINT UNSIGNED,
  IN p_class_type VARCHAR(20),
  OUT p_booking_id BIGINT UNSIGNED,
  OUT p_final_status VARCHAR(20)
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_route_id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_train_id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_booking_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_fare DECIMAL(10,2) DEFAULT 0.00;
  DECLARE v_journey_date DATE DEFAULT NULL;
  DECLARE v_seat_id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_queue_position INT UNSIGNED DEFAULT 1;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET p_booking_id = NULL;
  SET p_final_status = NULL;
  IF p_class_type NOT IN ('SLEEPER', 'AC', 'CHAIR_CAR') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsupported travel class.';
  END IF;

  START TRANSACTION;

  SELECT COUNT(*) INTO v_count
  FROM users
  WHERE user_id = p_user_id AND role = 'PASSENGER';
  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Passenger account was not found.';
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM train_schedules
  WHERE schedule_id = p_schedule_id;
  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Scheduled journey was not found.';
  END IF;

  -- Serialise booking/cancellation changes for this journey.
  SELECT route_id, booking_status, base_fare, journey_date
    INTO v_route_id, v_booking_status, v_fare, v_journey_date
  FROM train_schedules
  WHERE schedule_id = p_schedule_id
  FOR UPDATE;

  IF v_booking_status <> 'OPEN' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This journey is not open for booking.';
  END IF;
  IF v_journey_date < CURDATE() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Past journeys cannot be booked.';
  END IF;

  SELECT train_id INTO v_train_id
  FROM train_routes
  WHERE route_id = v_route_id;

  SELECT COUNT(*) INTO v_count
  FROM train_seats
  WHERE train_id = v_train_id AND class_type = p_class_type;
  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This train does not offer the selected travel class.';
  END IF;

  -- MIN() always returns one row; NULL means that no eligible seat is available.
  SELECT MIN(s.seat_id) INTO v_seat_id
  FROM train_seats s
  WHERE s.train_id = v_train_id
    AND s.class_type = p_class_type
    AND NOT EXISTS (
      SELECT 1 FROM seat_allocations a
      WHERE a.schedule_id = p_schedule_id AND a.seat_id = s.seat_id
    );

  IF v_seat_id IS NOT NULL THEN
    INSERT INTO bookings (passenger_id, schedule_id, class_type, status, fare)
    VALUES (p_user_id, p_schedule_id, p_class_type, 'CONFIRMED', v_fare);
    SET p_booking_id = LAST_INSERT_ID();

    INSERT INTO seat_allocations (schedule_id, seat_id, booking_id)
    VALUES (p_schedule_id, v_seat_id, p_booking_id);
    SET p_final_status = 'CONFIRMED';
  ELSE
    INSERT INTO bookings (passenger_id, schedule_id, class_type, status, fare)
    VALUES (p_user_id, p_schedule_id, p_class_type, 'WAITLISTED', v_fare);
    SET p_booking_id = LAST_INSERT_ID();

    SELECT COALESCE(MAX(queue_position), 0) + 1 INTO v_queue_position
    FROM waitlist_entries
    WHERE schedule_id = p_schedule_id AND class_type = p_class_type;

    INSERT INTO waitlist_entries (booking_id, schedule_id, class_type, queue_position, status)
    VALUES (p_booking_id, p_schedule_id, p_class_type, v_queue_position, 'WAITING');
    SET p_final_status = 'WAITLISTED';
  END IF;

  COMMIT;
END$$

CREATE PROCEDURE sp_cancel_booking(
  IN p_booking_id BIGINT UNSIGNED,
  IN p_requester_id BIGINT UNSIGNED
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_schedule_id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_owner_id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_class_type VARCHAR(20) DEFAULT NULL;
  DECLARE v_seat_id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_lock_schedule_id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_journey_date DATE DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT COUNT(*) INTO v_count FROM bookings WHERE booking_id = p_booking_id;
  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking was not found.';
  END IF;

  SELECT schedule_id INTO v_schedule_id FROM bookings WHERE booking_id = p_booking_id;
  SELECT schedule_id, journey_date INTO v_lock_schedule_id, v_journey_date
  FROM train_schedules WHERE schedule_id = v_schedule_id FOR UPDATE;
  IF v_journey_date < CURDATE() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Past journeys cannot be cancelled through the demo application.';
  END IF;

  SELECT passenger_id, status, class_type
    INTO v_owner_id, v_status, v_class_type
  FROM bookings
  WHERE booking_id = p_booking_id
  FOR UPDATE;

  IF v_owner_id <> p_requester_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You may cancel only your own booking.';
  END IF;
  IF v_status = 'CANCELLED' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This booking has already been cancelled.';
  END IF;

  -- The aggregation safely returns NULL if this was a waitlisted booking.
  SELECT MAX(seat_id) INTO v_seat_id
  FROM seat_allocations
  WHERE booking_id = p_booking_id;

  IF v_status = 'CONFIRMED' AND v_seat_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Confirmed booking has no active seat allocation; please contact the administrator.';
  END IF;

  UPDATE bookings SET status = 'CANCELLED' WHERE booking_id = p_booking_id;

  IF v_status = 'WAITLISTED' THEN
    UPDATE waitlist_entries
    SET status = 'CANCELLED'
    WHERE booking_id = p_booking_id AND status = 'WAITING';
  END IF;

  IF v_seat_id IS NOT NULL THEN
    DELETE FROM seat_allocations WHERE booking_id = p_booking_id;
  END IF;

  -- The AFTER INSERT trigger promotes the first eligible waiting booking when a seat
  -- was genuinely released. A waitlist cancellation passes NULL and promotes nobody.
  INSERT INTO cancellations (booking_id, schedule_id, class_type, released_seat_id, reason)
  VALUES (p_booking_id, v_schedule_id, v_class_type, v_seat_id, 'Passenger requested cancellation');

  COMMIT;
END$$

CREATE PROCEDURE sp_finalize_waitlist_history(OUT p_inserted INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET p_inserted = 0;
  START TRANSACTION;

  INSERT INTO waitlist_probability_history
    (source_booking_id, route_id, class_type, waitlist_position_at_observation,
     days_remaining_at_observation, final_outcome, observation_date, data_source)
  SELECT
    b.booking_id,
    r.route_id,
    b.class_type,
    w.queue_position,
    GREATEST(DATEDIFF(s.journey_date, DATE(w.created_at)), 0),
    CASE
      WHEN w.status = 'PROMOTED' THEN 'CONFIRMED'
      WHEN w.status = 'CANCELLED' AND b.status = 'CANCELLED' THEN 'PASSENGER_CANCELLED'
      ELSE 'NOT_CONFIRMED'
    END,
    DATE(w.created_at),
    'RECORDED_OUTCOME'
  FROM waitlist_entries w
  JOIN bookings b ON b.booking_id = w.booking_id
  JOIN train_schedules s ON s.schedule_id = w.schedule_id
  JOIN train_routes r ON r.route_id = s.route_id
  WHERE s.journey_date < CURDATE()
    AND w.status IN ('PROMOTED', 'WAITING', 'CANCELLED')
    AND NOT EXISTS (
      SELECT 1 FROM waitlist_probability_history h
      WHERE h.source_booking_id = b.booking_id
    );

  SET p_inserted = ROW_COUNT();

  -- Expire queue entries after their journey has departed so they are not shown as
  -- actively waiting in the passenger dashboard. Their outcome has already been recorded above.
  UPDATE waitlist_entries w
  JOIN train_schedules s ON s.schedule_id = w.schedule_id
  SET w.status = 'EXPIRED'
  WHERE s.journey_date < CURDATE() AND w.status = 'WAITING';

  UPDATE bookings b
  JOIN train_schedules s ON s.schedule_id = b.schedule_id
  SET b.status = 'EXPIRED'
  WHERE s.journey_date < CURDATE() AND b.status = 'WAITLISTED';

  COMMIT;
END$$

DELIMITER ;
