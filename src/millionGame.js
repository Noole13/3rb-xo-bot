import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from "discord.js";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { addGameWin } from "./scores.js";
import fs from "fs";
import path from "path";

// تسجيل الخط العربي لضمان ظهور الحروف متصلة وصحيحة
const fontPath = path.resolve("NotoNaskhArabic-SemiBold.ttf");
if (fs.existsSync(fontPath)) {
  GlobalFonts.registerFromPath(fontPath, "ArabicFont");
}

// خريطة لتخزين ألعاب المليون النشطة لكل قناة
export const millionGames = new Map();

// قائمة كبيرة ومتنوعة من الأسئلة الصعبة على غرار برنامج من سيربح المليون
const millionQuestions = [
  {
    level: 1,
    prize: "100",
    question: "ما هو العنصر الكيميائي الذي يرمز له بالحرف (Au)؟",
    options: ["فضة", "ذهب", "نحاس", "حديد"],
    correct: 2,
  },
  {
    level: 2,
    prize: "1,000",
    question: "في أي معركة إسلامية استشهد الصحابي جعفر بن أبي طالب؟",
    options: ["معركة مؤتة", "معركة اليمامة", "معركة القادسية", "معركة أجنادين"],
    correct: 1,
  },
  {
    level: 3,
    prize: "10,000",
    question: "ما هي عاصمة دولة أستراليا التي يجهلها الكثيرون؟",
    options: ["سيدني", "ملبورن", "كانبيرا", "بريزبان"],
    correct: 3,
  },
  {
    level: 4,
    prize: "100,000",
    question: "من هو العالم المسلم الذي يُعتبر المؤسس الحقيقي لعلم الجبر؟",
    options: ["الحسن بن الهيثم", "الخوارزمي", "ابن خلدون", "جابر بن حيان"],
    correct: 2,
  },
  {
    level: 5,
    prize: "1,000,000 🏆",
    question: "ما هو الكوكب الوحيد في المجموعة الشمسية الذي يدور حول محوره مع عقارب الساعة؟",
    options: ["المريخ", "زحل", "الزهرة", "عطارد"],
    correct: 3,
  },
  {
    level: 6,
    prize: "500",
    question: "ما هي الدولة الأكثر إنتاجاً للقهوة في العالم؟",
    options: ["كولومبيا", "فيتنام", "البرازيل", "إثيوبيا"],
    correct: 3,
  },
  {
    level: 7,
    prize: "2,000",
    question: "ما هو أطول نهر في العالم؟",
    options: ["نهر الأمازون", "نهر النيل", "نهر المسيسيبي", "نهر يانغتسي"],
    correct: 2,
  },
  {
    level: 8,
    prize: "20,000",
    question: "في أي عهد تم بناء قبة الصخرة المشرفة؟",
    options: ["العصر العباسي", "العصر الأموي", "العصر الفاطمي", "العصر العثماني"],
    correct: 2,
  },
  {
    level: 9,
    prize: "200,000",
    question: "ما هو اسم الغاز الذي يُعرف بغاز الضحك؟",
    options: ["أكسيد النيتروز", "أول أكسيد الكربون", "الميثان", "الأوزون"],
    correct: 1,
  },
  {
    level: 10,
    prize: "1,000,000 🏆",
    question: "من هو المعماري الشهير مصمم متحف غوغنهيم في بلباو؟",
    options: ["زها حديد", "فرانك جيري", "نورمان فوستر", "لي كوربوزيه"],
    correct: 2,
  },
  {
    level: 11,
    prize: "1,000",
    question: "ما هي السورة القرآنية التي تُسمى سنام القرآن؟",
    options: ["سورة يس", "سورة البقرة", "سورة الملك", "سورة الفاتحة"],
    correct: 2,
  },
  {
    level: 12,
    prize: "5,000",
    question: "من هو القائد العسكري الذي فتح جزيرة صقلية؟",
    options: ["طارق بن زياد", "أسد بن الفرات", "قتيبة بن مسلم", "عقبة بن نافع"],
    correct: 2,
  }
];

// دالة مساعدة لتقسيم النصوص الطويلة وتوسيطها داخل مربع السؤال العلوي (تم ضبط المسافة إلى 24 لمنع التداخل)
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + " " + words[i];
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  let startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, startY + index * lineHeight);
  });
}

