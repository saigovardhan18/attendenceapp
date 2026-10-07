#Attendance System

A simple college attendance system where the lecturer generates a unique QR code for an attendance session. Students scan the QR code, enter their roll number and name, and mark their attendance. The lecturer can then see the students who have marked attendance.

## Iteration 1

The goal of Iteration 1 is to build the basic QR-based attendance flow.

### How it works

```text
Lecturer
   ↓
Generate QR
   ↓
Unique Attendance Session
   ↓
Student scans QR
   ↓
Student Web Portal
   ↓
Enter Roll Number + Name
   ↓
Mark Attendance
   ↓
Flask Backend
   ↓
DuckDB Database
   ↓
Lecturer sees attendance
```

## Features

### Lecturer

* Generate a new QR code
* Each QR creates a new attendance session
* View the number of students present
* View students who marked attendance

### Student

* Scan the lecturer's QR code
* Open the student attendance portal
* Enter roll number
* Enter name
* Mark attendance

### Backend

* Flask REST API
* Creates unique attendance sessions
* Validates student information
* Stores attendance in DuckDB
* Connects lecturer and student sides

## Technologies

* HTML
* CSS
* JavaScript
* Python
* Flask
* DuckDB
* QR Code

## Project Structure

```text
attendance-system/
│
├── backend/
│   ├── app.py
│   ├── attendance.duckdb
│   └── requirements.txt
│
├── frontend/
│   ├── student/
│   │   ├── student.html
│   │   ├── student.css
│   │   └── student.js
│   │
│   └── lecturer/
│       ├── lecturer.html
│       ├── lecturer.css
│       └── lecturer.js
│
└── README.md
```

## Requirements

Before running the project, install:

* Python 3.x
* pip
* A web browser
* A phone for testing the QR code

## Installation

Clone the repository:

```bash
git clone <YOUR-GITHUB-REPOSITORY-URL>
cd attendance-system
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
venv\Scripts\activate
```

Install the required packages:

```bash
pip install -r backend/requirements.txt
```

## Running the Backend

Go to the backend folder:

```powershell
cd backend
```

Run Flask:

```powershell
python app.py
```

The backend will run on:

```text
http://127.0.0.1:5000
```

You should see:

```text
Attendance Server Running
```

## Running the Frontend

Open the lecturer page in your browser.

```text
frontend/lecturer/lecturer.html
```

The lecturer can now generate a QR code.

Students can scan the QR code using their phone.

## Important: Testing With a Phone

`127.0.0.1` means **your own computer**.

A phone cannot access your computer using:

```text
http://127.0.0.1:5000
```

If the laptop and phone are connected to the same Wi-Fi, find your laptop's local IP address:

```powershell
ipconfig
```

Look for:

```text
IPv4 Address
```

For example:

```text
192.168.1.10
```

The QR code should then contain:

```text
http://192.168.1.10:5000/student.html?session=YOUR_SESSION_ID
```

The phone can then open the student portal through the laptop.

## Attendance Session

Every time the lecturer clicks **Generate QR**, the backend creates a unique session.

Example:

```text
ATT-20261003-A7F92
```

The QR code contains the student portal URL together with this session ID.

This allows the backend to know which attendance session the student belongs to.

## Database

DuckDB is used to store attendance information.

An attendance record contains information such as:

```text
ID
Roll Number
Name
Date
Time
Status
Session ID
```

Example:

```text
1 | 23 | Rahul | 03/10/2026 | 09:42 AM | PRESENT | ATT-20261003-A7F92
```

## API

### Create Session

```http
POST /api/session/create
```

Creates a new attendance session.

### Mark Attendance

```http
POST /api/attendance
```

Receives student information and records attendance.

### Get Session Attendance

```http
GET /api/session/<session_id>/attendance
```

Returns the students who marked attendance for that session.

## Iteration 1 Scope

The following are intentionally kept outside Iteration 1:

* Student login
* Lecturer authentication
* Face recognition
* Bluetooth attendance
* NFC attendance
* Advanced analytics
* Attendance reports
* Multiple classes
* Automatic timetable integration
* Cloud deployment

The focus is only on making the basic QR attendance workflow work correctly.

## Future Improvements

Possible features for future iterations:

* Lecturer login
* Student accounts
* Attendance history
* Excel/PDF reports
* Attendance percentage
* Multiple classes
* QR expiration
* Cloud database
* Deployment
* Admin dashboard
* Attendance analytics

## Project Goal

The main goal of Iteration 1 is to create a simple attendance system where:

> **Lecturer generates QR → Student scans → Student marks attendance → Lecturer receives attendance**

This provides the basic working foundation for future versions of the project.

# Next Development

After completing Iteration 1, the next goal is to improve the system and make it more practical for real college use.

## Iteration 2

The main focus will be making the attendance process more secure and reliable.

### Planned Features

* **QR Expiration** — The QR code will work only for a limited amount of time.
* **Duplicate Prevention** — A student cannot mark attendance more than once in the same session.
* **Close Attendance** — The lecturer can manually close the attendance session.
* **Better Student Validation** — The system will validate the roll number and name before marking attendance.
* **Improved Dashboard** — The lecturer will be able to see the number of students present and the attendance list clearly.

## After Iteration 2

Once the basic system is stable, the next improvements can include:

* Student and lecturer login
* Attendance history
* Attendance percentage
* Excel/PDF attendance reports
* Multiple subjects and classes
* Real-time attendance updates

## Future Direction

The system can later be extended beyond QR attendance with technologies such as **NFC**, mobile applications, cloud deployment, and other methods of making attendance faster and more secure.

The main approach will be:

> **First make the basic system work properly, then improve it step by step.**

