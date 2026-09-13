import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from "discord.js";

import { createCanvas, registerFont, loadImage } from "canvas";
import { addGameWin } from "./scores.js";
import fs from "fs";
import path from "path";

// =========================================================
// خريطة ألعاب المليون النشطة
// =========================================================

export const millionGames = new Map();

// =========================================================
// تسجيل الخط العربي
// =========================================================

const fontPaths = [
  path.resolve("src/assets/NotoNaskhArabic-SemiBold.ttf"),
  path.resolve("assets/NotoNaskhArabic-SemiBold.ttf"),
  path.resolve("NotoNaskhArabic-SemiBold.ttf"),
];

let arabicFont = "sans-serif";

for (const fontPath of fontPaths) {
  if (fs.existsSync(fontPath)) {
    try {
      registerFont(fontPath, {
        family: "Noto Naskh Arabic",
      });

      arabicFont = "Noto Naskh Arabic";
      console.log(`✅ تم تسجيل الخط العربي: ${fontPath}`);
      break;
    } catch (error) {
      console.error("❌ تعذر تسجيل الخط العربي:", error);
    }
  }
}

// =========================================================
// الأسئلة
// =========================================================

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
    options: [
      "354 أو 355 يوماً",
      "365 يوماً",
      "366 يوماً",
      "300 يوم",
    ],
    correct: 1,
  },

  {
    level: 3,
    prize: "10,000",
    question: "ما هي عاصمة دولة اليابان؟",
    options: [
      "سيول",
      "بكين",
      "طوكيو",
      "بانكوك",
    ],
    correct: 3,
  },

  {
    level: 4,
    prize: "100,000",
    question: "في أي عام هبط الإنسان على سطح القمر لأول مرة؟",
    options: [
      "1965",
      "1969",
      "1973",
      "1981",
    ],
    correct: 2,
  },

  {
    level: 5,
    prize: "1,000,000 🏆",
    question: "من هو القائد المسلم الذي انتصر في معركة عين جالوت؟",
    options: [
      "صلاح الدين الأيوبي",
      "بيبرس",
      "قطز",
      "المظفر قطز",
    ],
    correct: 3,
  },
];

// =========================================================
// دالة رسم نص عربي داخل مساحة محددة
// =========================================================

function drawCenteredArabicText(
  ctx,
  text,
  x,
  y,
  maxWidth,
  fontSize,
  color = "#FFFFFF"
) {
  ctx.save();

  ctx.font = `bold ${fontSize}px "${arabicFont}"`;

  ctx.fillStyle = color;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // دعم اتجاه العربية
  try {
    ctx.direction = "rtl";
  } catch {}

  // إذا كان النص قصيرًا يرسم مباشرة
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    ctx.restore();
    return;
  }

  // تقسيم السؤال إلى أسطر
  const words = text.split(" ");
  const lines = [];

  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine
      ? `${currentLine} ${word}`
      : word;

    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  const lineHeight = fontSize * 1.35;

  const totalHeight = lines.length * lineHeight;

  let startY = y - totalHeight / 2 + lineHeight / 2;

  for (const line of lines) {
    ctx.fillText(line, x, startY);
    startY += lineHeight;
  }

  ctx.restore();
}

// =========================================================
// رسم مربع خيار
// =========================================================

