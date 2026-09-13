import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { addGameWin } from "./scores.js";
import fs from "fs";
import path from "path";

// خريطة لتخزين ألعاب المليون النشطة لكل قناة
export const millionGames = new Map();

// قائمة الأسئلة متدرجة الصعوبة (من الأسهل إلى الأصعب وصولاً للمليون)
const millionQuestions = [
  {
    level: 1,
    prize: "100",
    question: "ما هو لون السماء الصافية في النهار؟",
    options: ["أحمر", "أزرق", "أخضر", "أصفر"],
    correct: 2,
  },
  {
    level: 2,
    prize: "1,000",
    question: "كم عدد أيام السنة الهجرية؟",
    options: ["354 أو 355 يوماً", "365 يوماً", "366 يوماً", "300 يوم"],
    correct: 1,
  },
  {
    level: 3,
    prize: "10,000",
    question: "ما هي عاصمة دولة اليابان؟",
    options: ["سيول", "بكين", "طوكيو", "بانكوك"],
    correct: 3,
  },
  {
    level: 4,
    prize: "100,000",
    question: "في أي عام هبط الإنسان على سطح القمر لأول مرة؟",
    options: ["1965", "1969", "1973", "1981"],
    correct: 2,
  },
  {
    level: 5,
    prize: "1,000,000 🏆",
    question: "من هو القائد المسلم الذي انتصر في معركة عين جالوت؟",
    options: ["صلاح الدين الأيوبي", "سوزان بايبارس", "قطز", "المظفر قطز / طغرل بك"],
    correct: 3,
  },
];

// دالة مساعدة لتقسيم النصوص الطويلة داخل الصورة
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, currentY);
  return currentY;
}

