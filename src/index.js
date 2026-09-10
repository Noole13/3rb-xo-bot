import { createServer } from "node:http";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Events,
  REST,
  Routes,
  GatewayIntentBits,
  SlashCommandBuilder,
  MessageFlags,
} from "discord.js";

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const PORT = process.env.PORT || 10000;

if (!TOKEN) {
  throw new Error("Missing DISCORD_TOKEN");
}

if (!CLIENT_ID) {
  throw new Error("Missing DISCORD_CLIENT_ID");
}

/*
|--------------------------------------------------------------------------
| Render Web Service
|--------------------------------------------------------------------------
*/

const server = createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });

  res.end("3RB XO Bot is online.");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Web server listening on port ${PORT}`);
});

/*
|--------------------------------------------------------------------------
| Discord Client
|--------------------------------------------------------------------------
*/

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

/*
|--------------------------------------------------------------------------
| Games
|--------------------------------------------------------------------------
*/

const games = new Map();

/*
|--------------------------------------------------------------------------
| Slash Command
|--------------------------------------------------------------------------
*/

const xoCommand = new SlashCommandBuilder()
  .setName("xo")
  .setDescription("لعب لعبة XO مع لاعب آخر")
  .addUserOption((option) =>
    option
      .setName("player")
      .setDescription("اختر اللاعب الذي تريد اللعب ضده")
      .setRequired(true)
  );

/*
|--------------------------------------------------------------------------
| Register Slash Command
|--------------------------------------------------------------------------
*/

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: [xoCommand.toJSON()],
  });

  console.log("Slash command /xo registered successfully.");
}

/*
|--------------------------------------------------------------------------
| XO Board
|--------------------------------------------------------------------------
*/

function createBoard(gameId) {
  const game = games.get(gameId);

  if (!game) {
    return [];
  }

  const board = [];

  for (let i = 0; i < 9; i += 1) {
    const value = game.board[i];

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
    new ActionRowBuilder().addComponents(
      board[0],
      board[1],
      board[2]
    ),

    new ActionRowBuilder().addComponents(
      board[3],
      board[4],
      board[5]
    ),

    new ActionRowBuilder().addComponents(
      board[6],
      board[7],
      board[8]
    ),
  ];
}

/*
|--------------------------------------------------------------------------
| Game End Buttons
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Check Winner
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Create Game
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Game Status
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Discord Ready
|--------------------------------------------------------------------------
*/

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);

  try {
    await registerCommands();
  } catch (error) {
    console.error("Failed to register slash commands:", error);
  }
});

/*
|--------------------------------------------------------------------------
| Interactions
|--------------------------------------------------------------------------
*/

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | /xo
    |--------------------------------------------------------------------------
    */

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName !== "xo") {
        return;
      }

      const opponent = interaction.options.getUser(
        "player",
        true
      );

      const creator = interaction.user;

      if (opponent.bot) {
        await interaction.reply({
          content: "❌ لا يمكنك اللعب ضد بوت.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      if (opponent.id === creator.id) {
        await interaction.reply({
          content: "❌ لا يمكنك اللعب ضد نفسك.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      const existingGame = [...games.values()].find(
        (game) =>
          !game.finished &&
          (
            game.playerX.id === creator.id ||
            game.playerO.id === creator.id ||
            game.playerX.id === opponent.id ||
            game.playerO.id === opponent.id
          )
      );

      if (existingGame) {
        await interaction.reply({
          content:
            "❌ أحد اللاعبين موجود بالفعل في لعبة XO أخرى.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      const gameId = createGame(
        creator,
        opponent
      );

      const game = games.get(gameId);

      await interaction.reply({
        content: getStatus(game),
        components: createBoard(gameId),
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Buttons
    |--------------------------------------------------------------------------
    */

    if (!interaction.isButton()) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | XO Board Button
    |--------------------------------------------------------------------------
    */

    if (interaction.customId.startsWith("xo:")) {
      const [, gameId, indexText] =
        interaction.customId.split(":");

      const game = games.get(gameId);

      if (!game) {
        await interaction.reply({
          content: "❌ هذه اللعبة لم تعد موجودة.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      if (game.finished) {
        await interaction.reply({
          content: "❌ انتهت هذه اللعبة.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      if (
        interaction.user.id !== game.playerX.id &&
        interaction.user.id !== game.playerO.id
      ) {
        await interaction.reply({
          content:
            "❌ أنت لست أحد لاعبي هذه المباراة.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      if (interaction.user.id !== game.turn) {
        await interaction.reply({
          content: "⏳ ليس دورك الآن.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      const index = Number(indexText);

      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index > 8
      ) {
        await interaction.reply({
          content: "❌ حركة غير صالحة.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      if (game.board[index]) {
        await interaction.reply({
          content:
            "❌ هذا المربع مستخدم بالفعل.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      const symbol =
        interaction.user.id === game.playerX.id
          ? "❌"
          : "⭕";

      game.board[index] = symbol;

      const result = checkWinner(game.board);

      /*
      |--------------------------------------------------------------------------
      | Winner
      |--------------------------------------------------------------------------
      */

      if (
        result === "❌" ||
        result === "⭕"
      ) {
        game.finished = true;

        const winner =
          result === "❌"
            ? game.playerX
            : game.playerO;

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

      /*
      |--------------------------------------------------------------------------
      | Draw
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | Change Turn
      |--------------------------------------------------------------------------
      */

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

    /*
    |--------------------------------------------------------------------------
    | Replay
    |--------------------------------------------------------------------------
    */

    if (
      interaction.customId.startsWith(
        "xo-replay:"
      )
    ) {
      const [, gameId] =
        interaction.customId.split(":");

      const game = games.get(gameId);

      if (!game) {
        await interaction.reply({
          content: "❌ اللعبة غير موجودة.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      if (
        interaction.user.id !== game.playerX.id &&
        interaction.user.id !== game.playerO.id
      ) {
        await interaction.reply({
          content:
            "❌ أنت لست أحد لاعبي هذه المباراة.",
          flags: MessageFlags.Ephemeral,
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

    /*
    |--------------------------------------------------------------------------
    | End Game
    |--------------------------------------------------------------------------
    */

    if (
      interaction.customId.startsWith(
        "xo-end:"
      )
    ) {
      const [, gameId] =
        interaction.customId.split(":");

      const game = games.get(gameId);

      if (!game) {
        await interaction.reply({
          content: "❌ اللعبة غير موجودة.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      if (
        interaction.user.id !== game.playerX.id &&
        interaction.user.id !== game.playerO.id
      ) {
        await interaction.reply({
          content:
            "❌ أنت لست أحد لاعبي هذه المباراة.",
          flags: MessageFlags.Ephemeral,
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
    console.error(
      "Interaction error:",
      error.rawError ? JSON.stringify(error.rawError, null, 2) : error
    );

    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ حدث خطأ غير متوقع.",
          flags: MessageFlags.Ephemeral,
        });
      } else if (interaction.deferred && !interaction.replied) {
        await interaction.followUp({
          content: "❌ حدث خطأ غير متوقع.",
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (replyError) {
      console.error("Failed to send error response:", replyError);
    }
  }
});

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

client.login(TOKEN);
