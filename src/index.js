import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN) {
  throw new Error("Missing DISCORD_TOKEN");
}

if (!CLIENT_ID) {
  throw new Error("Missing DISCORD_CLIENT_ID");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const games = new Map();

const xoCommand = new SlashCommandBuilder()
  .setName("xo")
  .setDescription("لعب لعبة XO مع لاعب آخر")
  .addUserOption((option) =>
    option
      .setName("player")
      .setDescription("اختر اللاعب الذي تريد اللعب ضده")
      .setRequired(true)
  );

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: [xoCommand.toJSON()],
  });

  console.log("Slash commands registered.");
}

function createBoard(gameId) {
  const board = [];

  for (let i = 0; i < 9; i += 1) {
    const value = games.get(gameId)?.board[i];

    board.push(
      new ButtonBuilder()
        .setCustomId(`xo:${gameId}:${i}`)
        .setLabel(value || " ")
        .setStyle(
          value === "❌"
            ? ButtonStyle.Danger
            : value === "⭕"
              ? ButtonStyle.Primary
              : ButtonStyle.Secondary
        )
        .setDisabled(Boolean(value))
    );
  }

  return [
    new ActionRowBuilder().addComponents(board[0], board[1], board[2]),
    new ActionRowBuilder().addComponents(board[3], board[4], board[5]),
    new ActionRowBuilder().addComponents(board[6], board[7], board[8]),
  ];
}

function createGameButtons(gameId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`xo-replay:${gameId}`)
        .setLabel("🔄 لعب مرة أخرى")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`xo-end:${gameId}`)
        .setLabel("🛑 إنهاء")
        .setStyle(ButtonStyle.Danger)
    ),
  ];
}

function checkWinner(board) {
  const combinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of combinations) {
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a];
    }
  }

  if (board.every(Boolean)) {
    return "draw";
  }

  return null;
}

function getPlayerName(userId, game) {
  if (userId === game.playerX.id) {
    return game.playerX.username;
  }

  if (userId === game.playerO.id) {
    return game.playerO.username;
  }

  return "اللاعب";
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
  });

  return gameId;
}

