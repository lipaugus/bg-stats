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

// Games that require positions instead of winners-array
const gamesWithPositions = ["Heat", "Azul"];

// Only these games allow a points-limit
const gamesWithPointLimits = ["Jodete"];

// Heat track options
const heatTracks = ["USA", "Francia", "Italia", "UK"];

// Get inputs & containers (form)
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
const noWinnerWrapper = document.getElementById("no-winner-wrapper");
const btnLog = document.getElementById("btn-loggear");

// Positions UI elements
const positionsContainer = document.getElementById("positions-container");
const positionsListEl = document.getElementById("positions-list");

// Heat elements
const heatContainer = document.getElementById("heat-extras");
const heatTrackInput = document.getElementById("heat-track-select");
const heatTrackList = document.getElementById("heat-track-list");

// F7 elements
const f7Container = document.getElementById("f7-mades-container");
const f7PlayerInput = document.getElementById("f7-player-input");
const f7RoundInput = document.getElementById("f7-round-input");
const f7AddBtn = document.getElementById("f7-add-btn");
const f7List = document.getElementById("f7-mades-list");

// First-timers
const firstTimersContainer = document.getElementById("first-timers-container");
const firstTimersListEl = document.getElementById("first-timers-list");

// Scores table elements
const scoresContainer = document.getElementById("scores-container");
const scoresHeader = document.getElementById("scores-header");
const scoresBody = document.getElementById("scores-body");

// Stats & filter elements
const statsGrid = document.getElementById("stats-grid");
const playerFilterInput = document.getElementById("player-filter-input");
const playerFilterList = document.getElementById("player-filter-list");
const playerFilterSelected = document.getElementById("player-filter-selected");

// Set extracted_logs as global var
let extracted_logs = [];

// internal state
let allPlayers = [];          // unique players discovered in logs
let selectedPlayers = [];     // currently selected filter players
let players = [];             // players input for the form
let playersColors = window.playersColors || {};
let winnersList = [];         // used for non-position games (array)
let points = {};
let rowCount = 1;
let firstTimers = [];
let f7Mades = [];

// positions order for ranked games
let positionsOrder = []; // array of player names in current order

// color palette
const palette = [
  "#fa2c2c","#33FF57","#3357FF","#F5FF33","#A133FF","#33FFF5","#FF33A1","#FF8F33",
  "#8FFF33","#808080","#dc6aff","#ff8787","#5e5bff","#67ff74","#ffeb7a","#ff95e5","#ffffff"
];

// Default date to today
dateInput.valueAsDate = new Date();

// Hide pts-limit on load
ptsLimitInput.style.display = "none";

// Hide optional blocks initially
if (scoresContainer) scoresContainer.style.display = "none";
if (heatContainer) heatContainer.classList.add("hidden");
if (f7Container) f7Container.classList.add("hidden");
if (firstTimersContainer) firstTimersContainer.classList.add("hidden");
if (positionsContainer) positionsContainer.classList.add("hidden");

// Helper: Levenshtein
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

