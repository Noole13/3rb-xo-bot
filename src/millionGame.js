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

// الجوائز الثابتة لكل مستوى (1 إلى 5)
const PRIZES = ["100", "1,000", "10,000", "100,000", "1,000,000 🏆"];

// مكتبة الأسئلة الكاملة، مقسّمة حسب مستوى الصعوبة
const questionsBank = {
  1: [
    { question: "ما هو لون السماء الصافية في النهار؟", options: ["أحمر", "أزرق", "أخضر", "أصفر"], correct: 2 },
    { question: "كم عدد أيام الأسبوع؟", options: ["5", "6", "7", "8"], correct: 3 },
    { question: "ما هي عاصمة المملكة العربية السعودية؟", options: ["جدة", "الرياض", "مكة المكرمة", "الدمام"], correct: 2 },
    { question: "كم عدد أصابع اليد الواحدة؟", options: ["4", "5", "6", "10"], correct: 2 },
    { question: "ما هو أكبر كوكب في المجموعة الشمسية؟", options: ["الأرض", "المريخ", "المشتري", "زحل"], correct: 3 },
    { question: "ما هي اللغة الرسمية في مصر؟", options: ["الفرنسية", "الإنجليزية", "العربية", "التركية"], correct: 3 },
    { question: "كم عدد شهور السنة الميلادية؟", options: ["10", "11", "12", "13"], correct: 3 },
    { question: "ما هو الحيوان الملقب بملك الغابة؟", options: ["النمر", "الأسد", "الفيل", "الذئب"], correct: 2 },
    { question: "ما هو أطول نهر في العالم؟", options: ["الأمازون", "النيل", "دجلة", "الفرات"], correct: 2 },
    { question: "كم عدد ألوان قوس قزح؟", options: ["5", "6", "7", "8"], correct: 3 },
    { question: "ما هو الكوكب الذي نعيش عليه؟", options: ["المريخ", "الأرض", "الزهرة", "عطارد"], correct: 2 },
    { question: "ما هي الوجبة التي تؤكل في الصباح عادة؟", options: ["الغداء", "العشاء", "الفطور", "السحور"], correct: 3 },
  ],
  2: [
    { question: "كم عدد أيام السنة الهجرية؟", options: ["354 أو 355 يوماً", "365 يوماً", "366 يوماً", "300 يوم"], correct: 1 },
    { question: "من هو مؤسس الدولة السعودية الأولى؟", options: ["الملك عبدالعزيز", "محمد بن سعود", "فيصل بن تركي", "سعود الكبير"], correct: 2 },
    { question: "ما هي عاصمة كوريا الجنوبية؟", options: ["سيول", "طوكيو", "بكين", "مانيلا"], correct: 1 },
    { question: "كم عدد أركان الإسلام؟", options: ["3", "4", "5", "6"], correct: 3 },
    { question: "ما هي عملة دولة الإمارات العربية المتحدة؟", options: ["الريال", "الدرهم", "الدينار", "الجنيه"], correct: 2 },
    { question: "من هو النبي الذي ابتلعه الحوت؟", options: ["يونس عليه السلام", "موسى عليه السلام", "عيسى عليه السلام", "يوسف عليه السلام"], correct: 1 },
    { question: "كم عدد قارات العالم؟", options: ["5", "6", "7", "8"], correct: 3 },
    { question: "ما هو أصغر محيط في العالم من حيث المساحة؟", options: ["الهادئ", "الأطلسي", "المتجمد الشمالي", "الهندي"], correct: 3 },
    { question: "في أي مدينة يقع برج خليفة؟", options: ["أبوظبي", "دبي", "الشارقة", "الدوحة"], correct: 2 },
    { question: "ما هي أول سورة نزلت كاملة في القرآن الكريم؟", options: ["الفاتحة", "العلق", "البقرة", "الإخلاص"], correct: 1 },
    { question: "ما هي أكبر صحراء حارة في العالم؟", options: ["صحراء الربع الخالي", "الصحراء الكبرى", "صحراء كلاهاري", "صحراء غوبي"], correct: 2 },
    { question: "كم عدد اللاعبين الأساسيين في فريق كرة القدم الواحد؟", options: ["9", "10", "11", "12"], correct: 3 },
  ],
  3: [
    { question: "ما هي عاصمة دولة اليابان؟", options: ["سيول", "بكين", "طوكيو", "بانكوك"], correct: 3 },
    { question: "من هو العالم المسلم الذي يلقب بأبو الجبر؟", options: ["ابن سينا", "الخوارزمي", "ابن الهيثم", "الرازي"], correct: 2 },
    { question: "ما هي أطول سورة في القرآن الكريم؟", options: ["آل عمران", "النساء", "البقرة", "المائدة"], correct: 3 },
    { question: "في أي عام تم فتح مكة المكرمة؟", options: ["السنة الثامنة للهجرة", "السنة السادسة للهجرة", "السنة العاشرة للهجرة", "السنة الثانية للهجرة"], correct: 1 },
    { question: "ما هو أعلى جبل في العالم؟", options: ["كي2", "إفرست", "كليمنجارو", "إلبروس"], correct: 2 },
    { question: "من هو مخترع المصباح الكهربائي؟", options: ["نيوتن", "أديسون", "أينشتاين", "تسلا"], correct: 2 },
    { question: "ما هي عملة المملكة المتحدة؟", options: ["اليورو", "الدولار", "الجنيه الإسترليني", "الفرنك"], correct: 3 },
    { question: "كم عدد عظام جسم الإنسان البالغ تقريباً؟", options: ["106", "156", "206", "256"], correct: 3 },
    { question: "من هو مؤلف كتاب 'ألف ليلة وليلة' الأصلي؟", options: ["أنطوان غالان", "ريتشارد بيرتون", "إدوارد لين", "بورخيس"], correct: 1 },
    { question: "ما هي أكبر دولة عربية من حيث المساحة؟", options: ["مصر", "السعودية", "الجزائر", "السودان"], correct: 3 },
    { question: "في أي قارة تقع دولة مصر؟", options: ["آسيا", "أوروبا", "إفريقيا", "أمريكا الجنوبية"], correct: 3 },
    { question: "ما هو الغاز الذي يحتاجه الإنسان للتنفس؟", options: ["ثاني أكسيد الكربون", "النيتروجين", "الأكسجين", "الهيدروجين"], correct: 3 },
  ],
  4: [
    { question: "في أي عام هبط الإنسان على سطح القمر لأول مرة؟", options: ["1965", "1969", "1973", "1981"], correct: 2 },
    { question: "من هو الخليفة الراشدي الرابع؟", options: ["أبو بكر الصديق", "عمر بن الخطاب", "عثمان بن عفان", "علي بن أبي طالب"], correct: 4 },
    { question: "ما هي عاصمة أستراليا؟", options: ["سيدني", "ملبورن", "كانبيرا", "بيرث"], correct: 3 },
    { question: "من هو مكتشف قوانين الجاذبية؟", options: ["أينشتاين", "نيوتن", "غاليليو", "كوبرنيكوس"], correct: 2 },
    { question: "كم عدد اللغات الرسمية في الأمم المتحدة؟", options: ["4", "5", "6", "7"], correct: 3 },
    { question: "ما هو أصغر بلد في العالم من حيث المساحة؟", options: ["موناكو", "الفاتيكان", "سان مارينو", "ليختنشتاين"], correct: 2 },
    { question: "من هو مؤلف الملحمة الشعرية 'الإلياذة'؟", options: ["سقراط", "أفلاطون", "هوميروس", "أرسطو"], correct: 3 },
    { question: "في أي معركة انتصر المسلمون على الفرس نصراً حاسماً وسقطت بعده دولتهم؟", options: ["اليرموك", "القادسية", "بدر", "حطين"], correct: 2 },
    { question: "ما هو العنصر الكيميائي الذي رمزه 'Au'؟", options: ["الفضة", "الحديد", "الذهب", "النحاس"], correct: 3 },
    { question: "من هو أول رئيس لجمهورية مصر العربية بعد إلغاء الملكية؟", options: ["جمال عبدالناصر", "محمد نجيب", "أنور السادات", "حسني مبارك"], correct: 2 },
    { question: "ما هي أطول فترة صيام في اليوم بين دول العالم الإسلامي غالباً ما ترتبط بأي فصل؟", options: ["الشتاء", "الصيف", "الربيع", "الخريف"], correct: 2 },
    { question: "كم تبلغ سرعة الضوء تقريباً في الفراغ (كم/ثانية)؟", options: ["150 ألف", "300 ألف", "500 ألف", "900 ألف"], correct: 2 },
  ],
  5: [
    { question: "من هو القائد المسلم الذي انتصر في معركة عين جالوت؟", options: ["صلاح الدين الأيوبي", "بيبرس", "سيف الدين قطز", "طغرل بك"], correct: 3 },
    { question: "في أي عام سقطت الأندلس بشكل نهائي بسقوط غرناطة؟", options: ["1392م", "1492م", "1592م", "1292م"], correct: 2 },
    { question: "من هو مؤلف كتاب 'مقدمة ابن خلدون'؟", options: ["ابن رشد", "ابن خلدون", "ابن بطوطة", "الطبري"], correct: 2 },
    { question: "ما اسم أول قمر صناعي أُطلق إلى الفضاء؟", options: ["أبولو 11", "سبوتنيك 1", "فوستوك 1", "هابل"], correct: 2 },
    { question: "من هو الخليفة الأموي الذي بنى قبة الصخرة في القدس؟", options: ["معاوية بن أبي سفيان", "عبدالملك بن مروان", "الوليد بن عبدالملك", "عمر بن عبدالعزيز"], correct: 2 },
    { question: "ما هو اسم أطول جدار دفاعي في التاريخ يقع في الصين؟", options: ["سور الصين العظيم", "جدار هادريان", "خط ماجينو", "جدار برلين"], correct: 1 },
    { question: "من هو العالم المسلم الذي يعتبر رائد علم البصريات الحديث؟", options: ["ابن سينا", "ابن الهيثم", "الخوارزمي", "الرازي"], correct: 2 },
    { question: "في أي عام وقعت غزوة بدر الكبرى؟", options: ["السنة الأولى للهجرة", "السنة الثانية للهجرة", "السنة الثالثة للهجرة", "السنة الخامسة للهجرة"], correct: 2 },
    { question: "ما اسم المعاهدة التي أنهت الحرب العالمية الأولى رسمياً؟", options: ["معاهدة فرساي", "معاهدة يالطا", "معاهدة سايكس بيكو", "معاهدة لوزان"], correct: 1 },
    { question: "من هو مكتشف البنسلين؟", options: ["ألكسندر فليمنغ", "لويس باستور", "روبرت كوخ", "إدوارد جينر"], correct: 1 },
    { question: "ما هي أول جامعة في التاريخ لا تزال قائمة إلى اليوم، وتقع في المغرب؟", options: ["جامعة الأزهر", "جامعة القرويين", "جامعة قرطبة", "جامعة بغداد"], correct: 2 },
    { question: "من هو القائد الذي فتح بلاد الأندلس؟", options: ["طارق بن زياد", "موسى بن نصير", "عقبة بن نافع", "يوسف بن تاشفين"], correct: 1 },
  ],
};