// دالة لتوليد صورة السؤال والخيارات بالإحداثيات الدقيقة والمضبوطة
async function generateMillionQuestionImage(currentQ) {
  const canvas = createCanvas(800, 420);
  const ctx = canvas.getContext("2d");

  const bannerPath = path.resolve("million.png");

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

  // 1. كتابة نص السؤال فقط، بمنتصف الصندوق العلوي تماماً (تم ضبط lineHeight على 24 لمنع تداخل السطرين)
  ctx.font = "bold 26px ArabicFont, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  drawWrappedText(ctx, currentQ.question, 400, 234, 555, 24);

  // 2. الخيارات الأربعة موزعة بدقة داخل المربعات الخاصة بها (شكل سداسي يمين ويسار)
  const optionConfigs = [
    { text: currentQ.options[0], x: 655, y: 304, num: "1", circleX: 715, circleY: 302, align: "right" }, // الخيار 1: اليمين العلوي
    { text: currentQ.options[1], x: 110, y: 304, num: "2", circleX: 85,  circleY: 302, align: "left" },  // الخيار 2: اليسار العلوي
    { text: currentQ.options[2], x: 655, y: 359, num: "3", circleX: 715, circleY: 360, align: "right" }, // الخيار 3: اليمين السفلي
    { text: currentQ.options[3], x: 110, y: 359, num: "4", circleX: 85,  circleY: 360, align: "left" },  // الخيار 4: اليسار السفلي
  ];

  optionConfigs.forEach((opt) => {
    // كتابة نص الخيار داخل المربع
    ctx.font = "bold 24px ArabicFont, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = opt.align;
    ctx.fillText(opt.text, opt.x, opt.y + 5, 260);

    // كتابة رقم الخيار (1, 2, 3, 4) داخل المعين الذهبي بلون بارز
    ctx.font = "bold 20px ArabicFont, sans-serif";
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "center";
    ctx.fillText(opt.num, opt.circleX, opt.circleY + 5);
  });

  return canvas.toBuffer("image/png");
}

// دالة بدء اللعبة (مع اختيار الأسئلة عشوائياً وتلقائياً لكل لعبة جديدة)
export async function startMillionGame(messageOrInteraction, db, guildId) {
  const channelId = messageOrInteraction.channelId;

  if (millionGames.has(channelId)) {
    return { success: false, message: "⚠️ توجد لعبة 'من سيربح المليون' تعمل بالفعل في هذه القناة!" };
  }

  const hostId = messageOrInteraction.user ? messageOrInteraction.user.id : messageOrInteraction.author.id;

  // خلط الأسئلة عشوائياً لكل جلسة جديدة لضمان عدم تكرار نفس الترتيب
  const shuffledQuestions = [...millionQuestions].sort(() => Math.random() - 0.5);

  const gameData = {
    hostId,
    db,
    guildId,
    state: "recruiting",
    players: new Set(),
    activePlayers: new Set(),
    currentQuestionIndex: 0,
    questions: shuffledQuestions, // حفظ الأسئلة العشوائية الخاصة بهذه اللعبة
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

// دالة طرح الأسئلة وجولات اللعبة
export async function runMillionRound(channel, gameData) {
  const currentQ = gameData.questions[gameData.currentQuestionIndex];
  gameData.answersInRound.clear();

  const buffer = await generateMillionQuestionImage(currentQ);
  const attachment = new AttachmentBuilder(buffer, { name: "million.png" });

  const embed = new EmbedBuilder()
    .setColor("#1E90FF")
    .setDescription(`⏳ **لديك 20 ثانية لاختيار الإجابة بالضغط على الأزرار (1 / 2 / 3 / 4) أدناه!**`)
    .setImage("attachment://million.png")
    .setFooter({ text: `اللاعبون المستمرون الآن: ${gameData.activePlayers.size} | السؤال (${gameData.currentQuestionIndex + 1})` });

  // أزرار Discord 1 / 2 / 3 / 4 أسفل الصورة
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
      .setTitle(`📊 نتائج السؤال (${gameData.currentQuestionIndex + 1})`)
      .setDescription(
        `✅ **الإجابة الصحيحة كانت:** الخيار رقم **(${correctOption})**: ${currentQ.options[correctOption - 1]}`
      )
      .addFields(
        { name: "👑 الناجون المستمرون معنا:", value: survivorsText, inline: false },
        { name: "❌ المودعون (تم إقصاؤهم):", value: eliminatedText, inline: false }
      );

    await channel.send({ embeds: [resultEmbed] });

    if (nextActivePlayers.size === 0 || gameData.currentQuestionIndex >= gameData.questions.length - 1) {
      gameData.state = "finished";
      millionGames.delete(channel.id);

      const finalEmbed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("🏁 انتهت رحلة المليون!")
        .setDescription(
          nextActivePlayers.size > 0
            ? `👑 **الفائزون الأبطال:**\n` +
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
