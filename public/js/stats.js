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