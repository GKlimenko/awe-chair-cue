const fallbackAgenda = [
  {
    date: "2026-06-15",
    day: "Jun 15",
    title: "Opening XR Futures",
    speaker: "Maya Chen",
    room: "Main Stage",
    track: "Main Stage",
    trackColor: "#ff7f69",
    start: "09:00 AM",
    end: "09:20 AM",
    description: "A short opening session for the XR futures track.",
    next: "Spatial AI Panel",
  },
];

let allSessions = fallbackAgenda;
let filteredSessions = fallbackAgenda;
let currentIndex = 0;
let selectedTrack = "";
let agendaMeta = {
  event: "AWE USA 2026",
  timezone: "America/Los_Angeles",
};

const trackMenuEl = document.querySelector("#track-menu");
const trackListEl = document.querySelector("#track-list");
const sessionViewEl = document.querySelector("#session-view");
const descriptionPanelEl = document.querySelector("#description-panel");
const controlsEl = document.querySelector("#controls");
const fullDescriptionViewEl = document.querySelector("#description-view");
const descriptionControlsEl = document.querySelector("#description-controls");
const clockEl = document.querySelector("#clock");
const countEl = document.querySelector("#session-count");
const trackLabelEl = document.querySelector("#track-label");
const titleEl = document.querySelector("#talk-title");
const speakerEl = document.querySelector("#speaker-name");
const roomEl = document.querySelector("#room-name");
const remainingEl = document.querySelector("#time-remaining");
const sessionTimeEl = document.querySelector("#session-time");
const sessionPlaceEl = document.querySelector("#session-place");
const descriptionLabelEl = document.querySelector("#description-label");
const descriptionFullEl = document.querySelector("#description-full");
const prevButton = document.querySelector("#prev-button");
const nextButton = document.querySelector("#next-button");
const descriptionButton = document.querySelector("#description-button");
const menuButton = document.querySelector("#menu-button");
const descriptionBackButton = document.querySelector("#description-back-button");
const descriptionMenuButton = document.querySelector("#description-menu-button");
const descriptionNextButton = document.querySelector("#description-next-button");

function normalizeColor(color) {
  if (!color || !/^#?[0-9a-f]{6}$/i.test(color.trim())) {
    return "#45d5b4";
  }

  return color.trim().startsWith("#") ? color.trim() : `#${color.trim()}`;
}

function trackInkFor(color) {
  const hex = normalizeColor(color).slice(1);
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? "#090b0f" : "#f7f2e8";
}

function colorForTrack(track) {
  if (track === "All Tracks") {
    return "#45d5b4";
  }

  return normalizeColor(allSessions.find((session) => session.track === track)?.trackColor);
}

function applyCurrentTrackColor(color) {
  const normalized = normalizeColor(color);
  document.documentElement.style.setProperty("--current-track-color", normalized);
  document.documentElement.style.setProperty("--current-track-ink", trackInkFor(normalized));
}

function timeToMinutes(time) {
  const [clock, meridiem = "AM"] = time.split(" ");
  const [rawHours, minutes = "0"] = clock.split(":").map(Number);
  const hours =
    meridiem === "PM" && rawHours !== 12
      ? rawHours + 12
      : meridiem === "AM" && rawHours === 12
        ? 0
        : rawHours;

  return hours * 60 + Number(minutes);
}

function getEventNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: agendaMeta.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: Number(values.hour) * 60 + Number(values.minute),
  };
}

