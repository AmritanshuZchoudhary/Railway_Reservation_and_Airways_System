USE railway_db;
-- All train/station names and routes below are fictional demonstration data.
-- IDs are explicit so the demo walkthrough is reproducible on a fresh database.
START TRANSACTION;

INSERT INTO stations (station_id, station_code, station_name, city) VALUES
  (1, 'NDS', 'New Delhi Demo Terminal', 'New Delhi'),
  (2, 'AGD', 'Agra Demo Junction', 'Agra'),
  (3, 'BPD', 'Bhopal Demo Central', 'Bhopal'),
  (4, 'MCD', 'Mumbai Demo Central', 'Mumbai'),
  (5, 'JPD', 'Jaipur Demo Junction', 'Jaipur'),
  (6, 'LSD', 'Lucknow Demo Station', 'Lucknow')
ON DUPLICATE KEY UPDATE station_code=VALUES(station_code), station_name=VALUES(station_name), city=VALUES(city);

INSERT INTO trains (train_id, train_number, train_name, status) VALUES
  (1, '90001', 'Capital–Coast Demo Express', 'ACTIVE'),
  (2, '90002', 'Agra Intercity Demo', 'ACTIVE'),
  (3, '90003', 'Central Connector Demo', 'ACTIVE')
ON DUPLICATE KEY UPDATE train_number=VALUES(train_number), train_name=VALUES(train_name), status=VALUES(status);

INSERT INTO train_routes (route_id, train_id, origin_station_id, destination_station_id, distance_km) VALUES
  (1, 1, 1, 4, 1380.00),
  (2, 2, 1, 2, 230.00),
  (3, 3, 2, 3, 590.00),
  (4, 1, 1, 5, 310.00),
  (5, 3, 3, 4, 780.00)
ON DUPLICATE KEY UPDATE train_id=VALUES(train_id), origin_station_id=VALUES(origin_station_id), destination_station_id=VALUES(destination_station_id), distance_km=VALUES(distance_km);

INSERT INTO train_seats (seat_id, train_id, coach_number, seat_number, class_type) VALUES
  (1, 1, 'S1', '01', 'SLEEPER'),
  (2, 1, 'S1', '02', 'SLEEPER'),
  (3, 1, 'S1', '03', 'SLEEPER'),
  (4, 1, 'A1', '01', 'AC'),
  (5, 1, 'A1', '02', 'AC'),
  (6, 2, 'C1', '01', 'CHAIR_CAR'),
  (7, 2, 'C1', '02', 'CHAIR_CAR'),
  (8, 2, 'C1', '03', 'CHAIR_CAR'),
  (9, 2, 'C1', '04', 'CHAIR_CAR'),
  (10, 2, 'S1', '01', 'SLEEPER'),
  (11, 2, 'S1', '02', 'SLEEPER'),
  (12, 3, 'S1', '01', 'SLEEPER'),
  (13, 3, 'S1', '02', 'SLEEPER'),
  (14, 3, 'S1', '03', 'SLEEPER'),
  (15, 3, 'A1', '01', 'AC'),
  (16, 3, 'A1', '02', 'AC')
ON DUPLICATE KEY UPDATE train_id=VALUES(train_id), coach_number=VALUES(coach_number), seat_number=VALUES(seat_number), class_type=VALUES(class_type);

INSERT INTO train_schedules (schedule_id, route_id, journey_date, departure_time, arrival_time, base_fare, booking_status) VALUES
  (1001, 1, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '06:30:00', '08:45:00', 1299.00, 'OPEN'),
  (1002, 1, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '18:15:00', '21:00:00', 1199.00, 'OPEN'),
  (1003, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '08:00:00', '11:00:00', 349.00, 'OPEN'),
  (1004, 3, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '09:20:00', '16:40:00', 699.00, 'OPEN'),
  (1005, 4, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '07:10:00', '12:30:00', 499.00, 'OPEN'),
  (1006, 5, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:00:00', '20:30:00', 899.00, 'OPEN')
ON DUPLICATE KEY UPDATE route_id=VALUES(route_id), journey_date=VALUES(journey_date), departure_time=VALUES(departure_time), arrival_time=VALUES(arrival_time), base_fare=VALUES(base_fare), booking_status=VALUES(booking_status);

COMMIT;
