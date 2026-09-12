import { createServer } from "node:http";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set } from "firebase/database";

import {
  Client,
  Events,
  REST,
  Routes,
  GatewayIntentBits,
  SlashCommandBuilder,
  MessageFlags,
} from "discord.js";

import {
  games,
  createGame,
  createBoard,
  createGameButtons,
  checkWinner,
  getStatus,
  getBotMove,
} from "./xoGame.js";

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
| Firebase Initialization
|--------------------------------------------------------------------------
*/

const firebaseConfig = {
  databaseURL:
    process.env.FIREBASE_DATABASE_URL ||
    "https://rbgames-4ee8e-default-rtdb.firebaseio.com/",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

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
| Database Functions
|--------------------------------------------------------------------------
*/

async function addWin(userId) {
  try {
    const userRef = ref(db, `leaderboard/${userId}`);
    const snapshot = await get(userRef);

    let currentWins = 0;

    if (snapshot.exists()) {
      currentWins = snapshot.val().wins || 0;
    }

    await set(userRef, {
      wins: currentWins + 1,
    });
  } catch (e) {
    console.error("Error saving win to Firebase:", e);
  }
}

/*
|--------------------------------------------------------------------------
| Slash Commands
|--------------------------------------------------------------------------
*/

const xoCommand = new SlashCommandBuilder()
  .setName("xo")
  .setDescription("لعب لعبة XO مع لاعب آخر أو ضد البوت")
  .addUserOption((option) =>
    option
      .setName("player")
      .setDescription("اختر اللاعب (اتركه فارغاً للعب ضد البوت)")
      .setRequired(false)
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
| Helper: Create Game with Alternating Turns against Bot
|--------------------------------------------------------------------------
*/

// خريطة لتتبع دور البدء لكل مستخدم ضد البوت (true = البوت يبدأ أولاً، false = العضو يبدأ أولاً)
const botTurnToggle = new Map();

function createAlternatingGame(creator, opponent) {
  let pX = creator;
  let pO = opponent;
  let botStartsFirst = false;

  // إذا كان اللعب ضد البوت، نقوم بالتبديل بينهما
  if (opponent.bot) {
    const lastBotFirst = botTurnToggle.get(creator.id) || false;
    // نعكس الحالة للعبة القادمة
    botTurnToggle.set(creator.id, !lastBotFirst);

    if (!lastBotFirst) {
      // هذه المرة البوت يبدأ أولاً (البوت هو X والعضو هو O)
      pX = opponent;
      pO = creator;
      botStartsFirst = true;
    }
  }

  const gameId = createGame(pX, pO);
  const game = games.get(gameId);

  // إذا كان البوت هو من يبدأ، نحسب حركته الأولى بدقة ونضعها في اللوحة، ثم نعطي الدور للعضو
  if (game && game.isVsBot && botStartsFirst) {
    const botIndex = getBotMove(game.board, "❌");
    if (botIndex !== null && botIndex !== undefined) {
      game.board[botIndex] = "❌";
      // تعيين الدور بدقة تامة للعضو (playerO)
      game.turn = game.playerO.id;
    }
  }

  return gameId;
}

/*
|--------------------------------------------------------------------------
| Interactions
|--------------------------------------------------------------------------
*/

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Slash Commands
    |--------------------------------------------------------------------------
    */

    if (interaction.isChatInputCommand()) {
      /*
      |--------------------------------------------------------------------------
      | /top
      |--------------------------------------------------------------------------
      */

      if (interaction.commandName === "top") {
        await interaction.deferReply();

        try {
          const leaderboardRef = ref(db, "leaderboard");
          const snapshot = await get(leaderboardRef);

          if (!snapshot.exists()) {
            await interaction.editReply({
              content: "📊 لا توجد انتصارات مسجلة حتى الآن.",
            });

            return;
          }

          const data = snapshot.val();

          const sorted = Object.entries(data)
            .sort(
              ([, a], [, b]) =>
                (b.wins || 0) - (a.wins || 0)
            )
            .slice(0, 3);

          if (sorted.length === 0) {
            await interaction.editReply({
              content: "📊 لا توجد انتصارات مسجلة حتى الآن.",
            });

            return;
          }

          let desc = "🏆 **أفضل 3 لاعبين في لعبة XO**\n\n";

          const medals = ["🥇", "🥈", "🥉"];

          sorted.forEach(([userId, userData], index) => {
            desc += `${medals[index]} <@${userId}> — **${userData.wins}** فوز\n`;
          });

          await interaction.editReply({
            content: desc,
          });
        } catch (dbError) {
          console.error(
            "Error fetching leaderboard from Firebase:",
            dbError
          );

          await interaction.editReply({
            content: "❌ حدث خطأ أثناء جلب لوحة الشرف.",
          });
        }

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | /xo
      |--------------------------------------------------------------------------
      */

      if (interaction.commandName !== "xo") {
        return;
      }

      let opponent = interaction.options.getUser("player");
      const creator = interaction.user;

      if (!opponent) {
        opponent = client.user;
      }

      if (opponent.id === creator.id) {
        await interaction.reply({
          content: "❌ لا يمكنك اللعب ضد نفسك.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Remove old games for these players
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | Create Game (Using Alternating Helper)
      |--------------------------------------------------------------------------
      */

      const gameId = createAlternatingGame(creator, opponent);
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
    | XO Board Buttons
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

      /*
      |--------------------------------------------------------------------------
      | Check Player
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | Check Turn
      |--------------------------------------------------------------------------
      */

      if (interaction.user.id !== game.turn) {
        await interaction.deferUpdate();
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
          content: "❌ هذا المربع مستخدم بالفعل.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Player Move
      |--------------------------------------------------------------------------
      */

      const symbol =
        interaction.user.id === game.playerX.id
          ? "❌"
          : "⭕";

      game.board[index] = symbol;

      /*
      |--------------------------------------------------------------------------
      | Handle Game End
      |--------------------------------------------------------------------------
      */

      const handleGameEnd = async (resType) => {
        game.finished = true;

        /*
        |--------------------------------------------------------------------------
        | WIN
        |--------------------------------------------------------------------------
        */

        if (resType === "❌" || resType === "⭕") {
          const winner =
            resType === "❌"
              ? game.playerX
              : game.playerO;

          const loser =
            resType === "❌"
              ? game.playerO
              : game.playerX;

          /*
          |--------------------------------------------------------------------------
          | Save Human Win
          |--------------------------------------------------------------------------
          */

          if (!winner.bot) {
            await addWin(winner.id);
          }

          /*
          |--------------------------------------------------------------------------
          | Lock Original Game Message
          |--------------------------------------------------------------------------
          */

          await interaction.update({
            components: [
              ...createBoard(gameId),
              ...createGameButtons(gameId, false),
            ],
          });

          /*
          |--------------------------------------------------------------------------
          | RESULT MESSAGE
          |--------------------------------------------------------------------------
          */

          await interaction.channel.send({
            content:
              `🏆 **انتهت اللعبة!**\n\n` +
              `❌ ${game.playerX}  ضد  ⭕ ${game.playerO}\n` +
              `👑 الفائز: ${winner} (${resType})\n` +
              `💤 الخاسر: ${loser} (${
                resType === "❌" ? "⭕" : "❌"
              })`,
          });

          /*
          |--------------------------------------------------------------------------
          | BOT TAUNT
          |--------------------------------------------------------------------------
          */

          if (winner.bot) {
            const botTaunts = [
              "ارقد ارقد 🤣",
              "تعقب تفوز علي يا وحش 🥱",
              "فهمت اللعبة ولا نعلمك من جديد؟ 🤫",
              "بدري عليك تفوز، حاول مرة أخرى ☕",
              "وين اللي يقول بفوز؟ خذ لك صفقة هياط 👏",
              "ههههههه بدري عليك يا غالي 🤫",
            ];

            const randomTaunt =
              botTaunts[
                Math.floor(
                  Math.random() * botTaunts.length
                )
              ];

            await interaction.channel.send({
              content: randomTaunt,
              allowedMentions: {
                parse: [],
              },
            });
          }

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | DRAW
        |--------------------------------------------------------------------------
        */

        if (resType === "draw") {
          game.finished = true;

          await interaction.update({
            components: [
              ...createBoard(gameId),
              ...createGameButtons(gameId, false),
            ],
          });

          await interaction.channel.send({
            content:
              `🤝 **انتهت اللعبة بالتعادل!**\n\n` +
              `❌ ${game.playerX}  ضد  ⭕ ${game.playerO}`,
          });

          const drawTaunts = [
            "والله ماتفوز ريح نفسك 🤣",
            "تعادل وتشوف نفسك؟ مافي فوز يعني مافي فوز 🤫",
            "محاولة جيدة بس الحظ ما يكفي ضد الذكاء الاصطناعي 🥱",
            "تعادل مرة ومرتين.. والله ماتفوز! ☕",
          ];

          const randomDrawTaunt =
            drawTaunts[
              Math.floor(
                Math.random() * drawTaunts.length
              )
            ];

          await interaction.channel.send({
            content: randomDrawTaunt,
            allowedMentions: {
              parse: [],
            },
          });

          return;
        }
      };

      /*
      |--------------------------------------------------------------------------
      | Check Player Win
      |--------------------------------------------------------------------------
      */

      let result = checkWinner(game.board);

      if (result) {
        await handleGameEnd(result);
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Switch Turn (Player to Bot or vice versa)
      |--------------------------------------------------------------------------
      */

      game.turn =
        game.turn === game.playerX.id
          ? game.playerO.id
          : game.playerX.id;

      /*
      |--------------------------------------------------------------------------
      | Bot Move (If it's bot's turn)
      |--------------------------------------------------------------------------
      */

      if (game.isVsBot && !game.finished) {
        const isBotTurn =
          (game.turn === game.playerX.id && game.playerX.bot) ||
          (game.turn === game.playerO.id && game.playerO.bot);

        if (isBotTurn) {
          const botSymbol = game.turn === game.playerX.id ? "❌" : "⭕";
          const botIndex = getBotMove(game.board, botSymbol);

          if (botIndex !== null && botIndex !== undefined) {
            game.board[botIndex] = botSymbol;

            /*
            |--------------------------------------------------------------------------
            | Check Bot Win
            |--------------------------------------------------------------------------
            */

            result = checkWinner(game.board);

            if (result) {
              await handleGameEnd(result);
              return;
            }

            /*
            |--------------------------------------------------------------------------
            | Return Turn To Human Player
            |--------------------------------------------------------------------------
            */

            game.turn =
              game.turn === game.playerX.id
                ? game.playerO.id
                : game.playerX.id;
          }
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Update Current Game Message
      |--------------------------------------------------------------------------
      */

      await interaction.update({
        content: getStatus(game),
        components: createBoard(gameId),
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Replay Button
    |--------------------------------------------------------------------------
    */

    if (interaction.customId.startsWith("xo-replay:")) {
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
          content: "❌ أنت لست أحد لاعبي هذه المباراة.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Finish Old Game
      |--------------------------------------------------------------------------
      */

      game.finished = true;

      await interaction.update({
        components: [
          ...createBoard(gameId),
          ...createGameButtons(gameId, true),
        ],
      });

      /*
      |--------------------------------------------------------------------------
      | Create New Game (Using Alternating Helper for Replay)
      |--------------------------------------------------------------------------
      */

      const humanPlayer = game.playerX.bot ? game.playerO : game.playerX;
      const botPlayer = game.playerX.bot ? game.playerX : game.playerO;

      const newGameId = createAlternatingGame(humanPlayer, botPlayer);
      const newGame = games.get(newGameId);

      /*
      |--------------------------------------------------------------------------
      | Send New Game As New Message
      |--------------------------------------------------------------------------
      */

      await interaction.channel.send({
        content: getStatus(newGame),
        components: createBoard(newGameId),
      });

      return;
    }
  } catch (error) {
    console.error(
      "Interaction error:",
      error.rawError
        ? JSON.stringify(error.rawError, null, 2)
        : error
    );

    try {
      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content: "❌ حدث خطأ غير متوقع.",
          flags: MessageFlags.Ephemeral,
        });
      } else if (
        interaction.deferred &&
        !interaction.replied
      ) {
        await interaction.editReply({
          content: "❌ حدث خطأ غير متوقع.",
        });
      }
    } catch (replyError) {
      console.error(
        "Failed to send error response:",
        replyError
      );
    }
  }
});

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

client.login(TOKEN);