// --- PLAYER FILTER LOGIC ---
function computeAllPlayers(logs) {
  const set = new Set();
  logs.forEach(log => {
    (log.players || []).forEach(p => set.add(p));
  });
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}
function getPlayerMatches(query) {
  const s = (query || "").trim().toLowerCase();
  if (!s) return allPlayers.slice(0, 50);
  return allPlayers
    .map(p => ({ name: p, low: p.toLowerCase() }))
    .filter(o => o.low.startsWith(s) || levenshtein(o.low, s) <= 1)
    .slice(0, 8)
    .map(o => o.name);
}
function renderPlayerFilterList(items) {
  playerFilterList.innerHTML = "";
  if (!items || items.length === 0) {
    playerFilterList.style.display = "none";
    return;
  }
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    li.style.padding = '0.25em 0.5em';
    li.style.cursor = 'pointer';
    li.addEventListener('mousedown', e => {
      e.preventDefault();
      addSelectedPlayer(item);
      playerFilterList.style.display = 'none';
      try { playerFilterInput.blur(); } catch(_) {}
    });
    li.addEventListener('click', e => {
      e.preventDefault();
      addSelectedPlayer(item);
      playerFilterList.style.display = 'none';
      try { playerFilterInput.blur(); } catch(_) {}
    });
    playerFilterList.appendChild(li);
  });
  playerFilterList.style.display = 'block';
}
function addSelectedPlayer(name) {
  if (!name) return;
  if (!selectedPlayers.includes(name)) selectedPlayers.push(name);
  renderPlayerFilterSelected();
  applyPlayerFilter();
}
function removeSelectedPlayer(name) {
  selectedPlayers = selectedPlayers.filter(p => p !== name);
  renderPlayerFilterSelected();
  applyPlayerFilter();
}
function renderPlayerFilterSelected() {
  playerFilterSelected.innerHTML = "";
  selectedPlayers.forEach(name => {
    const pill = document.createElement('span');
    pill.className = 'player-filter-pill';
    pill.textContent = name;
    pill.style.borderColor = '#fff';
    pill.style.color = '#fff';
    pill.style.background = 'transparent';
    pill.addEventListener('click', () => removeSelectedPlayer(name));
    playerFilterSelected.appendChild(pill);
  });
}
function applyPlayerFilter() {
  let filtered;
  if (!selectedPlayers.length) filtered = extracted_logs;
  else {
    filtered = extracted_logs.filter(log => {
      const logPlayers = log.players || [];
      return selectedPlayers.every(p => logPlayers.includes(p));
    });
  }
  updateStats(filtered);
}

// --- Scoring & UI logic ---

function syncPointsWithPlayers() {
  players.forEach(name => {
    if (!points[name]) points[name] = Array(rowCount).fill('');
    if (points[name].length < rowCount) {
      while (points[name].length < rowCount) points[name].push('');
    } else if (points[name].length > rowCount) {
      points[name] = points[name].slice(0, rowCount);
    }
  });
  Object.keys(points).forEach(name => {
    if (!players.includes(name)) delete points[name];
  });
}

function renderScoresTable() {
  if (!scoresContainer) return;
  const gameName = (gameInput.value || "").trim();
  if (!scoringGames.includes(gameName)) {
    scoresContainer.style.display = "none";
    return;
  }

  rowCount = Math.max(1, parseInt(roundsInput.value) || 1);
  scoresContainer.style.display = "";
  syncPointsWithPlayers();

  // header
  scoresHeader.innerHTML = '';
  players.forEach((name, i) => {
    const th = document.createElement('th');
    th.textContent = name.slice(0,2);
    const color = palette[i % palette.length];
    th.style.background = color;
    th.style.color = '#161616';
    scoresHeader.appendChild(th);
  });

  // body
  scoresBody.innerHTML = '';
  for (let r = 0; r < rowCount; r++) {
    const tr = document.createElement('tr');
    players.forEach((name, i) => {
      const td = document.createElement('td');
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.value = points[name][r] ?? '';
      inp.style.borderBottom = `2px solid ${palette[i % palette.length]}`;
      inp.addEventListener('input', () => { points[name][r] = inp.value; });
      td.appendChild(inp);
      tr.appendChild(td);
    });
    scoresBody.appendChild(tr);
  }
}

