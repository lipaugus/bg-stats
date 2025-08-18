// List of games
const games = [
  "Akropolis",
  "Atenea",
  "Aventureros al Tren Europa",
  "Azul",
  "Camarero",
  "Cinefilo",
  "Derby",
  "Dixit",
  "Erudito",
  "Estanciero",
  "Flip 7",
  "Heat",
  "Ilustrado",
  "Jardinero",
  "Jodete",
  "Kluster",
  "Ludo",
  "Macarena",
  "Melomano",
  "Retro Park",
  "Sequence",
  "Splendor",
  "Switcher",
  "The Mind",
];

// Games that use scoring (show scoring table)
const scoringGames = ["Jodete", "Flip 7"];

// Only these games allow a points-limit
const gamesWithPointLimits = ["Jodete"];

// Heat track options
const heatTracks = ["USA", "Francia", "Italia", "UK"];

// Get inputs & containers
const formContainer = document.getElementById("log-form-container");
const gameInput = document.getElementById("game-select");
const gameList = document.getElementById("game-select-list");
const dateInput = document.getElementById("date-played");
const durationInput = document.getElementById("duration-input");
const roundsInput = document.getElementById("rounds-input");
const ptsLimitInput = document.getElementById("pts-limit-input");
const playerInput = document.getElementById("players-enter");
const playersContainer = document.getElementById("players-container");
const noWinnerCheckbox = document.getElementById("no-winner-cbx");
const btnLog = document.getElementById("btn-loggear");

// Heat elements (in HTML)
const heatContainer = document.getElementById("heat-extras");
const heatTrackInput = document.getElementById("heat-track-select");
const heatTrackList = document.getElementById("heat-track-list");

// F7 elements
const f7Container = document.getElementById("f7-mades-container");
const f7PlayerInput = document.getElementById("f7-player-input");
const f7RoundInput = document.getElementById("f7-round-input");
const f7AddBtn = document.getElementById("f7-add-btn");
const f7List = document.getElementById("f7-mades-list");

// First-timers container and list element
const firstTimersContainer = document.getElementById("first-timers-container");
const firstTimersListEl = document.getElementById("first-timers-list");

// Set extracted_logs as global var
let extracted_logs = [];

// Table elements
const scoresContainer = document.getElementById("scores-container");
const scoresHeader = document.getElementById("scores-header");
const scoresBody = document.getElementById("scores-body");
const addRowBtn = document.getElementById("add-row");
const removeRowBtn = document.getElementById("remove-row");

// Default date to today
dateInput.valueAsDate = new Date();

// Hide pts-limit on load
ptsLimitInput.style.display = "none";

// Hide the table controls arrows — we'll use rounds-input instead
if (addRowBtn) addRowBtn.style.display = "none";
if (removeRowBtn) removeRowBtn.style.display = "none";

// Initially hide scores container (no empty space), heat extras and first-timers
if (scoresContainer) scoresContainer.style.display = "none";
if (heatContainer) heatContainer.classList.add("hidden");
if (f7Container) f7Container.classList.add("hidden");
if (firstTimersContainer) firstTimersContainer.classList.add("hidden");

// State
let players = [];
let winnersList = [];
let points = {}; // { playerName: [row0, …], … }
let rowCount = 1;
let firstTimers = []; // players marked as "first time" for this game
let f7Mades = []; // Flip 7 entries

// Color palette
const palette = [
  "#fa2c2c",
  "#33FF57",
  "#3357FF",
  "#F5FF33",
  "#A133FF",
  "#33FFF5",
  "#FF33A1",
  "#FF8F33",
  "#8FFF33",
  "#808080",
  "#dc6aff",
  "#ff8787",
  "#5e5bff",
  "#67ff74",
  "#ffeb7a",
  "#ff95e5",
  "#ffffff",
];

window.playersColors = window.playersColors || {};

// Levenshtein distance for fuzzy match
function levenshtein(a, b) {
  const dp = Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = temp;
    }
  }
  return dp[b.length];
}

// Fuzzy matches (up to 8), return full list when empty
function getMatches(query) {
  const s = query.trim().toLowerCase();
  if (!s) return games;
  return games
    .map((g) => ({ name: g, low: g.toLowerCase() }))
    .filter((o) => o.low.startsWith(s) || levenshtein(o.low, s) <= 1)
    .slice(0, 8)
    .map((o) => o.name);
}

