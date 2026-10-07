from flask import Flask, request, jsonify, send_from_directory, send_file
import duckdb
from datetime import datetime
import secrets
import os
import io
import csv

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
LECTURER_DIR = os.path.join(FRONTEND_DIR, "lecturer")
STUDENT_DIR = os.path.join(FRONTEND_DIR, "student")

DB_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "attendance.duckdb"
)


def get_db():
    con = duckdb.connect(DB_PATH)

    tables = con.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_name = 'attendance'
    """).fetchall()

    if not tables:
        con.execute("""
            CREATE TABLE attendance (
                id INTEGER,
                session_id VARCHAR,
                roll_number INTEGER,
                name VARCHAR,
                date VARCHAR,
                time VARCHAR,
                status VARCHAR
            )
        """)
    else:
        columns = con.execute(
            "PRAGMA table_info('attendance')"
        ).fetchall()

        column_names = [row[1] for row in columns]

        if "session_id" not in column_names:
            con.execute(
                "ALTER TABLE attendance ADD COLUMN session_id VARCHAR"
            )

        if "roll_number" not in column_names:
            con.execute(
                "ALTER TABLE attendance ADD COLUMN roll_number INTEGER"
            )

        if "name" not in column_names:
            con.execute(
                "ALTER TABLE attendance ADD COLUMN name VARCHAR"
            )

        if "date" not in column_names:
            con.execute(
                "ALTER TABLE attendance ADD COLUMN date VARCHAR"
            )

        if "time" not in column_names:
            con.execute(
                "ALTER TABLE attendance ADD COLUMN time VARCHAR"
            )

        if "status" not in column_names:
            con.execute(
                "ALTER TABLE attendance ADD COLUMN status VARCHAR"
            )

        columns = con.execute(
            "PRAGMA table_info('attendance')"
        ).fetchall()

        session_column = None

        for column in columns:
            if column[1] == "session_id":
                session_column = column
                break

        if session_column and "VARCHAR" not in session_column[2].upper():
            try:
                con.execute("""
                    ALTER TABLE attendance
                    ALTER COLUMN session_id SET DATA TYPE VARCHAR
                """)
            except:
                pass

    con.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id VARCHAR PRIMARY KEY,
            created_at VARCHAR
        )
    """)

    return con


@app.route("/")
def home():
    return "Attendance Server Running"


# =========================
# LECTURER FRONTEND
# =========================

@app.route("/lecturer")
def lecturer_page():
    return send_from_directory(
        LECTURER_DIR,
        "lecturer-run.html"
    )


@app.route("/lecturer/<path:filename>")
def lecturer_files(filename):
    return send_from_directory(
        LECTURER_DIR,
        filename
    )


# =========================
# STUDENT FRONTEND
# =========================

@app.route("/student")
def student_page():
    return send_from_directory(
        STUDENT_DIR,
        "index for nftattendence.html"
    )


@app.route("/student/<path:filename>")
def student_files(filename):
    return send_from_directory(
        STUDENT_DIR,
        filename
    )


# Keep old filenames working
@app.route("/css for attendece using nft.css")
def old_css():
    return send_from_directory(
        STUDENT_DIR,
        "style.css"
    )


@app.route("/js for nft usingattendence.js")
def old_js():
    return send_from_directory(
        STUDENT_DIR,
        "script.js"
    )


# =========================
# CREATE ATTENDANCE SESSION
# =========================

@app.route("/api/session/create", methods=["POST"])
def create_session():

    session_id = (
        "ATT-"
        + datetime.now().strftime("%Y%m%d")
        + "-"
        + secrets.token_hex(4).upper()
    )

    con = get_db()

    con.execute(
        """
        INSERT INTO sessions
        (session_id, created_at)
        VALUES (?, ?)
        """,
        [
            session_id,
            datetime.now().isoformat()
        ]
    )

    con.close()

    return jsonify({
        "success": True,
        "session_id": session_id
    })


# =========================
# MARK ATTENDANCE
# =========================

