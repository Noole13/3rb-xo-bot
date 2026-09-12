import { AttachmentBuilder } from 'discord.js';

// قاعدة بيانات الأعلام والدول
const flagsData = [
    { name: "السعودية", code: "sa" },
    { name: "مصر", code: "eg" },
    { name: "الإمارات", code: "ae" },
    { name: "قطر", code: "qa" },
    { name: "الكويت", code: "kw" },
    { name: "البحرين", code: "bh" },
    { name: "عمان", code: "om" },
    { name: "الأردن", code: "jo" },
    { name: "العراق", code: "iq" },
    { name: "المغرب", code: "ma" },
    { name: "الجزائر", code: "dz" },
    { name: "تونس", code: "tn" },
    { name: "فرنسا", code: "fr" },
    { name: "ألمانيا", code: "de" },
    { name: "إيطاليا", code: "it" },
    { name: "إسبانيا", code: "es" },
    { name: "بريطانيا", code: "gb" },
    { name: "الولايات المتحدة", code: "us" },
    { name: "اليابان", code: "jp" },
    { name: "البرازيل", code: "br" },
    { name: "النرويج", code: "no" },
    { name: "تركيا", code: "tr" },
    { name: "كندا", code: "ca" }
];

export async function startFlagQuiz(message) {
    try {
        // اختيار علم عشوائي
        const flagItem = flagsData[Math.floor(Math.random() * flagsData.length)];
        
        // رابط صورة العلم كبيرة للسؤال في الأعلى
        const flagImageUrl = `https://flagcdn.com/w1280/${flagItem.code}.png`;
        // رابط صورة العلم بحجم أصغر للإجابة الصحيحة بجانب النص
        const smallFlagUrl = `https://flagcdn.com/w320/${flagItem.code}.png`;

        // إرسال علم السؤال كبير في الأعلى
        const attachment = new AttachmentBuilder(flagImageUrl, { name: 'flag.png' });

        const startTime = Date.now();
        await message.channel.send({
            content: "🏴 **خَمّن اسم الدولة:**",
            files: [attachment]
        });

        const filter = response => !response.author.bot;
        const collector = message.channel.createMessageCollector({ filter, time: 20000 });

        let answered = false;

        collector.on('collect', async response => {
            if (answered) return;

            // التحقق مما إذا كانت الإجابة تطابق اسم الدولة
            if (response.content.trim() === flagItem.name) {
                answered = true;
                const endTime = Date.now();
                const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

                collector.stop();

                // إرسال صورة العلم الصغيرة لتظهر بجانب النص في رسالة الفوز
                const winAttachment = new AttachmentBuilder(smallFlagUrl, { name: 'small-flag.png' });

                await response.reply({
                    content: `🎉 <@${response.author.id}> أجب في **${timeTaken} ثانية**\nالجواب: ${flagItem.name}`,
                    files: [winAttachment]
                });
            }
        });

        collector.on('end', collected => {
            if (!answered) {
                message.channel.send(`⏰ انتهى الوقت! للأسف لم يحرص أحد على الإجابة.\nالجواب الصحيح كان: **${flagItem.name}** ❌`);
            }
        });

    } catch (error) {
        console.error("خطأ في تشغيل لعبة الأعلام:", error);
        message.channel.send('حدث خطأ أثناء إرسال لعبة الأعلام.');
    }
}
