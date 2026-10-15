const doctors = [
  {
    id: "d1",
    name: "Dr. Ananya Rao",
    specialty: "Cardiology",
    experience: "12 years experience",
    availability: "Mon – Fri",
    initials: "AR",
    color: ""
  },
  {
    id: "d2",
    name: "Dr. Rohan Mehta",
    specialty: "Dermatology",
    experience: "9 years experience",
    availability: "Mon – Sat",
    initials: "RM",
    color: "pink"
  },
  {
    id: "d3",
    name: "Dr. Priya Nair",
    specialty: "Pediatrics",
    experience: "10 years experience",
    availability: "Mon – Fri",
    initials: "PN",
    color: "blue"
  },
  {
    id: "d4",
    name: "Dr. Vikram Shah",
    specialty: "Orthopedics",
    experience: "15 years experience",
    availability: "Tue – Sat",
    initials: "VS",
    color: "yellow"
  },
  {
    id: "d5",
    name: "Dr. Sana Iqbal",
    specialty: "Neurology",
    experience: "8 years experience",
    availability: "Mon – Fri",
    initials: "SI",
    color: "pink"
  },
  {
    id: "d6",
    name: "Dr. Arjun Das",
    specialty: "General Medicine",
    experience: "11 years experience",
    availability: "Mon – Sat",
    initials: "AD",
    color: "blue"
  }
];

const TIMES = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM"
];

const STORAGE_KEY = "carepoint_appointments_v1";

const $ = (selector) => document.querySelector(selector);

const doctorGrid = $("#doctorGrid");
const specialtyFilter = $("#specialtyFilter");
const doctorSelect = $("#doctorSelect");
const dateInput = $("#appointmentDate");
const timeSelect = $("#appointmentTime");
const form = $("#appointmentForm");
const formAlert = $("#formAlert");
const successPanel = $("#successPanel");
const adminSection = $("#adminSection");

let appointments = loadAppointments();

// Load saved appointments from this browser
function loadAppointments() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Save appointments in browser storage
function saveAppointments() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(appointments)
  );
}

// Escape user-entered text before displaying it as HTML
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

// Get today's date in local time
function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Format date for display
function prettyDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
}

// Find a doctor using their ID
function getDoctor(id) {
  return doctors.find((doctor) => doctor.id === id);
}

// Check whether a doctor/date/time slot is already booked
function bookedFor(doctorId, date, time, excludeId = null) {
  return appointments.some((item) =>
    item.doctorId === doctorId &&
    item.date === date &&
    item.time === time &&
    item.id !== excludeId
  );
}

// Populate specialization and doctor dropdowns
function populateFilters() {
  const specialties = [
    ...new Set(doctors.map((doctor) => doctor.specialty))
  ].sort();

  specialties.forEach((specialty) => {
    const option = document.createElement("option");

    option.value = specialty;
    option.textContent = specialty;

    specialtyFilter.append(option);
  });

  doctors.forEach((doctor) => {
    const option = document.createElement("option");

    option.value = doctor.id;
    option.textContent =
      `${doctor.name} — ${doctor.specialty}`;

    doctorSelect.append(option);
  });
}

// Display doctor cards
function renderDoctors() {
  const chosen = specialtyFilter.value;

  const filtered = doctors.filter((doctor) =>
    chosen === "all" || doctor.specialty === chosen
  );

  doctorGrid.innerHTML = filtered.map((doctor) => `
    <div class="col-md-6 col-xl-4">
      <article class="doctor-card">

        <div class="doctor-top">
          <div class="doctor-avatar ${doctor.color}">
            ${escapeHTML(doctor.initials)}
          </div>

          <div>
            <h3>${escapeHTML(doctor.name)}</h3>
            <div class="doctor-specialty">
              ${escapeHTML(doctor.specialty)}
            </div>
          </div>
        </div>

        <div class="doctor-meta">
          <span>✦ Experience</span>
          <strong>${escapeHTML(doctor.experience)}</strong>
        </div>

        <div class="doctor-meta">
          <span>◷ Clinic hours</span>
          <strong>${escapeHTML(doctor.availability)}</strong>
        </div>

        <button
          class="btn btn-primary rounded-pill w-100"
          data-book-doctor="${doctor.id}">
          Book appointment →
        </button>

      </article>
    </div>
  `).join("");

  $("#noDoctors").classList.toggle(
    "d-none",
    filtered.length > 0
  );
}