function formatClock() {
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function sessionStatus(item) {
  const now = getEventNow();
  const start = timeToMinutes(item.start || "12:00 AM");
  const end = timeToMinutes(item.end || item.start || "12:00 AM");

  if (item.date === now.date && start <= now.minutes && now.minutes <= end) {
    const remaining = Math.max(1, end - now.minutes);
    return { label: `${remaining}m`, rank: 0 };
  }

  if (item.date === now.date && now.minutes < start) {
    return { label: item.start, rank: 1 };
  }

  return { label: item.start || "--", rank: 2 };
}

function findBestStartingIndex(sessions) {
  const now = getEventNow();
  const activeIndex = sessions.findIndex((item) => {
    const start = timeToMinutes(item.start || "12:00 AM");
    const end = timeToMinutes(item.end || item.start || "12:00 AM");
    return item.date === now.date && start <= now.minutes && now.minutes <= end;
  });

  if (activeIndex >= 0) {
    return activeIndex;
  }

  const upcomingToday = sessions.findIndex((item) => {
    return item.date === now.date && timeToMinutes(item.start || "12:00 AM") > now.minutes;
  });

  if (upcomingToday >= 0) {
    return upcomingToday;
  }

  const upcomingLater = sessions.findIndex((item) => item.date > now.date);
  return upcomingLater >= 0 ? upcomingLater : 0;
}

function cleanSpeaker(value) {
  if (!value) {
    return "No speaker listed";
  }

  const speakers = value
    .split(";")
    .map((speaker) => speaker.trim().split(" - ")[0])
    .filter(Boolean);
  if (speakers.length > 3) {
    return `${speakers.slice(0, 3).join(", ")} +${speakers.length - 3}`;
  }

  return speakers.join(", ");
}

function cleanDescription(item) {
  return (item.description || `${item.track || "AWE"} session. Full description was not listed.`)
    .replace(/^coming soon!?$/i, "Description coming soon.")
    .replace(/^requires registration and acceptance to the hack\.\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fitTitle(text) {
  titleEl.classList.remove("title-long", "title-extra-long", "title-ultra-long");

  if (text.length > 58) {
    titleEl.classList.add("title-long");
  }

  if (text.length > 92) {
    titleEl.classList.add("title-extra-long");
  }

  if (text.length > 122) {
    titleEl.classList.add("title-ultra-long");
  }

  requestAnimationFrame(() => {
    const overflows = titleEl.scrollHeight > titleEl.clientHeight;
    if (!overflows) {
      return;
    }

    if (!titleEl.classList.contains("title-extra-long")) {
      titleEl.classList.add("title-extra-long");
    } else {
      titleEl.classList.add("title-ultra-long");
    }
  });
}

function showMenu() {
  selectedTrack = "";
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  applyCurrentTrackColor("#45d5b4");
  trackMenuEl.classList.remove("hidden");
  sessionViewEl.classList.add("hidden");
  descriptionPanelEl.classList.add("hidden");
  controlsEl.classList.add("hidden");
  fullDescriptionViewEl.classList.add("hidden");
  descriptionControlsEl.classList.add("hidden");
  countEl.textContent = `${allSessions.length} sessions`;
  document.title = `${agendaMeta.event}: Choose Track`;
  trackListEl.scrollTop = 0;

  requestAnimationFrame(() => {
    trackListEl.scrollTo({ top: 0, left: 0, behavior: "instant" });
    requestAnimationFrame(() => {
      const firstTrack = trackListEl.querySelector(".track-button");
      if (firstTrack) {
        setFocusedTrackButton(firstTrack);
      }

      firstTrack?.scrollIntoView({ block: "start", inline: "nearest" });
      firstTrack?.focus({ preventScroll: true });
    });
  });
}

function showSession() {
  trackMenuEl.classList.add("hidden");
  sessionViewEl.classList.remove("hidden");
  descriptionPanelEl.classList.remove("hidden");
  controlsEl.classList.remove("hidden");
  fullDescriptionViewEl.classList.add("hidden");
  descriptionControlsEl.classList.add("hidden");
  renderSession();
}

function showDescription() {
  const item = filteredSessions[currentIndex];

  trackMenuEl.classList.add("hidden");
  sessionViewEl.classList.add("hidden");
  descriptionPanelEl.classList.add("hidden");
  controlsEl.classList.add("hidden");
  fullDescriptionViewEl.classList.remove("hidden");
  descriptionControlsEl.classList.remove("hidden");

  descriptionLabelEl.textContent = item.track || "Description";
  descriptionFullEl.textContent = cleanDescription(item);
  descriptionFullEl.scrollTop = 0;
  document.title = `${agendaMeta.event}: Description`;
}

function renderTracks() {
  const counts = new Map();
  allSessions.forEach((session) => {
    const track = session.track || "Other";
    counts.set(track, (counts.get(track) || 0) + 1);
  });

  const tracks = ["All Tracks", ...Array.from(counts.keys()).sort((a, b) => a.localeCompare(b))];
  trackListEl.innerHTML = "";

  tracks.forEach((track) => {
    const button = document.createElement("button");
    const name = document.createElement("span");
    const count = document.createElement("span");
    const trackColor = colorForTrack(track);

    button.type = "button";
    button.className = "track-button";
    button.style.setProperty("--track-color", trackColor);
    button.style.setProperty("--track-ink", trackInkFor(trackColor));
    name.className = "track-name";
    name.textContent = track;
    count.className = "track-count";
    count.textContent = track === "All Tracks" ? allSessions.length : counts.get(track);
    button.append(name, count);
    button.addEventListener("focus", () => setFocusedTrackButton(button));
    button.addEventListener("click", () => selectTrack(track));
    trackListEl.appendChild(button);
  });
}

function setFocusedTrackButton(button) {
  trackListEl.querySelectorAll(".track-button").forEach((trackButton) => {
    trackButton.classList.toggle("is-focused", trackButton === button);
  });
}

function focusTrackByOffset(offset) {
  const buttons = Array.from(trackListEl.querySelectorAll(".track-button"));
  if (!buttons.length) {
    return;
  }

  const currentIndex = Math.max(0, buttons.indexOf(document.activeElement));
  const nextIndex = (currentIndex + offset + buttons.length) % buttons.length;
  setFocusedTrackButton(buttons[nextIndex]);
  buttons[nextIndex]?.focus();
  buttons[nextIndex]?.scrollIntoView({ block: "nearest" });
}

function selectTrack(track) {
  selectedTrack = track;
  filteredSessions =
    track === "All Tracks" ? allSessions : allSessions.filter((session) => session.track === track);
  currentIndex = findBestStartingIndex(filteredSessions);
  showSession();
}

function renderSession() {
  const item = filteredSessions[currentIndex];
  const status = sessionStatus(item);
  applyCurrentTrackColor(item.trackColor);

  clockEl.textContent = formatClock();
  countEl.textContent = `${currentIndex + 1} / ${filteredSessions.length}`;
  trackLabelEl.textContent = selectedTrack || item.track || "AWE";
  titleEl.textContent = item.title;
  fitTitle(item.title);
  speakerEl.textContent = cleanSpeaker(item.speaker);
  roomEl.textContent = item.track || "";
  remainingEl.textContent = status.label;
  sessionTimeEl.textContent = [item.day, `${item.start}-${item.end}`].filter(Boolean).join(" / ");
  sessionPlaceEl.textContent = item.room || "Room TBA";
  document.title = `${agendaMeta.event}: ${item.title}`;
}

function moveSession(direction) {
  currentIndex = (currentIndex + direction + filteredSessions.length) % filteredSessions.length;
  renderSession();
}

function moveSessionAndShow(direction) {
  moveSession(direction);
  showSession();
}

function setupIntentButton(button, action) {
  let isPressed = false;

  button.addEventListener("pointerenter", () => {
    button.focus();
  });

  button.addEventListener("pointerdown", () => {
    isPressed = true;
  });

  button.addEventListener("pointerleave", () => {
    isPressed = false;
  });

  button.addEventListener("pointerup", () => {
    if (!isPressed) {
      return;
    }

    isPressed = false;
    action();
  });

  button.addEventListener("keydown", (event) => {
    if (event.key !== " " && event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    action();
  });
}

async function loadAgenda() {
  clockEl.textContent = formatClock();

  try {
    const response = await fetch("./agenda.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Agenda request failed: ${response.status}`);
    }

    const payload = await response.json();
    allSessions = payload.sessions && payload.sessions.length ? payload.sessions : fallbackAgenda;
    agendaMeta = {
      event: payload.event || "AWE USA 2026",
      timezone: payload.timezone || "America/Los_Angeles",
    };
  } catch (error) {
    console.warn(error);
    allSessions = fallbackAgenda;
  }

  renderTracks();
  showMenu();
}

setupIntentButton(prevButton, () => moveSession(-1));
setupIntentButton(nextButton, () => moveSession(1));
setupIntentButton(descriptionButton, showDescription);
setupIntentButton(menuButton, showMenu);
setupIntentButton(descriptionBackButton, showSession);
setupIntentButton(descriptionMenuButton, showMenu);
setupIntentButton(descriptionNextButton, () => moveSessionAndShow(1));

window.addEventListener("keydown", (event) => {
  const menuIsOpen = !trackMenuEl.classList.contains("hidden");

  if (menuIsOpen) {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      focusTrackByOffset(1);
    }

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      focusTrackByOffset(-1);
    }

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      document.activeElement?.click();
    }

    return;
  }

  if (event.key === "ArrowLeft") {
    moveSession(-1);
  }

  if (event.key === "ArrowRight") {
    moveSession(1);
  }

  if (event.key === "Escape" || event.key.toLowerCase() === "m") {
    showMenu();
  }

  if (event.key.toLowerCase() === "i") {
    showDescription();
  }
});

loadAgenda();
setInterval(() => {
  clockEl.textContent = formatClock();
  if (trackMenuEl.classList.contains("hidden")) {
    renderSession();
  }
}, 30000);
