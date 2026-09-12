import { AttachmentBuilder, EmbedBuilder } from 'discord.js';

// قاعدة بيانات الأعلام والدول
const flagsData = [
    // الدول العربية
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
    { name: "ليبيا", code: "ly" },
    { name: "السودان", code: "sd" },
    { name: "اليمن", code: "ye" },
    { name: "سوريا", code: "sy" },
    { name: "لبنان", code: "lb" },
    { name: "فلسطين", code: "ps" },
    { name: "موريتانيا", code: "mr" },
    { name: "الصومال", code: "so" },
    { name: "جيبوتي", code: "dj" },
    { name: "جزر القمر", code: "km" },

    // أوروبا
    { name: "فرنسا", code: "fr" },
    { name: "ألمانيا", code: "de" },
    { name: "إيطاليا", code: "it" },
    { name: "إسبانيا", code: "es" },
    { name: "بريطانيا", code: "gb" },
    { name: "البرتغال", code: "pt" },
    { name: "هولندا", code: "nl" },
    { name: "بلجيكا", code: "be" },
    { name: "سويسرا", code: "ch" },
    { name: "النمسا", code: "at" },
    { name: "السويد", code: "se" },
    { name: "النرويج", code: "no" },
    { name: "الدنمارك", code: "dk" },
    { name: "فنلندا", code: "fi" },
    { name: "آيسلندا", code: "is" },
    { name: "أيرلندا", code: "ie" },
    { name: "بولندا", code: "pl" },
    { name: "التشيك", code: "cz" },
    { name: "سلوفاكيا", code: "sk" },
    { name: "المجر", code: "hu" },
    { name: "رومانيا", code: "ro" },
    { name: "بلغاريا", code: "bg" },
    { name: "اليونان", code: "gr" },
    { name: "أوكرانيا", code: "ua" },
    { name: "روسيا", code: "ru" },
    { name: "بيلاروسيا", code: "by" },
    { name: "صربيا", code: "rs" },
    { name: "كرواتيا", code: "hr" },
    { name: "البوسنة والهرسك", code: "ba" },
    { name: "سلوفينيا", code: "si" },
    { name: "ألبانيا", code: "al" },
    { name: "مقدونيا الشمالية", code: "mk" },
    { name: "مونتينيغرو", code: "me" },
    { name: "كوسوفو", code: "xk" },
    { name: "مولدوفا", code: "md" },
    { name: "ليتوانيا", code: "lt" },
    { name: "لاتفيا", code: "lv" },
    { name: "إستونيا", code: "ee" },
    { name: "لوكسمبورغ", code: "lu" },
    { name: "مالطا", code: "mt" },
    { name: "قبرص", code: "cy" },

    // آسيا
    { name: "اليابان", code: "jp" },
    { name: "الصين", code: "cn" },
    { name: "كوريا الجنوبية", code: "kr" },
    { name: "كوريا الشمالية", code: "kp" },
    { name: "الهند", code: "in" },
    { name: "باكستان", code: "pk" },
    { name: "بنغلاديش", code: "bd" },
    { name: "أفغانستان", code: "af" },
    { name: "إيران", code: "ir" },
    { name: "تركيا", code: "tr" },
    { name: "إندونيسيا", code: "id" },
    { name: "ماليزيا", code: "my" },
    { name: "سنغافورة", code: "sg" },
    { name: "تايلاند", code: "th" },
    { name: "فيتنام", code: "vn" },
    { name: "الفلبين", code: "ph" },
    { name: "ميانمار", code: "mm" },
    { name: "كمبوديا", code: "kh" },
    { name: "لاوس", code: "la" },
    { name: "منغوليا", code: "mn" },
    { name: "نيبال", code: "np" },
    { name: "سريلانكا", code: "lk" },
    { name: "كازاخستان", code: "kz" },
    { name: "أوزبكستان", code: "uz" },
    { name: "تركمانستان", code: "tm" },
    { name: "قيرغيزستان", code: "kg" },
    { name: "طاجيكستان", code: "tj" },
    { name: "أذربيجان", code: "az" },
    { name: "أرمينيا", code: "am" },
    { name: "جورجيا", code: "ge" },
    { name: "بروناي", code: "bn" },
    { name: "تيمور الشرقية", code: "tl" },

    // أمريكا الشمالية
    { name: "الولايات المتحدة", code: "us" },
    { name: "كندا", code: "ca" },
    { name: "المكسيك", code: "mx" },
    { name: "كوبا", code: "cu" },
    { name: "جامايكا", code: "jm" },
    { name: "بنما", code: "pa" },
    { name: "كوستاريكا", code: "cr" },
    { name: "غواتيمالا", code: "gt" },
    { name: "هندوراس", code: "hn" },
    { name: "السلفادور", code: "sv" },
    { name: "نيكاراغوا", code: "ni" },
    { name: "جمهورية الدومينيكان", code: "do" },
    { name: "هايتي", code: "ht" },
    { name: "ترينيداد وتوباغو", code: "tt" },

    // أمريكا الجنوبية
    { name: "البرازيل", code: "br" },
    { name: "الأرجنتين", code: "ar" },
    { name: "تشيلي", code: "cl" },
    { name: "كولومبيا", code: "co" },
    { name: "بيرو", code: "pe" },
    { name: "الإكوادور", code: "ec" },
    { name: "بوليفيا", code: "bo" },
    { name: "باراغواي", code: "py" },
    { name: "أوروغواي", code: "uy" },
    { name: "فنزويلا", code: "ve" },
    { name: "غيانا", code: "gy" },
    { name: "سورينام", code: "sr" },

    // أفريقيا
    { name: "جنوب أفريقيا", code: "za" },
    { name: "نيجيريا", code: "ng" },
    { name: "غانا", code: "gh" },
    { name: "السنغال", code: "sn" },
    { name: "الكاميرون", code: "cm" },
    { name: "ساحل العاج", code: "ci" },
    { name: "كينيا", code: "ke" },
    { name: "تنزانيا", code: "tz" },
    { name: "أوغندا", code: "ug" },
    { name: "إثيوبيا", code: "et" },
    { name: "زيمبابوي", code: "zw" },
    { name: "زامبيا", code: "zm" },
    { name: "موزمبيق", code: "mz" },
    { name: "مدغشقر", code: "mg" },
    { name: "رواندا", code: "rw" },
    { name: "مالي", code: "ml" },
    { name: "النيجر", code: "ne" },
    { name: "تشاد", code: "td" },
    { name: "بوركينا فاسو", code: "bf" },
    { name: "بنين", code: "bj" },
    { name: "توغو", code: "tg" },
    { name: "غينيا", code: "gn" },
    { name: "غينيا بيساو", code: "gw" },
    { name: "سيراليون", code: "sl" },
    { name: "ليبيريا", code: "lr" },
    { name: "الغابون", code: "ga" },
    { name: "الكونغو", code: "cg" },
    { name: "جمهورية الكونغو الديمقراطية", code: "cd" },
    { name: "أنغولا", code: "ao" },
    { name: "ناميبيا", code: "na" },
    { name: "بوتسوانا", code: "bw" },
    { name: "إسواتيني", code: "sz" },
    { name: "ليسوتو", code: "ls" },
    { name: "ملاوي", code: "mw" },

    // أوقيانوسيا
    { name: "أستراليا", code: "au" },
    { name: "نيوزيلندا", code: "nz" },
    { name: "فيجي", code: "fj" },
    { name: "بابوا غينيا الجديدة", code: "pg" },
    { name: "ساموا", code: "ws" },
    { name: "تونغا", code: "to" },
    { name: "فانواتو", code: "vu" },
    { name: "جزر سليمان", code: "sb" }
];

export async function startFlagQuiz(message) {
    try {
        // اختيار علم عشوائي
        const flagItem = flagsData[Math.floor(Math.random() * flagsData.length)];
        
        // رابط صورة العلم كبيرة للسؤال في الأعلى
        const flagImageUrl = `https://flagcdn.com/w1280/${flagItem.code}.png`;
        // رابط صورة العلم المصغرة للإمبد
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

                // إرسال رسالة الفوز عبر الإمبد المطلوب
                const winEmbed = new EmbedBuilder()
                    .setColor(0x28c7a6)
                    .setDescription(
                        `🎉 <@${response.author.id}> أجب في **${timeTaken} ثانية**\n` +
                        `الجواب: **${flagItem.name}**`
                    )
                    .setThumbnail(smallFlagUrl);

                await response.reply({
                    embeds: [winEmbed]
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