// Refresh available time slots when doctor/date changes
function refreshTimeSlots() {
  const doctorId = doctorSelect.value;
  const date = dateInput.value;

  timeSelect.innerHTML = "";

  if (!doctorId || !date) {
    timeSelect.add(
      new Option("Choose a doctor and date first", "")
    );

    timeSelect.disabled = true;
    return;
  }

  if (date < localDateString()) {
    timeSelect.add(
      new Option("Choose a valid future date", "")
    );

    timeSelect.disabled = true;
    return;
  }

  const available = TIMES.filter((time) =>
    !bookedFor(doctorId, date, time)
  );

  timeSelect.disabled = false;

  if (available.length === 0) {
    timeSelect.add(
      new Option(
        "No slots available — choose another date",
        ""
      )
    );

    timeSelect.disabled = true;
    return;
  }

  timeSelect.add(
    new Option("Select an available time", "")
  );

  available.forEach((time) => {
    timeSelect.add(new Option(time, time));
  });
}

// Validate individual fields
function showFieldValidity(field) {
  if (field === dateInput) {
    field.setCustomValidity(
      field.value && field.value < localDateString()
        ? "Choose today or a future date."
        : ""
    );
  }

  field.classList.toggle(
    "is-invalid",
    !field.checkValidity()
  );

  field.classList.toggle(
    "is-valid",
    field.checkValidity() && Boolean(field.value)
  );
}

// Display a Bootstrap notification
function showToast(message) {
  $("#toastMessage").textContent = message;

  bootstrap.Toast.getOrCreateInstance(
    $("#appToast"),
    { delay: 3000 }
  ).show();
}

// Display all appointments in the admin dashboard
function renderAdmin() {
  const today = localDateString();

  $("#totalCount").textContent = appointments.length;

  $("#upcomingCount").textContent =
    appointments.filter((item) => item.date >= today).length;

  $("#adminDoctorCount").textContent = doctors.length;

  const table = $("#appointmentsTable");

  const sorted = [...appointments].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
  );

  table.innerHTML = sorted.map((item) => {
    const doctor = getDoctor(item.doctorId);
    const isPast = item.date < today;

    return `
      <tr>
        <td>
          <strong>${escapeHTML(item.name)}</strong><br>
          <small class="text-secondary">
            ${escapeHTML(item.email)}<br>
            ${escapeHTML(item.phone)}
          </small>
        </td>

        <td>${escapeHTML(
          doctor ? doctor.name : "Unknown doctor"
        )}</td>

        <td>${escapeHTML(
          doctor ? doctor.specialty : "—"
        )}</td>

        <td>
          ${escapeHTML(prettyDate(item.date))}<br>
          <small class="text-secondary">
            ${escapeHTML(item.time)}
          </small>
        </td>

        <td>
          <span class="status-badge ${isPast ? "past" : ""}">
            ${isPast ? "Past" : "Confirmed"}
          </span>
        </td>

        <td>
          <button
            class="btn btn-sm btn-outline-danger rounded-pill"
            data-cancel="${escapeHTML(item.id)}">
            Cancel
          </button>
        </td>
      </tr>
    `;
  }).join("");

  $("#noAppointments").classList.toggle(
    "d-none",
    appointments.length > 0
  );
}

// Show/hide admin dashboard
function toggleAdmin() {
  adminSection.classList.toggle("d-none");

  if (!adminSection.classList.contains("d-none")) {
    renderAdmin();

    adminSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

// Reset the booking form
function resetBookingForm() {
  form.reset();

  form.classList.remove("was-validated");

  form.querySelectorAll(".is-valid, .is-invalid")
    .forEach((element) => {
      element.classList.remove("is-valid", "is-invalid");
    });

  $("#reasonCount").textContent = "0";
  formAlert.classList.add("d-none");

  successPanel.classList.add("d-none");
  form.classList.remove("d-none");

  dateInput.min = localDateString();

  refreshTimeSlots();
}

// Initial setup
populateFilters();

dateInput.min = localDateString();

renderDoctors();
renderAdmin();

// Filter doctors by specialization
specialtyFilter.addEventListener("change", renderDoctors);

// Select a doctor from their card
doctorGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-book-doctor]");

  if (!button) return;

  doctorSelect.value = button.dataset.bookDoctor;

  refreshTimeSlots();

  $("#booking").scrollIntoView({
    behavior: "smooth"
  });

  doctorSelect.focus({ preventScroll: true });
});

// Update available slots
doctorSelect.addEventListener("change", refreshTimeSlots);

dateInput.addEventListener("change", () => {
  showFieldValidity(dateInput);
  refreshTimeSlots();
});

timeSelect.addEventListener("change", () => {
  showFieldValidity(timeSelect);
});