function getStatus(game) {
  const currentPlayer =
    game.turn === game.playerX.id ? game.playerX : game.playerO;

  const symbol = game.turn === game.playerX.id ? "❌" : "⭕";

  return `🎮 **لعبة XO**\n\n❌ ${game.playerX}  ضد  ⭕ ${game.playerO}\n\n🎯 الدور الآن: ${currentPlayer} ${symbol}`;
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);

  try {
    await registerCommands();
  } catch (error) {
    console.error("Failed to register commands:", error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName !== "xo") {
        return;
      }

      const opponent = interaction.options.getUser("player", true);
      const creator = interaction.user;

      if (opponent.bot) {
        await interaction.reply({
          content: "❌ لا يمكنك اللعب ضد بوت.",
          ephemeral: true,
        });
        return;
      }

      if (opponent.id === creator.id) {
        await interaction.reply({
          content: "❌ لا يمكنك اللعب ضد نفسك.",
          ephemeral: true,
        });
        return;
      }

      const existingGame = [...games.values()].find(
        (game) =>
          !game.finished &&
          (game.playerX.id === creator.id ||
            game.playerO.id === creator.id ||
            game.playerX.id === opponent.id ||
            game.playerO.id === opponent.id)
      );

      if (existingGame) {
        await interaction.reply({
          content: "❌ أحد اللاعبين موجود بالفعل في لعبة XO أخرى.",
          ephemeral: true,
        });
        return;
      }

      const gameId = createGame(creator, opponent);
      const game = games.get(gameId);

      await interaction.reply({
        content: getStatus(game),
        components: createBoard(gameId),
      });

      return;
    }

    if (!interaction.isButton()) {
      return;
    }

    const [type, gameId, indexText] = interaction.customId.split(":");

    if (type === "xo") {
      const game = games.get(gameId);

      if (!game) {
        await interaction.reply({
          content: "❌ هذه اللعبة لم تعد موجودة.",
          ephemeral: true,
        });
        return;
      }

      if (game.finished) {
        await interaction.reply({
          content: "❌ انتهت هذه اللعبة.",
          ephemeral: true,
        });
        return;
      }

      if (
        interaction.user.id !== game.playerX.id &&
        interaction.user.id !== game.playerO.id
      ) {
        await interaction.reply({
          content: "❌ أنت لست أحد لاعبي هذه المباراة.",
          ephemeral: true,
        });
        return;
      }

      if (interaction.user.id !== game.turn) {
        await interaction.reply({
          content: "⏳ ليس دورك الآن.",
          ephemeral: true,
        });
        return;
      }

      const index = Number(indexText);

      if (!Number.isInteger(index) || index < 0 || index > 8) {
        await interaction.reply({
          content: "❌ حركة غير صالحة.",
          ephemeral: true,
        });
        return;
      }

      if (game.board[index]) {
        await interaction.reply({
          content: "❌ هذا المربع مستخدم بالفعل.",
          ephemeral: true,
        });
        return;
      }

      const symbol =
        interaction.user.id === game.playerX.id ? "❌" : "⭕";

      game.board[index] = symbol;

      const result = checkWinner(game.board);

      if (result === "❌" || result === "⭕") {
        game.finished = true;

        const winner =
          result === "❌" ? game.playerX : game.playerO;

        await interaction.update({
          content:
            `🏆 **انتهت اللعبة!**\n\n` +
            `الفائز: ${winner} ${result}\n\n` +
            `❌ ${game.playerX}  ضد  ⭕ ${game.playerO}`,
          components: [
            ...createBoard(gameId),
            ...createGameButtons(gameId),
          ],
        });

        return;
      }

      if (result === "draw") {
        game.finished = true;

        await interaction.update({
          content:
            `🤝 **تعادل!**\n\n` +
            `❌ ${game.playerX}  ضد  ⭕ ${game.playerO}`,
          components: [
            ...createBoard(gameId),
            ...createGameButtons(gameId),
          ],
        });

        return;
      }

      game.turn =
        game.turn === game.playerX.id
          ? game.playerO.id
          : game.playerX.id;

      await interaction.update({
        content: getStatus(game),
        components: createBoard(gameId),
      });

      return;
    }

    if (type === "xo-replay") {
      const game = games.get(gameId);

      if (!game) {
        await interaction.reply({
          content: "❌ اللعبة غير موجودة.",
          ephemeral: true,
        });
        return;
      }

      if (
        interaction.user.id !== game.playerX.id &&
        interaction.user.id !== game.playerO.id
      ) {
        await interaction.reply({
          content: "❌ أنت لست أحد لاعبي هذه المباراة.",
          ephemeral: true,
        });
        return;
      }

      game.board = Array(9).fill(null);
      game.turn = game.playerX.id;
      game.finished = false;

      await interaction.update({
        content: getStatus(game),
        components: createBoard(gameId),
      });

      return;
    }

    if (type === "xo-end") {
      const game = games.get(gameId);

      if (!game) {
        await interaction.reply({
          content: "❌ اللعبة غير موجودة.",
          ephemeral: true,
        });
        return;
      }

      if (
        interaction.user.id !== game.playerX.id &&
        interaction.user.id !== game.playerO.id
      ) {
        await interaction.reply({
          content: "❌ أنت لست أحد لاعبي هذه المباراة.",
          ephemeral: true,
        });
        return;
      }

      game.finished = true;
      games.delete(gameId);

      await interaction.update({
        content: "🛑 **تم إنهاء لعبة XO.**",
        components: [],
      });
    }
  } catch (error) {
    console.error("Interaction error:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ حدث خطأ غير متوقع.",
        ephemeral: true,
      });
    }
  }
});

client.login(TOKEN);
