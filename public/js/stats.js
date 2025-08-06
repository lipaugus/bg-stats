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

    // Prepare sortable array
    const sortable = allPlayers.map(player => {
      const value = mode === "total"
        ? wins[player]
        : totalGames[player]
          ? (wins[player] / totalGames[player]) * 100
          : 0;
      return { player, value, wins: wins[player], total: totalGames[player] };
    });

    // Sort descending by value
    sortable.sort((a, b) => b.value - a.value);

    return { sortable, wins, totalGames };
  }

  function update() {
    const { sortable } = getWinsData();

    let maxValue = mode === "total"
      ? Math.max(...sortable.map(s => s.value))
      : 100;

    let bars = "";
    sortable.forEach(({ player, value, wins, total }) => {
      const label = mode === "total"
        ? `${wins}`
        : total
          ? `${(value).toFixed(1)}%`
          : "0%";
      const barWidth = mode === "total"
        ? (maxValue > 0 ? (value / maxValue) * 100 : 0)
        : value;
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
          <div class="stat-barplot-controls"></div>
          <div class="barplot">
            ${bars}
          </div>
        </div>
      </div>
    `;

    // Insert dropdown as subtitle
    const controls = container.querySelector('.stat-barplot-controls');
    const dropdown = document.createElement("select");
    dropdown.className = "stat-dropdown";
    const optionAll = document.createElement("option");
    optionAll.value = "Todos";
    optionAll.textContent = "Todos los juegos";
    dropdown.appendChild(optionAll);
    allGames.forEach(game => {
      const opt = document.createElement("option");
      opt.value = game;
      opt.textContent = game;
      dropdown.appendChild(opt);
    });
    dropdown.value = selectedGame;
    dropdown.onchange = () => {
      selectedGame = dropdown.value;
      update();
    };
    controls.appendChild(dropdown);

    // Toggle button event
    const toggleBtn = container.querySelector('.stat-toggle');
    toggleBtn.onclick = (e) => {
      e.preventDefault();
      mode = mode === "total" ? "percentage" : "total";
      update();
    };
  }

  update();
}