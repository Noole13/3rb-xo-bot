import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const games = new Map();

function checkWinner(board) {
  const combinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  for (const [a, b, c] of combinations) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (board.every(Boolean)) {
    return "draw";
  }

  return null;
}

function createBoard(gameId) {
  const game = games.get(gameId);
  if (!game) return [];

  const board = [];
  for (let i = 0; i < 9; i += 1) {
    const value = game.board[i];

    board.push(
      new ButtonBuilder()
        .setCustomId(`xo:${gameId}:${i}`)
        .setLabel(value ? value : "➖")
        .setStyle(
          value === "❌"
            ? ButtonStyle.Danger
            : value === "⭕"
              ? ButtonStyle.Primary
              : ButtonStyle.Secondary
        )
        .setDisabled(Boolean(value) || game.finished)
    );
  }

  return [
    new ActionRowBuilder().addComponents(board[0], board[1], board[2]),
    new ActionRowBuilder().addComponents(board[3], board[4], board[5]),
    new ActionRowBuilder().addComponents(board[6], board[7], board[8]),
  ];
}

function createGameButtons(gameId, disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`xo-replay:${gameId}`)
        .setLabel("🔄 لعب مرة أخرى")
        .setStyle(ButtonStyle.Success)
        .setDisabled(disabled)
    ),
  ];
}

function createGame(playerX, playerO) {
  const gameId = `${playerX.id}-${playerO.id}-${Date.now()}`;

  games.set(gameId, {
    id: gameId,
    playerX,
    playerO,
    board: Array(9).fill(null),
    turn: playerX.id,
    finished: false,
    isVsBot: playerO.bot,
  });

  return gameId;
}

function getStatus(game) {
  const currentPlayer =
    game.turn === game.playerX.id
      ? game.playerX
      : game.playerO;

  const symbol =
    game.turn === game.playerX.id
      ? "❌"
      : "⭕";

  return (
    `🎮 **لعبة XO**\n\n` +
    `❌ ${game.playerX}  ضد  ⭕ ${game.playerO}\n\n` +
    `🎯 الدور الآن: ${currentPlayer} ${symbol}`
  );
}

function getBotMove(board) {
  const emptyIndices = [];
  board.forEach((val, idx) => {
    if (!val) emptyIndices.push(idx);
  });

  if (emptyIndices.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * emptyIndices.length);
  return emptyIndices[randomIndex];
}

export {
  games,
  createGame,
  createBoard,
  createGameButtons,
  checkWinner,
  getStatus,
  getBotMove,
};
