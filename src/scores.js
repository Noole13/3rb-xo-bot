import { ref, get, update } from "firebase/database";

/**
 * إضافة فوز أو نقطة للاعب في لعبة معينة ضمن السيرفر
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
 * جلب لوحة الشرف الشاملة لجميع ألعاب السيرفر (مع دعم المسارات القديمة والجديدة)
 */
export async function getGlobalLeaderboard(db, guildId) {
  try {
    // 1. محاولة الجلب من المسار الأساسي الجديد
    const scoresRef = ref(db, `scores/${guildId}`);
    let snapshot = await get(scoresRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }

    // 2. كحل احتياطي: المحاولة من مسار leaderboard إذا كانت البيانات قديمة مخزنة هناك
    const leaderboardRef = ref(db, `leaderboard/${guildId}`);
    snapshot = await get(leaderboardRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }

    return null;
  } catch (error) {
    console.error("Error fetching global leaderboard from Firebase:", error);
    return null;
  }
}
