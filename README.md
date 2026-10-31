# 🚆 Railway Reservation Management System

A database-driven Railway Reservation Management System designed to simplify train reservations, passenger management, ticket booking, and waitlist handling.

The project uses **MySQL, SQL triggers, stored procedures, and a web-based interface** to demonstrate real-world database management concepts.

One of its key features is an automated waitlist promotion mechanism combined with a historical-data-based probability estimation system that helps passengers understand their chances of getting a confirmed seat.

---

## 📌 Project Overview

Traditional railway reservation systems manage ticket bookings, cancellations, and waiting lists. However, passengers often have limited information about their chances of getting a confirmed ticket when they are placed on a waiting list.

Our system addresses this problem by introducing:

* Automated waitlist management.
* Automatic promotion of waitlisted passengers when confirmed tickets become available.
* Probability-based confirmation estimation using historical booking data.
* Centralized management of trains, passengers, bookings, and reservations.

The primary objective is to demonstrate how database concepts can be applied to build a practical railway reservation system.

---

## ✨ Key Features

### 1. User and Passenger Management

* Passenger registration and management.
* Storage of passenger details.
* Management of booking information.

### 2. Train Management

* Train information management.
* Train schedules and route details.
* Seat availability management.

### 3. Ticket Reservation

* Book railway tickets.
* Generate booking records.
* Maintain reservation details.
* Track booking status.

### 4. Automated Waitlist Management

* Passengers are automatically added to the waiting list when confirmed seats are unavailable.
* Each waitlisted passenger receives a waiting-list position.
* When a confirmed booking is cancelled, the database trigger automatically promotes the next eligible passenger.
* The booking status is updated automatically.

### 5. Waitlist Confirmation Probability

An additional feature that estimates the probability of a waitlisted passenger receiving a confirmed seat.

* Uses historical booking and cancellation records.
* Analyzes previous waitlist confirmation outcomes.
* Provides an estimated confirmation probability.
* Helps passengers make more informed booking decisions.

**Note:** The probability is an estimate based on historical data and is not a guarantee of confirmation.

---

## 🛠️ Technologies Used

| Technology            | Purpose                            |
| --------------------- | ---------------------------------- |
| HTML, CSS, JavaScript | Frontend development               |
| React / Vite          | Frontend framework and development |
| Node.js               | Backend runtime                    |
| Express.js            | Backend API                        |
| MySQL 8.0             | Database management                |
| SQL                   | Database queries and operations    |
| Stored Procedures     | Reusable database operations       |
| SQL Triggers          | Automated waitlist management      |
| Git & GitHub          | Version control and collaboration  |

---

## 📂 Project Structure

```text
Railway-Reservation-System/
│
├── backend/
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── index.js
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── main.jsx
│
├── database/
│   ├── 01_schema.sql
│   ├── 02_constraints_and_indexes.sql
│   ├── 03_stored_procedures.sql
│   ├── 04_triggers.sql
│   ├── 05_views_and_reports.sql
│   ├── 06_seed_data.sql
│   └── 07_probability_history.sql
│
├── docs/
│   └── viva_guide_and_project_report.md
│
├── README.md
└── .gitignore
```

---

## 🗄️ Database Implementation

The project uses MySQL as its relational database management system.

The database is responsible for maintaining relationships between passengers, trains, reservations, bookings, and waitlist records.

### Important Database Concepts Implemented

**1. Primary Keys and Foreign Keys**

* Maintain relationships between different tables.
* Ensure referential integrity.

**2. Constraints**

* Maintain data accuracy.
* Prevent invalid database entries.

**3. Stored Procedures**

* Implement reusable database operations.
* Simplify booking and reservation-related operations.

**4. Triggers**

* Automate database operations.
* Handle waitlist promotion after ticket cancellation.

**5. Views**

* Simplify access to frequently required information.
* Generate useful booking and reservation reports.

**6. Indexes**

* Improve query performance.
* Optimize database searching operations.

---

## ⚙️ How the Waitlist System Works

The automated waitlist mechanism follows this process:

1. A passenger requests a ticket.
2. If a confirmed seat is available, the booking is confirmed.
3. If no confirmed seat is available, the passenger is added to the waiting list.
4. When a confirmed ticket is cancelled, a database trigger is activated.
5. The trigger identifies the next eligible passenger in the waiting list.
6. The passenger's booking status is updated.
7. The available seat is assigned according to the waitlist order.

This process reduces the need for manual waitlist management.

---

## 📊 Probability-Based Confirmation Estimation

The system introduces a historical-data-based approach to estimate waitlist confirmation chances.

It uses previously recorded booking, cancellation, and waitlist outcomes to calculate an estimated probability.

The purpose is to provide passengers with additional information about their waiting-list status.

Unlike a traditional waitlist system, this feature introduces a predictive element into the reservation process.

---

## 🚀 Installation and Setup

Follow these steps to run the project locally.

### Prerequisites

Make sure you have installed:

* Node.js
* npm
* MySQL Server 8.0 or later
* Visual Studio Code
* Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Railway-Reservation-System.git
```

Navigate into the project:

```bash
cd Railway-Reservation-System
```

### Step 2: Set Up the Database

1. Open MySQL Workbench or MySQL Command Line.
2. Execute the SQL files inside the `database` folder in the appropriate order.
3. Verify that the database and tables have been created successfully.

Recommended execution order:

1. `01_schema.sql`
2. `02_constraints_and_indexes.sql`
3. `03_stored_procedures.sql`
4. `04_triggers.sql`
5. `05_views_and_reports.sql`
6. `06_seed_data.sql`
7. `07_probability_history.sql`

### Step 3: Configure the Backend

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Configure your database credentials using the `.env.example` file.

Create your local `.env` file and provide the required configuration.

**Never upload your actual `.env` file or database passwords to GitHub.**

### Step 4: Start the Backend

Run the development command configured in the backend's `package.json`.

### Step 5: Configure the Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal to access the application.

---

## 🎯 Project Objectives

* Develop a database-driven railway reservation system.
* Implement efficient passenger and train management.
* Automate ticket cancellation and waitlist promotion using SQL triggers.
* Demonstrate stored procedures, constraints, views, and indexing.
* Introduce historical-data-based waitlist confirmation estimation.
* Apply database management concepts to a practical real-world problem.

---

## 🔮 Future Scope

The system can be further improved by introducing:

* Real-time train tracking.
* Online payment gateway integration.
* Email and SMS booking notifications.
* More advanced prediction models.
* Improved passenger dashboards.
* Advanced analytics and reservation reports.

---

## 👨‍💻 Contributors

**Developed as a Database Management System (DBMS) academic project.**

Team Members:

* Member 1 – [Name]
* Member 2 – [Name]
* Member 3 – [Name]
* Member 4 – [Name]

Institution: Netaji Subhas University of Technology (NSUT)

---

## 📚 Academic Context

This project was developed to demonstrate the practical implementation of Database Management System concepts, including:

* Relational Database Design
* Entity Relationship Modelling
* SQL Queries
* Database Constraints
* Stored Procedures
* Triggers
* Views
* Indexing
* Transaction Management

---

⭐ If you find this project interesting, feel free to explore the repository!
