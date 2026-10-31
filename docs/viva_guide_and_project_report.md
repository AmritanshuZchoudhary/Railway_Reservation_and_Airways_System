# Railway+ — Project Report and Viva Guide

## Project title
**Railway Reservation System with Automatic Waitlist Management and Historical Confirmation Probability Estimation**

## Problem statement
Railway bookings involve related passenger, train, schedule, seat, booking, cancellation, and waitlist data. Without clear constraints and coordinated updates, seat records can become inconsistent or a released seat may not be assigned to the next eligible waitlisted passenger. This project develops a simplified relational database-backed prototype to manage those operations consistently and demonstrate SQL and transaction concepts.

## Objectives
- Maintain related passenger, route, schedule, seat, booking, cancellation, and waitlist records.
- Search schedules and calculate availability from active MySQL allocations.
- Prevent duplicate active seat assignments for the same scheduled journey.
- Create bookings using a stored procedure and transaction.
- Automatically promote the first eligible waitlisted booking when a confirmed seat is released.
- Estimate a waitlisted booking's confirmation percentage from comparable historical outcomes.
- Demonstrate SQL DDL, DML, DCL, joins, aggregate queries, views, triggers, constraints, and transaction handling.

## Modules
1. Account management and authentication.
2. Station, train, route, and schedule search.
3. Seat availability and reservation.
4. Booking cancellation and queue promotion.
5. Historical confirmation estimator.
6. Passenger dashboard, reporting, and admin metrics.

## Main tables
`users`, `stations`, `trains`, `train_routes`, `train_schedules`, `train_seats`, `bookings`, `seat_allocations`, `waitlist_entries`, `cancellations`, and `waitlist_probability_history`.

## Automatic waitlist promotion
A stored procedure locks the target schedule so bookings and cancellations for that journey are serialized. On cancellation, it validates ownership/status, removes the current allocation when a confirmed ticket is cancelled, and inserts an audit record in `cancellations`. The `AFTER INSERT` trigger checks that a seat was really released, selects the earliest `WAITING` entry for the same schedule and class, creates an allocation for the released seat, changes the booking to `CONFIRMED`, and marks the waitlist entry `PROMOTED`. These changes participate in the calling procedure's transaction. A cancellation of a waitlisted booking has no released seat and therefore cannot trigger an unrelated promotion.

## Historical probability method
For a current active waitlisted booking, the service reads the route, class, queue position, and days until departure. Position and lead time are mapped to documented bands. It counts confirmed and not-confirmed comparable history rows and excludes passenger-initiated cancellations. The first comparison group is the same route, class, position band, and lead-time band. If it has fewer than 20 outcomes, the service broadens the comparison first across all lead times for the same route/class/position band, then across routes for the same class/position band. If the sample is still below 20, it returns an insufficient-data message.

`Probability (%) = confirmed comparable cases ÷ known comparable outcomes × 100`.

The supplied records use `SIMULATED_DEMO`; they are synthetic, not railway statistics. An admin-only stored procedure can finalize the outcomes of past waitlist entries, write one `RECORDED_OUTCOME` row per source booking, and expire entries that were still waiting after departure. A unique source-booking key makes finalization idempotent. The estimate is an empirical historical ratio, not a machine-learning prediction or a guarantee.

## DBMS concepts used
- **DDL:** create database/tables and indexes.
- **DML:** insert, select, and update application records.
- **DCL:** GRANT/REVOKE examples are in `database/08_dcl_permissions.sql` and are commented until a safe password is provided.
- **Primary/foreign keys:** identify rows and protect relationships.
- **Constraints:** unique active seat allocation, unique booking allocation, supported state values, and valid queue positions.
- **Joins:** combine bookings with passengers, routes, schedules, and seats.
- **Aggregate functions:** count bookings, seats, and historical outcomes.
- **Views:** `vw_booking_overview`, `vw_schedule_occupancy`, and `vw_probability_outcome_summary`.
- **Stored procedures:** `sp_create_booking` and `sp_cancel_booking`.
- **Trigger:** `trg_promote_waitlist_after_cancellation`.
- **Transactions/locking:** coordinate multi-step updates and serialize operations by schedule.

## Suggested viva questions and answers

**Why are Passenger and Booking separate tables?**  
A passenger can make multiple bookings. A separate user/passenger record avoids repeating personal details in every booking and lets a foreign key connect the records.

**What prevents two passengers receiving the same seat?**  
A unique constraint on `(schedule_id, seat_id)` in `seat_allocations`, together with schedule-row locking in the booking procedure, prevents two active allocations for the same seat on the same schedule.

**What is the role of the trigger?**  
It automatically selects and promotes the first eligible waitlisted booking when a cancellation record identifies a released seat.

**Why is a stored procedure also used?**  
The procedure validates the operation, coordinates the transaction, handles errors, and commits or rolls back the whole cancellation workflow. The trigger participates in that same transaction.

**What if no one is on the waitlist?**  
The trigger finds no eligible row and does not create an allocation. The released seat stays available for another booking.

**What if someone cancels their waitlisted booking?**  
That booking had no allocated seat; its queue entry is marked cancelled. The cancellation record has `released_seat_id = NULL`, so the promotion trigger does nothing.

**How is the probability calculated?**  
It is the number of comparable cases confirmed before departure divided by the number of comparable known outcomes, multiplied by 100. Passenger-initiated cancellations are excluded from the denominator.

**Why is the probability not a guarantee?**  
The calculation describes historical cases, not the exact future of an individual journey. Current cancellations and demand can differ from the historical sample.

**Why does the app sometimes say there is insufficient data?**  
A comparison group needs at least 20 known outcomes. The service broadens the comparison using documented rules, and if there still are too few records it avoids presenting an unreliable percentage.

**Are the historical numbers real?**  
No. Seeded observations are clearly marked `SIMULATED_DEMO` so the feature can be demonstrated without claiming access to authentic railway data.

## Limitations
- Academic point-to-point route model only.
- Sample train and station data are fictional.
- Probability observations are simulated and suitable only for demonstrating SQL/statistical logic.
- No integration with IRCTC, payment providers, seat quotas, PNR systems, or live railway APIs.
