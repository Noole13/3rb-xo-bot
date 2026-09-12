const { AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');

// قائمة أسئلة تجريبية (يمكنك توسيعها أو ربطها بقاعدة بيانات)
const questions = [
    { category: "عواصم", question: "ما عاصمة تونس؟", answer: "تونس" },
    { category: "عواصم", question: "ما عاصمة البوسنة والهرسك؟", answer: "سراييفو" },
    { category: "عواصم", question: "ما عاصمة اليابان؟", answer: "طوكيو" },
    { category: "معلومات عامة", question: "ما هي أكبر حشرة في العالم من حيث الحجم؟", answer: "الخنافس" }
];

async function startQuiz(message) {
    try {
        // اختر سؤالاً عشوائياً
        const q = questions[Math.floor(Math.random() * questions.length)];

        // توليد صورة السؤال باستخدام Canvas بتصميم أنيق
        const canvas = createCanvas(800, 350);
        const ctx = canvas.getContext('2d');

        // خلفية البطاقة الداكنة (متوافقة مع واجهة ديسكورد)
        ctx.fillStyle = '#1e1f22';
        ctx.beginPath();
        ctx.roundRect(0, 0, 800, 350, 16);
        ctx.fill();

        // رسم الفئة في الأعلى
        ctx.fillStyle = '#b5bac1';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`🎮 فئة • ${q.category}`, 40, 60);

        // رسم نص السؤال بالمنتصف
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(q.question, 400, 190);

        // رسم مؤقت الوقت في الأسفل
        ctx.fillStyle = '#949ba4';
        ctx.font = '18px sans-serif';
        ctx.fillText('⏳ 20 ثانية', 400, 280);

        const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'quiz.png' });

        const startTime = Date.now();
        const sentMessage = await message.channel.send({
            files: [attachment]
        });

        // فتح مسار استقبال الإجابات في نفس الشات
        const filter = response => !response.author.bot;
        const collector = message.channel.createMessageCollector({ filter, time: 20000 });

        let answered = false;

        collector.on('collect', async response => {
            if (answered) return;

            // مطابقة الإجابة المدخلة مع الإجابة الصحيحة
            if (response.content.trim() === q.answer) {
                answered = true;
                const endTime = Date.now();
                const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

                collector.stop();

                // الرد برسالة الفوز بنفس النمط المطلوب
                await response.reply({
                    content: `🎉 <@${response.author.id}> أجاب في **${timeTaken} ثانية** 🥳\nالجواب: **${q.answer}**`
                });
            }
        });

        collector.on('end', collected => {
            if (!answered) {
                message.channel.send(`⏰ انتهى الوقت! لم يقم أحد بالإجابة بشكل صحيح. الإجابة هي: **${q.answer}**`);
            }
        });

    } catch (error) {
        console.error("خطأ في تشغيل لعبة الأسئلة:", error);
        message.channel.send('حدث خطأ أثناء تحميل السؤال.');
    }
}

module.exports = { startQuiz };