// Render players & table
function renderPlayers() {
  playersContainer.innerHTML = '';
  players.forEach((name, i) => {
    const color = palette[i % palette.length];
    playersColors[name] = color;
    const box = document.createElement('div');
    box.className = 'player-box';
    box.style.borderColor = color;
    box.style.background = '#1e1e1e';
    box.style.color = color;
    const inPositionsMode = gamesWithPositions.includes((gameInput.value || "").trim());
    if (!inPositionsMode) {
      box.addEventListener('click', () => {
        if (noWinnerCheckbox.checked) return;
        const idx = winnersList.indexOf(name);
        if (idx > -1) winnersList.splice(idx, 1);
        else winnersList.push(name);
        renderPlayers();
      });
    }

    const spanName = document.createElement('span');
    spanName.className = 'name';
    spanName.textContent = name;
    box.appendChild(spanName);

    const rem = document.createElement('span');
    rem.className = 'remove';
    rem.textContent = '×';
    rem.addEventListener('click', e => {
      e.stopPropagation();
      players = players.filter(p => p !== name);
      winnersList = winnersList.filter(p => p !== name);
      firstTimers = firstTimers.filter(p => p !== name);
      positionsOrder = positionsOrder.filter(p => p !== name);
      renderPlayers();
      renderPositionsList();
    });
    box.appendChild(rem);
    playersContainer.appendChild(box);
  });

  // show/hide first-timers container depending on players length
  if (firstTimersContainer) {
    if (players.length > 0) firstTimersContainer.classList.remove('hidden');
    else firstTimersContainer.classList.add('hidden');
  }

  // update scores table & positions UI
  renderScoresTable();
  renderPositionsList();
  renderFirstTimers();
}

// renderFirstTimers (fixed text color contrast)
function renderFirstTimers() {
  if (!firstTimersListEl) return;
  firstTimersListEl.innerHTML = '';
  players.forEach(name => {
    const pill = document.createElement('span');
    pill.className = 'f7-pill';
    pill.textContent = name;

    const selected = firstTimers.includes(name);
    const bg = selected ? (playersColors[name] || '#fff') : '#1e1e1e';
    pill.style.background = bg;
    pill.style.borderColor = playersColors[name] || '#fff';

    // Ensure readable text: when selected (bg is player color) use dark text; otherwise use player color or white
    pill.style.color = selected ? '#161616' : (playersColors[name] || '#fff');

    pill.addEventListener('click', () => {
      const idx = firstTimers.indexOf(name);
      if (idx > -1) firstTimers.splice(idx, 1);
      else firstTimers.push(name);
      renderFirstTimers();
    });
    firstTimersListEl.appendChild(pill);
  });
}

// F7 logic
function renderF7Mades() {
  if (!f7List) return;
  f7List.innerHTML = '';
  f7Mades.forEach((entry, idx) => {
    const pill = document.createElement('span');
    pill.className = 'f7-pill';
    pill.textContent = entry;
    pill.style.borderColor = '#fff';
    pill.style.background = '#1e1e1e';
    const del = document.createElement('button');
    del.className = 'f7-pill-delete';
    del.innerHTML = '&times;';
    del.onclick = () => {
      f7Mades.splice(idx, 1);
      renderF7Mades();
    };
    pill.appendChild(del);
    f7List.appendChild(pill);
  });
}
function addF7Hecho() {
  const p = (f7PlayerInput.value || '').trim();
  const r = (f7RoundInput.value || '').trim();
  if (!p || !r) return;
  f7Mades.push(`${p}-${r}`);
  renderF7Mades();
  f7PlayerInput.value = '';
  f7RoundInput.value = '';
  f7PlayerInput.focus();
}

