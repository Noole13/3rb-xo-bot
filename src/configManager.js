import { db } from './firebase.js'; // (أو استبدل المسار بملف إعدادات فايربيس الموجود عندك)
import { doc, getDoc, setDoc } from 'firebase/firestore';

// جلب قناة الألعاب الخاصة بالسيرفر من فايربيس
export async function getGameChannel(guildId) {
    try {
        const docRef = doc(db, "guildSettings", guildId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data().gameChannelId || null;
        }
        return null;
    } catch (error) {
        console.error("خطأ أثناء جلب القناة من فايربيس:", error);
        return null;
    }
}

// حفظ قناة الألعاب الخاصة بالسيرفر في فايربيس
export async function setGameChannel(guildId, channelId) {
    try {
        const docRef = doc(db, "guildSettings", guildId);
        await setDoc(docRef, { gameChannelId: channelId }, { merge: true });
        return true;
    } catch (error) {
        console.error("خطأ أثناء حفظ القناة في فايربيس:", error);
        return false;
    }
}
