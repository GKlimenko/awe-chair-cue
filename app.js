const agenda = [
  {
    title: "Opening XR Futures",
    speaker: "Maya Chen",
    room: "Main Stage",
    start: "09:00",
    end: "09:20",
    intro: "Welcome the room, thank AWE, introduce the futures track.",
    qa: "Invite one concise question, then point people to hallway follow-up.",
    next: "Spatial AI panel with Jordan Ellis.",
  },
  {
    title: "Spatial AI Panel",
    speaker: "Jordan Ellis + panel",
    room: "Main Stage",
    start: "09:25",
    end: "10:05",
    intro: "Frame the panel around practical AI workflows in AR glasses.",
    qa: "Ask for demos, deployment lessons, and what still feels brittle.",
    next: "Break. Remind everyone of the demo area.",
  },
  {
    title: "Break",
    speaker: "Demo floor opens",
    room: "Expo Hall",
    start: "10:05",
    end: "10:30",
    intro: "Tell attendees the track resumes in 25 minutes.",
    qa: "No Q&A. Keep the stage clear.",
    next: "Ray-Ban Display web app demo.",
  },
  {
    title: "Glanceable Apps",
    speaker: "Your Ray-Ban Display demo",
    room: "Developer Theater",
    start: "10:30",
    end: "10:45",
    intro: "Open with why tiny, timely cues matter more than full screens.",
    qa: "Ask the audience where hands-free prompts would help them most.",
    next: "Wrap and direct people to your contact card.",
  },
];

const modes = ["now", "intro", "qa", "next"];
let currentIndex = 0;
let modeIndex = 0;

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

function minutesFromTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function currentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function formatClock() {
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function getRemainingLabel(item) {
  const remaining = minutesFromTime(item.end) - currentMinutes();

  if (remaining > 0 && remaining < 180) {
    return `${remaining}m`;
  }

  return item.end;
}

function getModeContent(item) {
  const mode = modes[modeIndex];

  if (mode === "intro") {
    return {
      label: "Intro cue",
      title: item.title,
      cue: item.intro,
      button: "Q&A",
    };
  }

  if (mode === "qa") {
    return {
      label: "Q&A cue",
      title: item.title,
      cue: item.qa,
      button: "Next",
    };
  }

  if (mode === "next") {
    return {
      label: "Next",
      title: item.next,
      cue: "Preview the next item and keep the transition tight.",
      button: "Now",
    };
  }

  return {
    label: "Now",
    title: item.title,
    cue: `${item.start}-${item.end}. Stay centered on time and speaker handoff.`,
    button: "Cue",
  };
}

function render() {
  const item = agenda[currentIndex];
  const content = getModeContent(item);

  clockEl.textContent = formatClock();
  countEl.textContent = `Session ${currentIndex + 1} / ${agenda.length}`;
  modeEl.textContent = content.label;
  titleEl.textContent = content.title;
  speakerEl.textContent = item.speaker;
  roomEl.textContent = item.room;
  remainingEl.textContent = getRemainingLabel(item);
  cueEl.textContent = content.cue;
  modeButton.textContent = content.button;
}

function moveSession(direction) {
  currentIndex = (currentIndex + direction + agenda.length) % agenda.length;
  modeIndex = 0;
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

render();
setInterval(render, 30000);
