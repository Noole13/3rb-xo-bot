import { ref, get, set } from "firebase/database";

/**
 * دالة عامة لتسجيل فوز أو نقطة لأي لعبة في قاعدة بيانات السيرفر
 */
export async function addGameWin(db, guildId, userId, gameKey) {
  try {
    const userRef = ref(db, `guilds/${guildId}/leaderboard/${userId}/${gameKey}`);
    const snapshot = await get(userRef);

    let currentWins = 0;
    if (snapshot.exists()) {
      currentWins = snapshot.val() || 0;
    }

    await set(userRef, currentWins + 1);
  } catch (e) {
    console.error(`Error saving win for ${gameKey} to Firebase:`, e);
  }
}

/**
 * دالة لجلب وترتيب لوحة الشرف لجميع الألعاب لعرضها في أمر /top
 */
export async function getGlobalLeaderboard(db, guildId) {
  try {
    const leaderboardRef = ref(db, `guilds/${guildId}/leaderboard`);
    const snapshot = await get(leaderboardRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val();
  } catch (error) {
    console.error("Error fetching leaderboard from Firebase:", error);
    return null;
  }
}
