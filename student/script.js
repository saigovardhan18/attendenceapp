const API_BASE = "";

const form = document.getElementById("attendanceForm");
const rollInput = document.getElementById("roll");
const nameInput = document.getElementById("name");

const rollError = document.getElementById("rollError");
const nameError = document.getElementById("nameError");
const formError = document.getElementById("formError");

const submitBtn = document.getElementById("submitBtn");
const formView = document.getElementById("formView");
const successView = document.getElementById("successView");

const outName = document.getElementById("outName");
const outRoll = document.getElementById("outRoll");
const outDate = document.getElementById("outDate");
const outTime = document.getElementById("outTime");

const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session_id") || "TEST-SESSION";

function clearErrors() {
    rollError.textContent = "";
    nameError.textContent = "";
    formError.textContent = "";
}

function showError(element, message) {
    element.textContent = message;
}

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    clearErrors();

    const roll = rollInput.value.trim();
    const name = nameInput.value.trim();

    if (!roll) {
        showError(rollError, "Enter your roll number.");
        return;
    }

    if (!/^\d+$/.test(roll)) {
        showError(rollError, "Roll number must contain only numbers.");
        return;
    }

    if (Number(roll) < 1 || Number(roll) > 63) {
        showError(rollError, "Roll number must be between 1 and 63.");
        return;
    }

    if (!name) {
        showError(nameError, "Enter your name.");
        return;
    }

    if (name.length < 2) {
        showError(nameError, "Name is too short.");
        return;
    }

    submitBtn.disabled = true;

    const label = submitBtn.querySelector(".btn-label");

    if (label) {
        label.textContent = "MARKING...";
    }

    try {

        const response = await fetch(API_BASE + "/api/attendance", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                session_id: sessionId,
                roll_number: Number(roll),
                name: name
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Could not mark attendance.");
        }

        outName.textContent = data.name;
        outRoll.textContent = data.roll_number;
        outDate.textContent = data.date;
        outTime.textContent = data.time;

        formView.hidden = true;
        successView.hidden = false;

    } catch (error) {

        formError.textContent = error.message;

        submitBtn.disabled = false;

        if (label) {
            label.textContent = "MARK ATTENDANCE";
        }
    }
});