/* =========================================================
   Lecturer page
   1. Settings  2. Attendance data (blank)  3. Login  4. Dashboard  5. QR code
   ========================================================= */

/* ---------- 1. Settings ---------- */
const LECTURER_USERNAME = "lecturer"; // change these, or replace the login check with your backend later
const LECTURER_PASSWORD = "admin123";
const CLASS_SIZE = 63;                // total students in the class

/* ---------- 2. Attendance data (blank for now) ---------- */

// Add records here, or load them from your backend in getRecords() below.
// Each record looks like:
// { roll_number: 1, name: "Student Name", date: "03/10/2026", time: "09:10 AM", status: "PRESENT" }
async function getRecords() {

  const response = await fetch(
    "http://127.0.0.1:5000/api/lecturer/attendance"
  );

  if (!response.ok) {
    throw new Error("Could not load attendance.");
  }

  const data = await response.json();

  return data.records || [];
}

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");
const formatDate = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; // 03/10/2026
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- 3. Login ---------- */

function showView(loggedIn) {
  $("loginView").hidden = loggedIn;
  $("dashView").hidden = !loggedIn;
}

$("togglePw").addEventListener("click", () => {
  const pw = $("password"), show = pw.type === "password";
  pw.type = show ? "text" : "password";
  $("togglePw").textContent = show ? "Hide" : "Show";
});

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = $("username").value.trim(), password = $("password").value;
  const err = $("loginError");
  err.textContent = "";

  if (!username || !password) { err.textContent = "Enter both username and password."; return shake(); }

  $("loginBtn").disabled = true;
  $("loginBtn").classList.add("loading");
  $("loginLabel").textContent = "Signing in...";
  await wait(400);

  if (username === LECTURER_USERNAME && password === LECTURER_PASSWORD) {
    try { sessionStorage.setItem("lecturer_in", "1"); } catch (x) {}
    $("password").value = "";
    openDashboard();
  } else {
    err.textContent = "Incorrect username or password.";
    shake();
  }
  $("loginBtn").disabled = false;
  $("loginBtn").classList.remove("loading");
  $("loginLabel").textContent = "Login";
});

function shake() {
  const c = document.querySelector(".login-card");
  c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake");
}

$("logoutBtn").addEventListener("click", () => {
  try { sessionStorage.removeItem("lecturer_in"); } catch (x) {}
  resetQR();
  showView(false);
});

/* ---------- 4. Dashboard ---------- */

let allRecords = [];

async function openDashboard() {
  showView(true);
  $("todayLabel").textContent = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("statStudents").textContent = CLASS_SIZE;
  $("tableMsg").textContent = "Loading...";
  try {
    allRecords = await getRecords();
  } catch (e) {
    allRecords = [];
    $("tableMsg").textContent = "Could not load attendance records.";
    return;
  }
  const today = formatDate(new Date());
  $("statTotal").textContent = allRecords.length;
  $("statToday").textContent = `${allRecords.filter((r) => r.date === today).length} / ${CLASS_SIZE}`;
  applyFilters();
}

// search + date filter, applied to the loaded records
function applyFilters() {
  const q = $("search").value.trim().toLowerCase();
  const date = $("dateFilter").value; // YYYY-MM-DD
  const [y, m, d] = date ? date.split("-") : [];

  const shown = allRecords.filter((r) =>
    (!q || (/^\d+$/.test(q) ? String(r.roll_number) === q : String(r.name).toLowerCase().includes(q))) &&
    (!date || r.date === `${d}/${m}/${y}`));

  renderRows(shown);
  if (!allRecords.length) $("tableMsg").textContent = "No attendance records yet.";
  else if (!shown.length) $("tableMsg").textContent = "No records match your search.";
}

function renderRows(records) {
  const tbody = $("rows");
  tbody.innerHTML = "";
  const labels = ["Roll No", "Name", "Date", "Time", "Status"];

  records.forEach((r) => {
    const tr = document.createElement("tr");
    [r.roll_number, r.name, r.date, r.time].forEach((val, i) => {
      const td = document.createElement("td");
      td.dataset.label = labels[i];
      td.textContent = val; // textContent keeps student-typed names safe
      tr.appendChild(td);
    });
    const st = document.createElement("td");
    st.dataset.label = labels[4];
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = r.status;
    st.appendChild(pill);
    tr.appendChild(st);
    tbody.appendChild(tr);
  });
  $("tableMsg").textContent = "";
}

