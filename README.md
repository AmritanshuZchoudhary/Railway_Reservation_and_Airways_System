# Railway+ — Railway Reservation System

A full-stack undergraduate DBMS project demonstrating railway journey search, seat reservation, FIFO waitlist handling, automatic waitlist promotion through a MySQL trigger, and historical waitlist confirmation probability estimates.

> **Academic scope:** route names, train names, schedules, fares, and historical observations in the seed data are fictional demonstration records. This is not connected to IRCTC or any real railway service. Probability estimates are empirical demonstrations, not official predictions.

## Technology

- **Database:** MySQL Community Server 8.0.46+
- **SQL client:** MySQL Workbench 8.0 CE
- **Backend:** Node.js, Express, mysql2, JWT, bcrypt
- **Frontend:** React, Vite, React Router, Axios
- **Collaboration:** Git and GitHub

## Main features

- Passenger registration/login with bcrypt password hashing and JWT sessions.
- Train/schedule search by origin, destination, journey date, and class.
- Live seat availability calculated from MySQL seat allocations.
- Stored procedure for transaction-safe booking; full classes create FIFO waitlist entries.
- Stored procedure for cancellation; an `AFTER INSERT` trigger promotes the next eligible waiting booking and allocates the released seat in the same transaction.
- Booking history, cancellation records, and an administrator metrics page.
- Historical confirmation estimate based on comparable route/class/position/lead-time buckets, with a 20-outcome minimum and fallback comparison groups.
- Reporting views, a guarded admin action to finalize waitlist outcomes for past journeys, and commented DCL examples.

## Prerequisites

1. MySQL Community Server 8.0.46 or compatible MySQL 8.0 release, running locally on port `3306`.
2. MySQL Workbench 8.0 CE.
3. Node.js 22 LTS (or a supported Node.js version compatible with the installed Vite version) and npm.
4. Git (recommended for team collaboration).

PHP and XAMPP are not required.

## 1. Create the database in MySQL Workbench

Open MySQL Workbench and connect to your local MySQL server. Open each file from the `database/` directory and execute them **in this order**:

1. `01_schema.sql`
2. `02_constraints_and_indexes.sql`
3. `03_stored_procedures.sql`
4. `04_triggers.sql`
5. `05_views_and_reports.sql`
6. `06_seed_data.sql`
7. `07_probability_history.sql`

`08_dcl_permissions.sql` contains DCL examples commented out for safety. If your teacher asks you to demonstrate DCL, replace the sample password, uncomment the commands, and run them using a database administrator account. Do not commit any customized password.

The schema file creates `railway_db`. If you already made an empty database with this name, that is fine. The seed data provides fictional stations, trains, routes, future schedules, and seats. The probability-history file creates synthetic rows and replaces only prior synthetic rows on re-run.

**Do not run these scripts against a database that contains unrelated data.** The demo data uses fixed sample IDs so the walkthrough is repeatable on a fresh project database.

## 2. Configure the backend

Open a terminal in VS Code:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Open `backend/.env` and replace the values, especially `DB_PASSWORD` and `JWT_SECRET`.

Example shape (use your own local values):

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=railway_db
DB_USER=railway_app
DB_PASSWORD=the_password_you_chose_for_railway_app
JWT_SECRET=put_a_random_secret_of_32_or_more_characters_here
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

Because you have a working Workbench session but may not remember the saved root password, create a dedicated database account directly from a new SQL tab in Workbench after the database schema has been created. Example (replace the password with your own unique value):

```sql
CREATE USER 'railway_app'@'localhost' IDENTIFIED BY 'choose_a_unique_strong_password';
CREATE USER 'railway_app'@'127.0.0.1' IDENTIFIED BY 'choose_a_unique_strong_password';
GRANT ALL PRIVILEGES ON railway_db.* TO 'railway_app'@'localhost';
GRANT ALL PRIVILEGES ON railway_db.* TO 'railway_app'@'127.0.0.1';
```

Then set `DB_USER=railway_app` and `DB_PASSWORD` to that exact password in `backend/.env`. This avoids putting your root password in the application configuration. Never upload `.env` to GitHub.

Start the API:

```powershell
npm run dev
```

The API runs at `http://localhost:5000`. Check its database connection at `http://localhost:5000/api/health`.

## 3. Configure the frontend

Open a **second** VS Code terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the Express backend on port 5000.

## 4. First run and admin access

