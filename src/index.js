import { createServer } from "node:http";
import fs from "node:fs";

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

// استدعاء حزمة فايربيس بصيغة ES Modules
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const PORT = process.env.PORT || 10000;

const SPECIAL_USER_ID = "1521900880222490743";

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
| Firebase Setup (Realtime Database)
|--------------------------------------------------------------------------
*/

// قراءة بيانات المفتاح السري من متغيرات البيئة على Render أو من الملف محلياً للتجربة
let serviceAccount;
if (process.env.FIREBASE_CONFIG_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG_JSON);
  // إصلاح مشكلة الأسطر الجديدة في المفتاح الخاص لضمان المصادقة الصحيحة
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
} else {
  serviceAccount = JSON.parse(fs.readFileSync("./firebase-key.json", "utf8"));
}

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://rbgames-4ee8e-default-rtdb.firebaseio.com",
});

const db = getDatabase();

/*
|--------------------------------------------------------------------------
| Database Helper Functions
|--------------------------------------------------------------------------
*/

// زيادة عدد الانتصارات في الفايربيس
async function addWin(userId) {
  try {
    const userWinsRef = db.ref(`leaderboard/${userId}/wins`);
    await userWinsRef.transaction((currentWins) => (currentWins || 0) + 1);
  } catch (error) {
    console.error("Error updating win in Firebase:", error);
  }
}

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
| Slash Commands
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

const topCommand = new SlashCommandBuilder()
  .setName("top")
  .setDescription("عرض أفضل 3 لاعبين في لعبة XO");

/*
|--------------------------------------------------------------------------
| Register Slash Commands
|--------------------------------------------------------------------------
*/

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: [xoCommand.toJSON(), topCommand.toJSON()],
  });

  console.log("Slash commands registered successfully.");
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

/*
|--------------------------------------------------------------------------
| Game Buttons (Replay Only)
|--------------------------------------------------------------------------
*/

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
    | Slash Commands (/xo and /top)
    |--------------------------------------------------------------------------
    */

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "top") {
        // جلب قائمة الأوائل المحدثة مباشرة من فايربيس
        const snapshot = await db.ref("leaderboard").once("value");
        const leaderboardData = snapshot.val() || {};

        const sorted = Object.entries(leaderboardData)
          .sort(([, a], [, b]) => (b.wins || 0) - (a.wins || 0))
          .slice(0, 3);

        if (sorted.length === 0) {
          await interaction.reply({
            content: "📊 لا توجد انتصارات مسجلة حتى الآن.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        let desc = "🏆 **أفضل 3 لاعبين في لعبة XO**\n\n";
        const medals = ["🥇", "🥈", "🥉"];

        sorted.forEach(([userId, data], index) => {
          desc += `${medals[index]} <@${userId}> — **${data.wins || 0}** فوز\n`;
        });

        await interaction.reply({
          content: desc,
        });

        return;
      }

      if (interaction.commandName !== "xo") {
        return;
      }

      const opponent = interaction.options.getUser("player", true);
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

      for (const [id, g] of games.entries()) {
        if (
          !g.finished &&
          (
            g.playerX.id === creator.id ||
            g.playerO.id === creator.id ||
            g.playerX.id === opponent.id ||
            g.playerO.id === opponent.id
          )
        ) {
          g.finished = true;
          games.delete(id);
        }
      }

      const gameId = createGame(creator, opponent);
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

    if (interaction.customId.startsWith("xo:")) {
      const [, gameId, indexText] = interaction.customId.split(":");
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
          content: "❌ أنت لست أحد لاعبي هذه المباراة.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (interaction.user.id !== game.turn) {
        await interaction.deferUpdate();
        return;
      }

      const index = Number(indexText);

      if (!Number.isInteger(index) || index < 0 || index > 8) {
        await interaction.reply({
          content: "❌ حركة غير صالحة.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (game.board[index]) {
        await interaction.reply({
          content: "❌ هذا المربع مستخدم بالفعل.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const symbol = interaction.user.id === game.playerX.id ? "❌" : "⭕";
      game.board[index] = symbol;

      const result = checkWinner(game.board);

      if (result === "❌" || result === "⭕") {
        game.finished = true;

        const winner = result === "❌" ? game.playerX : game.playerO;
        const loser = result === "❌" ? game.playerO : game.playerX;
        const winnerSymbol = result;
        const loserSymbol = result === "❌" ? "⭕" : "❌";

        // تسجيل الفوز في قاعدة بيانات فايربيس
        await addWin(winner.id);

        await interaction.update({
          content: `🏁 **انتهت اللعبة!**\n❌ ${game.playerX}  ضد  ⭕ ${game.playerO}`,
          components: [
            ...createBoard(gameId),
            ...createGameButtons(gameId, false),
          ],
        });

        if (loser.id === SPECIAL_USER_ID) {
          await interaction.channel.send({
            content:
              `🏆 **انتهت اللعبة!**\n\n` +
              `👑 الفائز: ${winner} ${winnerSymbol}\n` +
              `✨ الحق يُقال: <@${SPECIAL_USER_ID}> هي الفائزة الأساسية باللعب الحقيقي، وألف مبروك الفوز حتى لا تزعلي! 💙\n` +
              `💤 الخاسر: ${loser} ${loserSymbol}`,
          });
        } else {
          await interaction.channel.send({
            content:
              `🏆 **انتهت اللعبة!**\n\n` +
              `👑 الفائز: ${winner} ${winnerSymbol}\n` +
              `💤 الخاسر: ${loser} ${loserSymbol}`,
          });
        }

        return;
      }

      if (result === "draw") {
        game.finished = true;

        await interaction.update({
          content: `🤝 **تعادل!**\n\n❌ ${game.playerX}  ضد  ⭕ ${game.playerO}`,
          components: [
            ...createBoard(gameId),
            ...createGameButtons(gameId, false),
          ],
        });

        await interaction.channel.send({
          content: `🤝 **انتهت اللعبة بالتعادل!**\n\n❌ ${game.playerX}  ضد  ⭕ ${game.playerO}`,
        });

        return;
      }

      game.turn = game.turn === game.playerX.id ? game.playerO.id : game.playerX.id;

      await interaction.update({
        content: getStatus(game),
        components: createBoard(gameId),
      });

      return;
    }

    if (interaction.customId.startsWith("xo-replay:")) {
      const [, gameId] = interaction.customId.split(":");
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
          content: "❌ أنت لست أحد لاعبي هذه المباراة.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      game.finished = true;
      await interaction.update({
        components: [
          ...createBoard(gameId),
          ...createGameButtons(gameId, true),
        ],
      });

      const newGameId = createGame(game.playerX, game.playerO);
      const newGame = games.get(newGameId);

      await interaction.channel.send({
        content: getStatus(newGame),
        components: createBoard(newGameId),
      });

      return;
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