// --- Positions UI (sortable) ---
function renderPositionsList() {
  if (!positionsContainer || !positionsListEl) return;
  const inPositionsMode = gamesWithPositions.includes((gameInput.value || "").trim());
  if (!inPositionsMode) {
    positionsContainer.classList.add('hidden');
    positionsContainer.setAttribute('aria-hidden', 'true');
    return;
  }
  // show
  positionsContainer.classList.remove('hidden');
  positionsContainer.setAttribute('aria-hidden', 'false');

  // ensure positionsOrder has same players (initially same order as players[])
  positionsOrder = positionsOrder.filter(p => players.includes(p));
  players.forEach(p => { if (!positionsOrder.includes(p)) positionsOrder.push(p); });

  // build list
  positionsListEl.innerHTML = '';
  positionsOrder.forEach((name, idx) => {
    const item = document.createElement('div');
    item.className = 'position-item';
    item.draggable = true;
    item.dataset.index = idx;

    // badge
    const badge = document.createElement('span');
    badge.className = 'pos-badge';
    badge.textContent = (idx + 1);
    item.appendChild(badge);

    // player pill (reuse visuals)
    const pill = document.createElement('div');
    pill.className = 'player-box';
    pill.style.borderColor = playersColors[name] || palette[idx % palette.length];
    pill.style.background = '#1e1e1e';
    pill.style.margin = '0';
    pill.style.flex = '1';
    pill.style.display = 'flex';
    pill.style.justifyContent = 'space-between';
    pill.style.alignItems = 'center';

    const span = document.createElement('span');
    span.textContent = name;
    span.style.marginRight = '12px';
    pill.appendChild(span);

    item.appendChild(pill);

    // drag handlers
    item.addEventListener('dragstart', (ev) => {
      ev.dataTransfer.setData('text/plain', String(idx));
      ev.dataTransfer.effectAllowed = 'move';
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
    item.addEventListener('dragover', (ev) => {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';
    });
    item.addEventListener('drop', (ev) => {
      ev.preventDefault();
      const srcIndex = Number(ev.dataTransfer.getData('text/plain'));
      const destIndex = Number(item.dataset.index);
      if (Number.isFinite(srcIndex) && Number.isFinite(destIndex) && srcIndex !== destIndex) {
        const moved = positionsOrder.splice(srcIndex, 1)[0];
        positionsOrder.splice(destIndex, 0, moved);
        renderPositionsList();
      }
    });

    // style item
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '12px';
    item.style.padding = '6px';
    item.style.border = '1px solid rgba(255,255,255,0.04)';
    item.style.borderRadius = '10px';
    item.style.marginBottom = '8px';
    item.style.background = 'rgba(255,255,255,0.01)';
    item.style.boxShadow = '0 6px 18px rgba(0,0,0,0.6)';
    item.style.cursor = 'grab';

    positionsListEl.appendChild(item);
  });
}

// Toast helper
function showToast(msg, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  const btn = document.createElement('button');
  btn.className = 'close-toast';
  btn.innerHTML = '&times;';
  btn.onclick = () => toast.remove();
  toast.appendChild(btn);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// handle game change UI
function handleGameChange() {
  const val = (gameInput.value || "").trim();

  // pts limit visibility
  if (gamesWithPointLimits.includes(val)) ptsLimitInput.style.display = '';
  else { ptsLimitInput.style.display = 'none'; ptsLimitInput.value = ''; }

  // scoring table visibility + rows based on rounds input
  if (scoringGames.includes(val)) {
    rowCount = Math.max(1, parseInt(roundsInput.value) || 1);
    renderScoresTable();
  } else {
    if (scoresContainer) scoresContainer.style.display = 'none';
  }

  // flip7 UI
  if (val.toLowerCase() === 'flip 7') {
    if (f7Container) f7Container.classList.remove('hidden');
  } else {
    if (f7Container) {
      f7Container.classList.add('hidden');
      f7Mades = [];
      renderF7Mades();
    }
  }

  // heat extras block
  if (val.toLowerCase() === 'heat') {
    if (heatContainer) heatContainer.classList.remove('hidden');
    roundsInput.placeholder = 'Rondas';
  } else {
    if (heatContainer) {
      heatContainer.classList.add('hidden');
      if (heatTrackInput) heatTrackInput.value = '';
      const baseRadio = document.querySelector('input[name="heat-mode"][value="Base"]');
      if (baseRadio) baseRadio.checked = true;
    }
    roundsInput.placeholder = 'Rondas';
  }

  // positions mode? show positionsContainer and hide winners-style selection
  const inPositionsMode = gamesWithPositions.includes(val);
  if (inPositionsMode) {
    if (positionsContainer) positionsContainer.classList.remove('hidden');
    // hide the no-winner checkbox when using positions
    if (noWinnerWrapper) noWinnerWrapper.classList.add('hidden');
    // initialize positionsOrder with players current order
    positionsOrder = [...players];
  } else {
    if (positionsContainer) positionsContainer.classList.add('hidden');
    if (noWinnerWrapper) noWinnerWrapper.classList.remove('hidden');
    positionsOrder = [];
  }

  if (players.length > 0 && firstTimersContainer) firstTimersContainer.classList.remove('hidden');
  else if (firstTimersContainer) firstTimersContainer.classList.add('hidden');

  // re-render UI parts
  renderPlayers();
  renderPositionsList();
}

// Dropdown list for games
function getMatches(query) {
  const s = (query || '').trim().toLowerCase();
  if (!s) return games;
  return games
    .map(g => ({ name: g, low: g.toLowerCase() }))
    .filter(o => o.low.startsWith(s) || levenshtein(o.low, s) <= 1)
    .slice(0, 8)
    .map(o => o.name);
}
function renderList(items) {
  gameList.innerHTML = '';
  if (!items.length) { gameList.style.display = 'none'; return; }
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    li.style.padding = '0.25em 0.5em';
    li.style.cursor = 'pointer';
    li.addEventListener('mousedown', e => {
      e.preventDefault();
      gameInput.value = item;
      gameList.style.display = 'none';
      try { gameInput.blur(); } catch(_) {}
      handleGameChange();
      gameInput.dispatchEvent(new Event('input', {bubbles:true}));
      gameInput.dispatchEvent(new Event('change', {bubbles:true}));
    });
    li.addEventListener('click', e => {
      e.preventDefault();
      gameInput.value = item;
      gameList.style.display = 'none';
      try { gameInput.blur(); } catch(_) {}
      handleGameChange();
      gameInput.dispatchEvent(new Event('input', {bubbles:true}));
      gameInput.dispatchEvent(new Event('change', {bubbles:true}));
    });
    gameList.appendChild(li);
  });
  gameList.style.display = 'block';
}

// heat track list rendering
function renderTrackList(items) {
  if (!heatTrackList) return;
  heatTrackList.innerHTML = '';
  if (!items || items.length === 0) { heatTrackList.style.display = 'none'; return; }
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    li.style.padding = '0.25em 0.5em';
    li.style.cursor = 'pointer';
    li.addEventListener('mousedown', e => {
      e.preventDefault();
      heatTrackInput.value = item;
      heatTrackList.style.display = 'none';
      try { heatTrackInput.blur(); } catch(_) {}
      heatTrackInput.dispatchEvent(new Event('input', {bubbles:true}));
      heatTrackInput.dispatchEvent(new Event('change', {bubbles:true}));
    });
    li.addEventListener('click', e => {
      e.preventDefault();
      heatTrackInput.value = item;
      heatTrackList.style.display = 'none';
      try { heatTrackInput.blur(); } catch(_) {}
      heatTrackInput.dispatchEvent(new Event('input', {bubbles:true}));
      heatTrackInput.dispatchEvent(new Event('change', {bubbles:true}));
    });
    heatTrackList.appendChild(li);
  });
  heatTrackList.style.display = 'block';
}