// Real-time name validation
$("#patientName").addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/\s{2,}/g, " ");
  showFieldValidity(event.target);
});

// Real-time email validation
$("#patientEmail").addEventListener("input", (event) => {
  showFieldValidity(event.target);
});

// Allow only 10 digits in phone number
$("#patientPhone").addEventListener("input", (event) => {
  event.target.value = event.target.value
    .replace(/\D/g, "")
    .slice(0, 10);

  showFieldValidity(event.target);
});

// Reason character counter
$("#reason").addEventListener("input", (event) => {
  $("#reasonCount").textContent = event.target.value.length;
});

// Validate required fields when the user leaves them
form.querySelectorAll("input[required], select[required]")
  .forEach((field) => {
    field.addEventListener("blur", () => {
      showFieldValidity(field);
    });
  });

// Handle appointment submission
form.addEventListener("submit", (event) => {
  event.preventDefault();

  formAlert.classList.add("d-none");

  const requiredFields = [
    $("#patientName"),
    $("#patientEmail"),
    $("#patientPhone"),
    doctorSelect,
    dateInput,
    timeSelect
  ];

  requiredFields.forEach(showFieldValidity);

  if (
    !form.checkValidity() ||
    requiredFields.some((field) => !field.value)
  ) {
    form.classList.add("was-validated");

    formAlert.textContent =
      "Please check the highlighted fields and complete the form.";

    formAlert.classList.remove("d-none");

    requiredFields.find(
      (field) => !field.checkValidity() || !field.value
    )?.focus();

    return;
  }

  if (dateInput.value < localDateString()) {
    formAlert.textContent =
      "Past dates cannot be booked. Please choose today or a future date.";

    formAlert.classList.remove("d-none");
    return;
  }

  // Recheck before saving to prevent duplicate slots
  if (
    bookedFor(
      doctorSelect.value,
      dateInput.value,
      timeSelect.value
    )
  ) {
    formAlert.textContent =
      "That slot has just been booked. Please select another time.";

    formAlert.classList.remove("d-none");

    refreshTimeSlots();
    return;
  }

  const doctor = getDoctor(doctorSelect.value);

  const appointment = {
    id: window.crypto?.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,

    name: $("#patientName").value.trim(),
    email: $("#patientEmail").value.trim(),
    phone: $("#patientPhone").value.trim(),
    doctorId: doctorSelect.value,
    date: dateInput.value,
    time: timeSelect.value,
    reason: $("#reason").value.trim(),
    createdAt: new Date().toISOString()
  };

  appointments.push(appointment);

  saveAppointments();
  renderAdmin();

  form.classList.add("d-none");
  successPanel.classList.remove("d-none");

  $("#successText").textContent =
    `${appointment.name}, your appointment with ${doctor.name} ` +
    `(${doctor.specialty}) is booked for ` +
    `${prettyDate(appointment.date)} at ${appointment.time}.`;

  showToast("Appointment booked successfully.");
});

// Book another appointment
$("#bookAnotherBtn").addEventListener(
  "click",
  resetBookingForm
);

// Admin dashboard button
$("#adminNavBtn").addEventListener("click", toggleAdmin);

// Export appointments as CSV
$("#exportBtn").addEventListener("click", () => {
  if (!appointments.length) {
    showToast("There are no appointments to export yet.");
    return;
  }

  const columns = [
    "name",
    "email",
    "phone",
    "doctor",
    "specialty",
    "date",
    "time",
    "reason",
    "status"
  ];

  const rows = appointments.map((item) => {
    const doctor = getDoctor(item.doctorId);

    return [
      item.name,
      item.email,
      item.phone,
      doctor?.name || "",
      doctor?.specialty || "",
      item.date,
      item.time,
      item.reason,
      item.date < localDateString() ? "Past" : "Confirmed"
    ];
  });

  const csv = [columns, ...rows]
    .map((row) =>
      row.map((value) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`
      ).join(",")
    )
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "carepoint-appointments.csv";
  link.click();

  URL.revokeObjectURL(url);

  showToast("Appointment list exported.");
});

// Cancel an appointment
$("#appointmentsTable").addEventListener("click", (event) => {
  const button = event.target.closest("[data-cancel]");

  if (!button) return;

  const item = appointments.find(
    (appointment) => appointment.id === button.dataset.cancel
  );

  if (
    !item ||
    !window.confirm(`Cancel the appointment for ${item.name}?`)
  ) {
    return;
  }

  appointments = appointments.filter(
    (appointment) => appointment.id !== item.id
  );

  saveAppointments();
  renderAdmin();
  refreshTimeSlots();

  showToast("Appointment cancelled.");
});