// Expects global extracted_logs

function getMostPlayedGame(logs, mode = "cantidad") {
  const gameStats = {};
  logs.forEach(log => {
    const game = log.game;
    if (!gameStats[game]) gameStats[game] = { count: 0, duration: 0 };
    gameStats[game].count += 1;
    gameStats[game].duration += Number(log.duration) || 0;
  });

  let bestGame = null;
  let bestValue = -Infinity;
  for (const [game, stats] of Object.entries(gameStats)) {
    const value = mode === "cantidad" ? stats.count : stats.duration;
    if (value > bestValue) {
      bestValue = value;
      bestGame = { name: game, ...stats };
    }
  }
  return bestGame;
}

export function renderMostPlayedStat(logs, container) {
  let mode = "cantidad";
  function update() {
    const stat = getMostPlayedGame(logs, mode);
    if (!stat) {
      container.innerHTML = "<div class='stat-box'>No hay datos</div>";
      return;
    }
    const imgSrc = `images/${stat.name}.png`;
    const title = `Más jugado por <button class="stat-toggle">${mode}</button>`;
    const value = mode === "cantidad"
      ? `${stat.count} Veces`
      : `${stat.duration} Minutos`;

    container.innerHTML = `
      <div class="stat-box">
        <img src="${imgSrc}" alt="${stat.name}" onerror="this.src='images/default.png'">
        <div class="stat-box-content">
          <div class="stat-title">${title}</div>
          <div class="stat-game-title">${stat.name}</div>
          <div class="stat-value">${value}</div>
        </div>
      </div>
    `;
    container.querySelector('.stat-toggle').onclick = () => {
      mode = mode === "cantidad" ? "tiempo" : "cantidad";
      update();
    };
  }
  update();
}

export function renderWinsBarplot(logs, container) {
  let mode = "total"; // or "percentage"
  let selectedGame = "Todos";

  // --- Get all unique players and games ---
  const allPlayers = Array.from(
    new Set(logs.flatMap(log => log.players))
  );
  const allGames = Array.from(
    new Set(logs.map(log => log.game))
  );

  function createDropdown() {
    const select = document.createElement("select");
    select.className = "stat-dropdown";
    const optionAll = document.createElement("option");
    optionAll.value = "Todos";
    optionAll.textContent = "Todos";
    select.appendChild(optionAll);
    allGames.forEach(game => {
      const opt = document.createElement("option");
      opt.value = game;
      opt.textContent = game;
      select.appendChild(opt);
    });
    select.value = selectedGame;
    select.onchange = () => {
      selectedGame = select.value;
      update();
    };
    return select;
  }

  function createToggle() {
    const btn = document.createElement("button");
    btn.className = "stat-toggle";
    btn.textContent = mode === "total" ? "total" : "porcentaje";
    btn.onclick = (e) => {
      e.preventDefault();
      mode = mode === "total" ? "percentage" : "total";
      update();
    };
    return btn;
  }

  function getWinsData() {
    const filteredLogs = selectedGame === "Todos"
      ? logs
      : logs.filter(log => log.game === selectedGame);

    const wins = {};
    allPlayers.forEach(p => wins[p] = 0);
    filteredLogs.forEach(log => {
      (log.winners || []).forEach(winner => {
        if (wins[winner] !== undefined) wins[winner]++;
      });
    });

    const totalGames = {};
    allPlayers.forEach(p => totalGames[p] = 0);
    filteredLogs.forEach(log => {
      (log.players || []).forEach(player => {
        if (totalGames[player] !== undefined) totalGames[player]++;
      });
    });

    return { wins, totalGames, filteredLogs };
  }

  function update() {
    const { wins, totalGames } = getWinsData();

    // For total: bars relative to max wins. For percentage: bars are % width.
    let bars = "";
    let maxValue = mode === "total"
      ? Math.max(...Object.values(wins))
      : 100;

    allPlayers.forEach(player => {
      const value = mode === "total"
        ? wins[player]
        : totalGames[player]
          ? (wins[player] / totalGames[player]) * 100
          : 0;
      const label = mode === "total"
        ? `${wins[player]}`
        : totalGames[player]
          ? `${(value).toFixed(1)}%`
          : "0%";
      const barWidth = mode === "total"
        ? (maxValue > 0 ? (wins[player] / maxValue) * 100 : 0)
        : value; // percentage mode: bar width is the percentage itself
      bars += `
        <div class="bar-row">
          <span class="bar-label">${player}</span>
          <div class="bar-bg">
            <div class="bar-fill" style="width:${barWidth}%;"></div>
          </div>
          <span class="bar-value">${label}</span>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="stat-box stat-box-barplot">
        <div class="stat-box-content" style="width:100%">
          <div class="stat-title">
            Ganadores por <button class="stat-toggle">${mode === "total" ? "total" : "porcentaje"}</button>
          </div>
          <div class="stat-barplot-controls">
            ${createDropdown().outerHTML}
          </div>
          <div class="barplot">
            ${bars}
          </div>
        </div>
      </div>
    `;

    // Insert dropdown and toggle (replace HTML so need to re-attach events)
    const controls = container.querySelector('.stat-barplot-controls');
    controls.innerHTML = "";
    controls.appendChild(createDropdown());
    // No label, dropdown only, slightly smaller
  }

  update();
}