@app.route("/api/attendance", methods=["POST"])
def mark_attendance():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "message": "No data received"
        }), 400

    session_id = str(
        data.get("session_id", "")
    ).strip()

    name = str(
        data.get("name", "")
    ).strip()

    roll_number = data.get("roll_number")

    if not session_id:
        return jsonify({
            "success": False,
            "message": "Session ID is required"
        }), 400

    try:
        roll_number = int(roll_number)
    except:
        return jsonify({
            "success": False,
            "message": "Roll number must be a number"
        }), 400

    if roll_number < 1 or roll_number > 63:
        return jsonify({
            "success": False,
            "message": "Roll number must be between 1 and 63"
        }), 400

    if len(name) < 2:
        return jsonify({
            "success": False,
            "message": "Name is too short"
        }), 400

    con = get_db()

    # Allow test session
    if session_id != "TEST-SESSION":

        session = con.execute(
            """
            SELECT session_id
            FROM sessions
            WHERE session_id = ?
            """,
            [session_id]
        ).fetchone()

        if not session:
            con.close()

            return jsonify({
                "success": False,
                "message": "Invalid attendance session"
            }), 400

    existing = con.execute(
        """
        SELECT id
        FROM attendance
        WHERE session_id = ?
        AND roll_number = ?
        """,
        [
            session_id,
            roll_number
        ]
    ).fetchone()

    if existing:
        con.close()

        return jsonify({
            "success": False,
            "message": "Attendance already marked"
        }), 400

    now = datetime.now()

    date = now.strftime("%Y-%m-%d")
    time = now.strftime("%I:%M:%S %p")

    result = con.execute(
        """
        SELECT COALESCE(MAX(id), 0) + 1
        FROM attendance
        """
    ).fetchone()

    new_id = result[0]

    con.execute(
        """
        INSERT INTO attendance
        (
            id,
            session_id,
            roll_number,
            name,
            date,
            time,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        [
            new_id,
            session_id,
            roll_number,
            name,
            date,
            time,
            "PRESENT"
        ]
    )

    con.close()

    return jsonify({
        "success": True,
        "message": "Attendance marked successfully",
        "roll_number": roll_number,
        "name": name,
        "date": date,
        "time": time,
        "status": "PRESENT"
    })


# =========================
# SESSION ATTENDANCE
# =========================

@app.route(
    "/api/session/<session_id>/attendance",
    methods=["GET"]
)
def session_attendance(session_id):

    con = get_db()

    rows = con.execute(
        """
        SELECT
            roll_number,
            name,
            date,
            time,
            status
        FROM attendance
        WHERE session_id = ?
        ORDER BY roll_number
        """,
        [session_id]
    ).fetchall()

    con.close()

    students = []

    for row in rows:

        students.append({
            "roll_number": row[0],
            "name": row[1],
            "date": row[2],
            "time": row[3],
            "status": row[4]
        })

    return jsonify({
        "success": True,
        "count": len(students),
        "students": students
    })


# =========================
# LECTURER LOGIN
# =========================

@app.route(
    "/api/lecturer/login",
    methods=["POST"]
)
def lecturer_login():

    data = request.get_json(silent=True) or {}

    username = data.get("username")
    password = data.get("password")

    if username == "lecturer" and password == "admin123":

        return jsonify({
            "success": True,
            "token": "lecturer-local-token"
        })

    return jsonify({
        "success": False,
        "error": "Incorrect username or password."
    }), 401


# =========================
# LECTURER STATS
# =========================

@app.route("/api/lecturer/stats")
def lecturer_stats():

    con = get_db()

    total_records = con.execute(
        """
        SELECT COUNT(*)
        FROM attendance
        """
    ).fetchone()[0]

    today = datetime.now().strftime("%Y-%m-%d")

    present_today = con.execute(
        """
        SELECT COUNT(*)
        FROM attendance
        WHERE date = ?
        """,
        [today]
    ).fetchone()[0]

    con.close()

    return jsonify({
        "total_records": total_records,
        "present_today": present_today
    })


# =========================
# LECTURER ATTENDANCE
# =========================

@app.route("/api/lecturer/attendance")
def lecturer_attendance():

    search = request.args.get(
        "search",
        ""
    ).strip().lower()

    date = request.args.get(
        "date",
        ""
    ).strip()

    con = get_db()

    if search and date:

        rows = con.execute(
            """
            SELECT
                roll_number,
                name,
                date,
                time,
                status
            FROM attendance
            WHERE date = ?
            AND (
                CAST(roll_number AS VARCHAR) = ?
                OR LOWER(name) LIKE ?
            )
            ORDER BY time DESC
            """,
            [
                date,
                search,
                "%" + search + "%"
            ]
        ).fetchall()

    elif search:

        rows = con.execute(
            """
            SELECT
                roll_number,
                name,
                date,
                time,
                status
            FROM attendance
            WHERE
                CAST(roll_number AS VARCHAR) = ?
                OR LOWER(name) LIKE ?
            ORDER BY date DESC, time DESC
            """,
            [
                search,
                "%" + search + "%"
            ]
        ).fetchall()

    elif date:

        rows = con.execute(
            """
            SELECT
                roll_number,
                name,
                date,
                time,
                status
            FROM attendance
            WHERE date = ?
            ORDER BY time DESC
            """,
            [date]
        ).fetchall()

    else:

        rows = con.execute(
            """
            SELECT
                roll_number,
                name,
                date,
                time,
                status
            FROM attendance
            ORDER BY date DESC, time DESC
            """
        ).fetchall()

    con.close()

    records = []

    for row in rows:

        try:
            formatted_date = datetime.strptime(
                str(row[2]),
                "%Y-%m-%d"
            ).strftime("%d/%m/%Y")
        except:
            formatted_date = str(row[2])

        records.append({
            "roll_number": row[0],
            "name": row[1],
            "date": formatted_date,
            "time": row[3],
            "status": row[4]
        })

    return jsonify({
        "records": records
    })


# =========================
# ATTENDANCE BY DATE
# =========================

@app.route(
    "/api/attendance/date/<date>",
    methods=["GET"]
)
def attendance_by_date(date):

    con = get_db()

    rows = con.execute(
        """
        SELECT
            roll_number,
            name,
            date,
            time,
            status,
            session_id
        FROM attendance
        WHERE date = ?
        ORDER BY time
        """,
        [date]
    ).fetchall()

    con.close()

    students = []

    for row in rows:

        students.append({
            "roll_number": row[0],
            "name": row[1],
            "date": row[2],
            "time": row[3],
            "status": row[4],
            "session_id": row[5]
        })

    return jsonify({
        "success": True,
        "count": len(students),
        "students": students
    })


# =========================
# EXPORT ATTENDANCE
# =========================

@app.route("/api/attendance/export")
def export_attendance():

    con = get_db()

    rows = con.execute(
        """
        SELECT
            roll_number,
            name,
            date,
            time,
            status,
            session_id
        FROM attendance
        ORDER BY date DESC, time DESC
        """
    ).fetchall()

    con.close()

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "Roll Number",
        "Name",
        "Date",
        "Time",
        "Status",
        "Session ID"
    ])

    writer.writerows(rows)

    file_data = io.BytesIO(
        output.getvalue().encode("utf-8-sig")
    )

    return send_file(
        file_data,
        mimetype="text/csv",
        as_attachment=True,
        download_name="attendance.csv"
    )


# =========================
# START SERVER
# =========================

if __name__ == "__main__":

    con = get_db()
    con.close()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
