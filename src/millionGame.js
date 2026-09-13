import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { addGameWin } from "./scores.js";

// خريطة لتخزين ألعاب المليون النشطة لكل قناة
export const millionGames = new Map();

// قائمة الأسئلة متدرجة الصعوبة (من الأسهل إلى الأقدم/الأصعب وصولاً للمليون)
const millionQuestions = [
  {
    level: 1,
    prize: "100",
    question: "ما هو لون السماء الصافية في النهار؟",
    options: ["أحمر", "أزرق", "أخضر", "أصفر"],
    correct: 2 // رقم الخيار الصحيح (1 إلى 4)
  },
  {
    level: 2,
    prize: "1,000",
    question: "كم عدد أيام السنة الهجرية؟",
    options: ["354 أو 355 يوماً", "365 يوماً", "366 يوماً", "300 يوم"],
    correct: 1
  },
  {
    level: 3,
    prize: "10,000",
    question: "ما هي عاصمة دولة اليابان؟",
    options: ["سيول", "بكين", "طوكيو", "بانكوك"],
    correct: 3
  },
  {
    level: 4,
    prize: "100,000",
    question: "في أي عام هبط الإنسان على سطح القمر لأول مرة؟",
    options: ["1965", "1969", "1973", "1981"],
    correct: 2
  },
  {
    level: 5,
    prize: "1,000,000 🏆",
    question: "من هو القائد المسلم الذي انتصر في معركة عين جالوت؟",
    options: ["صلاح الدين الأيوبي", "سوزان بايبارس", "قطز", "المظفر قطز / طغرل بك"], // (مثال توضيحي)
    correct: 3
  }
];

// دالة بدء اللعبة
export async function startMillionGame(messageOrInteraction, db, guildId) {
  const channelId = messageOrInteraction.channelId;

  if (millionGames.has(channelId)) {
    return { success: false, message: "⚠️ توجد لعبة 'من سيربح المليون' تعمل بالفعل في هذه القناة!" };
  }

  // جلب الكائن أو المؤلف للعبة
  const hostId = messageOrInteraction.user ? messageOrInteraction.user.id : messageOrInteraction.author.id;

  const gameData = {
    hostId,
    db,
    guildId,
    state: "recruiting", // recruiting, playing, finished
    players: new Set(), // جميع اللاعبين المنضمين في البداية
    activePlayers: new Set(), // اللاعبون المستمرون (الناجون)
    currentQuestionIndex: 0,
    answersInRound: new Map(), // تخزين إجابات كل لاعب في السؤال الحالي
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
  const currentQ = millionQuestions[gameData.currentQuestionIndex];
  gameData.answersInRound.clear();

  const embed = new EmbedBuilder()
    .setColor("#1E90FF")
    .setTitle(`💡 السؤال رقم ${gameData.currentQuestionIndex + 1} (الجائزة: $${currentQ.prize})`)
    .setDescription(`**${currentQ.question}**\n\n` +
      `1️⃣ ${currentQ.options[0]}\n` +
      `2️⃣ ${currentQ.options[1]}\n` +
      `3️⃣ ${currentQ.options[2]}\n` +
      `4️⃣ ${currentQ.options[3]}\n\n` +
      `⏳ **لديك 20 ثانية لاختيار الإجابة بالضغط على الأزرار أدناه!**`
    )
    .setFooter({ text: `اللاعبون المستمرون الآن: ${gameData.activePlayers.size}` });

  // أزرار الاختيارات الأربعة
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("million_ans_1").setLabel("1").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("million_ans_2").setLabel("2").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("million_ans_3").setLabel("3").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("million_ans_4").setLabel("4").setStyle(ButtonStyle.Secondary)
  );

  const msg = await channel.send({ embeds: [embed], components: [row] });

  // مؤقت لمدة 20 ثانية لتلقي الإجابات
  setTimeout(async () => {
    if (gameData.state !== "playing") return;

    // تعطيل الأزرار بعد انتهاء الوقت
    await msg.edit({ components: [] }).catch(() => {});

    const correctOption = currentQ.correct;
    const nextActivePlayers = new Set();
    const eliminatedPlayers = [];

    // تصفية اللاعبين
    for (const playerId of gameData.activePlayers) {
      const chosenAnswer = gameData.answersInRound.get(playerId);
      if (chosenAnswer === correctOption) {
        nextActivePlayers.add(playerId); // ناجح ويستمر معنا
      } else {
        eliminatedPlayers.id = playerId;
        eliminatedPlayers.push(playerId); // خاسر أو لم يجب في الوقت المحدد
      }
    }

    gameData.activePlayers = nextActivePlayers;

    // صياغة رسالة النتائج وتصفية الجولة
    let survivorsText = nextActivePlayers.size > 0 
      ? Array.from(nextActivePlayers).map(id => `<@${id}>`).join(", ") 
      : "لا أحد للأسف!";
      
    let eliminatedText = eliminatedPlayers.length > 0 
      ? eliminatedPlayers.map(id => `<@${id}>`).join(", ") 
      : "لم يخسر أحد هذه الجولة!";

    const resultEmbed = new EmbedBuilder()
      .setColor(nextActivePlayers.size > 0 ? "#00FF00" : "#FF0000")
      .setTitle(`📊 نتائج السؤال ${gameData.currentQuestionIndex + 1}`)
      .setDescription(`✅ **الإجابة الصحيحة كانت:** الخيار رقم **(${correctOption})**: ${currentQ.options[correctOption - 1]}`)
      .addFields(
        { name: "👑 الناجون المستمرون معنا:", value: survivorsText, inline: false },
        { name: "❌ المودعون (تم إقصاؤهم):", value: eliminatedText, inline: false }
      );

    await channel.send({ embeds: [resultEmbed] });

    // التحقق هل انتهت اللعبة (لا يوجد رابحون، أو انتهت كل الأسئلة)
    if (nextActivePlayers.size === 0 || gameData.currentQuestionIndex >= millionQuestions.length - 1) {
      gameData.state = "finished";
      millionGames.delete(channel.id);

      const finalEmbed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("🏁 انتهت رحلة المليون!")
        .setDescription(
          nextActivePlayers.size > 0
            ? `👑 **الفائزون الذين وصلوا للمليون:**\n` + Array.from(nextActivePlayers).map(id => `<@${id}>`).join(", ") + `\n\n🎉 مبروك تم تسجيل النقاط في السجل!`
            : "❌ انتهت اللعبة ولم يتبقَ أي ناجٍ يصل إلى النهاية!"
        );

      // تسجيل النقاط في فايربيس للناجين نهائياً
      if (nextActivePlayers.size > 0 && gameData.db) {
        for (const winnerId of nextActivePlayers) {
          await addGameWin(gameData.db, gameData.guildId, winnerId, "million");
        }
      }

      await channel.send({ embeds: [finalEmbed] });
      return;
    }

    // الانتقال للسؤال التالي الأصعب بعد 4 ثوانٍ
    gameData.currentQuestionIndex++;
    setTimeout(() => {
      if (gameData.state === "playing") {
        runMillionRound(channel, gameData);
      }
    }, 4000);

  }, 20000); // 20 ثانية مدة الإجابة
}
