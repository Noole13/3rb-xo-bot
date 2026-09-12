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
    // عواصم عالمية - أوروبا
    // =========================================================
    { category: "عواصم عالمية", question: "ما هي عاصمة ألبانيا؟", answer: "تيرانا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة أندورا؟", answer: "أندورا لا فيلا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة النمسا؟", answer: "فيينا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بيلاروسيا؟", answer: "مينسك" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بلجيكا؟", answer: "بروكسل" },
    { category: "عواصم عالمية", question: "ما هي عاصمة البوسنة والهرسك؟", answer: "سراييفو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بلغاريا؟", answer: "صوفيا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كرواتيا؟", answer: "زغرب" },
    { category: "عواصم عالمية", question: "ما هي عاصمة قبرص؟", answer: "نيقوسيا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة التشيك؟", answer: "براغ" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الدنمارك؟", answer: "كوبنهاغن" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إستونيا؟", answer: "تالين" },
    { category: "عواصم عالمية", question: "ما هي عاصمة فنلندا؟", answer: "هلسنكي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة فرنسا؟", answer: "باريس" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ألمانيا؟", answer: "برلين" },
    { category: "عواصم عالمية", question: "ما هي عاصمة اليونان؟", answer: "أثينا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة المجر؟", answer: "بودابست" },
    { category: "عواصم عالمية", question: "ما هي عاصمة أيسلندا؟", answer: "ريكيافيك" },
    { category: "عواصم عالمية", question: "ما هي عاصمة أيرلندا؟", answer: "دبلن" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إيطاليا؟", answer: "روما" },
    { category: "عواصم عالمية", question: "ما هي عاصمة لاتفيا؟", answer: "ريغا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ليختنشتاين؟", answer: "فادوتس" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ليتوانيا؟", answer: "فيلنيوس" },
    { category: "عواصم عالمية", question: "ما هي عاصمة لوكسمبورغ؟", answer: "لوكسمبورغ" },
    { category: "عواصم عالمية", question: "ما هي عاصمة مالطا؟", answer: "فاليتا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة مولدوفا؟", answer: "كيشيناو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة موناكو؟", answer: "موناكو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الجبل الأسود؟", answer: "بودغوريتسا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة هولندا؟", answer: "أمستردام" },
    { category: "عواصم عالمية", question: "ما هي عاصمة مقدونيا الشمالية؟", answer: "سكوبيه" },
    { category: "عواصم عالمية", question: "ما هي عاصمة النرويج؟", answer: "أوسلو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بولندا؟", answer: "وارسو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة البرتغال؟", answer: "لشبونة" },
    { category: "عواصم عالمية", question: "ما هي عاصمة رومانيا؟", answer: "بوخارست" },
    { category: "عواصم عالمية", question: "ما هي عاصمة روسيا؟", answer: "موسكو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة سان مارينو؟", answer: "سان مارينو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة صربيا؟", answer: "بلغراد" },
    { category: "عواصم عالمية", question: "ما هي عاصمة سلوفاكيا؟", answer: "براتيسلافا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة سلوفينيا؟", answer: "ليوبليانا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إسبانيا؟", answer: "مدريد" },
    { category: "عواصم عالمية", question: "ما هي عاصمة السويد؟", answer: "ستوكهولم" },
    { category: "عواصم عالمية", question: "ما هي عاصمة سويسرا؟", answer: "برن" },
    { category: "عواصم عالمية", question: "ما هي عاصمة تركيا؟", answer: "أنقرة" },
    { category: "عواصم عالمية", question: "ما هي عاصمة أوكرانيا؟", answer: "كييف" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بريطانيا؟", answer: "لندن" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الفاتيكان؟", answer: "الفاتيكان" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كوسوفو؟", answer: "بريشتينا" },

    // =========================================================
    // عواصم عالمية - آسيا
    // =========================================================
    { category: "عواصم عالمية", question: "ما هي عاصمة أفغانستان؟", answer: "كابول" },
    { category: "عواصم عالمية", question: "ما هي عاصمة أرمينيا؟", answer: "يريفان" },
    { category: "عواصم عالمية", question: "ما هي عاصمة أذربيجان؟", answer: "باكو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بنغلاديش؟", answer: "دكا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بوتان؟", answer: "تيمفو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بروناي؟", answer: "بندر سري بكاوان" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كمبوديا؟", answer: "بنوم بنه" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الصين؟", answer: "بكين" },
    { category: "عواصم عالمية", question: "ما هي عاصمة جورجيا؟", answer: "تبليسي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الهند؟", answer: "نيودلهي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إندونيسيا؟", answer: "جاكرتا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إيران؟", answer: "طهران" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إسرائيل؟", answer: "القدس" },
    { category: "عواصم عالمية", question: "ما هي عاصمة اليابان؟", answer: "طوكيو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كازاخستان؟", answer: "أستانا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة قرغيزستان؟", answer: "بيشكيك" },
    { category: "عواصم عالمية", question: "ما هي عاصمة لاوس؟", answer: "فيينتيان" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ماليزيا؟", answer: "كوالالمبور" },
    { category: "عواصم عالمية", question: "ما هي عاصمة المالديف؟", answer: "ماليه" },
    { category: "عواصم عالمية", question: "ما هي عاصمة منغوليا؟", answer: "أولان باتور" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ميانمار؟", answer: "نايبيداو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة نيبال؟", answer: "كاتماندو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كوريا الشمالية؟", answer: "بيونغ يانغ" },
    { category: "عواصم عالمية", question: "ما هي عاصمة باكستان؟", answer: "إسلام آباد" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الفلبين؟", answer: "مانيلا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة سنغافورة؟", answer: "سنغافورة" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كوريا الجنوبية؟", answer: "سيول" },
    { category: "عواصم عالمية", question: "ما هي عاصمة سريلانكا؟", answer: "سري جاياواردنابورا كوتي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة طاجيكستان؟", answer: "دوشنبه" },
    { category: "عواصم عالمية", question: "ما هي عاصمة تايلاند؟", answer: "بانكوك" },
    { category: "عواصم عالمية", question: "ما هي عاصمة تيمور الشرقية؟", answer: "ديلي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة تركمانستان؟", answer: "عشق آباد" },
    { category: "عواصم عالمية", question: "ما هي عاصمة أوزبكستان؟", answer: "طشقند" },
    { category: "عواصم عالمية", question: "ما هي عاصمة فيتنام؟", answer: "هانوي" },

    // =========================================================
    // عواصم عالمية - أفريقيا
    // =========================================================
    { category: "عواصم عالمية", question: "ما هي عاصمة أنغولا؟", answer: "لواندا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بنين؟", answer: "بورتو نوفو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بوتسوانا؟", answer: "غابورون" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بوركينا فاسو؟", answer: "واغادوغو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بوروندي؟", answer: "غيتيغا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الكاميرون؟", answer: "ياوندي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الرأس الأخضر؟", answer: "برايا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة جمهورية أفريقيا الوسطى؟", answer: "بانغي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة تشاد؟", answer: "نجامينا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الكونغو؟", answer: "برازافيل" },
    { category: "عواصم عالمية", question: "ما هي عاصمة جمهورية الكونغو الديمقراطية؟", answer: "كينشاسا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ساحل العاج؟", answer: "ياموسوكرو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إريتريا؟", answer: "أسمرة" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إسواتيني؟", answer: "مبابان" },
    { category: "عواصم عالمية", question: "ما هي عاصمة إثيوبيا؟", answer: "أديس أبابا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الغابون؟", answer: "ليبرفيل" },
    { category: "عواصم عالمية", question: "ما هي عاصمة غامبيا؟", answer: "بانجول" },
    { category: "عواصم عالمية", question: "ما هي عاصمة غانا؟", answer: "أكرا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة غينيا؟", answer: "كوناكري" },
    { category: "عواصم عالمية", question: "ما هي عاصمة غينيا بيساو؟", answer: "بيساو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة غينيا الاستوائية؟", answer: "مالابو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كينيا؟", answer: "نيروبي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ليسوتو؟", answer: "ماسيرو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ليبيريا؟", answer: "مونروفيا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة مدغشقر؟", answer: "أنتاناناريفو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة مالاوي؟", answer: "ليلونغوي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة مالي؟", answer: "باماكو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة موريشيوس؟", answer: "بورت لويس" },
    { category: "عواصم عالمية", question: "ما هي عاصمة موزمبيق؟", answer: "مابوتو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ناميبيا؟", answer: "ويندهوك" },
    { category: "عواصم عالمية", question: "ما هي عاصمة النيجر؟", answer: "نيامي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة نيجيريا؟", answer: "أبوجا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة رواندا؟", answer: "كيغالي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ساو تومي وبرينسيب؟", answer: "ساو تومي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة السنغال؟", answer: "داكار" },
    { category: "عواصم عالمية", question: "ما هي عاصمة سيشل؟", answer: "فيكتوريا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة سيراليون؟", answer: "فريتاون" },
    { category: "عواصم عالمية", question: "ما هي عاصمة جنوب أفريقيا؟", answer: "بريتوريا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة جنوب السودان؟", answer: "جوبا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة تنزانيا؟", answer: "دودوما" },
    { category: "عواصم عالمية", question: "ما هي عاصمة توغو؟", answer: "لومي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة أوغندا؟", answer: "كمبالا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة زامبيا؟", answer: "لوساكا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة زيمبابوي؟", answer: "هراري" },

    // =========================================================
    // عواصم عالمية - أمريكا الشمالية والكاريبي
    // =========================================================
    { category: "عواصم عالمية", question: "ما هي عاصمة أنتيغوا وباربودا؟", answer: "سانت جونز" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الباهاما؟", answer: "ناساو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بربادوس؟", answer: "بريدجتاون" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بليز؟", answer: "بلموبان" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كندا؟", answer: "أوتاوا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كوستاريكا؟", answer: "سان خوسيه" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كوبا؟", answer: "هافانا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة دومينيكا؟", answer: "روسو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة جمهورية الدومينيكان؟", answer: "سانتو دومينغو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة السلفادور؟", answer: "سان سلفادور" },
    { category: "عواصم عالمية", question: "ما هي عاصمة غرينادا؟", answer: "سانت جورجز" },
    { category: "عواصم عالمية", question: "ما هي عاصمة غواتيمالا؟", answer: "غواتيمالا سيتي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة هايتي؟", answer: "بورت أو برنس" },
    { category: "عواصم عالمية", question: "ما هي عاصمة هندوراس؟", answer: "تيغوسيغالبا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة جامايكا؟", answer: "كينغستون" },
    { category: "عواصم عالمية", question: "ما هي عاصمة المكسيك؟", answer: "مكسيكو سيتي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة نيكاراغوا؟", answer: "ماناغوا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بنما؟", answer: "بنما سيتي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة سانت كيتس ونيفيس؟", answer: "باستير" },
    { category: "عواصم عالمية", question: "ما هي عاصمة سانت لوسيا؟", answer: "كاستريس" },
    { category: "عواصم عالمية", question: "ما هي عاصمة سانت فنسنت والغرينادين؟", answer: "كينغستاون" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ترينيداد وتوباغو؟", answer: "بورت أوف سبين" },
    { category: "عواصم عالمية", question: "ما هي عاصمة أمريكا؟", answer: "واشنطن" },

    // =========================================================
    // عواصم عالمية - أمريكا الجنوبية
    // =========================================================
    { category: "عواصم عالمية", question: "ما هي عاصمة الأرجنتين؟", answer: "بوينس آيرس" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بوليفيا؟", answer: "سوكري" },
    { category: "عواصم عالمية", question: "ما هي عاصمة البرازيل؟", answer: "برازيليا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة تشيلي؟", answer: "سانتياغو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كولومبيا؟", answer: "بوغوتا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة الإكوادور؟", answer: "كيتو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة غيانا؟", answer: "جورج تاون" },
    { category: "عواصم عالمية", question: "ما هي عاصمة باراغواي؟", answer: "أسونسيون" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بيرو؟", answer: "ليما" },
    { category: "عواصم عالمية", question: "ما هي عاصمة سورينام؟", answer: "باراماريبو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة أوروغواي؟", answer: "مونتيفيديو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة فنزويلا؟", answer: "كاراكاس" },

    // =========================================================
    // عواصم عالمية - أوقيانوسيا
    // =========================================================
    { category: "عواصم عالمية", question: "ما هي عاصمة أستراليا؟", answer: "كانبرا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة فيجي؟", answer: "سوفا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة كيريباتي؟", answer: "تاراوا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة جزر مارشال؟", answer: "ماجورو" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ميكرونيزيا؟", answer: "باليكير" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ناورو؟", answer: "يارين" },
    { category: "عواصم عالمية", question: "ما هي عاصمة نيوزيلندا؟", answer: "ويلينغتون" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بالاو؟", answer: "نغيرولمود" },
    { category: "عواصم عالمية", question: "ما هي عاصمة بابوا غينيا الجديدة؟", answer: "بورت مورسبي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة ساموا؟", answer: "أبيا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة جزر سليمان؟", answer: "هونيارا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة تونغا؟", answer: "نوكوالوفا" },
    { category: "عواصم عالمية", question: "ما هي عاصمة توفالو؟", answer: "فونافوتي" },
    { category: "عواصم عالمية", question: "ما هي عاصمة فانواتو؟", answer: "بورت فيلا" },

    // =========================================================
    // معلومات عامة
    // =========================================================
    { category: "معلومات عامة", question: "ما هو أكبر كوكب في المجموعة الشمسية؟", answer: "المشتري" },
    { category: "معلومات عامة", question: "ما هو أصغر كوكب في المجموعة الشمسية؟", answer: "عطارد" },
    { category: "معلومات عامة", question: "ما هو الكوكب المعروف بالكوكب الأحمر؟", answer: "المريخ" },
    { category: "معلومات عامة", question: "ما هو الكوكب الأقرب إلى الشمس؟", answer: "عطارد" },
    { category: "معلومات عامة", question: "ما هو أكبر محيط في العالم؟", answer: "المحيط الهادئ" },
    { category: "معلومات عامة", question: "ما هي أكبر قارة في العالم؟", answer: "آسيا" },
    { category: "معلومات عامة", question: "ما هي أصغر قارة في العالم؟", answer: "أستراليا" },
    { category: "معلومات عامة", question: "ما هي أكبر دولة في العالم من حيث المساحة؟", answer: "روسيا" },
    { category: "معلومات عامة", question: "ما هي أصغر دولة في العالم؟", answer: "الفاتيكان" },
    { category: "معلومات عامة", question: "ما هو أعلى جبل في العالم؟", answer: "إيفرست" },
    { category: "معلومات عامة", question: "ما هو أسرع حيوان بري؟", answer: "الفهد" },
    { category: "معلومات عامة", question: "ما هو أكبر حيوان في العالم؟", answer: "الحوت الأزرق" },
    { category: "معلومات عامة", question: "ما هو الغاز الأكثر وجوداً في الغلاف الجوي؟", answer: "النيتروجين" },
    { category: "معلومات عامة", question: "كم عدد ألوان قوس قزح؟", answer: "7" },
    { category: "معلومات عامة", question: "كم عدد الكواكب في المجموعة الشمسية؟", answer: "8" },
    { category: "معلومات عامة", question: "كم عدد سور القرآن الكريم؟", answer: "114" },
    { category: "معلومات عامة", question: "ما هي أطول سورة في القرآن الكريم؟", answer: "البقرة" },
    { category: "معلومات عامة", question: "ما هي أقصر سورة في القرآن الكريم؟", answer: "الكوثر" },
    { category: "معلومات عامة", question: "ما هي السورة التي تسمى أم الكتاب؟", answer: "الفاتحة" },
    { category: "معلومات عامة", question: "ما هي العملة الرسمية في السعودية؟", answer: "الريال" },
    { category: "معلومات عامة", question: "ما هي العملة الرسمية في اليابان؟", answer: "الين" },
    { category: "معلومات عامة", question: "ما هي العملة الرسمية في بريطانيا؟", answer: "الجنيه الإسترليني" },
    { category: "معلومات عامة", question: "ما هي العملة الرسمية في أمريكا؟", answer: "الدولار" },
    { category: "معلومات عامة", question: "كم عدد أشهر السنة؟", answer: "12" },
    { category: "معلومات عامة", question: "كم عدد أيام الأسبوع؟", answer: "7" },
    { category: "معلومات عامة", question: "كم عدد ساعات اليوم؟", answer: "24" },

    // =========================================================
    // رياضة
    // =========================================================
    { category: "رياضة", question: "كم عدد لاعبي فريق كرة القدم داخل الملعب؟", answer: "11" },
    { category: "رياضة", question: "كم عدد أشواط مباراة كرة القدم؟", answer: "2" },
    { category: "رياضة", question: "كم مدة شوط كرة القدم؟", answer: "45 دقيقة" },
    { category: "رياضة", question: "كم عدد لاعبي فريق كرة السلة داخل الملعب؟", answer: "5" },
    { category: "رياضة", question: "كم عدد الحلقات في شعار الألعاب الأولمبية؟", answer: "5" },
    { category: "رياضة", question: "ما هي الرياضة التي تستخدم فيها كرة صفراء ومضرب؟", answer: "التنس" },
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

export default questions;

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
        ctx.font = 'bold 42px NotoNaskh, sans-serif';
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
