import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from "discord.js";

// تعريف أمر السلاش
export const announcementCommand = new SlashCommandBuilder()
  .setName("إعلان-التحديثات")
  .setDescription("إرسال رسالة تحديثات ألعاب البوت الرسمية في القناة الحالية")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

// دالة تنفيذ الأمر
export async function executeAnnouncement(interaction) {
  // إنشاء الـ Embed المرتب بإطار لون مميز
  const updateEmbed = new EmbedBuilder()
    .setColor(0xF1C40F)
    .setTitle("🎉 تحديث جديد ومثير في سيرفرنا!")
    .setDescription("تم الانتهاء بحمد الله من بناء وتطوير نظام ألعاب البوت بالكامل! 🎮✨\n\nلقد قمنا بإطلاق قائمة ممتعة ومتنوعة من الألعاب لتستمتعوا بها معنا. إليكم الألعاب التي أضفناها:")
    .addFields(
      
      { name: "🪑 لعبة الكراسي الموسيقية", value: "لعبة جماعية ممتعة تتطلب السرعة للبقاء على الكراسي حتى الوصول للفوز وتسجيل نقطة في لوحة الشرف." },
    
      { name: "🏴 لعبة الأعلام (!اعلام أو !flags)", value: "اختبار ذكاء ومعرفة بأسماء أعلام الدول المختلفة." },
      
      { name: "🌍 لعبة العواصم (!عواصم)", value: "تحدٍ ثقافي لمعرفة عواصم دول العالم بسرعة البديهة." },
      
      { name: "🧠 لعبة الأسئلة العامة (!سؤال)", value: "أسئلة منوعة لاختبار معلوماتك العامة وسرعة إجابتك." },
      
      { name: "❌ ⭕ لعبة XO الكلاسيكية (/xo)", value: "التحدي الشهير، حيث يمكنك اللعب ضد أصدقائك أو ضد الذكاء الاصطناعي (البوت)." },
      
      { name: "📊 لوحة الشرف ونظام النقاط (/top)", value: "نظام متكامل لحفظ انتصاراتكم وعرض أفضل اللاعبين في السيرفر." },
      
      { name: "⚠️ تنبيه هام", value: "يرجى دائماً استخدام هذه الألعاب داخل قناة الألعاب المخصصة في السيرفر!" }
    )
    .setFooter({ text: "جهّزوا أنفسكم، ونتمنى للجميع أوقاتاً مليئة بالحماس والتحدي! 🚀🔥" });

  // إرسال الـ Embed في القناة التي كُتب فيها الأمر
  await interaction.channel.send({ embeds: [updateEmbed] });

  // رد مخفي للمشرف يؤكد نجاح الإرسال
  await interaction.reply({
    content: "✅ تم إرسال رسالة إعلان التحديثات بنجاح في هذه القناة!",
    flags: MessageFlags.Ephemeral,
  });
}
