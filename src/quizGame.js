import { AttachmentBuilder } from 'discord.js';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';

// تسجيل الخط العربي Noto Naskh تلقائياً من المجلد الرئيسي للمشروع
try {
    const fontPath = path.join(process.cwd(), 'NotoNaskhArabic-SemiBold.ttf');
    if (fs.existsSync(fontPath)) {
        GlobalFonts.registerFromPath(fontPath, 'NotoNaskh');
        console.log("✅ تم تسجيل خط Noto Naskh Arabic بنجاح!");
    } else {
        console.log("⚠️ تحذير: ملف الخط غير موجود في الجذر، تأكد من رفعه.");
    }
} catch (e) {
    console.error("❌ خطأ أثناء تسجيل الخط:", e);
}

// قاعدة بيانات الأسئلة مصنفة بدقة
const questions = [
    // --- عواصم عربية ---
    { category: "عواصم عربية", question: "ما هي عاصمة المملكة العربية السعودية؟", answer: "الرياض" },
    { category: "عواصم عربية", question: "ما هي عاصمة جمهورية مصر العربية؟", answer: "القاهرة" },
    { category: "عواصم عربية", question: "ما هي عاصمة دولة الإمارات العربية المتحدة؟", answer: "أبوظبي" },
    { category: "عواصم عربية", question: "ما هي عاصمة دولة قطر؟", answer: "الدوحة" },
    { category: "عواصم عربية", question: "ما هي عاصمة دولة الكويت؟", answer: "الكويت" },
    { category: "عواصم عربية", question: "ما هي عاصمة مملكة البحرين؟", answer: "المنامة" },
    { category: "عواصم عربية", question: "ما هي عاصمة سلطنة عمان؟", answer: "مسقط" },
    { category: "عواصم عربية", question: "ما هي عاصمة المملكة الأردنية الهاشمية؟", answer: "عمان" },
    { category: "عواصم عربية", question: "ما هي عاصمة الجمهورية العربية السورية؟", answer: "دمشق" },
    { category: "عواصم عربية", question: "ما هي عاصمة الجمهورية اللبنانية؟", answer: "بيروت" },
    { category: "عواصم عربية", question: "ما هي عاصمة الجمهورية العراقية؟", answer: "بغداد" },
    { category: "عواصم عربية", question: "ما هي عاصمة الجمهورية اليمنية؟", answer: "صنعاء" },
    { category: "عواصم عربية", question: "ما هي عاصمة الجمهورية الجزائرية؟", answer: "الجزائر" },
    { category: "عواصم عربية", question: "ما هي عاصمة المملكة المغربية؟", answer: "الرباط" },
    { category: "عواصم عربية", question: "ما هي عاصمة الجمهورية التونسية؟", answer: "تونس" },
    { category: "عواصم عربية", question: "ما هي عاصمة دولة ليبيا؟", answer: "طرابلس" },
    { category: "عواصم عربية", question: "ما هي عاصمة جمهورية السودان؟", answer: "الخرطوم" },
    { category: "عواصم عربية", question: "ما هي عاصمة الجمهورية الإسلامية الموريتانية؟", answer: "نواكشوط" },
    { category: "عواصم عربية", question: "ما هي عاصمة دولة الصومال؟", answer: "مقديشو" },
    { category: "عواصم عربية", question: "ما هي عاصمة دولة جيبوتي؟", answer: "جيبوتي" },
    { category: "عواصم عربية", question: "ما هي عاصمة جزر القمر؟", answer: "مروني" },

    // --- عواصم عالمية ---
    { category: "عواصم عالمية", question: "ما هي عاصمة الجمهورية التركية؟", answer: "أنقرة" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الجمهورية الإيرانية؟", answer: "طهران" },
    { category: "عواصم عالمية", question: "ما هي عاصمة دولة اليابان؟", answer: "طوكيو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة جمهورية الصين الشعبية؟", answer: "بكين" },
    { category: "عواصم عالمية", question: "ما هي عاصمة روسيا الاتحادية؟", answer: "موسكو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الولايات المتحدة الأمريكية؟", answer: "واشنطن" },
    { category: "عواصم عالمية", question: "ما هي عاصمة المملكة المتحدة (بريطانيا)؟", answer: "لندن" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الجمهورية الفرنسية؟", answer: "باريس" },
    { category: "عواصم عالمية", question: "ما هي عاصمة جمهورية ألمانيا الاتحادية؟", answer: "برلين" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إيطاليا؟", answer: "روما" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إسبانيا؟", answer: "مدريد" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كوريا الجنوبية؟", answer: "سيول" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الهند؟", answer: "نيودلهي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة البوسنة والهرسك؟", answer: "سراييفو" },

    // --- معلومات عامة ---
    { category: "معلومات عامة", question: "ما هو أكبر كوكب في المجموعة الشمسية؟", answer: "المشتري" },
    { category: "معلومات عامة", question: "ما هو الحيوان الذي يُطلق عليه سفين الصحراء؟", answer: "الجمل" },
    { category: "معلومات عامة", question: "ما هو المعدن السائل الوحيد في الجدول الدوري؟", answer: "الزئبق" },
    { category: "معلومات عامة", question: "في أي قارة يقع نهر النيجر؟", answer: "إفريقيا" },
    { category: "معلومات عامة", question: "كم عدد سور القرآن الكريم؟", answer: "114" },
    { category: "معلومات عامة", question: "ما هي أطول سورة في القرآن الكريم؟", answer: "البقرة" },
    { category: "معلومات عامة", question: "من هو أول خلفاء المسلمين الراشدين؟", answer: "أبو بكر الصديق" },
    { category: "معلومات عامة", question: "كم عدد غزوات الرسول صلى الله عليه وسلم؟", answer: "27" },
    { category: "معلومات عامة", question: "ما هو الغاز الأكثر وجوداً في الغلاف الجوي؟", answer: "النيتروجين" }
];

export async function startQuiz(message, mode = 'capitals') {
    try {
        let availableQuestions = questions;

        // تصفية الأسئلة بدقة حسب الأمر المستخدم
        if (mode === 'capitals') {
            availableQuestions = questions.filter(q => q.category.includes('عواصم'));
        } else if (mode === 'general') {
            availableQuestions = questions.filter(q => q.category.includes('معلومات'));
        }

        const q = availableQuestions[Math.floor(Math.random() * availableQuestions.length)] || questions[0];

        const canvas = createCanvas(800, 380);
        const ctx = canvas.getContext('2d');

        // خلفية البطاقة المتدرجة الفخمة
        const gradient = ctx.createLinearGradient(0, 0, 800, 380);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.5, '#1e293b');
        gradient.addColorStop(1, '#090d16');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(0, 0, 800, 380, 20);
        ctx.fill();

        // إطار البطاقة الخارجي الذهبي
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(5, 5, 790, 370, 18);
        ctx.stroke();

        // العنوان العلوي باستخدام الخط المخصص NotoNaskh
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 20px NotoNaskh, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('🌟 3RB Games • تحدي المعرفة', 750, 50);

        // التصنيف
        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px NotoNaskh, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`📌 التصنيف: ${q.category}`, 50, 50);

        // خط فاصل
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, 75);
        ctx.lineTo(750, 75);
        ctx.stroke();

        // نص السؤال الرئيسي في المنتصف بالخط العربي الجميل
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px NotoNaskh, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(q.question, 400, 210);

        // صندوق المؤقت في الأسفل
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.beginPath();
        ctx.roundRect(300, 290, 200, 50, 25);
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.stroke();

        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 18px NotoNaskh, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⏳ 20 ثانية للإجابة', 400, 323);

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'arabic-quiz.png' });

        const startTime = Date.now();
        await message.channel.send({
            files: [attachment]
        });

        const filter = response => !response.author.bot;
        const collector = message.channel.createMessageCollector({ filter, time: 20000 });

        let answered = false;

        collector.on('collect', async response => {
            if (answered) return;

            if (response.content.trim() === q.answer) {
                answered = true;
                const endTime = Date.now();
                const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

                collector.stop();

                await response.reply({
                    content: `🎉 كفو <@${response.author.id}>! أجبَت في **${timeTaken} ثانية** 🚀\nالإجابة الصحيحة: **${q.answer}**`
                });
            }
        });

        collector.on('end', collected => {
            if (!answered) {
                message.channel.send(`⏰ انتهى الوقت يا شباب! للأسف لم يحرص أحد على الإجابة الصحيحة.\nالإجابة كانت: **${q.answer}** ❌`);
            }
        });

    } catch (error) {
        console.error("خطأ في تشغيل لعبة الأسئلة:", error);
        message.channel.send('حدث خطأ أثناء تحميل بطاقة السؤال.');
    }
}