// دالة لتوليد صورة السؤال والخيارات عبر @napi-rs/canvas
async function generateMillionQuestionImage(currentQ) {
  const canvas = createCanvas(900, 500);
  const ctx = canvas.getContext("2d");

  const bannerPath = path.resolve("million_banner.png");
  
  if (fs.existsSync(bannerPath)) {
    try {
      const background = await loadImage(bannerPath);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } catch (e) {
      ctx.fillStyle = "#0B1D3A";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  } else {
    ctx.fillStyle = "#0B1D3A";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // طبقة تظليل خفيفة لوضوح النصوص
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // كتابة رقم السؤال والجائزة
  ctx.font = "bold 24px sans-serif";
  ctx.fillStyle = "#F1C40F";
  ctx.textAlign = "right";
  ctx.fillText(`السؤال ${currentQ.level} | الجائزة: $${currentQ.prize}`, 850, 55);

  // كتابة نص السؤال
  ctx.font = "bold 26px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "right";
  const lastY = wrapText(ctx, currentQ.question, 850, 110, 800, 38);

  // رسم مربعات الخيارات الأربعة
  const optionsStartY = Math.max(lastY + 40, 220);
  const optionHeight = 45;
  const optionSpacing = 12;

  currentQ.options.forEach((option, index) => {
    const y = optionsStartY + index * (optionHeight + optionSpacing);
    
    ctx.fillStyle = "rgba(15, 30, 60, 0.85)";
    ctx.fillRect(50, y, 800, optionHeight);

    ctx.strokeStyle = "#3498DB";
    ctx.lineWidth = 2;
    ctx.strokeRect(50, y, 800, optionHeight);

    ctx.fillStyle = "#F1C40F";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${index + 1}️⃣`, 830, y + 29);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "19px sans-serif";
    ctx.fillText(option, 780, y + 29);
  });

  return canvas.toBuffer("image/png");
}

// دالة بدء اللعبة
export async function startMillionGame(messageOrInteraction, db, guildId) {
  const channelId = messageOrInteraction.channelId;

  if (millionGames.has(channelId)) {
    return { success: false, message: "⚠️ توجد لعبة 'من سيربح المليون' تعمل بالفعل في هذه القناة!" };
  }

  const hostId = messageOrInteraction.user ? messageOrInteraction.user.id : messageOrInteraction.author.id;

  const gameData = {
    hostId,
    db,
    guildId,
    state: "recruiting",
    players: new Set(),
    activePlayers: new Set(),
    currentQuestionIndex: 0,
    answersInRound: new Map(),
    message: null,
  };

  millionGames.set(channelId, gameData);
  return { success: true, gameData };
}

// أزرار التسجيل والانضمام للعبة
export function getMillionRecruitmentComponents() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("million_join")
      .setLabel("انضمام للمليون")
      .setStyle(ButtonStyle.Success)
      .setEmoji("💰"),
    new ButtonBuilder()
      .setCustomId("million_start")
      .setLabel("ابدأ التحدي")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("▶️"),
    new ButtonBuilder()
      .setCustomId("million_cancel")
      .setLabel("إلغاء")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("✖️")
  );
}

// واجهة رسالة التسجيل
export function getMillionRecruitmentEmbed(gameData) {
  const playerList =
    gameData.players.size > 0
      ? Array.from(gameData.players).map((id) => `<@${id}>`).join(", ")
      : "لا توجد مشاركات حتى الآن. كن أول المنضمين!";

  return new EmbedBuilder()
    .setColor("#DAA520")
    .setTitle("🧠 مسابقة: من سيربح المليون؟")
    .setDescription("اضغط على زر **انضمام للمليون** لتسجيل اسمك في المسابقة!\nالأسئلة ستتدرج في الصعوبة، ومن يخطئ يُقصى فوراً!")
    .addFields(
      { name: "👥 عدد المشاركين", value: `${gameData.players.size}`, inline: true },
      { name: "📋 قائمة اللاعبين", value: playerList, inline: false }
    )
    .setFooter({ text: "3RB Games • من سيربح المليون" });
}

// دالة طرح الأسئلة وجولات اللعبة مع الصورة المدمجة
export async function runMillionRound(channel, gameData) {
  const currentQ = millionQuestions[gameData.currentQuestionIndex];
  gameData.answersInRound.clear();

  const buffer = await generateMillionQuestionImage(currentQ);
  const attachment = new AttachmentBuilder(buffer, { name: "million_question.png" });

  const embed = new EmbedBuilder()
    .setColor("#1E90FF")
    .setTitle(`💡 السؤال رقم ${currentQ.level} (الجائزة: $${currentQ.prize})`)
    .setDescription(`⏳ **لديك 20 ثانية لاختيار الإجابة بالضغط على الأزرار أدناه!**`)
    .setImage("attachment://million_question.png")
    .setFooter({ text: `اللاعبون المستمرون الآن: ${gameData.activePlayers.size}` });

  // أزرار الاختيارات الأربعة
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("million_ans_1").setLabel("1").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("million_ans_2").setLabel("2").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("million_ans_3").setLabel("3").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("million_ans_4").setLabel("4").setStyle(ButtonStyle.Secondary)
  );

  const msg = await channel.send({ embeds: [embed], files: [attachment], components: [row] });

  // مؤقت لمدة 20 ثانية لتلقي الإجابات
  setTimeout(async () => {
    if (gameData.state !== "playing") return;

    await msg.edit({ components: [] }).catch(() => {});

    const correctOption = currentQ.correct;
    const nextActivePlayers = new Set();
    const eliminatedPlayers = [];

    for (const playerId of gameData.activePlayers) {
      const chosenAnswer = gameData.answersInRound.get(playerId);
      if (chosenAnswer === correctOption) {
        nextActivePlayers.add(playerId);
      } else {
        eliminatedPlayers.push(playerId);
      }
    }

    gameData.activePlayers = nextActivePlayers;

    let survivorsText =
      nextActivePlayers.size > 0
        ? Array.from(nextActivePlayers)
            .map((id) => `<@${id}>`)
            .join(", ")
        : "لا أحد للأسف!";

    let eliminatedText =
      eliminatedPlayers.length > 0
        ? eliminatedPlayers.map((id) => `<@${id}>`).join(", ")
        : "لم يخسر أحد هذه الجولة!";

    const resultEmbed = new EmbedBuilder()
      .setColor(nextActivePlayers.size > 0 ? "#00FF00" : "#FF0000")
      .setTitle(`📊 نتائج السؤال ${currentQ.level}`)
      .setDescription(
        `✅ **الإجابة الصحيحة كانت:** الخيار رقم **(${correctOption})**: ${currentQ.options[correctOption - 1]}`
      )
      .addFields(
        { name: "👑 الناجون المستمرون معنا:", value: survivorsText, inline: false },
        { name: "❌ المودعون (تم إقصاؤهم):", value: eliminatedText, inline: false }
      );

    await channel.send({ embeds: [resultEmbed] });

    if (nextActivePlayers.size === 0 || gameData.currentQuestionIndex >= millionQuestions.length - 1) {
      gameData.state = "finished";
      millionGames.delete(channel.id);

      const finalEmbed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("🏁 انتهت رحلة المليون!")
        .setDescription(
          nextActivePlayers.size > 0
            ? `👑 **الفائزون الذين وصلوا للمليون:**\n` +
              Array.from(nextActivePlayers)
                .map((id) => `<@${id}>`)
                .join(", ") +
              `\n\n🎉 مبروك تم تسجيل النقاط في السجل!`
            : "❌ انتهت اللعبة ولم يتبقَ أي ناجٍ يصل إلى النهاية!"
        );

      if (nextActivePlayers.size > 0 && gameData.db) {
        for (const winnerId of nextActivePlayers) {
          await addGameWin(gameData.db, gameData.guildId, winnerId, "million");
        }
      }

      await channel.send({ embeds: [finalEmbed] });
      return;
    }

    gameData.currentQuestionIndex++;
    setTimeout(() => {
      if (gameData.state === "playing") {
        runMillionRound(channel, gameData);
      }
    }, 4000);
  }, 20000);
}
