USE railway_db;
DROP TRIGGER IF EXISTS trg_promote_waitlist_after_cancellation;
DELIMITER $$
CREATE TRIGGER trg_promote_waitlist_after_cancellation
AFTER INSERT ON cancellations
FOR EACH ROW
BEGIN
  DECLARE v_waitlist_id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_booking_id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_no_waiting TINYINT DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_no_waiting = 1;

  IF NEW.released_seat_id IS NOT NULL THEN
    SELECT w.waitlist_id, w.booking_id
      INTO v_waitlist_id, v_booking_id
    FROM waitlist_entries w
    INNER JOIN bookings b ON b.booking_id = w.booking_id
    WHERE w.schedule_id = NEW.schedule_id
      AND w.class_type = NEW.class_type
      AND w.status = 'WAITING'
      AND b.status = 'WAITLISTED'
    ORDER BY w.queue_position ASC, w.created_at ASC, w.waitlist_id ASC
    LIMIT 1;

    IF v_no_waiting = 0 AND v_waitlist_id IS NOT NULL AND v_booking_id IS NOT NULL THEN
      INSERT INTO seat_allocations (schedule_id, seat_id, booking_id)
      VALUES (NEW.schedule_id, NEW.released_seat_id, v_booking_id);

      UPDATE bookings
      SET status = 'CONFIRMED'
      WHERE booking_id = v_booking_id AND status = 'WAITLISTED';

      UPDATE waitlist_entries
      SET status = 'PROMOTED', promoted_at = CURRENT_TIMESTAMP
      WHERE waitlist_id = v_waitlist_id AND status = 'WAITING';
    END IF;
  END IF;
END$$
DELIMITER ;
