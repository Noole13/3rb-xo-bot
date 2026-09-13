import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from "discord.js";
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { addGameWin } from "./scores.js";

// خريطة لتخزين ألعاب المليون النشطة لكل قناة
export const millionGames = new Map();

// قائمة الأسئلة متدرجة الصعوبة للعبة من سيربح المليون
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
    options: ["صلاح الدين الأيوبي", "سوزان بايبارس", "قطز", "طغرل بك"],
    correct: 3,
  },
];

// دالة بدء اللعبة
export async function startMillionGame(messageOrInteraction, db, guildId) {
  const channelId = messageOrInteraction.channelId;

  if (millionGames.has(channelId)) {
    return { success: false, message: "⚠️ توجد لعبة 'من سيربح المليون' تعمل بالفعل في هذه القناة!" };
  }

  const gameData = {
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

  return {
    content: "🧠 **مسابقة: من سيربح المليون؟**\nاضغط على زر **انضمام للمليون** لتسجيل اسمك في المسابقة!",
    embeds: []
  };
}

// دالة رسم السؤال والخيارات داخل الصورة وطرح الجولة
export async function runMillionRound(channel, gameData) {
  const currentQ = millionQuestions[gameData.currentQuestionIndex];
  gameData.answersInRound.clear();

  try {
    // 1. إنشاء الـ Canvas بنفس أبعاد لعبتك الأخرى
    const canvas = createCanvas(1200, 675);
    const ctx = canvas.getContext('2d');

    // 2. تحميل الخلفية (تأكد أن اسم الصورة لديك هو quiz-bg.png أو مليون_banner.png)
    const bgPath = path.join(process.cwd(), 'quiz-bg.png');
    if (fs.existsSync(bgPath)) {
      const background = await loadImage(bgPath);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 3. كتابة التصنيف (رقم السؤال والجائزة) في الأعلى
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 26px NotoNaskh, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`السؤال ${currentQ.level} - الجائزة: $${currentQ.prize}`, 80, 85);

    ctx.textAlign = 'right';
    ctx.fillText('من سيربح المليون', 1120, 85);

    // 4. كتابة نص السؤال في منتصف الصورة
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px NotoNaskh, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(currentQ.question, 600, 220);

    // 5. كتابة الخيارات الأربعة بشكل مرتب داخل الصورة
    ctx.font = 'bold 28px NotoNaskh, sans-serif';
    ctx.fillStyle = '#38bdf8'; // لون مميز للخيارات
    
    // خيار 1 و 2 (في صف أو تحت بعض حسب التنسيق المفضل، هنا سنرتبهم بشكل واضح)
    ctx.fillText(`1️⃣ ${currentQ.options[0]}`, 600, 310);
    ctx.fillText(`2️⃣ ${currentQ.options[1]}`, 600, 370);
    ctx.fillText(`3️⃣ ${currentQ.options[2]}`, 600, 430);
    ctx.fillText(`4️⃣ ${currentQ.options[3]}`, 600, 490);

    // 6. المؤقت في الأسفل
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 26px NotoNaskh, sans-serif';
    ctx.fillText('ثانية للإجابة 20', 600, 580);

    // 7. تجهيز المرفق للإرسال
    const attachment = new AttachmentBuilder(await canvas.encode('png'), {
      name: 'million-question.png',
    });

    // 8. أزرار الاختيارات (1، 2، 3، 4)
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("million_ans_1").setLabel("1").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("million_ans_2").setLabel("2").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("million_ans_3").setLabel("3").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("million_ans_4").setLabel("4").setStyle(ButtonStyle.Primary)
    );

    const msg = await channel.send({
      content: `⏳ **اللاعبون المستمرون (${gameData.activePlayers.size}):** اختر الإجابة الصحيحة بالضغط على الأزرار أدناه!`,
      files: [attachment],
      components: [row]
    });

    // 9. مؤقت انتهاء الجولة (20 ثانية)
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

      let survivorsText = nextActivePlayers.size > 0
        ? Array.from(nextActivePlayers).map((id) => `<@${id}>`).join(", ")
        : "لا أحد للأسف!";

      let eliminatedText = eliminatedPlayers.length > 0
        ? eliminatedPlayers.map((id) => `<@${id}>`).join(", ")
        : "لم يخسر أحد هذه الجولة!";

      await channel.send({
        content: `📊 **نتائج السؤال رقم ${currentQ.level}**\n` +
                 `✅ **الإجابة الصحيحة:** (${correctOption}) ${currentQ.options[correctOption - 1]}\n\n` +
                 `👑 **الناجون:** ${survivorsText}\n` +
                 `❌ **المقصيون:** ${eliminatedText}`
      });

      if (nextActivePlayers.size === 0 || gameData.currentQuestionIndex >= millionQuestions.length - 1) {
        gameData.state = "finished";
        millionGames.delete(channel.id);

        if (nextActivePlayers.size > 0 && gameData.db) {
          for (const winnerId of nextActivePlayers) {
            addGameWin(gameData.db, gameData.guildId, winnerId, "million");
          }
        }

        await channel.send({
          content: nextActivePlayers.size > 0
            ? `🏁 **انتهت اللعبة! مبروك للفائزين الذين وصلوا للمليون:** ` + Array.from(nextActivePlayers).map(id => `<@${id}>`).join(", ")
            : `❌ **انتهت اللعبة! لم يتبقَ أي ناجٍ.**`
        });
        return;
      }

      gameData.currentQuestionIndex++;
      setTimeout(() => {
        if (gameData.state === "playing") {
          runMillionRound(channel, gameData);
        }
      }, 4000);

    }, 20000);

  } catch (error) {
    console.error("خطأ في رسم وتوليد سؤال المليون:", error);
    channel.send("حدث خطأ أثناء تحميل بطاقة السؤال.");
  }
}