// rounds input changes
if (roundsInput) {
  roundsInput.addEventListener('input', () => {
    rowCount = Math.max(1, parseInt(roundsInput.value) || 1);
    Object.keys(points).forEach(name => {
      if (!points[name]) points[name] = Array(rowCount).fill('');
      if (points[name].length < rowCount) {
        while (points[name].length < rowCount) points[name].push('');
      } else if (points[name].length > rowCount) {
        points[name] = points[name].slice(0, rowCount);
      }
    });
    renderScoresTable();
  });
}

// add player on Enter
playerInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const name = playerInput.value.trim();
    if (name && !players.includes(name)) {
      players.push(name);
      renderPlayers();
    }
    playerInput.value = '';
    playerInput.focus();
  }
});

// no-winner checkbox
noWinnerCheckbox.addEventListener('change', () => {
  if (noWinnerCheckbox.checked) winnersList = [];
  renderPlayers();
});

// main toggle
btnLog.addEventListener('click', () => {
  const now = formContainer.classList.toggle('visible');
  formContainer.classList.toggle('hidden', !now);
  btnLog.classList.toggle('active', now);
  btnLog.textContent = now ? '✖' : '+';
  if (now && window.innerWidth <= 640) {
    setTimeout(()=> { document.getElementById('log-form').scrollTop = 0; }, 20);
  }
});