// Render dropdown list for games
function renderList(items) {
  gameList.innerHTML = "";
  if (!items.length) {
    gameList.style.display = "none";
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    li.style.padding = "0.25em 0.5em";
    li.style.cursor = "pointer";

    // Use mousedown so the blur on input doesn't hide the list before click
    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
      gameInput.value = item;
      // hide immediately
      gameList.style.display = "none";
      // blur input so the virtual keyboard / focus state is cleared
      try { gameInput.blur(); } catch (_) {}
      handleGameChange();
      // ensure other listeners react
      gameInput.dispatchEvent(new Event("input", { bubbles: true }));
      gameInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    li.addEventListener("click", (e) => {
      e.preventDefault();
      gameInput.value = item;
      gameList.style.display = "none";
      try { gameInput.blur(); } catch (_) {}
      handleGameChange();
      gameInput.dispatchEvent(new Event("input", { bubbles: true }));
      gameInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    gameList.appendChild(li);
  });
  gameList.style.display = "block";
}

// Heat track list rendering (for Circuito)
function renderTrackList(items) {
  if (!heatTrackList) return;
  heatTrackList.innerHTML = "";
  if (!items || items.length === 0) {
    heatTrackList.style.display = "none";
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    li.style.padding = "0.25em 0.5em";
    li.style.cursor = "pointer";

    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
      heatTrackInput.value = item;
      heatTrackList.style.display = "none";
      try { heatTrackInput.blur(); } catch (_) {}
      heatTrackInput.dispatchEvent(new Event("input", { bubbles: true }));
      heatTrackInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    li.addEventListener("click", (e) => {
      e.preventDefault();
      heatTrackInput.value = item;
      heatTrackList.style.display = "none";
      try { heatTrackInput.blur(); } catch (_) {}
      heatTrackInput.dispatchEvent(new Event("input", { bubbles: true }));
      heatTrackInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    heatTrackList.appendChild(li);
  });

  heatTrackList.style.display = "block";
}

function getTrackMatches(query) {
  const s = (query || "").trim().toLowerCase();
  if (!s) return heatTracks;
  return heatTracks.filter((t) => t.toLowerCase().startsWith(s));
}

// Show/hide pts-limit based on selected game
function togglePtsLimit() {
  if (gamesWithPointLimits.includes(gameInput.value)) {
    ptsLimitInput.style.display = "";
  } else {
    ptsLimitInput.style.display = "none";
    ptsLimitInput.value = "";
  }
}

// Darken hex by 40%
function darken(hex) {
  let num = parseInt(hex.slice(1), 16),
    r = (num >> 16) & 0xff,
    g = (num >> 8) & 0xff,
    b = num & 0xff;
  r = Math.floor(r * 0.6);
  g = Math.floor(g * 0.6);
  b = Math.floor(b * 0.6);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// Style player box
function updateBoxStyle(box, color, selected) {
  if (selected) {
    box.style.background = color;
    box.style.color = "#161616";
  } else {
    box.style.background = "#161616";
    box.style.color = color;
  }
}

// Keep points keys in sync with players[]
function syncPointsWithPlayers() {
  players.forEach((name) => {
    if (!points[name]) points[name] = Array(rowCount).fill("");
    if (points[name].length < rowCount) {
      while (points[name].length < rowCount) points[name].push("");
    } else if (points[name].length > rowCount) {
      points[name] = points[name].slice(0, rowCount);
    }
  });
  Object.keys(points).forEach((name) => {
    if (!players.includes(name)) delete points[name];
  });
}

// Render the scores table
function renderScoresTable() {
  if (!scoresContainer) return;
  const gameName = (gameInput.value || "").trim();
  if (!scoringGames.includes(gameName)) {
    scoresContainer.style.display = "none";
    return;
  }

  // ensure rowCount is in sync with roundsInput
  rowCount = Math.max(1, parseInt(roundsInput.value) || 1);

  scoresContainer.style.display = "";

  syncPointsWithPlayers();

  // header
  scoresHeader.innerHTML = "";
  players.forEach((name, i) => {
    const th = document.createElement("th");
    th.textContent = name.slice(0, 2);
    const color = palette[i % palette.length];
    th.style.background = color;
    th.style.color = "#161616";
    scoresHeader.appendChild(th);
  });

  // body
  scoresBody.innerHTML = "";
  for (let r = 0; r < rowCount; r++) {
    const tr = document.createElement("tr");
    players.forEach((name, i) => {
      const td = document.createElement("td");
      const inp = document.createElement("input");
      inp.type = "number";
      inp.value = points[name][r] ?? "";
      inp.style.borderBottom = `2px solid ${palette[i % palette.length]}`;
      inp.addEventListener("input", () => {
        points[name][r] = inp.value;
      });
      td.appendChild(inp);
      tr.appendChild(td);
    });
    scoresBody.appendChild(tr);
  }
}

// Render players & table and show/hide first-timers container when needed
function renderPlayers() {
  playersContainer.innerHTML = "";
  players.forEach((name, i) => {
    const color = palette[i % palette.length];
    window.playersColors[name] = color; // persist mapping for other components
    const box = document.createElement("div");
    box.className = "player-box";
    box.style.borderColor = color;

    // ensure visual state matches winnersList
    const selected = winnersList.includes(name);
    updateBoxStyle(box, color, selected);

    box.addEventListener("click", () => {
      if (noWinnerCheckbox.checked) return;
      const idx = winnersList.indexOf(name);
      if (idx > -1) winnersList.splice(idx, 1);
      else winnersList.push(name);
      // update visual using the new state
      const nowSelected = winnersList.includes(name);
      updateBoxStyle(box, color, nowSelected);
    });

    const spanName = document.createElement("span");
    spanName.className = "name";
    spanName.textContent = name;
    box.appendChild(spanName);

    const rem = document.createElement("span");
    rem.className = "remove";
    rem.textContent = "×";
    rem.addEventListener("click", (e) => {
      e.stopPropagation();
      players = players.filter((p) => p !== name);
      winnersList = winnersList.filter((p) => p !== name);
      // Keep firstTimers in sync
      firstTimers = firstTimers.filter((p) => p !== name);
      renderPlayers();
    });
    box.appendChild(rem);
    playersContainer.appendChild(box);
  });

  // Show first-timers container only when we have players
  if (firstTimersContainer) {
    if (players.length > 0) firstTimersContainer.classList.remove("hidden");
    else firstTimersContainer.classList.add("hidden");
  }

  renderScoresTable();
  renderFirstTimers();
}

// Toast notification
function showToast(msg, duration = 3000) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  const btn = document.createElement("button");
  btn.className = "close-toast";
  btn.innerHTML = "&times;";
  btn.onclick = () => toast.remove();
  toast.appendChild(btn);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// --- First-timers UI ---
function renderFirstTimers() {
  if (!firstTimersListEl) return;
  firstTimersListEl.innerHTML = "";

  players.forEach((name) => {
    const pill = document.createElement("span");
    pill.className = "f7-pill";
    const color = window.playersColors[name] || "#fff";

    // use CSS for padding/size; only set color/border/background state
    pill.style.borderColor = color;
    pill.style.color = color;
    pill.style.background = "#1e1e1e";
    pill.style.cursor = "pointer";
    pill.textContent = name;

    // initial selected state
    if (firstTimers.includes(name)) {
      pill.style.background = color;
      pill.style.color = "#161616";
    }

    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = firstTimers.indexOf(name);
      if (idx > -1) firstTimers.splice(idx, 1);
      else firstTimers.push(name);

      const selected = firstTimers.includes(name);
      if (selected) {
        pill.style.background = color;
        pill.style.color = "#161616";
      } else {
        pill.style.background = "#1e1e1e";
        pill.style.color = color;
      }
    });

    firstTimersListEl.appendChild(pill);
  });
}

// --- F7 hechos logic ---
function renderF7Mades() {
  if (!f7List) return;
  f7List.innerHTML = "";
  f7Mades.forEach((entry, idx) => {
    const [player, round] = entry.split("-");
    const pill = document.createElement("span");
    pill.className = "f7-pill";
    const color = window.playersColors[player] || "#fff";
    pill.style.borderColor = color;
    pill.style.color = color;
    // default background kept in CSS; selected state toggles to color
    pill.style.background = "#1e1e1e";
    pill.textContent = `${player}-${round}`;

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.className = "f7-pill-delete";
    delBtn.innerHTML = "&times;";
    delBtn.onclick = () => {
      f7Mades.splice(idx, 1);
      renderF7Mades();
    };
    pill.appendChild(delBtn);
    f7List.appendChild(pill);
  });
}

// Add F7 hecho
function addF7Hecho() {
  const player = f7PlayerInput.value.trim();
  const round = f7RoundInput.value.trim();
  if (!player || !round) return;
  f7Mades.push(`${player}-${round}`);
  renderF7Mades();
  f7PlayerInput.value = "";
  f7RoundInput.value = "";
  f7PlayerInput.focus();
}

// Handle UI when game changes (show/hide scoring, heat extras, F7)
function handleGameChange() {
  const val = (gameInput.value || "").trim();

  // pts limit
  togglePtsLimit();

  // scoring table show/hide and sync rounds
  if (scoringGames.includes(val)) {
    // ensure rowCount matches rounds input
    const r = Math.max(1, parseInt(roundsInput.value) || 1);
    rowCount = r;
    Object.keys(points).forEach((name) => {
      if (!points[name]) points[name] = Array(rowCount).fill("");
      if (points[name].length < rowCount) {
        while (points[name].length < rowCount) points[name].push("");
      } else if (points[name].length > rowCount) {
        points[name] = points[name].slice(0, rowCount);
      }
    });
    renderScoresTable();
  } else {
    if (scoresContainer) scoresContainer.style.display = "none";
  }

  // Flip 7 special block
  if (val.toLowerCase() === "flip 7") {
    if (f7Container) f7Container.classList.remove("hidden");
  } else {
    if (f7Container) {
      f7Container.classList.add("hidden");
      f7Mades = [];
      renderF7Mades();
    }
  }

  // Heat special inputs (do NOT auto-open the circuito dropdown)
  if (val.toLowerCase() === "heat") {
    if (heatContainer) heatContainer.classList.remove("hidden");
    // REVERTED: keep placeholder "Rondas" rather than "Vueltas"
    roundsInput.placeholder = "Rondas";
    // do NOT call renderTrackList here - leave dropdown closed until user focuses/inputs
  } else {
    if (heatContainer) {
      heatContainer.classList.add("hidden");
      // clear heat inputs when hiding
      if (heatTrackInput) heatTrackInput.value = "";
      const checked = document.querySelector('input[name="heat-mode"]:checked');
      if (checked) checked.checked = false;
      const baseRadio = document.querySelector('input[name="heat-mode"][value="Base"]');
      if (baseRadio) baseRadio.checked = true;
    }
    roundsInput.placeholder = "Rondas";
  }

  // Toggle first-timers container visibility based on players
  if (firstTimersContainer) {
    if (players.length > 0) firstTimersContainer.classList.remove("hidden");
    else firstTimersContainer.classList.add("hidden");
  }
}

// Event listeners
gameInput.addEventListener("input", () => {
  renderList(getMatches(gameInput.value));
  handleGameChange();
});
gameInput.addEventListener("focus", () => renderList(games));
gameInput.addEventListener("blur", () => setTimeout(() => (gameList.style.display = "none"), 100));

playerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const name = playerInput.value.trim();
    if (name && !players.includes(name)) {
      players.push(name);
      renderPlayers();
    }
    playerInput.value = "";
    playerInput.focus();
  }
});

