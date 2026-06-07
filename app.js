const fallbackAgenda = [
  {
    date: "2026-06-15",
    day: "Jun 15",
    title: "Opening XR Futures",
    speaker: "Maya Chen",
    room: "Main Stage",
    track: "Main Stage",
    start: "09:00 AM",
    end: "09:20 AM",
    intro: "Welcome the room, thank AWE, introduce the futures track.",
    qa: "Invite one concise question, then point people to hallway follow-up.",
    next: "Spatial AI panel with Jordan Ellis.",
  },
];

const modes = ["now", "intro", "qa", "next"];
let agenda = fallbackAgenda;
let currentIndex = 0;
let modeIndex = 0;
let agendaMeta = {
  event: "AWE Chair Cue",
  source: "",
};

const clockEl = document.querySelector("#clock");
const countEl = document.querySelector("#session-count");
const modeEl = document.querySelector("#mode-label");
const titleEl = document.querySelector("#talk-title");
const speakerEl = document.querySelector("#speaker-name");
const roomEl = document.querySelector("#room-name");
const remainingEl = document.querySelector("#time-remaining");
const cueEl = document.querySelector("#cue-text");
const prevButton = document.querySelector("#prev-button");
const nextButton = document.querySelector("#next-button");
const modeButton = document.querySelector("#mode-button");

function parseSessionDate(item, field) {
  const time = item[field] || item.start || "12:00 AM";
  const [clock, meridiem = "AM"] = time.split(" ");
  const [rawHours, minutes = "0"] = clock.split(":").map(Number);
  const hours =
    meridiem === "PM" && rawHours !== 12
      ? rawHours + 12
      : meridiem === "AM" && rawHours === 12
        ? 0
        : rawHours;

  return new Date(`${item.date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
}

function findBestStartingIndex(items) {
  const now = new Date();
  const activeIndex = items.findIndex((item) => {
    const start = parseSessionDate(item, "start");
    const end = parseSessionDate(item, "end");
    return start <= now && now <= end;
  });

  if (activeIndex >= 0) {
    return activeIndex;
  }

  const upcomingIndex = items.findIndex((item) => parseSessionDate(item, "start") > now);
  return upcomingIndex >= 0 ? upcomingIndex : 0;
}

function formatClock() {
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function getRemainingLabel(item) {
  const now = new Date();
  const end = parseSessionDate(item, "end");
  const remaining = Math.ceil((end.getTime() - now.getTime()) / 60000);

  if (remaining > 0 && remaining < 180) {
    return `${remaining}m`;
  }

  return item.end || "--";
}

function cleanSpeaker(value) {
  if (!value) {
    return "No speaker listed";
  }

  const speakers = value.split(";").map((speaker) => speaker.trim()).filter(Boolean);
  if (speakers.length > 2) {
    return `${speakers.slice(0, 2).join("; ")} +${speakers.length - 2}`;
  }

  return speakers.join("; ");
}

function getModeContent(item) {
  const mode = modes[modeIndex];

  if (mode === "intro") {
    return {
      label: "Intro cue",
      title: item.title,
      cue: item.intro || `Introduce: ${item.title}`,
      button: "Q&A",
    };
  }

  if (mode === "qa") {
    return {
      label: "Q&A cue",
      title: item.title,
      cue: item.qa || "Invite one concise audience question.",
      button: "Next",
    };
  }

  if (mode === "next") {
    return {
      label: "Next",
      title: item.next || agenda[currentIndex + 1]?.title || "End of agenda",
      cue: "Preview the next item and keep the transition tight.",
      button: "Now",
    };
  }

  return {
    label: item.day || "Now",
    title: item.title,
    cue: `${item.start || "--"}-${item.end || "--"} · ${item.track || "AWE"}`,
    button: "Cue",
  };
}

function fitTitle(text) {
  titleEl.classList.toggle("title-long", text.length > 58);
  titleEl.classList.toggle("title-extra-long", text.length > 92);
}

function render() {
  const item = agenda[currentIndex];
  const content = getModeContent(item);

  clockEl.textContent = formatClock();
  countEl.textContent = `${currentIndex + 1} / ${agenda.length}`;
  modeEl.textContent = content.label;
  titleEl.textContent = content.title;
  fitTitle(content.title);
  speakerEl.textContent = cleanSpeaker(item.speaker);
  roomEl.textContent = [item.day, item.room, item.track].filter(Boolean).join(" · ");
  remainingEl.textContent = getRemainingLabel(item);
  cueEl.textContent = content.cue;
  modeButton.textContent = content.button;
  document.title = `${agendaMeta.event}: ${item.title}`;
}

function moveSession(direction) {
  currentIndex = (currentIndex + direction + agenda.length) % agenda.length;
  modeIndex = 0;
  render();
}

async function loadAgenda() {
  try {
    const response = await fetch("./agenda.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Agenda request failed: ${response.status}`);
    }

    const payload = await response.json();
    agenda = payload.sessions && payload.sessions.length ? payload.sessions : fallbackAgenda;
    agendaMeta = {
      event: payload.event || "AWE USA 2026",
      source: payload.source || "",
    };
    currentIndex = findBestStartingIndex(agenda);
  } catch (error) {
    console.warn(error);
    agenda = fallbackAgenda;
    currentIndex = 0;
  }

  render();
}

prevButton.addEventListener("click", () => moveSession(-1));
nextButton.addEventListener("click", () => moveSession(1));
modeButton.addEventListener("click", () => {
  modeIndex = (modeIndex + 1) % modes.length;
  render();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    moveSession(-1);
  }

  if (event.key === "ArrowRight") {
    moveSession(1);
  }

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    modeButton.click();
  }
});

loadAgenda();
setInterval(render, 30000);