// heat track input behavior
if (heatTrackInput) {
  heatTrackInput.addEventListener('input', () => {
    renderTrackList(heatTracks.filter(t => t.toLowerCase().startsWith((heatTrackInput.value||'').toLowerCase())));
  });
  heatTrackInput.addEventListener('focus', () => renderTrackList(heatTracks));
  heatTrackInput.addEventListener('blur', () => setTimeout(()=> { if (heatTrackList) heatTrackList.style.display = 'none'; }, 120));
}

// f7 wiring
if (f7AddBtn) f7AddBtn.addEventListener('click', addF7Hecho);
[f7PlayerInput, f7RoundInput].forEach(input => {
  if (!input) return;
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addF7Hecho();
    }
  });
});

// player filter events
playerFilterInput.addEventListener('input', () => {
  renderPlayerFilterList(getPlayerMatches(playerFilterInput.value));
});
playerFilterInput.addEventListener('focus', () => renderPlayerFilterList(allPlayers.slice(0, 50)));
playerFilterInput.addEventListener('blur', () => setTimeout(()=> { playerFilterList.style.display = 'none'; }, 120));

// Ensure game input toggles UI both on typing and on selection/change
gameInput.addEventListener('input', () => {
  renderList(getMatches(gameInput.value));
  handleGameChange();
});
gameInput.addEventListener('change', () => handleGameChange());
gameInput.addEventListener('focus', () => renderList(getMatches(gameInput.value)));
gameInput.addEventListener('blur', () => setTimeout(()=> { gameList.style.display = 'none'; }, 120));

// submit handler (formats date as DD/MM/YYYY)
document.getElementById('log-form').addEventListener('submit', async e => {
  e.preventDefault();

  const cleanedPoints = {};
  const gameName = (gameInput.value || '').trim();

  if (scoringGames.includes(gameName)) {
    Object.keys(points).forEach(name => {
      cleanedPoints[name] = points[name].map(v => {
        const i = parseInt(v);
        return Number.isInteger(i) ? i : null;
      });
    });
  }

  const duration = (() => {
    const i = parseInt(durationInput.value);
    return Number.isInteger(i) ? i : null;
  })();

  const roundsVal = Math.max(1, parseInt(roundsInput.value) || 1);

  let limit_points = (() => {
    const i = parseInt(ptsLimitInput.value);
    return Number.isInteger(i) ? i : null;
  })();
  if (!gamesWithPointLimits.includes(gameInput.value)) limit_points = null;

  // Build winners payload depending on positions mode
  let winnersPayload = null;
  if (gamesWithPositions.includes(gameName)) {
    // positionsOrder should have the sorted player names
    winnersPayload = {};
    positionsOrder.forEach((p, idx) => { winnersPayload[idx + 1] = p; });
  } else {
    winnersPayload = winnersList.length ? [...winnersList] : [];
  }

  // Format date to DD/MM/YYYY for storage
  let payloadDate = null;
  try {
    if (dateInput.value) {
      const d = new Date(dateInput.value);
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const yyyy = d.getFullYear();
      payloadDate = `${dd}/${mm}/${yyyy}`;
    }
  } catch (_) {
    payloadDate = dateInput.value || null;
  }

  const payload = {
    date: payloadDate,
    game: gameInput.value,
    players: [...players],
    winners: winnersPayload,
    points: scoringGames.includes(gameName) ? cleanedPoints : null,
    rounds: roundsVal,
    duration,
    limit_points
  };

  if (gameInput.value.trim().toLowerCase() === 'flip 7' && f7Mades.length > 0) {
    payload.f7_mades = [...f7Mades];
  }

  payload.first_timers = firstTimers.length ? [...firstTimers] : null;

  if (gameName.toLowerCase() === 'heat') {
    payload.track_played = heatTrackInput && heatTrackInput.value ? heatTrackInput.value : null;
    const modeRadio = document.querySelector('input[name="heat-mode"]:checked');
    payload.game_mode = modeRadio ? modeRadio.value : 'Base';
  }

  try {
    const r = await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error(r.statusText);
    const json = await r.json();
    showToast('Partida guardada!');
    console.log('Saved:', json);

    // reset
    btnLog.click();
    players = [];
    winnersList = [];
    points = {};
    rowCount = 1;
    firstTimers = [];
    f7Mades = [];
    positionsOrder = [];

    gameInput.value = '';
    durationInput.value = '';
    ptsLimitInput.value = '';
    roundsInput.value = '';
    if (heatTrackInput) heatTrackInput.value = '';
    dateInput.valueAsDate = new Date();
    playerInput.value = '';
    noWinnerCheckbox.checked = false;
    if (heatContainer) heatContainer.classList.add('hidden');
    roundsInput.placeholder = 'Rondas';
    if (scoresContainer) scoresContainer.style.display = 'none';
    if (positionsContainer) positionsContainer.classList.add('hidden');
    if (noWinnerWrapper) noWinnerWrapper.classList.remove('hidden');
    renderPlayers();
    renderF7Mades();
    renderFirstTimers();

    // refetch logs so stats get updated (optional)
    await fetchLogs();
  } catch (err) {
    console.error(err);
    alert('Error guardando, ver consola');
  }
});