1. Open the website and create an account from **Create account**.
2. You can use the passenger features immediately.
3. To make your own account an admin for a local teacher demonstration, stop at the backend terminal, open a new terminal in `backend/`, and run:

```powershell
npm run make-admin -- your_registered_email@example.com
```

4. Sign out and sign back in. The Admin console will then appear.

The script changes only the role of the matching account. Keep it a local development/admin utility; do not expose this operation through a public API.

## 5. Suggested teacher demo (5–7 minutes)

1. Register/login and show the Overview dashboard.
2. Search `New Delhi Demo Terminal` → `Mumbai Demo Central`, choose the date three days ahead, and select `Sleeper`.
3. The seeded journey has **three sleeper seats**. Book using enough separate passenger accounts to fill the three seats, then attempt a fourth booking. The fourth becomes waitlisted.
4. Sign in as an account that owns a confirmed booking and cancel it. The database procedure records the cancellation; the trigger promotes the next eligible waiter and reuses the released seat.
5. Show that the newly promoted booking is confirmed and the seat allocation is present in MySQL Workbench.
6. Show the waitlist estimate for a waitlisted booking when one exists. It is calculated from rows in `waitlist_probability_history`, not hardcoded in React.
7. Open MySQL Workbench to show `bookings`, `seat_allocations`, `waitlist_entries`, `cancellations`, and the trigger/procedure definitions.
8. If using an admin account, show the Admin console's live metrics. The **Finalize past outcomes** action records known outcomes only for journeys with dates before today; it is safe to click again because each source booking is recorded at most once.

The waitlist demo requires different passenger accounts because each account can cancel only its own bookings. Do not try to cancel another user's booking to demonstrate promotion.

## Probability methodology

The estimator counts historical rows with final outcomes `CONFIRMED` and `NOT_CONFIRMED`; it excludes `PASSENGER_CANCELLED`. It first compares the same route, class, waitlist-position band, and days-remaining band. If fewer than 20 observations are available, it broadens to the same route/class/position band across all lead times, then to the same class/position band across routes. If no comparison reaches 20 outcomes, the API returns an insufficient-data message.

`estimated probability = confirmed comparable outcomes / all known comparable outcomes × 100`

The seed values are simulated to exercise the feature. An administrator can record known outcomes after a journey date has passed through the Admin console's **Finalize past outcomes** action; the database stores a unique source-booking ID so the operation does not duplicate outcomes. Do not present synthetic rows as real railway statistics. An individual booking is not guaranteed to confirm even when similar historical cases often did.

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | API and database health |
| POST | `/api/auth/register` | Register passenger |
| POST | `/api/auth/login` | Authenticate |
| GET | `/api/auth/me` | Current account |
| GET | `/api/stations` | Station list |
| GET | `/api/schedules/search` | Search schedules |
| GET | `/api/bookings/my` | Current user's bookings |
| POST | `/api/bookings/create` | Create booking / waitlist entry |
| POST | `/api/bookings/cancel` | Cancel own booking and trigger promotion |
| GET | `/api/dashboard/summary` | Passenger's booking counts |
| GET | `/api/dashboard/admin/summary` | Admin metrics (admin only) |
| POST | `/api/dashboard/admin/finalize-history` | Record known outcomes for past waitlist journeys (admin only) |
| GET | `/api/probability?booking_id=123` | Historical estimate for own active waitlisted booking |

All routes other than health, register, and login require a Bearer token.

## GitHub team workflow

- Commit and push the source files, SQL scripts, and documentation.
- Do **not** commit `backend/.env`, passwords, JWT secrets, `node_modules`, or build output.
- Each teammate installs dependencies locally, creates their own `backend/.env`, and imports the shared SQL scripts into their own MySQL server.
- Pull schema changes before coding against them. Keep one shared schema and do not rename columns independently.
- Avoid editing the same file simultaneously; use small branches or coordinate before merging.

## Notes and limitations

- This is a single origin-to-destination route model. It does not implement seat reuse across intermediate segments or real railway quotas.
- Seats are assigned for one schedule and class; constraints prevent two active allocations for the same seat and schedule.
- Seed routes, fares, station/train names, and historical observations are fictional.
- MySQL stored procedures own booking/cancellation transactions. The trigger participates in the cancellation transaction; it must not start/commit its own transaction.
- Always test the SQL scripts on a fresh `railway_db` before the lab demonstration.
