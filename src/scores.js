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

          // إذا اختار لعبة معينة
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
              .slice(0, 10); // عرض أفضل 10 لاعبين لتلك اللعبة المحددة

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
            // إذا اختار عرض جميع الألعاب
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
                .slice(0, 3); // أفضل 3 لاعبين لكل لعبة

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
