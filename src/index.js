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
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
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

import { startQuiz } from "./quizGame.js";
import { startFlagQuiz } from "./flagGame.js";
import {
  chairGames,
  startChairGame,
  getRecruitmentComponents,
  getRecruitmentEmbed,
  runNextRound,
} from "./chairsGame.js";

// استيراد أمر التحديثات من الملف المنفصل
import { announcementCommand, executeAnnouncement } from "./announcements.js";

// استيراد دوال النقاط ولوحة الشرف الشاملة من ملف scores.js
import { addGameWin, getGlobalLeaderboard } from "./scores.js";

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

  res.end("3RB Games Bot is online.");
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
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

/*
|--------------------------------------------------------------------------
| Database Functions (Game Channel Settings)
|--------------------------------------------------------------------------
*/

async function getGameChannel(guildId) {
  try {
    const channelRef = ref(db, `guildSettings/${guildId}/gameChannelId`);
    const snapshot = await get(channelRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (e) {
    console.error("Error fetching game channel from Firebase:", e);
    return null;
  }
}

async function setGameChannel(guildId, channelId) {
  try {
    const channelRef = ref(db, `guildSettings/${guildId}`);
    await set(channelRef, {
      gameChannelId: channelId,
    });
  } catch (e) {
    console.error("Error saving game channel to Firebase:", e);
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
  .setDescription("عرض لوحة الشرف والترتيبات لألعاب السيرفر")
  .addStringOption((option) =>
    option
      .setName("game")
      .setDescription("اختر اللعبة لعرض ترتيبها، أو اختر الكل")
      .setRequired(false)
      .addChoices(
        { name: "🏆 جميع الألعاب", value: "all" },
        { name: "❌ ⭕ لعبة XO", value: "xo" },
        { name: "🪑 لعبة الكراسي", value: "chairs" },
        { name: "🌍 لعبة العواصم", value: "capitals" },
        { name: "🧠 الأسئلة العامة", value: "general" },
        { name: "🏴 لعبة الأعلام", value: "flags" }
      )
  );

const setChannelCommand = new SlashCommandBuilder()
  .setName("تعيين-قناة")
  .setDescription("تعيين القناة المخصصة لألعاب البوت في السيرفر")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("اختر القناة التي تريد جعلها مخصصة للألعاب")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

const chairsCommand = new SlashCommandBuilder()
  .setName("كراسي")
  .setDescription("بدء لعبة الكراسي الموسيقية الجماعية في الشات");

/*
|--------------------------------------------------------------------------
| Register Slash Commands
|--------------------------------------------------------------------------
*/

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: [
      xoCommand.toJSON(),
      topCommand.toJSON(),
      setChannelCommand.toJSON(),
      chairsCommand.toJSON(),
      announcementCommand.toJSON(),
    ],
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
| Message Create (For Quiz / Text Commands & Channel Restriction)
|--------------------------------------------------------------------------
*/

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  // أوامر الألعاب (العواصم، الأسئلة، الأعلام)
  if (
    message.content === "!عواصم" ||
    message.content === "!سؤال" ||
    message.content === "!اعلام" ||
    message.content === "!flags"
  ) {
    const allowedChannelId = await getGameChannel(message.guild.id);

    if (!allowedChannelId) {
      return message.reply({
        content:
          "⚠️ لم يتم تحديد قناة للألعاب بعد! يرجى من أحد المشرفين استخدام أمر السلاش `/تعيين-قناة` لتحديدها.",
      });
    }

    if (message.channel.id !== allowedChannelId) {
      return message.reply({
        content: `⚠️ يرجى استخدام ألعاب البوت في القناة المخصصة فقط: <#${allowedChannelId}>!`,
      });
    }

    if (message.content === "!عواصم") {
      await startQuiz(message, "capitals", db);
    } else if (message.content === "!سؤال") {
      await startQuiz(message, "general", db);
    } else if (message.content === "!اعلام" || message.content === "!flags") {
      await startFlagQuiz(message, db);
    }
  }
});

/*
|--------------------------------------------------------------------------
| Interactions
|--------------------------------------------------------------------------
*/

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      /*
      |--------------------------------------------------------------------------
      | /إعلان-التحديثات
      |--------------------------------------------------------------------------
      */
      if (interaction.commandName === "إعلان-التحديثات") {
        await executeAnnouncement(interaction);
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | /تعيين-قناة
      |--------------------------------------------------------------------------
      */
      if (interaction.commandName === "تعيين-قناة") {
        const channel = interaction.options.getChannel("channel");

        await setGameChannel(interaction.guildId, channel.id);

        await interaction.reply({
          content: `✅ تم تعيين القناة **<#${channel.id}>** كقناة رسمية للألعاب في هذا السيرفر بنجاح! 🎮`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | /top (لوحة الشرف الشاملة أو حسب اللعبة المحددة)
      |--------------------------------------------------------------------------
      */
      if (interaction.commandName === "top") {
        await interaction.deferReply();

        try {
          const selectedGame = interaction.options.getString("game") || "all";
          const data = await getGlobalLeaderboard(db, interaction.guildId);

          if (!data) {
            await interaction.editReply({
              content: "📊 لا توجد أي انتصارات أو نقاط مسجلة في السيرفر حتى الآن.",
            });
            return;
          }

          const gamesList = {
            xo: "❌ ⭕ لعبة XO",
            chairs: "🪑 لعبة الكراسي",
            capitals: "🌍 لعبة العواصم",
            general: "🧠 الأسئلة العامة",
            flags: "🏴 لعبة الأعلام",
          };

          const embed = new EmbedBuilder()
            .setColor(0xF1C40F)
            .setTimestamp();

          if (selectedGame !== "all") {
            const gameTitle = gamesList[selectedGame];
            embed.setTitle(`🏆 لوحة شرف ${gameTitle}`);
            embed.setDescription(`أفضل اللاعبين في لعبة **${gameTitle}** على مستوى السيرفر:`);

            const rankedPlayers = Object.entries(data)
              .map(([userId, userGames]) => ({
                userId,
                score: userGames[selectedGame] || 0,
              }))
              .filter((item) => item.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 10);

            if (rankedPlayers.length === 0) {
              await interaction.editReply({
                content: `📊 لا توجد انتصارات مسجلة في **${gameTitle}** حتى الآن.`,
              });
              return;
            }

            const medals = ["🥇", "🥈", "🥉"];
            let fieldText = "";

            rankedPlayers.forEach((player, index) => {
              const rankIcon = medals[index] || `\`#${index + 1}\``;
              fieldText += `${rankIcon} <@${player.userId}> — **${player.score}** فوز\n`;
            });

            embed.addFields({ name: "الترتيب", value: fieldText, inline: false });
          } else {
            embed.setTitle("🏆 لوحة الشرف الشاملة لألعاب السيرفر");
            embed.setDescription("إليك ترتيبيات اللاعبين وأفضل الهدافين في مختلف ألعاب البوت:");

            let hasAnyScore = false;

            for (const [gameKey, gameTitle] of Object.entries(gamesList)) {
              const rankedPlayers = Object.entries(data)
                .map(([userId, userGames]) => ({
                  userId,
                  score: userGames[gameKey] || 0,
                }))
                .filter((item) => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

              if (rankedPlayers.length > 0) {
                hasAnyScore = true;
                const medals = ["🥇", "🥈", "🥉"];
                let fieldText = "";

                rankedPlayers.forEach((player, index) => {
                  fieldText += `${medals[index]} <@${player.userId}> — **${player.score}** فوز\n`;
                });

                embed.addFields({ name: gameTitle, value: fieldText, inline: false });
              }
            }

            if (!hasAnyScore) {
              await interaction.editReply({
                content: "📊 لا توجد نتائج كافية لعرضها في لوحة الشرف حتى الآن.",
              });
              return;
            }
          }

          await interaction.editReply({ embeds: [embed] });
        } catch (dbError) {
          console.error("Error fetching global leaderboard:", dbError);
          await interaction.editReply({
            content: "❌ حدث خطأ أثناء جلب لوحة الشرف.",
          });
        }

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | /كراسي (لعبة الكراسي)
      |--------------------------------------------------------------------------
      */
      if (interaction.commandName === "كراسي") {
        const allowedChannelId = await getGameChannel(interaction.guildId);

        if (!allowedChannelId) {
          await interaction.reply({
            content:
              "⚠️ لم يتم تحديد قناة للألعاب بعد! يرجى من أحد المشرفين استخدام أمر السلاش `/تعيين-قناة` للبدء.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        if (interaction.channelId !== allowedChannelId) {
          await interaction.reply({
            content: `⚠️ يرجى استخدام ألعاب البوت في القناة المخصصة فقط: <#${allowedChannelId}>!`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const res = startChairGame(interaction, client.user);
        if (!res.success) {
          await interaction.reply({
            content: res.message,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const gameData = res.gameData;
        const embed = getRecruitmentEmbed(gameData);
        const components = getRecruitmentComponents();

        const replyMsg = await interaction.reply({
          embeds: [embed],
          components: [components],
          fetchReply: true,
        });

        gameData.message = replyMsg;
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

      const allowedChannelId = await getGameChannel(interaction.guildId);

      if (!allowedChannelId) {
        await interaction.reply({
          content:
            "⚠️ لم يتم تحديد قناة للألعاب بعد! يرجى من أحد المشرفين استخدام أمر السلاش `/تعيين-قناة` للبدء.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (interaction.channelId !== allowedChannelId) {
        await interaction.reply({
          content: `⚠️ يرجى لعب ألعاب البوت في القناة المخصصة فقط: <#${allowedChannelId}>!`,
          flags: MessageFlags.Ephemeral,
        });
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

      for (const [id, g] of games.entries()) {
        if (
          !g.finished &&
          (g.playerX.id === creator.id ||
            g.playerO.id === creator.id ||
            g.playerX.id === opponent.id ||
            g.playerO.id === opponent.id)
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
    | Buttons Interactions
    |--------------------------------------------------------------------------
    */

    if (!interaction.isButton()) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Chair Game Buttons
    |--------------------------------------------------------------------------
    */
    if (interaction.customId.startsWith("chair_")) {
      const channelId = interaction.channelId;
      const gameData = chairGames.get(channelId);

      if (!gameData) {
        await interaction.reply({
          content: "❌ لا توجد لعبة كراسي نشطة في هذه القناة حالياً.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const userId = interaction.user.id;

      if (interaction.customId === "chair_join") {
        if (gameData.state !== "recruiting") {
          return interaction.reply({
            content: "❌ لقد بدأت اللعبة بالفعل، لا يمكنك الانضمام الآن!",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (gameData.players.has(userId)) {
          return interaction.reply({
            content: "⚠️ أنت منضم بالفعل إلى هذه اللعبة!",
            flags: MessageFlags.Ephemeral,
          });
        }

        gameData.players.add(userId);
        await interaction.update({
          embeds: [getRecruitmentEmbed(gameData)],
        });
        return;
      }

      if (interaction.customId === "chair_start") {
        if (
          userId !== gameData.hostId &&
          !interaction.member.permissions.has("ManageChannels")
        ) {
          return interaction.reply({
            content: "❌ صاحب اللعبة أو المشرفون فقط هم من يمكنهم بدء اللعبة!",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (gameData.players.size < 2) {
          return interaction.reply({
            content: "⚠️ الحد الأدنى للبدء هو لاعبين اثنين (2) على الأقل!",
            flags: MessageFlags.Ephemeral,
          });
        }

        gameData.state = "playing";
        gameData.activePlayersInRound = Array.from(gameData.players);

        await interaction.update({
          content: "🎮 **بدأت لعبة الكراسي! استعدوا للجولات...**",
          embeds: [getRecruitmentEmbed(gameData)],
          components: [],
        });

        setTimeout(() => {
          runNextRound(
            interaction.channel,
            gameData,
            (gid, uid) => addGameWin(db, gid, uid, "chairs"),
            interaction.guildId
          );
        }, 1000);

        return;
      }

      if (interaction.customId === "chair_cancel") {
        if (
          userId !== gameData.hostId &&
          !interaction.member.permissions.has("ManageChannels")
        ) {
          return interaction.reply({
            content: "❌ صاحب اللعبة أو المشرفون فقط يمكنهم إلغاؤها!",
            flags: MessageFlags.Ephemeral,
          });
        }

        chairGames.delete(channelId);
        await interaction.update({
          content: "❌ **تم إلغاء لعبة الكراسي بنجاح.**",
          embeds: [],
          components: [],
        });
        return;
      }

      if (interaction.customId === "chair_sit") {
        if (gameData.state !== "playing") {
          return interaction.reply({
            content: "❌ ليست هناك جولة جلوس نشطة حالياً!",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (!gameData.activePlayersInRound.includes(userId)) {
          return interaction.reply({
            content: "❌ أنت لست مشاركاً في هذه الجولة.",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (gameData.clickedInRound.has(userId)) {
          return interaction.reply({
            content: "⚠️ لقد ضغطت مسبقاً! انتظر نتيجة الجولة.",
            flags: MessageFlags.Ephemeral,
          });
        }

        gameData.clickedInRound.add(userId);
        return interaction.reply({
          content: "🪑 لقد جلست بنجاح! انتظر لنرى إن كنت ضمن الناجين.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | XO Board Buttons
    |--------------------------------------------------------------------------
    */
    if (interaction.customId.startsWith("xo:")) {
      const [, gameId, indexText] = interaction.customId.split(":");
      const game = games.get(gameId);

      if (!game || game.finished) {
        await interaction.reply({
          content: "❌ هذه اللعبة غير موجودة أو انتهت.",
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
      if (!Number.isInteger(index) || index < 0 || index > 8 || game.board[index]) {
        await interaction.reply({
          content: "❌ حركة غير صالحة أو المربع مستخدم.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const symbol = interaction.user.id === game.playerX.id ? "❌" : "⭕";
      game.board[index] = symbol;

      const handleGameEnd = async (resType) => {
        game.finished = true;

        if (resType === "❌" || resType === "⭕") {
          const winner = resType === "❌" ? game.playerX : game.playerO;
          const loser = resType === "❌" ? game.playerO : game.playerX;

          if (!winner.bot) {
            await addGameWin(db, interaction.guildId, winner.id, "xo");
          }

          await interaction.update({
            components: [
              ...createBoard(gameId),
              ...createGameButtons(gameId, false),
            ],
          });

          await interaction.channel.send({
            content:
              `🏆 **انتهت اللعبة!**\n\n` +
              `❌ ${game.playerX}  ضد  ⭕ ${game.playerO}\n` +
              `👑 الفائز: ${winner} (${resType})\n` +
              `💤 الخاسر: ${loser} (${resType === "❌" ? "⭕" : "❌"})`,
          });

          if (winner.bot) {
            const botTaunts = [
              "ارقد ارقد 🤣",
              "تعقب تفوز علي يا وحش 🥱",
              "فهمت اللعبة ولا نعلمك من جديد؟ 🤫",
              "بدري عليك تفوز، حاول مرة أخرى ☕",
            ];
            const randomTaunt = botTaunts[Math.floor(Math.random() * botTaunts.length)];
            await interaction.channel.send({
              content: randomTaunt,
              allowedMentions: { parse: [] },
            });
          }
          return;
        }

        if (resType === "draw") {
          game.finished = true;
          await interaction.update({
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
      };

      let result = checkWinner(game.board);
      if (result) {
        await handleGameEnd(result);
        return;
      }

      game.turn = game.turn === game.playerX.id ? game.playerO.id : game.playerX.id;

      if (game.isVsBot && !game.finished) {
        const isBotTurn =
          (game.turn === game.playerX.id && game.playerX.bot) ||
          (game.turn === game.playerO.id && game.playerO.bot);

        if (isBotTurn) {
          const botSymbol = game.turn === game.playerX.id ? "❌" : "⭕";
          const botIndex = getBotMove(game.board, botSymbol);

          if (botIndex !== null && botIndex !== undefined) {
            game.board[botIndex] = botSymbol;
            result = checkWinner(game.board);

            if (result) {
              await handleGameEnd(result);
              return;
            }

            game.turn = game.turn === game.playerX.id ? game.playerO.id : game.playerX.id;
          }
        }
      }

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
      const [, gameId] = interaction.customId.split(":");
      const game = games.get(gameId);

      if (!game || (interaction.user.id !== game.playerX.id && interaction.user.id !== game.playerO.id)) {
        await interaction.reply({
          content: "❌ لا يمكنك إعادة اللعب.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      game.finished = true;
      await interaction.update({
        components: [...createBoard(gameId), ...createGameButtons(gameId, true)],
      });

      const humanPlayer = game.playerX.bot ? game.playerO : game.playerX;
      const botPlayer = game.playerX.bot ? game.playerX : game.playerO;

      const newGameId = createGame(humanPlayer, botPlayer);
      const newGame = games.get(newGameId);

      await interaction.channel.send({
        content: getStatus(newGame),
        components: createBoard(newGameId),
      });
      return;
    }
  } catch (error) {
    console.error("Interaction error:", error);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ حدث خطأ غير متوقع.",
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (e) {
      console.error("Error sending error reply:", e);
    }
  }
});

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/
client.login(TOKEN);
