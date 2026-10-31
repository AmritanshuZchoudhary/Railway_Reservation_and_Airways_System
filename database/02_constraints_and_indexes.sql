USE railway_db;
-- Most core integrity constraints and indexes are created in 01_schema.sql alongside
-- each table. This file is an explicit implementation checkpoint and adds useful keys.
CREATE INDEX idx_users_role_created ON users (role, created_at);
CREATE INDEX idx_routes_origin_destination ON train_routes (origin_station_id, destination_station_id);
CREATE INDEX idx_bookings_status_time ON bookings (status, booking_time);
CREATE INDEX idx_cancellations_time ON cancellations (cancelled_at);