function pickRandomQuestion(level) {
  const pool = questionsBank[level];
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return {
    level,
    prize: PRIZES[level - 1],
    question: picked.question,
    options: picked.options,
    correct: picked.correct,
  };
}

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

  ctx.font = "bold 30px ArabicFont, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  drawWrappedText(ctx, currentQ.question, 400, 234, 555, 17);

  const optionConfigs = [
    { text: currentQ.options[0], x: 655, y: 304, num: "1", circleX: 715, circleY: 302, align: "right" },
    { text: currentQ.options[1], x: 110, y: 304, num: "2", circleX: 85,  circleY: 302, align: "left" },
    { text: currentQ.options[2], x: 655, y: 359, num: "3", circleX: 715, circleY: 360, align: "right" },
    { text: currentQ.options[3], x: 110, y: 359, num: "4", circleX: 85,  circleY: 360, align: "left" },
  ];

  optionConfigs.forEach((opt) => {
    ctx.font = "bold 26px ArabicFont, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = opt.align;
    ctx.fillText(opt.text, opt.x, opt.y + 5, 260);

    ctx.font = "bold 20px ArabicFont, sans-serif";
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "center";
    ctx.fillText(opt.num, opt.circleX, opt.circleY + 5);
  });

  return canvas.toBuffer("image/png");
}

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

