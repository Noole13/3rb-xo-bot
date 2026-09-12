import { ref, get, update } from "firebase/database";

/**
 * إضافة فوز أو نقطة للاعب في لعبة معينة ضمن السيرفر
 * @param {import("firebase/database").Database} db - قاعدة بيانات فايربيس
 * @param {string} guildId - معرف السيرفر
 * @param {string} userId - معرف اللاعب
 * @param {string} gameName - اسم اللعبة (xo, chairs, capitals, general, flags)
 */
export async function addGameWin(db, guildId, userId, gameName) {
  try {
    const userScoreRef = ref(db, `scores/${guildId}/${userId}/${gameName}`);
    const snapshot = await get(userScoreRef);
    
    let currentScore = 0;
    if (snapshot.exists()) {
      currentScore = snapshot.val();
    }

    const updates = {};
    updates[`scores/${guildId}/${userId}/${gameName}`] = currentScore + 1;
    
    await update(ref(db), updates);
  } catch (error) {
    console.error("Error updating score in Firebase:", error);
  }
}

/**
 * جلب لوحة الشرف الشاملة لجميع ألعاب السيرفر
 * @param {import("firebase/database").Database} db - قاعدة بيانات فايربيس
 * @param {string} guildId - معرف السيرفر
 * @returns {Promise<Object|null>}
 */
export async function getGlobalLeaderboard(db, guildId) {
  try {
    const guildScoresRef = ref(db, `scores/${guildId}`);
    const snapshot = await get(guildScoresRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Error fetching global leaderboard from Firebase:", error);
    return null;
  }
}