let timer;
$("search").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(applyFilters, 250); });
$("dateFilter").addEventListener("change", applyFilters);

$("clearBtn").addEventListener("click", () => {
  clearTimeout(timer);
  $("search").value = "";
  $("dateFilter").value = "";
  applyFilters();
  $("search").focus();
});

// export: downloads a CSV (opens in Excel). Later you can use your backend's /api/attendance/export instead.
$("exportBtn").addEventListener("click", () => {
  if (!allRecords.length) { $("tableMsg").textContent = "Nothing to export yet."; return; }
  const quote = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = ["Roll No,Name,Date,Time,Status",
    ...allRecords.map((r) => [r.roll_number, quote(r.name), r.date, r.time, r.status].join(","))];
  const url = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "attendance.csv";
  document.body.appendChild(link); // some browsers need the link in the page
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* ---------- 5. Attendance QR code (valid for 5 minutes) ---------- */

const QR_MINUTES = 5;

// Address of the student page. Default: the "frontend" folder next to this "lecturer" folder.
// You can also edit it on the page. For phones it must use your computer's IP, not "localhost".
let STUDENT_PAGE_URL = "";
try { STUDENT_PAGE_URL = new URL("../frontend/index.html", location.href).href; } catch (x) {}

let qrTimer = null;
let qrExpiry = 0;

$("qrBase").value = STUDENT_PAGE_URL;

// warn when the address will not work from a phone
function updateQrNote() {
  const v = $("qrBase").value.trim().toLowerCase();
  $("qrNote").hidden = !(v.startsWith("file:") || v.includes("localhost") || v.includes("127.0.0.1"));
}
$("qrBase").addEventListener("input", updateQrNote);
updateQrNote();

function showQrMessage(text) {
  $("qrMsg").textContent = text;
  $("qrMsg").hidden = !text;
}

// draw the QR code as an SVG picture
function drawQR(text) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount(), border = 4;
  let path = "";
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (qr.isDark(r, c)) path += `M${c + border} ${r + border}h1v1h-1z`;
  const size = n + border * 2;
  $("qrBox").innerHTML =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">` +
    `<rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#111827"/></svg>`;
}

function generateQR() {
  const base = $("qrBase").value.trim();
  if (!/^(https?|file):\/\//i.test(base)) {
    resetQR();
    showQrMessage("Enter the full student page address, starting with http://");
    return;
  }
  let url;
  try { url = new URL(base); } catch (x) { resetQR(); showQrMessage("That address is not valid."); return; }

  // the link carries its own expiry time (exp) and a random code (k)
  qrExpiry = Date.now() + QR_MINUTES * 60 * 1000;
  url.searchParams.set("exp", qrExpiry);
  url.searchParams.set("k", Math.random().toString(36).slice(2, 10));

  drawQR(url.href);
  showQrMessage("");
  $("qrBody").hidden = false;
  $("qrBtn").textContent = "Generate New QR Code";
  clearInterval(qrTimer);
  qrTick();
  qrTimer = setInterval(qrTick, 1000);
}

function qrTick() {
  const left = qrExpiry - Date.now();
  if (left <= 0) {
    resetQR();
    showQrMessage("This QR code has expired. Generate a new one.");
    return;
  }
  const secs = Math.ceil(left / 1000);
  $("qrStatus").textContent = `Valid for ${Math.floor(secs / 60)}:${pad(secs % 60)}`;
  $("qrBar").style.width = (left / (QR_MINUTES * 60 * 1000)) * 100 + "%";
  const low = secs <= 60;
  $("qrStatus").classList.toggle("low", low);
  $("qrBar").parentElement.classList.toggle("low", low);
}

// remove the QR code and stop the timer
function resetQR() {
  clearInterval(qrTimer);
  qrExpiry = 0;
  $("qrBody").hidden = true;
  $("qrBox").innerHTML = "";
  $("qrBtn").textContent = "Generate QR Code";
  showQrMessage("");
}

$("qrBtn").addEventListener("click", generateQR);

/* ---------- start ---------- */
let loggedIn = false;
try { loggedIn = sessionStorage.getItem("lecturer_in") === "1"; } catch (x) {}
if (loggedIn) openDashboard(); else showView(false);