noWinnerCheckbox.addEventListener("change", () => {
  if (noWinnerCheckbox.checked) winnersList = [];
  renderPlayers();
});

btnLog.addEventListener("click", () => {
  const now = formContainer.classList.toggle("visible");
  formContainer.classList.toggle("hidden", !now);
  btnLog.classList.toggle("active", now);
  btnLog.textContent = now ? "✖" : "+";
});

// roundsInput change updates rows
if (roundsInput) {
  roundsInput.addEventListener("input", () => {
    const r = Math.max(1, parseInt(roundsInput.value) || 1);
    rowCount = r;
    Object.keys(points).forEach((name) => {
      if (!points[name]) points[name] = Array(rowCount).fill("");
      if (points[name].length < rowCount) {
        while (points[name].length < rowCount) points[name].push("");
      } else if (points[name].length > rowCount) {
        points[name] = points[name].slice(0, rowCount);
      }
    });
    renderScoresTable();
  });
}

// Heat track input wiring (open dropdown only on focus or input)
if (heatTrackInput) {
  heatTrackInput.addEventListener("input", () => {
    renderTrackList(getTrackMatches(heatTrackInput.value));
  });
  heatTrackInput.addEventListener("focus", () => renderTrackList(heatTracks));
  heatTrackInput.addEventListener("blur", () =>
    setTimeout(() => {
      if (heatTrackList) heatTrackList.style.display = "none";
    }, 120)
  );
}

