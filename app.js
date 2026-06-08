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
const clockEl = document.querySelector("#clock");
const countEl = document.querySelector("#session-count");
const trackLabelEl = document.querySelector("#track-label");
const titleEl = document.querySelector("#talk-title");
const speakerEl = document.querySelector("#speaker-name");
const roomEl = document.querySelector("#room-name");
const remainingEl = document.querySelector("#time-remaining");
const descriptionEl = document.querySelector("#description-text");
const prevButton = document.querySelector("#prev-button");
const nextButton = document.querySelector("#next-button");
const menuButton = document.querySelector("#menu-button");

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
  const description = item.description || `${item.track || "AWE"} session. Full description was not listed.`;
  const cleaned = description
    .replace(/^coming soon!?$/i, "Description coming soon.")
    .replace(/^requires registration and acceptance to the hack\.\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= 95) {
    return cleaned;
  }

  const sentences = cleaned.match(/[^.!?]+[.!?]/g) || [];
  const preferred = sentences
    .map((sentence) => sentence.trim().replace(/^but\s+/i, ""))
    .find((sentence) => {
      return (
        sentence.length >= 45 &&
        sentence.length <= 105 &&
        !sentence.endsWith("?") &&
        !/^the era\b/i.test(sentence) &&
        !/^deadline\b/i.test(sentence) &&
        !/^more information\b/i.test(sentence)
      );
    });

  if (preferred) {
    return `${preferred.charAt(0).toUpperCase()}${preferred.slice(1)}`;
  }

  const contrastClause = cleaned.match(/,\s*but\s+([^.!?]{45,120}[.!?])/i)?.[1];
  if (contrastClause) {
    return `${contrastClause.charAt(0).toUpperCase()}${contrastClause.slice(1)}`;
  }

  const summaryLead = cleaned
    .replace(/^this session (will )?(explores?|covers?|discusses?|introduces?)\s+/i, "")
    .replace(/^in this session,\s*/i, "")
    .replace(/^participants will\s+/i, "Learn ");
  const brief = summaryLead.slice(0, 88);
  const breakPoint = Math.max(
    brief.lastIndexOf("."),
    brief.lastIndexOf(";"),
    brief.lastIndexOf(","),
    brief.lastIndexOf(" ")
  );
  const trimmed = brief.slice(0, breakPoint > 55 ? breakPoint : brief.length).trim();

  return `${trimmed.replace(/[,:;.-]+$/, "")}.`;
}

function fitTitle(text) {
  titleEl.classList.toggle("title-long", text.length > 58);
  titleEl.classList.toggle("title-extra-long", text.length > 92);
  titleEl.classList.toggle("title-ultra-long", text.length > 122);
}

function showMenu() {
  selectedTrack = "";
  applyCurrentTrackColor("#45d5b4");
  trackMenuEl.classList.remove("hidden");
  sessionViewEl.classList.add("hidden");
  descriptionPanelEl.classList.add("hidden");
  controlsEl.classList.add("hidden");
  countEl.textContent = `${allSessions.length} sessions`;
  document.title = `${agendaMeta.event}: Choose Track`;
  trackListEl.scrollTop = 0;
  requestAnimationFrame(() => {
    trackListEl.querySelector(".track-button")?.focus();
  });
}

function showSession() {
  trackMenuEl.classList.add("hidden");
  sessionViewEl.classList.remove("hidden");
  descriptionPanelEl.classList.remove("hidden");
  controlsEl.classList.remove("hidden");
  renderSession();
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
    button.addEventListener("click", () => selectTrack(track));
    trackListEl.appendChild(button);
  });
}

function focusTrackByOffset(offset) {
  const buttons = Array.from(trackListEl.querySelectorAll(".track-button"));
  if (!buttons.length) {
    return;
  }

  const currentIndex = Math.max(0, buttons.indexOf(document.activeElement));
  const nextIndex = (currentIndex + offset + buttons.length) % buttons.length;
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
  roomEl.textContent = [item.day, item.start, item.room].filter(Boolean).join(" / ");
  remainingEl.textContent = status.label;
  descriptionEl.textContent = cleanDescription(item);
  document.title = `${agendaMeta.event}: ${item.title}`;
}

function moveSession(direction) {
  currentIndex = (currentIndex + direction + filteredSessions.length) % filteredSessions.length;
  renderSession();
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
setupIntentButton(menuButton, showMenu);

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
});

loadAgenda();
setInterval(() => {
  clockEl.textContent = formatClock();
  if (trackMenuEl.classList.contains("hidden")) {
    renderSession();
  }
}, 30000);
