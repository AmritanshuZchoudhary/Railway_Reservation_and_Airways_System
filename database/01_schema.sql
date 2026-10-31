-- Railway Reservation System
-- Target: MySQL Community Server 8.0.46+
-- Run this file first in MySQL Workbench.
CREATE DATABASE IF NOT EXISTS railway_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE railway_db;

CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('PASSENGER', 'ADMIN') NOT NULL DEFAULT 'PASSENGER',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stations (
  station_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  station_code VARCHAR(10) NOT NULL,
  station_name VARCHAR(120) NOT NULL,
  city VARCHAR(100) NOT NULL,
  PRIMARY KEY (station_id),
  UNIQUE KEY uq_stations_code (station_code),
  UNIQUE KEY uq_stations_name_city (station_name, city)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trains (
  train_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  train_number VARCHAR(12) NOT NULL,
  train_name VARCHAR(150) NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (train_id),
  UNIQUE KEY uq_trains_number (train_number)
) ENGINE=InnoDB;

-- A simplified academic model: each route represents one bookable origin/destination pair.
CREATE TABLE IF NOT EXISTS train_routes (
  route_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  train_id BIGINT UNSIGNED NOT NULL,
  origin_station_id BIGINT UNSIGNED NOT NULL,
  destination_station_id BIGINT UNSIGNED NOT NULL,
  distance_km DECIMAL(8,2) NULL,
  PRIMARY KEY (route_id),
  UNIQUE KEY uq_route_pair (train_id, origin_station_id, destination_station_id),
  CONSTRAINT fk_routes_train FOREIGN KEY (train_id) REFERENCES trains (train_id),
  CONSTRAINT fk_routes_origin FOREIGN KEY (origin_station_id) REFERENCES stations (station_id),
  CONSTRAINT fk_routes_destination FOREIGN KEY (destination_station_id) REFERENCES stations (station_id),
  CONSTRAINT chk_route_stations_differ CHECK (origin_station_id <> destination_station_id),
  CONSTRAINT chk_route_distance CHECK (distance_km IS NULL OR distance_km > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS train_schedules (
  schedule_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  route_id BIGINT UNSIGNED NOT NULL,
  journey_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  base_fare DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  booking_status ENUM('OPEN', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (schedule_id),
  UNIQUE KEY uq_schedule_route_date_time (route_id, journey_date, departure_time),
  KEY idx_schedule_date_status (journey_date, booking_status),
  CONSTRAINT fk_schedules_route FOREIGN KEY (route_id) REFERENCES train_routes (route_id),
  CONSTRAINT chk_schedule_fare CHECK (base_fare >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS train_seats (
  seat_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  train_id BIGINT UNSIGNED NOT NULL,
  coach_number VARCHAR(10) NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  class_type ENUM('SLEEPER', 'AC', 'CHAIR_CAR') NOT NULL,
  PRIMARY KEY (seat_id),
  UNIQUE KEY uq_train_physical_seat (train_id, coach_number, seat_number),
  KEY idx_seats_train_class (train_id, class_type),
  CONSTRAINT fk_seats_train FOREIGN KEY (train_id) REFERENCES trains (train_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  booking_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  passenger_id BIGINT UNSIGNED NOT NULL,
  schedule_id BIGINT UNSIGNED NOT NULL,
  class_type ENUM('SLEEPER', 'AC', 'CHAIR_CAR') NOT NULL,
  status ENUM('CONFIRMED', 'WAITLISTED', 'CANCELLED', 'EXPIRED') NOT NULL,
  fare DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  booking_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (booking_id),
  KEY idx_bookings_passenger_time (passenger_id, booking_time),
  KEY idx_bookings_schedule_status (schedule_id, status),
  CONSTRAINT fk_bookings_passenger FOREIGN KEY (passenger_id) REFERENCES users (user_id),
  CONSTRAINT fk_bookings_schedule FOREIGN KEY (schedule_id) REFERENCES train_schedules (schedule_id),
  CONSTRAINT chk_booking_fare CHECK (fare >= 0)
) ENGINE=InnoDB;

-- Stores current allocations only. Cancelled/released allocations are removed, while
-- the cancellations table preserves the audit trail.
CREATE TABLE IF NOT EXISTS seat_allocations (
  allocation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  schedule_id BIGINT UNSIGNED NOT NULL,
  seat_id BIGINT UNSIGNED NOT NULL,
  booking_id BIGINT UNSIGNED NOT NULL,
  allocated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (allocation_id),
  UNIQUE KEY uq_schedule_seat (schedule_id, seat_id),
  UNIQUE KEY uq_booking_allocation (booking_id),
  CONSTRAINT fk_alloc_schedule FOREIGN KEY (schedule_id) REFERENCES train_schedules (schedule_id),
  CONSTRAINT fk_alloc_seat FOREIGN KEY (seat_id) REFERENCES train_seats (seat_id),
  CONSTRAINT fk_alloc_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS waitlist_entries (
  waitlist_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  schedule_id BIGINT UNSIGNED NOT NULL,
  class_type ENUM('SLEEPER', 'AC', 'CHAIR_CAR') NOT NULL,
  queue_position INT UNSIGNED NOT NULL,
  status ENUM('WAITING', 'PROMOTED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'WAITING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  promoted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (waitlist_id),
  UNIQUE KEY uq_waitlist_booking (booking_id),
  UNIQUE KEY uq_waitlist_queue_position (schedule_id, class_type, queue_position),
  KEY idx_waitlist_next (schedule_id, class_type, status, queue_position),
  CONSTRAINT fk_waitlist_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id),
  CONSTRAINT fk_waitlist_schedule FOREIGN KEY (schedule_id) REFERENCES train_schedules (schedule_id),
  CONSTRAINT chk_waitlist_position CHECK (queue_position > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cancellations (
  cancellation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  schedule_id BIGINT UNSIGNED NOT NULL,
  class_type ENUM('SLEEPER', 'AC', 'CHAIR_CAR') NOT NULL,
  released_seat_id BIGINT UNSIGNED NULL,
  cancelled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(255) NULL,
  PRIMARY KEY (cancellation_id),
  UNIQUE KEY uq_cancellation_booking (booking_id),
  KEY idx_cancellations_schedule (schedule_id, cancelled_at),
  CONSTRAINT fk_cancellations_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id),
  CONSTRAINT fk_cancellations_schedule FOREIGN KEY (schedule_id) REFERENCES train_schedules (schedule_id),
  CONSTRAINT fk_cancellations_seat FOREIGN KEY (released_seat_id) REFERENCES train_seats (seat_id)
) ENGINE=InnoDB;

-- Each row is a historical observation linked to its eventual known outcome.
-- Demo records are synthetic and explicitly identified by data_source.
CREATE TABLE IF NOT EXISTS waitlist_probability_history (
  history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_booking_id BIGINT UNSIGNED NULL,
  route_id BIGINT UNSIGNED NOT NULL,
  class_type ENUM('SLEEPER', 'AC', 'CHAIR_CAR') NOT NULL,
  waitlist_position_at_observation INT UNSIGNED NOT NULL,
  days_remaining_at_observation INT UNSIGNED NOT NULL,
  final_outcome ENUM('CONFIRMED', 'NOT_CONFIRMED', 'PASSENGER_CANCELLED') NOT NULL,
  observation_date DATE NOT NULL,
  data_source ENUM('SIMULATED_DEMO', 'RECORDED_OUTCOME') NOT NULL DEFAULT 'SIMULATED_DEMO',
  PRIMARY KEY (history_id),
  UNIQUE KEY uq_probability_source_booking (source_booking_id),
  KEY idx_probability_lookup (route_id, class_type, waitlist_position_at_observation, days_remaining_at_observation),
  KEY idx_probability_class_position (class_type, waitlist_position_at_observation, final_outcome),
  CONSTRAINT fk_probability_route FOREIGN KEY (route_id) REFERENCES train_routes (route_id),
  CONSTRAINT fk_probability_source_booking FOREIGN KEY (source_booking_id) REFERENCES bookings (booking_id),
  CONSTRAINT chk_probability_position CHECK (waitlist_position_at_observation > 0)
) ENGINE=InnoDB;