// F7 controls
if (f7AddBtn) f7AddBtn.addEventListener("click", addF7Hecho);
[f7PlayerInput, f7RoundInput].forEach((input) => {
  if (!input) return;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addF7Hecho();
    }
  });
});

// Unified submit handler — builds payload including f7_mades and first_timers
document.getElementById("log-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  // clean points → int or null (only if scoring game)
  const cleanedPoints = {};
  const gameName = (gameInput.value || "").trim();
  if (scoringGames.includes(gameName)) {
    Object.keys(points).forEach((name) => {
      cleanedPoints[name] = points[name].map((v) => {
        const i = parseInt(v);
        return Number.isInteger(i) ? i : null;
      });
    });
  }

  const duration = (() => {
    const i = parseInt(durationInput.value);
    return Number.isInteger(i) ? i : null;
  })();

  // rounds comes from roundsInput now
  const roundsVal = Math.max(1, parseInt(roundsInput.value) || 1);

  let limit_points = (() => {
    const i = parseInt(ptsLimitInput.value);
    return Number.isInteger(i) ? i : null;
  })();
  if (!gamesWithPointLimits.includes(gameInput.value)) limit_points = null;

  const payload = {
    date: dateInput.value,
    game: gameInput.value,
    players: [...players],
    winners: [...winnersList],
    points: scoringGames.includes(gameName) ? cleanedPoints : null,
    rounds: roundsVal,
    duration,
    limit_points,
  };

  // Add Flip 7 specifics
  if (gameInput.value.trim().toLowerCase() === "flip 7" && f7Mades.length > 0) {
    payload.f7_mades = [...f7Mades];
  }

  // Add first_timers (null if none)
  payload.first_timers = firstTimers.length ? [...firstTimers] : null;

  // Heat extras
  if (gameName.toLowerCase() === "heat") {
    payload.track_played = heatTrackInput && heatTrackInput.value ? heatTrackInput.value : null;
    const modeRadio = document.querySelector('input[name="heat-mode"]:checked');
    payload.game_mode = modeRadio ? modeRadio.value : "Base";
  }

  try {
    const r = await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(r.statusText);
    const json = await r.json();

    showToast("Partida guardada!");
    console.log("Saved:", json);

    // ----- CLEANUP & RESET -----
    btnLog.click(); // close form

    players = [];
    winnersList = [];
    points = {};
    rowCount = 1;
    firstTimers = [];
    f7Mades = [];

    // Reset inputs
    gameInput.value = "";
    durationInput.value = "";
    ptsLimitInput.value = "";
    roundsInput.value = "";
    if (heatTrackInput) heatTrackInput.value = "";
    dateInput.valueAsDate = new Date();
    playerInput.value = "";
    noWinnerCheckbox.checked = false;
    if (heatContainer) heatContainer.classList.add("hidden");
    roundsInput.placeholder = "Rondas";
    togglePtsLimit(); // hides pts-limit if needed

    // Re-render empty UI
    renderPlayers();
    renderF7Mades();
    renderFirstTimers();
  } catch (err) {
    console.error(err);
    alert("Error guardando, ver consola");
  }
});

