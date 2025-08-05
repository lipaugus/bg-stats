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

// Only these games allow a points-limit
const gamesWithPointLimits = ["Jodete"];

// Get inputs & containers
const formContainer = document.getElementById('log-form-container');
const gameInput = document.getElementById('game-select');
const gameList = document.getElementById('game-select-list');
const dateInput = document.getElementById('date-played');
const durationInput = document.getElementById('duration-input');
const ptsLimitInput = document.getElementById('pts-limit-input');
const playerInput = document.getElementById('players-enter');
const playersContainer = document.getElementById('players-container');
const noWinnerCheckbox = document.getElementById('no-winner-cbx');
const btnLog = document.getElementById('btn-loggear');

// Table elements
const scoresHeader = document.getElementById('scores-header');
const scoresBody = document.getElementById('scores-body');
const addRowBtn = document.getElementById('add-row');
const removeRowBtn = document.getElementById('remove-row');

// Default date to today
dateInput.valueAsDate = new Date();

// Hide pts-limit on load
ptsLimitInput.style.display = 'none';

// State
let players = [];
let winnersList = [];
let points = {};  // { playerName: [row0, …], … }
let rowCount = 1;

// Color palette
const palette = [
    '#fa2c2c',
    '#33FF57',
    '#3357FF',
    '#F5FF33',
    '#A133FF',
    '#33FFF5',
    '#FF33A1',
    '#FF8F33',
    '#8FFF33',
    '#808080',
    '#dc6aff',
    '#ff8787',
    '#5e5bff',
    '#67ff74',
    '#ffeb7a',
    '#ff95e5',
    '#ffffff',
];

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
        .map(g => ({ name: g, low: g.toLowerCase() }))
        .filter(o => o.low.startsWith(s) || levenshtein(o.low, s) <= 1)
        .slice(0, 8)
        .map(o => o.name);
}

// Render dropdown list
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
            togglePtsLimit();
        });
        gameList.appendChild(li);
    });
    gameList.style.display = 'block';
}

// Show/hide pts-limit based on selected game
function togglePtsLimit() {
    if (gamesWithPointLimits.includes(gameInput.value)) {
        ptsLimitInput.style.display = '';
    } else {
        ptsLimitInput.style.display = 'none';
        ptsLimitInput.value = '';
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
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// Style player box
function updateBoxStyle(box, color, selected) {
    if (selected) {
        box.style.background = color;
        box.style.color = '#161616';
    } else {
        box.style.background = '#161616';
        box.style.color = color;
    }
}

// Keep points keys in sync with players[]
function syncPointsWithPlayers() {
    players.forEach(name => {
        if (!points[name]) points[name] = Array(rowCount).fill('');
    });
    Object.keys(points).forEach(name => {
        if (!players.includes(name)) delete points[name];
    });
}

// Render the scores table
function renderScoresTable() {
    syncPointsWithPlayers();
    // header
    scoresHeader.innerHTML = '';
    players.forEach((name, i) => {
        const th = document.createElement('th');
        th.textContent = name.slice(0, 2);
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
            inp.addEventListener('input', () => { points[name][r] = inp.value });
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
        const box = document.createElement('div');
        box.className = 'player-box';
        box.style.borderColor = color;
        updateBoxStyle(box, color, winnersList.includes(name));
        box.addEventListener('click', () => {
            if (noWinnerCheckbox.checked) return;
            const idx = winnersList.indexOf(name);
            if (idx > -1) winnersList.splice(idx, 1);
            else winnersList.push(name);
            updateBoxStyle(box, color, idx === -1);
        });
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
            renderPlayers();
        });
        box.appendChild(rem);
        playersContainer.appendChild(box);
    });
    renderScoresTable();
}

// Toast notification
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

// Event listeners
gameInput.addEventListener('input', () => {
    renderList(getMatches(gameInput.value));
    togglePtsLimit();
});
gameInput.addEventListener('focus', () => renderList(games));
gameInput.addEventListener('blur', () => setTimeout(() => gameList.style.display = 'none', 100));

playerInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const name = playerInput.value.trim();
        if (name && !players.includes(name)) {
            players.push(name);
            renderPlayers();
        }
        playerInput.value = '';
    }
});

noWinnerCheckbox.addEventListener('change', () => {
    if (noWinnerCheckbox.checked) winnersList = [];
    renderPlayers();
});

btnLog.addEventListener('click', () => {
    const now = formContainer.classList.toggle('visible');
    formContainer.classList.toggle('hidden', !now);
    btnLog.classList.toggle('active', now);
    btnLog.textContent = now ? '✖' : '+';
});

addRowBtn.addEventListener('click', () => {
    rowCount++;
    Object.keys(points).forEach(n => points[n].push(''));
    renderScoresTable();
});

removeRowBtn.addEventListener('click', () => {
    if (rowCount > 1) {
        rowCount--;
        Object.keys(points).forEach(n => points[n].pop());
        renderScoresTable();
    }
});

document.getElementById('log-form').addEventListener('submit', e => {
  e.preventDefault();
  // clean points → int or null
  const cleanedPoints = {};
  Object.keys(points).forEach(name => {
    cleanedPoints[name] = points[name].map(v => {
      const i = parseInt(v);
      return Number.isInteger(i) ? i : null;
    });
  });
  const duration = (() => {
    const i = parseInt(durationInput.value);
    return Number.isInteger(i) ? i : null;
  })();
  let limit_points = (() => {
    const i = parseInt(ptsLimitInput.value);
    return Number.isInteger(i) ? i : null;
  })();
  if (!gamesWithPointLimits.includes(gameInput.value)) limit_points = null;

  const payload = {
    date:         dateInput.value,
    game:         gameInput.value,
    players:      [...players],
    winners:      [...winnersList],
    points:       cleanedPoints,
    rounds:       rowCount,
    duration,
    limit_points
  };

  fetch('/api/log', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  })
    .then(r => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    })
    .then(json => {
      showToast('Partida guardada!');
      console.log('Saved:', json);

      // ----- CLEANUP & RESET -----
      // Close the form
      btnLog.click();

      // Reset state
      players = [];
      winnersList = [];
      points = {};
      rowCount = 1;

      // Reset inputs
      gameInput.value      = '';
      durationInput.value  = '';
      ptsLimitInput.value  = '';
      dateInput.valueAsDate = new Date();
      playerInput.value    = '';
      noWinnerCheckbox.checked = false;
      togglePtsLimit();   // hides pts-limit if needed

      // Re-render empty UI
      renderPlayers();
    })
    .catch(err => {
      console.error(err);
      alert('Error guardando, ver consola');
    });
});


// Fetch existing logs
async function fetchLogs() {
  try {
    const res = await fetch('/api/logs_extraction');
    if (!res.ok) throw new Error(res.statusText);
    extracted_logs = await res.json();
    console.log('Extracted logs:', extracted_logs);
  } catch (err) {
    console.error('Error fetching logs:', err);
  }
}


// Initial render
renderPlayers();

// Fetch logs from MongoDB when page loads
fetchLogs();