export function getMillionRecruitmentEmbed(gameData) {
  const playerList =
    gameData.players.size > 0
      ? Array.from(gameData.players).map((id, index) => `**${index + 1}.** <@${id}>`).join("\n")
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

export async function handleMillionButton(interaction) {
  const channelId = interaction.channelId;
  const gameData = millionGames.get(channelId);

  if (!gameData || gameData.state !== "recruiting") {
    return interaction.reply({ content: "⚠️ لا توجد مسابقة نشطة تستقبل مشاركين حالياً!", ephemeral: true });
  }

  if (interaction.customId === "million_join") {
    const userId = interaction.user.id;
    if (gameData.players.has(userId)) {
      return interaction.reply({ content: "⚠️ أنت منضم بالفعل إلى المسابقة!", ephemeral: true });
    }

    gameData.players.add(userId);

    const updatedEmbed = getMillionRecruitmentEmbed(gameData);
    await interaction.update({ embeds: [updatedEmbed] });
  }
}

export async function runMillionRound(channel, gameData) {
  const level = gameData.currentQuestionIndex + 1;
  const currentQ = pickRandomQuestion(level);
  gameData.answersInRound.clear();

  const buffer = await generateMillionQuestionImage(currentQ);
  const attachment = new AttachmentBuilder(buffer, { name: "million.png" });

  const embed = new EmbedBuilder()
    .setColor("#1E90FF")
    .setDescription(`⏳ **لديك 20 ثانية لاختيار الإجابة بالضغط على الأزرار (1 / 2 / 3 / 4) أدناه!**`)
    .setImage("attachment://million.png")
    .setFooter({ text: `اللاعبون المستمرون الآن: ${gameData.activePlayers.size}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("million_ans_1").setLabel("1").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("million_ans_2").setLabel("2").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("million_ans_3").setLabel("3").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("million_ans_4").setLabel("4").setStyle(ButtonStyle.Secondary)
  );

  const msg = await channel.send({ embeds: [embed], files: [attachment], components: [row] });

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

    if (nextActivePlayers.size === 0 || gameData.currentQuestionIndex >= PRIZES.length - 1) {
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
