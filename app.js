// ==========================================
// 1. FIREBASE CONFIG & INITIALIZATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBScSSGdMZCR41E2vsS4ogvlBH4vV3nTmw",
    authDomain: "friendquiz-94ba3.firebaseapp.com",
    databaseURL: "https://friendquiz-94ba3-default-rtdb.firebaseio.com",
    projectId: "friendquiz-94ba3",
    storageBucket: "friendquiz-94ba3.appspot.com",
    messagingSenderId: "422728369836",
    appId: "1:422728369836:web:071dd9ab77f2dc26cf4109"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// الاستماع اللحظي للدرجات من Firebase
function listenToScoresFirebase(quizKey, callback) {
    if (!quizKey) return;
    const sanitizedKey = quizKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    db.ref(`quizzes/${sanitizedKey}/scores`).on('value', (snapshot) => {
        const data = snapshot.val();
        let board = [];
        if (data) {
            board = Object.values(data);
        }
        callback(board);
    });
}

// حفظ النتيجة في Firebase
function saveScoreToFirebase(quizKey, friendName, score, total) {
    if (!quizKey || !friendName) return;
    const sanitizedKey = quizKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    db.ref(`quizzes/${sanitizedKey}/scores`).push({
        f: friendName,
        s: score,
        t: total,
        timestamp: Date.now()
    });
}

// ==========================================
// 2. YOUR ORIGINAL APP CODE
// ==========================================
const app = document.getElementById('app');
const STORAGE_PREFIX = "friendQuizV2_";

// --- CUSTOM ALERT ---
window.customAlert = function (msg, type = 'error') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = msg;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

const PREDEFINED_QUESTIONS = [
    { id: 0, me: "ما هو لوني المفضل؟", friend: "ما هو اللون المفضل لـ {name}؟", o: ["🖤 الأسود", "💙 الأزرق", "❤️ الأحمر", "🤍 الأبيض", "💚 الأخضر", "💛 الأصفر"] },
    { id: 1, me: "ما هي أكلتي المفضلة؟", friend: "ما هي الأكلة المفضلة لـ {name}؟", o: ["🥙 الشاورما", "🍕 البيتزا", "🍔 البرجر", "🍝 المكرونة", "🍣 السوشي", "🍗 المشويات"] },
    { id: 2, me: "مشروبي المفضل؟", friend: "ما هو المشروب المفضل لـ {name}؟", o: ["☕ القهوة", "🍵 الشاي", "🧃 العصير", "🥤 المشروبات الغازية", "💧 الماء", "🧋 القهوة المثلجة"] },
    { id: 3, me: "أكثر شيء يزعجني؟", friend: "أكثر شيء يزعج {
