import { AttachmentBuilder } from 'discord.js';
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';

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
    { name: "المانيا", code: "de" },
    { name: "النرويج", code: "no" },
    { name: "تركيا", code: "tr" },
    { name: "كندا", code: "ca" }
];

export async function startFlagQuiz(message) {
    try {
        // اختيار علم عشوائي
        const flagItem = flagsData[Math.floor(Math.random() * flagsData.length)];
        
        // رابط صورة العلم بجودة عالية
        const flagImageUrl = `https://flagcdn.com/w640/${flagItem.code}.png`;

        // إنشاء الكانفاس بتصميم فخم ومناسب
        const canvas = createCanvas(800, 450);
        const ctx = canvas.getContext('2d');

        // خلفية داكنة متدرجة أنيقة
        const gradient = ctx.createLinearGradient(0, 0, 800, 450);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#1e293b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // إطار ذهبي خارجي
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, 780, 430);

        // عنوان اللعبة في الأعلى
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 24px NotoNaskh, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('🏴 خَمّن اسم الدولة', 750, 55);

        // تحميل ورسم صورة العلم في المنتصف بإطار جمالي
        try {
            const flagImage = await loadImage(flagImageUrl);
            
            // رسم مستطيل خلف العلم ليعطي مظهراً بارزاً
            ctx.fillStyle = '#000000';
            ctx.fillRect(225, 85, 350, 230);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.strokeRect(225, 85, 350, 230);

            // رسم العلم داخل الإطار
            ctx.drawImage(flagImage, 230, 90, 340, 220);
        } catch (imgErr) {
            console.error("خطأ في تحميل صورة العلم:", imgErr);
        }

        // صندوق المؤقت في الأسفل
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.beginPath();
        ctx.roundRect(300, 350, 200, 50, 25);
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 18px NotoNaskh, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⏳ 20 ثانية للإجابة', 400, 382);

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'flag-quiz.png' });

        const startTime = Date.now();
        await message.channel.send({
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

                await response.reply({
                    content: `🎉 كفو <@${response.author.id}>! أجبَت في **${timeTaken} ثانية** 🚀\nالجواب: **${flagItem.name}**`
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
        message.channel.send('حدث خطأ أثناء تحميل بطاقة لعبة الأعلام.');
    }
}