// Stats rendering plumbing
const mostPlayedDiv = document.createElement('div');
const barplotDiv = document.createElement('div');

import { renderMostPlayedStat, renderWinsBarplot } from './stats.js';
function updateStats(logs) {
  statsGrid.innerHTML = '';
  statsGrid.appendChild(mostPlayedDiv);
  statsGrid.appendChild(barplotDiv);
  renderMostPlayedStat(logs, mostPlayedDiv);
  renderWinsBarplot(logs, barplotDiv);
}

// Fetch logs and initialize UI
async function fetchLogs() {
  try {
    const res = await fetch('/api/logs_extraction');
    if (!res.ok) throw new Error(res.statusText);
    extracted_logs = await res.json();
    console.log('Extracted logs:', extracted_logs);
  } catch (err) {
    console.warn('Falling back to sample logs:', err);
    extracted_logs = SAMPLE_LOGS;
  }

  // compute players from logs
  allPlayers = computeAllPlayers(extracted_logs);

  // initial stats render (no filter)
  updateStats(extracted_logs);

  // do not auto-open filter list here
  renderPlayerFilterSelected();
}

// SAMPLE_LOGS
const SAMPLE_LOGS = [
  {
    date: "03/08/2025",
    duration: 21,
    game: "Jodete",
    limit_points: 200,
    players: ['Ariel', 'Lucas'],
    points: { Ariel: [-10, -5, -15, 20, 10, 160, null], Lucas: [55, 45, 50, 40, 55, 45, 35] },
    rounds: 7,
    winners: ['Lucas'],
    _id: "1"
  },
  {
    date: "06/08/2025",
    duration: 15,
    game: "Azul",
    limit_points: 100,
    players: ['Mica', 'Lucas', 'Ariel'],
    points: { Mica: [10,20,15,25], Lucas: [15,25,20,30], Ariel: [12,18,22,28] },
    rounds: 4,
    winners: {1: 'Lucas', 2: 'Mica', 3: 'Ariel'},
    _id: "2"
  },
  {
    date: "09/08/2025",
    duration: 18,
    game: "Jodete",
    limit_points: 200,
    players: ['Mica', 'Ariel'],
    points: { Mica: [30,50,70,90], Ariel: [40,60,80,100] },
    rounds: 4,
    winners: ['Ariel'],
    _id: "3"
  }
];

// start
renderPlayers();
fetchLogs();
