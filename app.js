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
    { id: 3, me: "أكثر شيء يزعجني؟", friend: "أكثر شيء يزعج {name}؟", o: ["🤥 الكذب", "🙄 التجاهل", "⏳ الانتظار", "📢 الصوت العالي", "🥶 البرود", "😎 الغرور"] },
    { id: 4, me: "مكاني المفضل للخروج؟", friend: "المكان المفضل للخروج لـ {name}؟", o: ["🌊 البحر", "☕ الكافيه", "🍿 السينما", "🍽️ المطعم", "🛍️ التسوق", "🏠 البقاء في المنزل"] },
    { id: 5, me: "نوع الأفلام المفضل لي؟", friend: "نوع الأفلام المفضل لـ {name}؟", o: ["💥 أكشن", "👻 رعب", "😂 كوميدي", "👽 خيال علمي", "🎭 دراما", "❤️ رومانسي"] },
    { id: 6, me: "شخصيتي بشكل عام؟", friend: "شخصية {name} بشكل عام؟", o: ["🤫 هادئ", "🗣️ اجتماعي", "😠 عصبي", "🤣 مرح", "😳 خجول", "🎭 متقلب المزاج"] },
    { id: 7, me: "أكثر تطبيق بستخدمه؟", friend: "أكثر تطبيق يستخدمه {name}؟", o: ["💬 واتساب", "📸 انستجرام", "📘 فيسبوك", "🎵 تيك توك", "👻 سناب شات", "🐦 تويتر (X)"] },
    { id: 8, me: "فصلي المفضل في السنة؟", friend: "الفصل المفضل في السنة لـ {name}؟", o: ["❄️ الشتاء", "☀️ الصيف", "🌸 الربيع", "🍂 الخريف"] },
    { id: 9, me: "رياضتي المفضلة؟", friend: "الرياضة المفضلة لـ {name}؟", o: ["⚽ كرة القدم", "🏀 كرة السلة", "🏊 السباحة", "🏃 الجري", "تنسيق الكود السابق انقطع في النهاية؛ إليك **الجزء المتبقي والنهائي لملف `app.js`** لتستكمل به الملف بالكامل:

```javascript
    { id: 9, me: "رياضتي المفضلة؟", friend: "الرياضة المفضلة لـ {name}؟", o: ["⚽ كرة القدم", "🏀 كرة السلة", "🏊 السباحة", "🏃 الجري", "🎾 التنس", "🛋️ لا أمارس الرياضة"] },
    { id: 10, me: "لو ربحت مليون دولار، أول شيء سأفعله؟", friend: "لو ربح {name} مليون دولار، أول شيء سيفعله؟", o: ["🏡 شراء منزل", "✈️ السفر حول العالم", "🏎️ شراء سيارة أحلامي", "📈 الاستثمار", "🤲 التبرع بجزء منها", "🚪 الاستقالة من العمل"] },
    { id: 11, me: "أكثر شيء أحب قضاء وقتي فيه؟", friend: "أكثر شيء يحب {name} قضاء وقته فيه؟", o: ["😴 النوم", "📱 تصفح الجوال", "🎬 مشاهدة الأفلام/المسلسلات", "👯 الخروج مع الأصدقاء", "🎮 اللعب (Video Games)", "📚 القراءة"] },
    { id: 12, me: "كيف أتصرف عندما أحزن؟", friend: "كيف يتصرف {name} عندما يحزن؟", o: ["🛌 أنام", "🍔 آكل كثيراً", "🚶 أجلس بمفردي", "🫂 أفضفض لشخص قريب", "🎧 أستمع للموسيقى", "😭 أبكي"] },
    { id: 13, me: "حيواني الأليف المفضل؟", friend: "الحيوان الأليف المفضل لـ {name}؟", o: ["🐱 القطط", "🐶 الكلاب", "🦜 الطيور", "🐠 الأسماك", "🚫 لا أحب الحيوانات الأليفة"] },
    { id: 14, me: "لو قدرت أسافر لأي دولة الآن، سأختار؟", friend: "لو استطاع {name} السفر لأي دولة الآن، سيختار؟", o: ["🏝️ المالديف", "🇹🇷 تركيا", "🇺🇸 أمريكا", "🇯🇵 اليابان", "🇫🇷 فرنسا", "🇬🇧 بريطانيا"] },
    { id: 15, me: "كلمتي المفضلة التي أقولها دائماً؟", friend: "الكلمة التي يرددها {name} دائماً؟", o: ["💯 والله", "😲 بجد", "🤦 يا عم", "👌 تمام", "🚗 يا اسطى", "👍 أوكي"] },
    { id: 16, me: "لو كنت بطل خارق، ماذا ستكون قوتي؟", friend: "لو كان {name} بطلاً خارقاً، ما هي قوته؟", o: ["✈️ الطيران", "👻 الاختفاء", "💪 القوة الخارقة", "🧠 قراءة الأفكار", "⚡ السرعة الخارقة"] },
    { id: 17, me: "أفضل هدية ممكن حد يجيبهالي؟", friend: "أفضل هدية بالنسبة لـ {name}؟", o: ["📱 إلكترونيات", "👟 ملابس/أحذية", "⌚ ساعة قيمة", "🍫 شوكولاتة", "💵 كاش", "🌹 ورد"] },
    { id: 18, me: "حاجتي المفضلة في التليفون؟", friend: "أكثر شيء يحبه {name} في التليفون؟", o: ["📸 الكاميرا", "🎮 الألعاب", "💬 الشات", "🎵 الأغاني", "🎥 الفيديوهات القصيرة"] },
    { id: 19, me: "رد فعلي لما حد يعصبني؟", friend: "رد فعل {name} لما حد يعصبه؟", o: ["🤬 أتعصب وأزعق", "🤐 أسكت تماماً", "🚶 أمشي وأسيبه", "😂 أضحك ببرود", "🙄 أرمي كلام مستفز"] }
];

function encodeData(data) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}
function decodeData(str) {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
}

// Router
let currentQueryStr = "";
let quizKey = "";

function initApp() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const r = params.get('r');

    if (q) {
        currentQueryStr = q;
        db.ref(`quizzes_data/${q}`).once('value').then((snapshot) => {
            const quizData = snapshot.val();
            if (quizData) {
                renderTakeQuiz(quizData);
            } else {
                try {
                    const oldData = decodeData(q);
                    renderTakeQuiz(oldData);
                } catch (e) {
                    customAlert('الرابط غير صالح أو تم حذفه!', 'error');
                    renderHome();
                }
            }
        }).catch(() => {
            customAlert('حدث خطأ في جلب بيانات الاختبار!', 'error');
            renderHome();
        });
    } else if (r) {
        try {
            const resultData = decodeData(r);
            renderViewResult(resultData);
        } catch (e) {
            customAlert('الرابط غير صالح!', 'error');
            renderHome();
        }
    } else {
        renderHome();
    }
}

// --- HOME SCREEN ---
function renderHome() {
    const savedQuiz = localStorage.getItem('friendQuiz_myLink');

    let myQuizSection = '';
    if (savedQuiz) {
        const parsed = JSON.parse(savedQuiz);
        const myQuizKey = parsed.link.includes('?q=') ? parsed.link.split('?q=')[1] : '';

        myQuizSection = `
            <div style="background:rgba(255,255,255,0.07); border:1px solid var(--card-border); border-radius:18px; padding:20px; margin-bottom:25px; text-align:right;">
                <h3 style="color:var(--secondary); margin-bottom:5px; font-size:1.1rem;">📋 اختبارك الحالي - <span style="color:white;">${parsed.name}</span></h3>
                <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">انسخ الرابط وأرسله لأصدقائك:</p>
                <div class="link-box" id="savedLinkBox" style="font-size:0.8rem; padding:10px; margin-bottom:10px;">${parsed.link}</div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button class="btn" onclick="copyText('savedLinkBox')" style="flex:1; padding:10px; font-size:0.95rem;">📋 نسخ الرابط</button>
                    <button class="btn btn-secondary" onclick="clearMyQuiz()" style="flex:1; padding:10px; font-size:0.95rem;">🗑️ حذف الاختبار</button>
                </div>
                
                <div style="margin-top:18px; border-top:1px solid var(--card-border); padding-top:15px;">
                    <h4 style="color:var(--secondary); margin-bottom:12px;">🏆 درجات أصدقائك</h4>
                    <div id="liveScoresContainer">
                        <p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">جاري تحميل الدرجات...</p>
                    </div>
                </div>
            </div>`;

        setTimeout(() => {
            if (myQuizKey) {
                listenToScoresFirebase(myQuizKey, (board) => {
                    const container = document.getElementById('liveScoresContainer');
                    if (!container) return;

                    if (board.length === 0) {
                        container.innerHTML = `
                            <div style="text-align:center; padding: 15px 0;">
                                <img src="[https://media.tenor.com/pZ_sJd2gqPIAAAAi/sad-spongebob.gif](https://media.tenor.com/pZ_sJd2gqPIAAAAi/sad-spongebob.gif)" style="width:120px; border-radius:12px; display:block; margin: 0 auto 10px;" alt="sad">
                                <p style="font-size:0.95rem; color:var(--text-muted);">لم يحل أي صديق اختبارك بعد 🥺<br>أرسل الرابط وانتظر!</p>
                            </div>`;
                    } else {
                        board.sort((a, b) => (b.s / b.t) - (a.s / a.t));
                        container.innerHTML = board.map((item, i) => `
                            <div style="background:rgba(255,255,255,0.05); padding:12px 15px; border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; border-right:3px solid ${i === 0 ? '#fbbf24' : 'var(--primary)'}">
                                <span style="font-weight:bold;">${i === 0 ? '👑 ' : ''}${i + 1}. ${item.f}</span>
                                <span style="color:var(--secondary); font-weight:bold; font-size:1.1rem;">${item.s}/${item.t}</span>
                            </div>`).join('');
                    }
                });
            }
        }, 100);
    }

    app.innerHTML = `
        <div class="fade-in">
            <h1 style="font-size: 2.2rem; margin-bottom: 10px;">اختبار الأصدقاء ✨</h1>
            <p class="subtitle" style="margin-bottom: 25px;">هل أصدقاؤك يعرفونك حقاً؟ اختبرهم الآن! 😂</p>
            
            ${myQuizSection}

            <button class="btn" onclick="renderCreatePredefinedQuiz()" style="margin-bottom: 15px; padding: 18px;">🚀 إنشاء اختبار جديد بأسئلة جاهزة</button>
            <button class="btn btn-secondary" onclick="renderCreateCustomQuiz()" style="padding: 18px;">✍️ تأليف أسئلة من دماغك</button>
        </div>
    `;
}

window.clearMyQuiz = function () {
    localStorage.removeItem('friendQuiz_myLink');
    localStorage.removeItem('friendQuiz_leaderboard');
    customAlert('تم حذف الاختبار والدرجات بنجاح!', 'success');
    renderHome();
}

// --- GENERATE SHORT LINK ---
window.generateQuizLink = function (type) {
    const creatorName = document.getElementById('creatorName').value.trim();
    if (!creatorName) {
        customAlert('يرجى كتابة اسمك أعلى الصفحة!', 'warning');
        window.scrollTo(0, 0);
        return;
    }

    let quizData = { type: type, n: creatorName, qs: [] };

    if (type === 'predefined') {
        for (let i = 0; i < activeQuestions.length; i++) {
            const selected = document.querySelector(`input[name="cq-${i}"]:checked`);
            if (!selected) {
                customAlert(`يرجى الإجابة على السؤال رقم ${i + 1} حتى نستطيع تقييم صديقك!`, 'warning');
                document.getElementById(`q-block-${i}`).scrollIntoView({ behavior: "smooth", block: "center" });
                return;
            }
            quizData.qs.push({ i: activeQuestions[i].id, a: parseInt(selected.value) });
        }
    } else {
        for (let i = 1; i <= customQuestionsCounter; i++) {
            const qText = document.getElementById(`cust-q-${i}-text`)?.value.trim();
            if (!qText) continue;

            const opt0 = document.getElementById(`cust-q-${i}-opt-0`).value.trim();
            const opt1 = document.getElementById(`cust-q-${i}-opt-1`).value.trim();
            const opt2 = document.getElementById(`cust-q-${i}-opt-2`).value.trim();

            if (!opt0 || !opt1) {
                customAlert(`السؤال رقم ${i} غير مكتمل!`, 'warning');
                return;
            }

            const options = [opt0, opt1];
            if (opt2) options.push(opt2);

            quizData.qs.push({ q: qText, o: options, a: 0 });
        }
        if (quizData.qs.length === 0) return customAlert('يجب إضافة سؤال واحد على الأقل!', 'warning');
    }

    const quizId = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);

    db.ref(`quizzes_data/${quizId}`).set(quizData).then(() => {
        const baseUrl = window.location.origin + window.location.pathname;
        const shareLink = `${baseUrl}?q=${quizId}`;

        localStorage.setItem('friendQuiz_myLink', JSON.stringify({ name: creatorName, link: shareLink }));

        app.innerHTML = `
            <div class="fade-in">
                <h2>تم إنشاء الاختبار بنجاح! 🎉</h2>
                <p class="subtitle">انسخ الرابط القصير بالأسفل وأرسله لأصدقائك:</p>
                <div class="link-box" id="shareLinkBox">${shareLink}</div>
                <button class="btn" onclick="copyText('shareLinkBox')">📋 نسخ الرابط</button>
                <button class="btn btn-secondary" onclick="renderHome()">🏠 الرئيسية</button>
            </div>
        `;
    }).catch(() => {
        customAlert('حدث خطأ أثناء حفظ الاختبار، يرجى المحاولة مرة أخرى.', 'error');
    });
}

window.copyText = function (elementId) {
    const text = document.getElementById(elementId).innerText;
    navigator.clipboard.writeText(text).then(() => {
        customAlert('تم نسخ الرابط بنجاح!', 'success');
    });
}

window.onload = initApp;
