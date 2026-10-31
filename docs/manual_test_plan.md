# Manual database and website test plan

Run these tests on a dedicated project database populated with the supplied demo data. Use at least four registered passenger accounts for the queue walkthrough.

| Test | Steps | Expected result |
|---|---|---|
| Register | Create account from the website | A `users` row is created with a bcrypt hash and PASSENGER role |
| Search | Select New Delhi Demo Terminal → Mumbai Demo Central, date 3 days ahead, SLEEPER | Demo schedule 1001 appears with 3 seats initially available |
| Seat reservation | Book the first three tickets from three accounts | Each booking is CONFIRMED with a different seat allocation |
| Waitlist | Book a fourth SLEEPER ticket for schedule 1001 | Booking is WAITLISTED, with queue position 1 |
| Probability | Check probability for the active waitlisted booking | Route/class/position/time history is queried; demo group has enough records for a percentage |
| Automatic promotion | Cancel one of the first three confirmed bookings from its owner's account | Cancellation record stores released seat; database trigger confirms first waiter and allocates the released seat |
| FIFO | Have a fifth account join the waitlist before canceling another confirmed booking | The earliest still-WAITING queue position is promoted first |
| Cancel waiter | Cancel a WAITLISTED booking | Its queue entry becomes CANCELLED and no other booking is promoted because no seat was released |
| Double cancel | Cancel the same booking again | API returns a validation error; no extra cancellation record is created |
| Owner check | Try to cancel another account's booking | API returns a permission error; no data changes |
| No eligible waiter | Cancel a confirmed booking when no one is waiting | The released seat remains available |
| Estimate data threshold | Temporarily test a route/class/position without enough known history | API returns insufficient-data message; no made-up percentage appears |
| Admin role | Promote own account with local make-admin script, sign in again | Admin console shows live MySQL counts |
| Historical finalization | Ensure a demo schedule date is before today and it has waitlist entries, then click **Finalize past outcomes** as admin | Known outcomes are inserted once with `RECORDED_OUTCOME`; remaining waiting entries expire; re-running does not duplicate history |

## Useful SQL for the teacher demonstration

```sql
USE railway_db;
SELECT * FROM bookings ORDER BY booking_id DESC;
SELECT * FROM seat_allocations ORDER BY schedule_id, seat_id;
SELECT * FROM waitlist_entries ORDER BY schedule_id, class_type, queue_position;
SELECT * FROM cancellations ORDER BY cancellation_id DESC;
SELECT * FROM vw_schedule_occupancy ORDER BY journey_date, train_number;
SELECT * FROM vw_probability_outcome_summary ORDER BY route_id, class_type, position_band;
SHOW TRIGGERS;
SHOW PROCEDURE STATUS WHERE Db = 'railway_db';
```

A cancellation test must be performed by the account that owns the confirmed booking; the procedure intentionally enforces ownership.
