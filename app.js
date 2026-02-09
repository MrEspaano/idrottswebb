// Grundläggande idrottsapp utan backend.
// All data laddas från lokala JSON-filer.

const NAV_BUTTONS = document.querySelectorAll(".nav-btn");
const VIEWS = document.querySelectorAll(".view");
const CLASS_BUTTONS_CONTAINER = document.getElementById("class-buttons");
const SCHEDULE_LIST = document.getElementById("schedule-list");
const TERM_LIST = document.getElementById("term-list");
const CURRENT_WEEK_EL = document.getElementById("current-week");
const PREV_WEEK_BTN = document.getElementById("prev-week");
const NEXT_WEEK_BTN = document.getElementById("next-week");

let weeklyData = {};
let termData = [];
let selectedClass = null;
let selectedWeek = null;

// -------------------------------
// Hjälpfunktioner
// -------------------------------

function getCurrentWeekNumber() {
  // Beräknar ISO-vecka (1-53) enligt standard för Sverige.
  const now = new Date();
  const target = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
  return weekNumber;
}

function formatWeekKey(weekNumber) {
  return `v${weekNumber}`;
}

function setActiveView(viewKey) {
  VIEWS.forEach((view) => {
    view.classList.toggle("is-active", view.id === `view-${viewKey}`);
  });
  NAV_BUTTONS.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewKey);
  });
}

function renderClassButtons() {
  CLASS_BUTTONS_CONTAINER.innerHTML = "";
  const classes = Object.keys(weeklyData);

  classes.forEach((className) => {
    const button = document.createElement("button");
    button.className = "class-btn";
    button.textContent = className.toUpperCase();
    button.dataset.className = className;
    button.addEventListener("click", () => {
      selectedClass = className;
      updateActiveClassButton();
      renderSchedule();
    });
    CLASS_BUTTONS_CONTAINER.appendChild(button);
  });
}

function updateActiveClassButton() {
  const buttons = CLASS_BUTTONS_CONTAINER.querySelectorAll(".class-btn");
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.className === selectedClass);
  });
}

function renderSchedule() {
  if (!selectedClass) {
    SCHEDULE_LIST.innerHTML = `<p>Välj en klass för att se schema.</p>`;
    return;
  }

  const weekKey = formatWeekKey(selectedWeek);
  const classSchedule = weeklyData[selectedClass] || {};
  const weekSchedule = classSchedule[weekKey];

  CURRENT_WEEK_EL.textContent = weekKey.toUpperCase();
  SCHEDULE_LIST.innerHTML = "";

  if (!weekSchedule || weekSchedule.length === 0) {
    SCHEDULE_LIST.innerHTML = `<p>Schema ej publicerat ännu</p>`;
    return;
  }

  weekSchedule.forEach((item) => {
    const card = document.createElement("article");
    card.className = "schedule-card";
    card.innerHTML = `
      <h2>${item.dag}</h2>
      <div class="schedule-meta">
        <span><strong>Sal:</strong> ${item.sal}</span>
        <span><strong>Omklädningsrum:</strong> ${item.omkladningsrum}</span>
        <span><strong>Kod:</strong> ${item.kod}</span>
        <span><strong>Aktivitet:</strong> ${item.aktivitet}</span>
      </div>
    `;
    SCHEDULE_LIST.appendChild(card);
  });
}

function renderTermPlan() {
  TERM_LIST.innerHTML = "";
  termData.forEach((item) => {
    const card = document.createElement("article");
    card.className = "term-card";
    const tagText = item.bedomning ? "Bedömning" : "Ingen bedömning";
    card.innerHTML = `
      <h2>${item.omrade}</h2>
      <p><strong>Veckor:</strong> ${item.veckor}</p>
      <p><strong>Fokus:</strong> ${item.fokus}</p>
      <span class="tag">${tagText}</span>
    `;
    TERM_LIST.appendChild(card);
  });
}

function adjustWeek(offset) {
  selectedWeek += offset;
  if (selectedWeek < 1) selectedWeek = 1;
  if (selectedWeek > 53) selectedWeek = 53;
  renderSchedule();
}

// -------------------------------
// Navigation
// -------------------------------

NAV_BUTTONS.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveView(button.dataset.view);
  });
});

PREV_WEEK_BTN.addEventListener("click", () => adjustWeek(-1));
NEXT_WEEK_BTN.addEventListener("click", () => adjustWeek(1));

// -------------------------------
// Init
// -------------------------------

async function init() {
  try {
    const weeklyResponse = await fetch("veckoscheman.json");
    const termResponse = await fetch("terminsplanering.json");

    weeklyData = await weeklyResponse.json();
    termData = await termResponse.json();

    selectedWeek = getCurrentWeekNumber();
    renderClassButtons();
    renderTermPlan();
    renderSchedule();
  } catch (error) {
    SCHEDULE_LIST.innerHTML = "<p>Kunde inte ladda scheman.</p>";
    TERM_LIST.innerHTML = "<p>Kunde inte ladda terminsplanering.</p>";
  }
}

init();
