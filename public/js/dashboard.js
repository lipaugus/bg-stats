// Get inputs & containers
const formContainer = document.getElementById('log-form-container');
const gameInput = document.getElementById('game-select');
const dateInput = document.getElementById('date-played');
const playerInput = document.getElementById('players-enter');
const durationInput = document.getElementById('duration-input');
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

// State
let players = [];
let winnersList = [];
let points = {};     // { playerName: [row0, row1, ...], … }
let rowCount = 1;      // always keep at least one data row

// Color palette
const palette = [
    '#e27d60', '#85cdc4', '#e8a87c',
    '#c38d9e', '#41b3a3', '#6d597a'
];

// Darken hex color by 40%
function darken(hex) {
    let num = parseInt(hex.slice(1), 16),
        r = (num >> 16) & 0xff,
        g = (num >> 8) & 0xff,
        b = num & 0xff;
    r = Math.floor(r * 0.6);
    g = Math.floor(g * 0.6);
    b = Math.floor(b * 0.6);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b)
        .toString(16)
        .slice(1);
}

// Update one box’s look based on selection
function updateBoxStyle(box, color, selected) {
    if (selected) {
        box.style.background = color;
        box.style.color = darken(color);
    } else {
        box.style.background = '#161616';
        box.style.color = color;
    }
}

// Sync points object keys with current players[]
function syncPointsWithPlayers() {
    // add new players
    players.forEach(name => {
        if (!points[name]) {
            points[name] = Array(rowCount).fill('');
        }
    });
    // remove old players
    Object.keys(points).forEach(name => {
        if (!players.includes(name)) {
            delete points[name];
        }
    });
}

// Render the scores table
function renderScoresTable() {
    syncPointsWithPlayers();

    // HEADER
    scoresHeader.innerHTML = '';
    players.forEach((name, i) => {
        const th = document.createElement('th');
        th.textContent = name.slice(0, 2);
        const color = palette[i % palette.length];
        th.style.background = color;
        th.style.color = darken(color);
        scoresHeader.appendChild(th);
    });

    // BODY
    scoresBody.innerHTML = '';
    for (let r = 0; r < rowCount; r++) {
        const tr = document.createElement('tr');
        players.forEach((name, i) => {
            const td = document.createElement('td');
            const inp = document.createElement('input');
            inp.type = 'number';
            inp.value = points[name][r] ?? '';
            inp.style.borderBottom = `2px solid ${palette[i % palette.length]}`;
            inp.addEventListener('input', () => {
                points[name][r] = inp.value;
            });
            td.appendChild(inp);
            tr.appendChild(td);
        });
        scoresBody.appendChild(tr);
    }
}

// Render the player-boxes and then the table
function renderPlayers() {
    playersContainer.innerHTML = '';

    players.forEach((name, i) => {
        const color = palette[i % palette.length];
        const box = document.createElement('div');
        box.className = 'player-box';
        box.style.borderColor = color;
        updateBoxStyle(box, color, winnersList.includes(name));

        // toggle winner
        box.addEventListener('click', () => {
            if (noWinnerCheckbox.checked) return;
            const idx = winnersList.indexOf(name);
            if (idx > -1) {
                winnersList.splice(idx, 1);
                updateBoxStyle(box, color, false);
            } else {
                winnersList.push(name);
                updateBoxStyle(box, color, true);
            }
            console.log('winnersList =', winnersList);
        });

        // name label
        const spanName = document.createElement('span');
        spanName.className = 'name';
        spanName.textContent = name;
        box.appendChild(spanName);

        // remove button
        const rem = document.createElement('span');
        rem.className = 'remove';
        rem.textContent = '×';
        rem.addEventListener('click', e => {
            e.stopPropagation();
            players = players.filter(p => p !== name);
            winnersList = winnersList.filter(p => p !== name);
            console.log(`Deleted ${name}`, 'players =', players);
            renderPlayers();
        });
        box.appendChild(rem);

        playersContainer.appendChild(box);
    });

    // after rebuilding players, rebuild table
    renderScoresTable();
}

// Helper to show a temporary, closable toast
function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  const btn = document.createElement('button');
  btn.className = 'close-toast';
  btn.innerHTML = '&times;';
  btn.addEventListener('click', () => {
    toast.remove();
  });
  toast.appendChild(btn);

  document.body.appendChild(toast);

  // auto-remove after duration
  setTimeout(() => toast.remove(), duration);
}

// Handle Enter on player input
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

// Handle “Sin ganador” checkbox
noWinnerCheckbox.addEventListener('change', () => {
    if (noWinnerCheckbox.checked) {
        winnersList = [];
        console.log('Sin ganador checked → winnersList cleared');
    }
    renderPlayers();
});

// Toggle form visibility
btnLog.addEventListener('click', () => {
    const nowVisible = formContainer.classList.toggle('visible');
    formContainer.classList.toggle('hidden', !nowVisible);
    btnLog.classList.toggle('active', nowVisible);
    btnLog.textContent = nowVisible ? '✖' : '+';
});

// Add / remove data rows
addRowBtn.addEventListener('click', () => {
    rowCount++;
    Object.keys(points).forEach(name => points[name].push(''));
    renderScoresTable();
});
removeRowBtn.addEventListener('click', () => {
    if (rowCount > 1) {
        rowCount--;
        Object.keys(points).forEach(name => points[name].pop());
        renderScoresTable();
    }
});

// initial render
renderPlayers();

// Handle form submission
const logForm = document.getElementById('log-form');
logForm.addEventListener('submit', e => {
    e.preventDefault();

    // Build the payload
    const payload = {
        date: dateInput.value,          // YYYY-MM-DD
        game: gameInput.value,
        players: [...players],
        winners: [...winnersList],
        points: { ...points },
        rounds: rowCount,
        duration: durationInput.value
    };

    // 1) Log it in mongodb
    fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => {
            if (!res.ok) throw new Error(res.statusText);
            return res.json();
        })
        .then(json => {
            showToast('Partida guardada!');
            console.log('Saved to Mongo:', json);

            // then your existing cleanup code…
            formContainer.classList.remove('visible');
            formContainer.classList.add('hidden');
            btnLog.classList.remove('active');
            btnLog.textContent = '+';
            players = [];
            winnersList = [];
            points = {};
            rowCount = 1;
            gameInput.value = '';
            durationInput.value = '';
            dateInput.valueAsDate = new Date();
            playerInput.value = '';
            noWinnerCheckbox.checked = false;
            renderPlayers();
        })
        .catch(err => {
            console.error('Error saving log:', err);
            alert('Error saving your log, see console.');
        });

    // 2) Close & reset the form UI
    formContainer.classList.remove('visible');
    formContainer.classList.add('hidden');
    btnLog.classList.remove('active');
    btnLog.textContent = '+';

    // 3) Clear all in‐memory data so progress is reset
    players = [];
    winnersList = [];
    points = {};
    rowCount = 1;

    // reset inputs
    gameInput.value = '';
    durationInput.value = '';
    dateInput.valueAsDate = new Date();
    playerInput.value = '';
    noWinnerCheckbox.checked = false;

    // re-render players & table with a single empty row
    renderPlayers();
});