function drawOption(
  ctx,
  option,
  number,
  x,
  y,
  width,
  height,
  numberOnRight = true
) {
  ctx.save();

  // -------------------------------------------------------
  // خلفية الخيار
  // -------------------------------------------------------

  const gradient = ctx.createLinearGradient(
    x,
    y,
    x,
    y + height
  );

  gradient.addColorStop(0, "#102F63");
  gradient.addColorStop(0.5, "#0B2450");
  gradient.addColorStop(1, "#071A3A");

  ctx.fillStyle = gradient;

  // المربع الرئيسي
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 15);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, width, height);
  }

  // -------------------------------------------------------
  // إطار أزرق
  // -------------------------------------------------------

  ctx.strokeStyle = "#168DFF";
  ctx.lineWidth = 2;

  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 15);
    ctx.stroke();
  } else {
    ctx.strokeRect(x, y, width, height);
  }

  // -------------------------------------------------------
  // توهج خفيف
  // -------------------------------------------------------

  ctx.shadowColor = "rgba(0, 110, 255, 0.45)";
  ctx.shadowBlur = 8;

  ctx.strokeStyle = "#168DFF";
  ctx.lineWidth = 1;

  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 15);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;

  // -------------------------------------------------------
  // دائرة / سداسي الرقم
  // -------------------------------------------------------

  const badgeSize = 27;

  const badgeX = numberOnRight
    ? x + width - 38
    : x + 38;

  const badgeY = y + height / 2;

  // سداسي
  ctx.beginPath();

  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i - Math.PI / 6;

    const px =
      badgeX + Math.cos(angle) * badgeSize;

    const py =
      badgeY + Math.sin(angle) * badgeSize;

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.closePath();

  const badgeGradient = ctx.createLinearGradient(
    badgeX,
    badgeY - badgeSize,
    badgeX,
    badgeY + badgeSize
  );

  badgeGradient.addColorStop(0, "#173F78");
  badgeGradient.addColorStop(1, "#081D40");

  ctx.fillStyle = badgeGradient;
  ctx.fill();

  ctx.strokeStyle = "#F3C44F";
  ctx.lineWidth = 2;
  ctx.stroke();

  // رقم الخيار
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold 18px Arial`;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    String(number),
    badgeX,
    badgeY + 1
  );

  // -------------------------------------------------------
  // نص الإجابة
  // -------------------------------------------------------

  const textX = numberOnRight
    ? x + width / 2 - 5
    : x + width / 2 + 5;

  const textMaxWidth = width - 95;

  drawCenteredArabicText(
    ctx,
    option,
    textX,
    y + height / 2,
    textMaxWidth,
    option.length > 22 ? 15 : 18,
    "#FFFFFF"
  );

  ctx.restore();
}

// =========================================================
// توليد صورة السؤال
// =========================================================

async function generateMillionQuestionImage(currentQ) {
  // الحجم المطلوب بالضبط
  const WIDTH = 800;
  const HEIGHT = 420;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // =======================================================
  // تحميل الخلفية
  // =======================================================

  const bannerPath = path.resolve("million_banner.png");

  if (fs.existsSync(bannerPath)) {
    try {
      const background = await loadImage(bannerPath);

      // ---------------------------------------------------
      // جعل الصورة تغطي كامل 800×420 بدون تشويه
      // ---------------------------------------------------

      const sourceRatio =
        background.width / background.height;

      const targetRatio =
        WIDTH / HEIGHT;

      let sourceWidth = background.width;
      let sourceHeight = background.height;
      let sourceX = 0;
      let sourceY = 0;

      if (sourceRatio > targetRatio) {
        // الصورة أعرض من المطلوب
        sourceWidth =
          background.height * targetRatio;

        sourceX =
          (background.width - sourceWidth) / 2;
      } else {
        // الصورة أطول من المطلوب
        sourceHeight =
          background.width / targetRatio;

        sourceY =
          (background.height - sourceHeight) / 2;
      }

      ctx.drawImage(
        background,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        WIDTH,
        HEIGHT
      );

    } catch (error) {
      console.error(
        "❌ خطأ في تحميل million_banner.png:",
        error
      );

      ctx.fillStyle = "#06132D";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

  } else {
    console.warn(
      "⚠️ لم يتم العثور على million_banner.png"
    );

    ctx.fillStyle = "#06132D";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // =======================================================
  // طبقة داكنة خفيفة جدًا
  // =======================================================

  ctx.fillStyle = "rgba(0, 0, 10, 0.12)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // =======================================================
  // السؤال داخل المربع
  // =======================================================

  drawCenteredArabicText(
    ctx,
    currentQ.question,
    400,
    175,
    650,
    currentQ.question.length > 45 ? 21 : 24,
    "#FFFFFF"
  );

  // =======================================================
  // الإجابات 2 × 2
  // =======================================================

  const optionWidth = 365;
  const optionHeight = 48;

  const leftX = 25;
  const rightX = 410;

  const firstY = 242;
  const secondY = 300;

  // -------------------------------------------------------
  // الخيار 1 - يمين
  // -------------------------------------------------------

  drawOption(
    ctx,
    currentQ.options[0],
    1,
    rightX,
    firstY,
    optionWidth,
    optionHeight,
    true
  );

  // -------------------------------------------------------
  // الخيار 2 - يسار
  // -------------------------------------------------------

  drawOption(
    ctx,
    currentQ.options[1],
    2,
    leftX,
    firstY,
    optionWidth,
    optionHeight,
    false
  );

  // -------------------------------------------------------
  // الخيار 3 - يمين
  // -------------------------------------------------------

  drawOption(
    ctx,
    currentQ.options[2],
    3,
    rightX,
    secondY,
    optionWidth,
    optionHeight,
    true
  );

  // -------------------------------------------------------
  // الخيار 4 - يسار
  // -------------------------------------------------------

  drawOption(
    ctx,
    currentQ.options[3],
    4,
    leftX,
    secondY,
    optionWidth,
    optionHeight,
    false
  );

  // =======================================================
  // معلومات الوقت أسفل الصورة
  // =======================================================

  ctx.save();

  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";

  ctx.fillRect(
    0,
    365,
    WIDTH,
    55
  );

  drawCenteredArabicText(
    ctx,
    "لديك 20 ثانية لاختيار الإجابة",
    400,
    382,
    500,
    16,
    "#FFFFFF"
  );

  ctx.restore();

  // =======================================================
  // إخراج الصورة
  // =======================================================

  return canvas.toBuffer("image/png");
}

// =========================================================
// بدء لعبة المليون
// =========================================================

export async function startMillionGame(
  messageOrInteraction,
  db,
  guildId
) {
  const channelId =
    messageOrInteraction.channelId;

  if (millionGames.has(channelId)) {
    return {
      success: false,
      message:
        "⚠️ توجد لعبة 'من سيربح المليون' تعمل بالفعل في هذه القناة!",
    };
  }

  const hostId =
    messageOrInteraction.user
      ? messageOrInteraction.user.id
      : messageOrInteraction.author.id;

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

  millionGames.set(
    channelId,
    gameData
  );

  return {
    success: true,
    gameData,
  };
}

// =========================================================
// أزرار التسجيل
// =========================================================

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

// =========================================================
// رسالة التسجيل
// =========================================================

export function getMillionRecruitmentEmbed(gameData) {
  const playerList =
    gameData.players.size > 0
      ? Array.from(gameData.players)
          .map((id) => `<@${id}>`)
          .join(", ")
      : "لا توجد مشاركات حتى الآن. كن أول المنضمين!";

  return new EmbedBuilder()
    .setColor("#DAA520")

    .setTitle(
      "🧠 مسابقة: من سيربح المليون؟"
    )

    .setDescription(
      "اضغط على زر **انضمام للمليون** لتسجيل اسمك في المسابقة!\n" +
      "الأسئلة ستتدرج في الصعوبة، ومن يخطئ يُقصى فوراً!"
    )

    .addFields(
      {
        name: "👥 عدد المشاركين",
        value: `${gameData.players.size}`,
        inline: true,
      },

      {
        name: "📋 قائمة اللاعبين",
        value: playerList,
        inline: false,
      }
    )

    .setFooter({
      text: "3RB Games • من سيربح المليون",
    });
}

// =========================================================
// تشغيل الجولة
// =========================================================

export async function runMillionRound(
  channel,
  gameData
) {
  const currentQ =
    millionQuestions[
      gameData.currentQuestionIndex
    ];

  if (!currentQ) {
    return;
  }

  // مسح إجابات الجولة السابقة
  gameData.answersInRound.clear();

  // =======================================================
  // إنشاء صورة السؤال
  // =======================================================

  const buffer =
    await generateMillionQuestionImage(
      currentQ
    );

  const attachment =
    new AttachmentBuilder(buffer, {
      name: "million_question.png",
    });

  // =======================================================
  // Embed
  // =======================================================

  const embed =
    new EmbedBuilder()

      .setColor("#1E90FF")

      // لا نضع السؤال هنا
      // لأنه موجود داخل الصورة

      .setImage(
        "attachment://million_question.png"
      )

      .setFooter({
        text:
          `السؤال ${currentQ.level} • ` +
          `الجائزة: $${currentQ.prize} • ` +
          `اللاعبون المستمرون الآن: ${gameData.activePlayers.size}`,
      });

  // =======================================================
  // أزرار الاختيارات
  // =======================================================

  const row =
    new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId("million_ans_1")
        .setLabel("1")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("million_ans_2")
        .setLabel("2")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("million_ans_3")
        .setLabel("3")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("million_ans_4")
        .setLabel("4")
        .setStyle(ButtonStyle.Secondary)
    );

  // =======================================================
  // إرسال السؤال
  // =======================================================

  const msg =
    await channel.send({
      embeds: [embed],
      files: [attachment],
      components: [row],
    });

  // =======================================================
  // مؤقت 20 ثانية
  // =======================================================

  setTimeout(async () => {

    if (gameData.state !== "playing") {
      return;
    }

    // إزالة أزرار Discord بعد انتهاء الوقت
    await msg
      .edit({
        components: [],
      })
      .catch(() => {});

    // =====================================================
    // تحديد الإجابة الصحيحة
    // =====================================================

    const correctOption =
      currentQ.correct;

    const nextActivePlayers =
      new Set();

    const eliminatedPlayers = [];

    // =====================================================
    // تصفية اللاعبين
    // =====================================================

    for (
      const playerId
      of gameData.activePlayers
    ) {

      const chosenAnswer =
        gameData.answersInRound.get(
          playerId
        );

      if (
        chosenAnswer === correctOption
      ) {

        nextActivePlayers.add(
          playerId
        );

      } else {

        eliminatedPlayers.push(
          playerId
        );
      }
    }

    gameData.activePlayers =
      nextActivePlayers;

    // =====================================================
    // الناجون
    // =====================================================

    const survivorsText =
      nextActivePlayers.size > 0

        ? Array.from(nextActivePlayers)
            .map(
              (id) => `<@${id}>`
            )
            .join(", ")

        : "لا أحد للأسف!";

    // =====================================================
    // المودعون
    // =====================================================

    const eliminatedText =
      eliminatedPlayers.length > 0

        ? eliminatedPlayers
            .map(
              (id) => `<@${id}>`
            )
            .join(", ")

        : "لم يخسر أحد هذه الجولة!";

    // =====================================================
    // نتيجة السؤال
    // =====================================================

    const resultEmbed =
      new EmbedBuilder()

        .setColor(
          nextActivePlayers.size > 0
            ? "#00FF00"
            : "#FF0000"
        )

        .setTitle(
          `📊 نتائج السؤال ${currentQ.level}`
        )

        .setDescription(
          `✅ **الإجابة الصحيحة:** الخيار رقم **(${correctOption})** — ${currentQ.options[correctOption - 1]}`
        )

        .addFields(

          {
            name:
              "👑 الناجون المستمرون معنا:",
            value: survivorsText,
            inline: false,
          },

          {
            name:
              "❌ المودعون (تم إقصاؤهم):",
            value: eliminatedText,
            inline: false,
          }
        );

    await channel.send({
      embeds: [resultEmbed],
    });

    // =====================================================
    // انتهاء اللعبة
    // =====================================================

    if (
      nextActivePlayers.size === 0 ||
      gameData.currentQuestionIndex >=
        millionQuestions.length - 1
    ) {

      gameData.state =
        "finished";

      millionGames.delete(
        channel.id
      );

      const finalEmbed =
        new EmbedBuilder()

          .setColor("#FFD700")

          .setTitle(
            "🏁 انتهت رحلة المليون!"
          )

          .setDescription(

            nextActivePlayers.size > 0

              ? `👑 **الفائزون الذين وصلوا للمليون:**\n` +
                Array.from(
                  nextActivePlayers
                )
                  .map(
                    (id) =>
                      `<@${id}>`
                  )
                  .join(", ") +
                `\n\n🎉 مبروك تم تسجيل النقاط في السجل!`

              : "❌ انتهت اللعبة ولم يتبقَ أي ناجٍ يصل إلى النهاية!"
          );

      // ===================================================
      // تسجيل الفوز
      // ===================================================

      if (
        nextActivePlayers.size > 0 &&
        gameData.db
      ) {

        for (
          const winnerId
          of nextActivePlayers
        ) {

          await addGameWin(
            gameData.db,
            gameData.guildId,
            winnerId,
            "million"
          );
        }
      }

      await channel.send({
        embeds: [finalEmbed],
      });

      return;
    }

    // =====================================================
    // السؤال التالي بعد 4 ثوانٍ
    // =====================================================

    gameData.currentQuestionIndex++;

    setTimeout(() => {

      if (
        gameData.state ===
        "playing"
      ) {

        runMillionRound(
          channel,
          gameData
        );
      }

    }, 4000);

  }, 20000);
}