// Fetch logs & render stats (unchanged)
import { renderMostPlayedStat, renderWinsBarplot } from "./stats.js";

async function fetchLogs() {
  try {
    const res = await fetch("/api/logs_extraction");
    if (!res.ok) throw new Error(res.statusText);
    extracted_logs = await res.json();
    console.log("Extracted logs:", extracted_logs);
  } catch (err) {
    // Use sample data if fetch fails (e.g., when running locally)
    console.warn("Falling back to local sample data:", err);
    extracted_logs = SAMPLE_LOGS;
    console.log("Sample logs:", extracted_logs);
  }

  // Render stats
  const statsGrid = document.getElementById("stats-grid");
  statsGrid.innerHTML = ""; // Clear previous

  // Create separate containers for each stat box
  const mostPlayedDiv = document.createElement("div");
  const barplotDiv = document.createElement("div");
  statsGrid.appendChild(mostPlayedDiv);
  statsGrid.appendChild(barplotDiv);

  renderMostPlayedStat(extracted_logs, mostPlayedDiv);
  renderWinsBarplot(extracted_logs, barplotDiv);
}

// Sample logs (kept for local dev)
const SAMPLE_LOGS = [
  {
    date: "2025-08-03",
    duration: 21,
    game: "Jodete",
    limit_points: 200,
    players: ["Ariel", "Lucas"],
    points: { Ariel: [-10, -5, -15, 20, 10, 160, null], Lucas: [55, 45, 50, 40, 55, 45, 35] },
    rounds: 7,
    winners: ["Lucas"],
    _id: "688f839e58af4aaf79437397",
  },
  // ... other sample logs ...
];

// Initial render
renderPlayers();

// Fetch logs from MongoDB when page loads
fetchLogs();
