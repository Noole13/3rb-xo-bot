import { AttachmentBuilder } from 'discord.js';
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
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
    // =========================================================
    // عواصم عربية
    // =========================================================
    { category: "عواصم عربية", question: "ما هي عاصمة السعودية؟", answer: "الرياض" },
    { category: "عواصم عربية", question: "ما هي عاصمة مصر؟", answer: "القاهرة" },
    { category: "عواصم عربية", question: "ما هي عاصمة الإمارات؟", answer: "أبوظبي" },
    { category: "عواصم عربية", question: "ما هي عاصمة قطر؟", answer: "الدوحة" },
    { category: "عواصم عربية", question: "ما هي عاصمة الكويت؟", answer: "الكويت" },
    { category: "عواصم عربية", question: "ما هي عاصمة البحرين؟", answer: "المنامة" },
    { category: "عواصم عربية", question: "ما هي عاصمة عمان؟", answer: "مسقط" },
    { category: "عواصم عربية", question: "ما هي عاصمة الأردن؟", answer: "عمان" },
    { category: "عواصم عربية", question: "ما هي عاصمة سوريا؟", answer: "دمشق" },
    { category: "عواصم عربية", question: "ما هي عاصمة لبنان؟", answer: "بيروت" },
    { category: "عواصم عربية", question: "ما هي عاصمة العراق؟", answer: "بغداد" },
    { category: "عواصم عربية", question: "ما هي عاصمة اليمن؟", answer: "صنعاء" },
    { category: "عواصم عربية", question: "ما هي عاصمة الجزائر؟", answer: "الجزائر" },
    { category: "عواصم عربية", question: "ما هي عاصمة المغرب؟", answer: "الرباط" },
    { category: "عواصم عربية", question: "ما هي عاصمة تونس؟", answer: "تونس" },
    { category: "عواصم عربية", question: "ما هي عاصمة ليبيا؟", answer: "طرابلس" },
    { category: "عواصم عربية", question: "ما هي عاصمة السودان؟", answer: "الخرطوم" },
    { category: "عواصم عربية", question: "ما هي عاصمة موريتانيا؟", answer: "نواكشوط" },
    { category: "عواصم عربية", question: "ما هي عاصمة الصومال؟", answer: "مقديشو" },
    { category: "عواصم عربية", question: "ما هي عاصمة جيبوتي؟", answer: "جيبوتي" },
    { category: "عواصم عربية", question: "ما هي عاصمة جزر القمر؟", answer: "موروني" },
    { category: "عواصم عربية", question: "ما هي عاصمة فلسطين؟", answer: "القدس" },

    // =========================================================
    // عواصم عالمية
    // =========================================================
    { category: "عواصم عالمية", question: "ما هي عاصمة ألبانيا؟", answer: "تيرانا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة النمسا؟", answer: "فيينا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بلجيكا؟", answer: "بروكسل" },
    { category: "عواصم عالمية", question: "ما هي عاصمة البوسنة والهرسك؟", answer: "سراييفو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بلغاريا؟", answer: "صوفيا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كرواتيا؟", answer: "زغرب" },
    { category: "عواصم عالمية", question: "ما هي عاصمة التشيك؟", answer: "براغ" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الدنمارك؟", answer: "كوبنهاغن" },
    { category: "عواصم عالمية", question: "ما هي عاصمة فنلندا؟", answer: "هلسنكي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة فرنسا؟", answer: "باريس" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ألمانيا؟", answer: "برلين" },
    { category: "عواصم عالمية", question: "ما هي عاصمة اليونان؟", answer: "أثينا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة المجر؟", answer: "بودابست" },
    { category: "عواصم عالمية", question: "ما هي عاصمة أيرلندا؟", answer: "دبلن" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إيطاليا؟", answer: "روما" },
    { category: "عواصم عالمية", question: "ما هي عاصمة هولندا؟", answer: "أمستردام" },
    { category: "عواصم عالمية", question: "ما هي عاصمة النرويج؟", answer: "أوسلو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بولندا؟", answer: "وارسو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة البرتغال؟", answer: "لشبونة" },
    { category: "عواصم عالمية", question: "ما هي عاصمة رومانيا؟", answer: "بوخارست" },
    { category: "عواصم عالمية", question: "ما هي عاصمة روسيا؟", answer: "موسكو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة صربيا؟", answer: "بلغراد" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إسبانيا؟", answer: "مدريد" },
    { category: "عواصم عالمية", question: "ما هي عاصمة السويد؟", answer: "ستوكهولم" },
    { category: "عواصم عالمية", question: "ما هي عاصمة سويسرا؟", answer: "برن" },
    { category: "عواصم عالمية", question: "ما هي عاصمة تركيا؟", answer: "أنقرة" },
    { category: "عواصم عالمية", question: "ما هي عاصمة أوكرانيا؟", answer: "كييف" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بريطانيا؟", answer: "لندن" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الصين؟", answer: "بكين" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الهند؟", answer: "نيودلهي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إندونيسيا؟", answer: "جاكرتا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إيران؟", answer: "طهران" },
    { category: "عواصم عالمية", question: "ما هي عاصمة اليابان؟", answer: "طوكيو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ماليزيا؟", answer: "كوالالمبور" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كوريا الشمالية؟", answer: "بيونغ يانغ" },
    { category: "عواصم عالمية", question: "ما هي عاصمة باكستان؟", answer: "إسلام آباد" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الفلبين؟", answer: "مانيلا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة سنغافورة؟", answer: "سنغافورة" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كوريا الجنوبية؟", answer: "سيول" },
    { category: "عواصم عالمية", question: "ما هي عاصمة تايلاند؟", answer: "بانكوك" },
    { category: "عواصم عالمية", question: "ما هي عاصمة فيتنام؟", answer: "هانوي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كندا؟", answer: "أوتاوا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كوبا؟", answer: "هافانا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة المكسيك؟", answer: "مكسيكو سيتي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة أمريكا؟", answer: "واشنطن" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الأرجنتين؟", answer: "بوينس آيرس" },
    { category: "عواصم عالمية", question: "ما هي عاصمة البرازيل؟", answer: "برازيليا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة تشيلي؟", answer: "سانتياغو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كولومبيا؟", answer: "بوغوتا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بيرو؟", answer: "ليما" },
    { category: "عواصم عالمية", question: "ما هي عاصمة فنزويلا؟", answer: "كاراكاس" },
    { category: "عواصم عالمية", question: "ما هي عاصمة أستراليا؟", answer: "كانبرا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة نيوزيلندا؟", answer: "ويلينغتون" },

    // =========================================================
    // معلومات عامة
    // =========================================================
    { category: "معلومات عامة", question: "ما هو أكبر كوكب في المجموعة الشمسية؟", answer: "المشتري" },
    { category: "معلومات عامة", question: "ما هو أصغر كوكب في المجموعة الشمسية؟", answer: "عطارد" },
    { category: "معلومات عامة", question: "ما هو الكوكب المعروف بالكوكب الأحمر؟", answer: "المريخ" },
    { category: "معلومات عامة", question: "ما هو أكبر محيط في العالم؟", answer: "المحيط الهادئ" },
    { category: "معلومات عامة", question: "ما هي أكبر قارة في العالم؟", answer: "آسيا" },
    { category: "معلومات عامة", question: "ما هي أكبر دولة في العالم من حيث المساحة؟", answer: "روسيا" },
    { category: "معلومات عامة", question: "ما هي أصغر دولة في العالم؟", answer: "الفاتيكان" },
    { category: "معلومات عامة", question: "ما هو أعلى جبل في العالم؟", answer: "إيفرست" },
    { category: "معلومات عامة", question: "ما هو أسرع حيوان بري؟", answer: "الفهد" },
    { category: "معلومات عامة", question: "ما هو أكبر حيوان في العالم؟", answer: "الحوت الأزرق" },
    { category: "معلومات عامة", question: "ما هو الغاز الأكثر وجوداً في الغلاف الجوي؟", answer: "النيتروجين" },
    { category: "معلومات عامة", question: "كم عدد سور القرآن الكريم؟", answer: "114" },
    { category: "معلومات عامة", question: "ما هي أطول سورة في القرآن الكريم؟", answer: "البقرة" },
    { category: "معلومات عامة", question: "ما هي أقصر سورة في القرآن الكريم؟", answer: "الكوثر" },
    { category: "معلومات عامة", question: "كم عدد أشهر السنة؟", answer: "12" },

    // =========================================================
    // رياضة
    // =========================================================
    { category: "رياضة", question: "كم عدد لاعبي فريق كرة القدم داخل الملعب؟", answer: "11" },
    { category: "رياضة", question: "كم عدد أشواط مباراة كرة القدم؟", answer: "2" },
    { category: "رياضة", question: "كم مدة شوط كرة القدم؟", answer: "45 دقيقة" },
    { category: "رياضة", question: "كم عدد لاعبي فريق كرة السلة داخل الملعب؟", answer: "5" },
    { category: "رياضة", question: "كم عدد الحلقات في شعار الألعاب الأولمبية؟", answer: "5" },
    { category: "رياضة", question: "ما هي الرياضة التي تسمى اللعبة الجميلة؟", answer: "كرة القدم" },

    // =========================================================
    // ألغاز
    // =========================================================
    { category: "ألغاز", question: "ما هو الشيء الذي له أسنان ولا يعض؟", answer: "المشط" },
    { category: "ألغاز", question: "ما هو الشيء الذي يمشي بلا أرجل؟", answer: "الوقت" },
    { category: "ألغاز", question: "ما هو الشيء الذي كلما أخذت منه كبر؟", answer: "الحفرة" },
    { category: "ألغاز", question: "ما هو الشيء الذي له عين ولا يرى؟", answer: "الإبرة" },
    { category: "ألغاز", question: "ما هو الشيء الذي يسمع بلا أذن ويتكلم بلا لسان؟", answer: "الصدى" },
    { category: "ألغاز", question: "ما هو الشيء الذي إذا زاد نقص؟", answer: "العمر" },
    { category: "ألغاز", question: "ما هو الشيء الذي يكتب ولا يقرأ؟", answer: "القلم" }
];

export async function startQuiz(message, mode = 'capitals') {
    try {
        let availableQuestions = questions;

        // التصفية الدقيقة والفصل التام بين الأوامر
        if (mode === 'capitals') {
            availableQuestions = questions.filter(q => q.category.includes('عواصم'));
        } else if (mode === 'general') {
            availableQuestions = questions.filter(q => !q.category.includes('عواصم'));
        }

        const q = availableQuestions[Math.floor(Math.random() * availableQuestions.length)] || questions[0];

        // استخدام دقة عالية تتناسب مع أبعاد الصورة الخلفية الجديدة
        const canvas = createCanvas(1200, 675);
        const ctx = canvas.getContext('2d');

        // تحميل ورسم صورة الخلفية
        try {
            const bgPath = path.join(process.cwd(), 'quiz-bg.png');
            if (fs.existsSync(bgPath)) {
                const background = await loadImage(bgPath);
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
            } else {
                // خلفية احتياطية داكنة في حال لم يتم العثور على الصورة لسبب ما
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        } catch (imgErr) {
            console.error("خطأ في تحميل صورة الخلفية:", imgErr);
        }

        // 1. التصنيف (في أعلى اليسار تماماً كما يظهر في صورتك)
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 26px NotoNaskh, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`التصنيف: ${q.category}`, 80, 85);

        // 2. العنوان العلوي (في أعلى اليمين تماماً كما يظهر في صورتك)
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 26px NotoNaskh, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('تحدي المعرفة', 1120, 85);

        // 3. نص السؤال الرئيسي (في المنتصف تماماً تحت الشعار وبخط كبير وواضح)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 46px NotoNaskh, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(q.question, 600, 360);

        // 4. نص المؤقت (داخل الزر الشفاف في الأسفل تماماً)
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 26px NotoNaskh, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ثانية للإجابة 20', 600, 545);

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
