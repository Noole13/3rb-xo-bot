import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

// خريطة لتخزين ألعاب الكراسي النشطة لكل قناة لتجنب تداخل الألعاب
export const chairGames = new Map();

export function startChairGame(messageOrInteraction, clientUser) {
  const channelId = messageOrInteraction.channelId;

  if (chairGames.has(channelId)) {
    return { success: false, message: "⚠️ توجد لعبة كراسي تعمل بالفعل في هذه القناة!" };
  }

  const gameData = {
    hostId: messageOrInteraction.user ? messageOrInteraction.user.id : messageOrInteraction.author.id,
    players: new Set(), // تخزين IDs اللاعبين المشاركين
    state: "recruiting", // recruiting, playing, finished
    round: 0,
    activePlayersInRound: [],
    clickedInRound: new Set(),
    message: null,
  };

  chairGames.set(channelId, gameData);
  return { success: true, gameData };
}

// دالة توليد زر الانضمام العام (يظهر للجميع)
export function getRecruitmentComponents() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("chair_join")
      .setLabel("انضمام للعبة")
      .setStyle(ButtonStyle.Success)
      .setEmoji("👥")
  );
}

// دالة توليد أزرار التحكم الخاصة بصاحب اللعبة فقط (تظهر بشكل سري Ephemeral)
export function getHostControlComponents() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("chair_start")
      .setLabel("بدء اللعبة")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("▶️"),
    new ButtonBuilder()
      .setCustomId("chair_cancel")
      .setLabel("إلغاء اللعبة")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("✖️")
  );
}

// دالة توليد واجهة Embed التسجيل
export function getRecruitmentEmbed(gameData) {
  const playerList =
    gameData.players.size > 0
      ? Array.from(gameData.players)
          .map((id) => `<@${id}>`)
          .join(", ")
      : "لا يوجد لاعبون منضمون بعد.";

  return new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("🪑 لعبة الكراسي الموسيقية")
    .setDescription("اضغط على زر **انضمام** للمشاركة في اللعبة!\nصاحب اللعبة لديه أزرار التحكم (بدء / إلغاء) في رسالته الخاصة.")
    .addFields(
      { name: "👥 عدد اللاعبين المشاركين", value: `${gameData.players.size}`, inline: true },
      { name: "⏳ حالة اللعبة", value: "في انتظار انضمام اللاعبين...", inline: false },
      { name: "📋 اللاعبون المنضمون", value: playerList, inline: false }
    )
    .setFooter({ text: "3RB Games • لعبة الكراسي" });
}

// بدء جولة جديدة في اللعبة
export async function runNextRound(channel, gameData, addWinFunction, guildId) {
  gameData.round++;
  const totalPlayers = gameData.activePlayersInRound.length;

  // إذا تبقى لاعب واحد فقط، فهو الفائز!
  if (totalPlayers === 1) {
    const winnerId = gameData.activePlayersInRound[0];
    gameData.state = "finished";
    chairGames.delete(channel.id);

    // تسجيل الفوز في النظام (Leaderboard)
    if (addWinFunction) {
      await addWinFunction(guildId, winnerId);
    }

    const winEmbed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("🏆 انتهت لعبة الكراسي!")
      .setDescription(`👑 **الفائز:** <@${winnerId}>\n\n🎉 مبروك! لقد فزت بلعبة الكراسي وتم تسجيل نقطة في لوحة الشرف!`)
      .setTimestamp();

    return channel.send({ embeds: [winEmbed], components: [] });
  }

  const chairsCount = totalPlayers - 1;
  gameData.clickedInRound.clear();

  // رسالة إعلان بداية الجولة
  const roundStartEmbed = new EmbedBuilder()
    .setColor("#FFA500")
    .setTitle(`🪑 الجولة ${gameData.round} بدأت!`)
    .setDescription(`عدد اللاعبين الأحياء: **${totalPlayers}**\nعدد الكراسي المتاحة: **${chairsCount}**\n\nانتظر قليلاً...`);

  const roundMsg = await channel.send({ embeds: [roundStartEmbed] });

  // مؤقت قصير قبل ظهور زر الجلوس (مثلاً 3 ثوانٍ)
  setTimeout(async () => {
    if (gameData.state !== "playing") return;

    const sitEmbed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle(`🚨 اجلس بسرعة! (الجولة ${gameData.round})`)
      .setDescription(`متبقي **${chairsCount} كراسي** فقط لـ **${totalPlayers} لاعبين**!\nاضغط على الزر أدناه بأقصى سرعة!`);

    const sitRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("chair_sit")
        .setLabel("اجلس")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🪑")
    );

    await roundMsg.edit({ embeds: [sitEmbed], components: [sitRow] });

    // وقت الجلوس المتاح للاعبين (مثلاً 5 ثوانٍ)
    setTimeout(async () => {
      if (gameData.state !== "playing") return;

      // إيقاف استقبال الضغطات بإزالة الأزرار
      await roundMsg.edit({ components: [] }).catch(() => {});

      const clickedArray = Array.from(gameData.clickedInRound);
      const survivors = clickedArray.slice(0, chairsCount);
      const eliminated = gameData.activePlayersInRound.filter((id) => !survivors.includes(id));

      // تحديث قائمة اللاعبين المستمرين للجولة القادمة
      gameData.activePlayersInRound = survivors;

      let survivorsText = survivors.length > 0 ? survivors.map((id) => `• <@${id}>`).join("\n") : "لا أحد!";
      let eliminatedText = eliminated.length > 0 ? eliminated.map((id) => `• <@${id}>`).join("\n") : "لا أحد (الجميع تأخروا أو لم يضغطوا)!";

      if (survivors.length === 0 && gameData.activePlayersInRound.length > 0) {
        const randomSurvivor = gameData.activePlayersInRound[Math.floor(Math.random() * gameData.activePlayersInRound.length)];
        gameData.activePlayersInRound = [randomSurvivor];
      }

      const resultsEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle(`🪑 انتهت الجولة ${gameData.round}!`)
        .addFields(
          { name: "✅ الناجون على الكراسي:", value: survivorsText, inline: false },
          { name: "❌ تم إقصاؤهم:", value: eliminatedText, inline: false }
        )
        .setFooter({ text: "جارٍ الانتقال للجولة التالية..." });

      await channel.send({ embeds: [resultsEmbed] });

      // الانتظار 4 ثوانٍ ثم بدء الجولة التالية تلقائياً
      setTimeout(() => {
        if (gameData.state === "playing") {
          runNextRound(channel, gameData, addWinFunction, guildId);
        }
      }, 4000);

    }, 5000); // 5 ثواني مدة سرعة الضغط على الكراسي

  }, 3000); // 3 ثواني تحضير للجولة
}
