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
    }, 4000); // 4 seconds before fading out
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
    { id: 9, me: "رياضتي المفضلة؟", friend: "الرياضة المفضلة لـ {name}؟", o: ["⚽ كرة القدم", "🏀 كرة السلة", "🏊 السباحة", "🏃 الجري", "🎾 التنس", "🛋️ لا أمارس الرياضة"] },
    { id: 10, me: "لو ربحت مليون دولار، أول شيء سأفعله؟", friend: "لو ربح {name} مليون دولار، أول شيء سيفعله؟", o: ["🏡 شراء منزل", "✈️ السفر حول العالم", "🏎️ شراء سيارة أحلامي", "📈 الاستثمار", "🤲 التبرع بجزء منها", "🚪 الاستقالة من العمل"] },
    { id: 11, me: "أكثر شيء أحب قضاء وقتي فيه؟", friend: "أكثر شيء يحب {name} قضاء وقته فيه؟", o: ["😴 النوم", "📱 تصفح الجوال", "🎬 مشاهدة الأفلام/المسلسلات", "👯 الخروج مع الأصدقاء", "🎮 اللعب (Video Games)", "📚 القراءة"] },
    { id: 12, me: "كيف أتصرف عندما أحزن؟", friend: "كيف يتصرف {name} عندما يحزن؟", o: ["🛌 أنام", "🍔 آكل كثيراً", "🚶 أجلس بمفردي", "🫂 أفضفض لشخص قريب", "🎧 أستمع للموسيقى", "😭 أبكي"] },
    { id: 13, me: "حيواني الأليف المفضل؟", friend: "الحيوان الأليف المفضل لـ {name}؟", o: ["🐱 القطط", "🐶 الكلاب", "🦜 الطيور", "🐠 الأسماك", "🚫 لا أحب الحيوانات الأليفة"] },
    { id: 14, me: "لو قدرت أسافر لأي دولة الآن، سأختار؟", friend: "لو استطاع {name} السفر لأي دولة الآن، سيختار؟", o: ["🏝️ المالديف", "🇹🇷 تركيا", "🇺🇸 أمريكا", "🇯پان اليابان", "🇫🇷 فرنسا", "🇬🇧 بريطانيا"] },
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
let quizKey = ""; // Used for local storage & Firebase anti-cheat

function initApp() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const r = params.get('r');

    if (q) {
        try {
            currentQueryStr = q;
            const quizData = decodeData(q);
            renderTakeQuiz(quizData);
        } catch (e) {
            customAlert('الرابط غير صالح!', 'error');
            renderHome();
        }
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
                                <img src="https://media.tenor.com/pZ_sJd2gqPIAAAAi/sad-spongebob.gif" style="width:120px; border-radius:12px; display:block; margin: 0 auto 10px;" alt="sad">
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

// --- DASHBOARD ---
window.renderDashboard = function () {
    const savedQuiz = localStorage.getItem('friendQuiz_myLink');
    let myQuizKey = "";
    if (savedQuiz) {
        const parsed = JSON.parse(savedQuiz);
        myQuizKey = parsed.link.includes('?q=') ? parsed.link.split('?q=')[1] : '';
    }

    app.innerHTML = `
        <div class="fade-in">
            <h2 style="color: var(--secondary); margin-bottom: 20px;">🏆 لوحة درجات الأصدقاء</h2>
            <div id="dashScoresContainer">
                <p style="text-align:center; color:white;">جاري جلب الدرجات...</p>
            </div>
            <button class="btn btn-secondary" onclick="renderHome()">🏠 العودة للرئيسية</button>
        </div>
    `;

    if (myQuizKey) {
        listenToScoresFirebase(myQuizKey, (board) => {
            const container = document.getElementById('dashScoresContainer');
            if (!container) return;

            if (board.length === 0) {
                container.innerHTML = `
                    <img src="https://media.tenor.com/pZ_sJd2gqPIAAAAi/sad-spongebob.gif" class="result-gif" alt="Sad GIF" style="border: 2px solid var(--card-border);">
                    <p class="subtitle" style="color: white; font-weight: bold; font-size: 1.2rem; margin-top: 15px;">لم يقم أي من أصدقائك بحل الاختبار حتى الآن 🥺</p>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">أنشئ اختباراً وشارك الرابط معهم لتظهر درجاتهم هنا!</p>
                `;
            } else {
                board.sort((a, b) => (b.s / b.t) - (a.s / a.t));
                let listHtml = board.map((item, i) => `
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-right: 4px solid ${i === 0 ? '#fbbf24' : 'var(--primary)'};">
                        <span style="font-size:1.1rem; font-weight:bold;">${i === 0 ? '👑 ' : ''}${i + 1}. ${item.f}</span>
                        <span style="font-weight:bold; color:var(--secondary); font-size:1.2rem;">${item.s} / ${item.t}</span>
                    </div>
                `).join('');

                container.innerHTML = `
                    <p class="subtitle">هذه هي درجات أصدقائك الذين حلوا اختبارك:</p>
                    <div style="max-height: 350px; overflow-y: auto; margin-bottom: 20px; text-align: right; padding-right: 5px;">
                        ${listHtml}
                    </div>
                `;
            }
        });
    }
}

// --- CREATE PREDEFINED QUIZ ---
let activeQuestions = [];
let availableQuestions = [];

function renderCreatePredefinedQuiz() {
    availableQuestions = [...PREDEFINED_QUESTIONS].sort(() => Math.random() - 0.5);
    activeQuestions = [];
    for (let i = 0; i < 10; i++) activeQuestions.push(availableQuestions.shift());

    renderCreatorQuestions();
}

function renderCreatorQuestions() {
    let questionsHtml = activeQuestions.map((q, index) => `
        <div class="question-block" id="q-block-${index}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; flex: 1; font-size: 1.1rem; color: var(--secondary);">${index + 1}. ${q.me}</h3>
                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem; margin: 0; width: auto; box-shadow: none;" onclick="skipQuestion(${index})">🔄 تخطي</button>
            </div>
            <div class="options-container">
                ${q.o.map((opt, j) => `
                    <div class="option-input-row">
                        <input type="radio" name="cq-${index}" value="${j}" id="cq-${index}-${j}">
                        <label for="cq-${index}-${j}" style="font-size: 1rem; width: 100\%;">${opt}</label>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    app.innerHTML = `
        <div class="fade-in" style="text-align: right;">
            <h2 style="margin-bottom: 20px; text-align: center; color: var(--secondary);">الأسئلة الجاهزة 🔥</h2>
            
            <div class="input-group">
                <label>اسمك (ليعرف أصدقائك أن هذا اختبارك):</label>
                <input type="text" id="creatorName" placeholder="أدخل اسمك هنا..." required>
            </div>

            <div id="questionsContainer">
                ${questionsHtml}
            </div>

            <button class="btn" onclick="generateQuizLink('predefined')">إنشاء الرابط ومشاركته 🚀</button>
            <button class="btn btn-secondary" onclick="renderHome()">العودة</button>
        </div>
    `;
}

window.skipQuestion = function (index) {
    if (availableQuestions.length === 0) return customAlert("لا يوجد المزيد من الأسئلة للتخطي!", "warning");

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const newQuestion = availableQuestions.splice(randomIndex, 1)[0];
    availableQuestions.push(activeQuestions[index]);
    activeQuestions[index] = newQuestion;

    const block = document.getElementById(`q-block-${index}`);
    block.style.opacity = '0';
    setTimeout(() => {
        block.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; flex: 1; font-size: 1.1rem; color: var(--secondary);">${index + 1}. ${newQuestion.me}</h3>
                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem; margin: 0; width: auto; box-shadow: none;" onclick="skipQuestion(${index})">🔄 تخطي</button>
            </div>
            <div class="options-container">
                ${newQuestion.o.map((opt, j) => `
                    <div class="option-input-row">
                        <input type="radio" name="cq-${index}" value="${j}" id="cq-${index}-${j}">
                        <label for="cq-${index}-${j}" style="font-size: 1rem; width: 100\%;">${opt}</label>
                    </div>
                `).join('')}
            </div>
        `;
        block.style.opacity = '1';
    }, 200);
}

// --- CREATE CUSTOM QUIZ ---
let customQuestionsCounter = 1;

function renderCreateCustomQuiz() {
    customQuestionsCounter = 1;
    app.innerHTML = `
        <div class="fade-in" style="text-align: right;">
            <h2 style="margin-bottom: 20px; text-align: center; color: var(--secondary);">تأليف أسئلة من دماغك 🧠</h2>
            
            <div class="input-group">
                <label>اسمك (صاحب الاختبار):</label>
                <input type="text" id="creatorName" placeholder="أدخل اسمك هنا..." required>
            </div>

            <div id="customQuestionsContainer">
                ${generateCustomQuestionHTML(1)}
            </div>

            <button class="btn btn-secondary" onclick="addCustomQuestion()" style="margin-bottom: 20px;">+ إضافة سؤال آخر</button>
            <button class="btn" onclick="generateQuizLink('custom')">إنشاء الرابط ومشاركته 🚀</button>
            <button class="btn btn-secondary" onclick="renderHome()">العودة</button>
        </div>
    `;
}

function generateCustomQuestionHTML(id) {
    return `
        <div class="question-block" id="custom-q-${id}">
            <h3 style="margin-bottom:15px; color:var(--secondary);">السؤال رقم ${id}</h3>
            
            <div class="input-group">
                <input type="text" id="cust-q-${id}-text" placeholder="اكتب سؤالك هنا... (مثال: من هو مطربي المفضل؟)" required>
            </div>
            
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 10px;">ضع الإجابة الصحيحة والإجابات الخاطئة:</p>
            <div class="options-container">
                <div class="option-input-row" style="border: 1px solid var(--success);">
                    <input type="radio" name="cust-q-${id}-correct" value="0" checked style="pointer-events:none;">
                    <input type="text" id="cust-q-${id}-opt-0" placeholder="الإجابة الصحيحة (مطلوب)" required style="flex:1; background:transparent; border:none; color:white; outline:none; font-size:1rem; padding-right:10px;">
                </div>
                <div class="option-input-row" style="border: 1px solid var(--danger);">
                    <input type="radio" name="cust-q-${id}-correct" value="1" disabled>
                    <input type="text" id="cust-q-${id}-opt-1" placeholder="إجابة خاطئة (مطلوب)" required style="flex:1; background:transparent; border:none; color:white; outline:none; font-size:1rem; padding-right:10px;">
                </div>
                <div class="option-input-row" style="border: 1px solid var(--danger);">
                    <input type="radio" name="cust-q-${id}-correct" value="2" disabled>
                    <input type="text" id="cust-q-${id}-opt-2" placeholder="إجابة خاطئة (اختياري)" style="flex:1; background:transparent; border:none; color:white; outline:none; font-size:1rem; padding-right:10px;">
                </div>
            </div>
        </div>
    `;
}

window.addCustomQuestion = function () {
    customQuestionsCounter++;
    document.getElementById('customQuestionsContainer').insertAdjacentHTML('beforeend', generateCustomQuestionHTML(customQuestionsCounter));
}

// --- GENERATE LINK ---
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
        // Custom
        for (let i = 1; i <= customQuestionsCounter; i++) {
            const qText = document.getElementById(`cust-q-${i}-text`)?.value.trim();
            if (!qText) continue;

            const opt0 = document.getElementById(`cust-q-${i}-opt-0`).value.trim();
            const opt1 = document.getElementById(`cust-q-${i}-opt-1`).value.trim();
            const opt2 = document.getElementById(`cust-q-${i}-opt-2`).value.trim();

            if (!opt0 || !opt1) {
                customAlert(`السؤال رقم ${i} غير مكتمل! تأكد من كتابة إجابة صحيحة وإجابة واحدة خاطئة على الأقل.`, 'warning');
                return;
            }

            const options = [opt0, opt1];
            if (opt2) options.push(opt2);

            quizData.qs.push({ q: qText, o: options, a: 0 }); // 0 is always the correct one in creation
        }
        if (quizData.qs.length === 0) return customAlert('يجب إضافة سؤال واحد على الأقل!', 'warning');
    }

    const encoded = encodeData(quizData);
    const baseUrl = window.location.origin + window.location.pathname;
    const shareLink = `${baseUrl}?q=${encoded}`;

    // Save quiz persistently so user finds it when they return
    localStorage.setItem('friendQuiz_myLink', JSON.stringify({ name: creatorName, link: shareLink }));
    localStorage.removeItem('friendQuiz_leaderboard');

    app.innerHTML = `
        <div class="fade-in">
            <h2>تم إنشاء الاختبار بنجاح! 🎉</h2>
            <p class="subtitle">انسخ الرابط بالأسفل وأرسله لأصدقائك عبر الواتساب أو ماسنجر</p>
            
            <div class="link-box" id="shareLinkBox">${shareLink}</div>
            
            <button class="btn" onclick="copyText('shareLinkBox')">📋 نسخ الرابط</button>
            <button class="btn btn-secondary" onclick="renderHome()">🏠 الرئيسية (الاختبار محفوظ)</button>
        </div>
    `;
}

window.copyText = function (elementId) {
    const text = document.getElementById(elementId).innerText;
    navigator.clipboard.writeText(text).then(() => {
        customAlert('تم نسخ الرابط بنجاح! أرسله الآن لأصدقائك.', 'success');
    }).catch(err => {
        customAlert('حدث خطأ أثناء النسخ التلقائي، يرجى تحديده ونسخه يدوياً.', 'error');
    });
}

// --- TAKE QUIZ FLOW ---
let currentQuizData = null;
let friendAnswers = [];
let friendQuestions = [];

function renderTakeQuiz(quizData) {
    currentQuizData = quizData;
    quizKey = currentQueryStr;

    // ANTI-CHEAT: Check if this exact quiz was started before
    const savedStateStr = localStorage.getItem(STORAGE_PREFIX + quizKey);
    if (savedStateStr) {
        try {
            const savedState = JSON.parse(savedStateStr);
            if (savedState.quizId === quizKey &&
                savedState.friendAnswers &&
                savedState.friendAnswers.length > 0 &&
                savedState.friendQuestions &&
                savedState.friendQuestions.length > 0) {

                currentQuizData.fName = savedState.fName;
                friendAnswers = savedState.friendAnswers;
                friendQuestions = savedState.friendQuestions;

                if (friendAnswers.length >= friendQuestions.length) {
                    return calculateAndShowResult();
                }

                customAlert('تم منع الغش! 🚫😎 سيتم استئناف الاختبار من حيث توقفت.', 'warning');
                return renderQuestion(friendAnswers.length);
            }
        } catch (e) {
            localStorage.removeItem(STORAGE_PREFIX + quizKey);
        }
    }

    app.innerHTML = `
        <div class="fade-in">
            <h1>مرحباً بك! 👋</h1>
            <p class="subtitle">صديقك <b>${quizData.n}</b> يتحداك ليرى مدى معرفتك به!</p>
            
            <div class="input-group" style="text-align: right;">
                <label>أدخل اسمك أولاً لبدء التحدي:</label>
                <input type="text" id="friendName" placeholder="اسمك..." required>
            </div>

            <button class="btn" onclick="startAnswering()">بدء التحدي 🔥</button>
        </div>
    `;
}

window.startAnswering = function () {
    const fName = document.getElementById('friendName').value.trim();
    if (!fName) return customAlert('يرجى إدخال اسمك قبل البدء!', 'warning');

    currentQuizData.fName = fName;
    friendAnswers = [];

    if (currentQuizData.type === 'predefined') {
        friendQuestions = currentQuizData.qs.map((savedQ) => {
            const q = PREDEFINED_QUESTIONS.find(x => x.id === savedQ.i);
            const correctIdx = savedQ.a;
            let wrongIdx;
            do { wrongIdx = Math.floor(Math.random() * q.o.length); } while (wrongIdx === correctIdx);

            const choices = [
                { text: q.o[correctIdx], isCorrect: true },
                { text: q.o[wrongIdx], isCorrect: false }
            ];
            if (Math.random() > 0.5) choices.reverse();

            return { text: q.friend.replace('{name}', currentQuizData.n), choices: choices };
        });
    } else {
        // Custom
        friendQuestions = currentQuizData.qs.map(q => {
            let choices = q.o.map((opt, idx) => ({
                text: opt,
                isCorrect: idx === q.a
            }));
            choices = choices.sort(() => Math.random() - 0.5);
            return { text: q.q, choices: choices };
        });
    }

    localStorage.setItem(STORAGE_PREFIX + quizKey, JSON.stringify({
        quizId: quizKey,
        fName: fName,
        friendQuestions: friendQuestions,
        friendAnswers: friendAnswers
    }));

    renderQuestion(0);
}

function renderQuestion(index) {
    if (index >= friendQuestions.length) return calculateAndShowResult();

    const q = friendQuestions[index];
    let optionsHtml = q.choices.map((choice, i) => `
        <div class="quiz-option" id="opt-${index}-${i}" onclick="selectAnswer(${index}, ${i}, ${choice.isCorrect})">${choice.text}</div>
    `).join('');

    app.innerHTML = `
        <div class="fade-in" style="text-align: right;">
            <p style="color: var(--secondary); font-weight: bold; margin-bottom: 10px;">السؤال ${index + 1} من ${friendQuestions.length}</p>
            <h2 style="margin-bottom: 25px; line-height: 1.4;">${q.text}</h2>
            
            <div class="options-container">
                ${optionsHtml}
            </div>
        </div>
    `;
}

window.selectAnswer = function (qIndex, optIndex, isCorrect) {
    if (isCorrect) friendAnswers.push(1);
    else friendAnswers.push(0);

    const savedStateStr = localStorage.getItem(STORAGE_PREFIX + quizKey);
    if (savedStateStr) {
        const savedState = JSON.parse(savedStateStr);
        savedState.friendAnswers = friendAnswers;
        localStorage.setItem(STORAGE_PREFIX + quizKey, JSON.stringify(savedState));
    }

    const selectedElement = document.getElementById(`opt-${qIndex}-${optIndex}`);
    selectedElement.style.background = isCorrect ? 'var(--success)' : 'var(--danger)';
    selectedElement.style.borderColor = isCorrect ? 'var(--success)' : 'var(--danger)';

    if (!isCorrect) {
        const correctChoiceIdx = friendQuestions[qIndex].choices.findIndex(c => c.isCorrect);
        const correctEl = document.getElementById(`opt-${qIndex}-${correctChoiceIdx}`);
        if (correctEl) {
            correctEl.style.borderColor = 'var(--success)';
            correctEl.style.color = 'var(--success)';
        }
    }

    document.querySelectorAll('.quiz-option').forEach(el => el.style.pointerEvents = 'none');

    setTimeout(() => {
        renderQuestion(qIndex + 1);
    }, 800);
}

function calculateAndShowResult() {
    let score = friendAnswers.reduce((a, b) => a + b, 0);
    const total = friendQuestions.length;
    const percentage = score / total;

    // حفظ الدرجة في Firebase ليصل تنبيه فوري لصاحب الاختبار
    saveScoreToFirebase(quizKey, currentQuizData.fName, score, total);

    const resultData = {
        f: currentQuizData.fName,
        c: currentQuizData.n,
        s: score,
        t: total
    };

    const encodedResult = encodeData(resultData);
    const baseUrl = window.location.origin + window.location.pathname;
    const resultLink = `${baseUrl}?r=${encodedResult}`;

    let message = "";
    let gifUrl = "";

    if (percentage === 1) {
        message = "ممتاز! أنت تعرفه جيداً جداً 🏆<br><span style='color:var(--success);'>مستحيل يسيبك أبداً 🥰</span>";
        gifUrl = "https://media.tenor.com/pZ2K7W0EItcAAAAi/spongebob-patrick.gif";
    } else if (percentage >= 0.5) {
        message = "جيد، معرفتك به لا بأس بها 👍<br><span style='color:#fbbf24;'>شكله هيراجع علاقته بيك 🤔</span>";
        gifUrl = "https://media.tenor.com/4q-W4x280eAAAAAi/squidward-spongebob.gif";
    } else {
        message = "للأسف، يبدو أنك لا تعرفه أبداً 😅<br><span style='color:var(--danger);'>هيعملك بلوك حالاً! 🚫</span>";
        gifUrl = "https://media.tenor.com/bK1qpWbwQ4gAAAAi/block-blocked.gif";
    }

    app.innerHTML = `
        <div class="fade-in">
            <h2>انتهى الاختبار!</h2>
            <img src="${gifUrl}" class="result-gif" alt="Result GIF">
            
            <div class="score-circle" style="margin-top:15px; margin-bottom:15px; width:120px; height:120px; font-size:2.5rem;">
                <div class="score-inner" style="width:100px; height:100px;">
                    ${score}/${total}
                </div>
            </div>
            
            <p class="subtitle" style="color: white; font-weight: bold; font-size: 1.1rem; line-height:1.6;">${message}</p>
            
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 12px; margin-top: 20px;">
                <p style="margin-bottom: 10px; font-weight: bold;">أخبر ${currentQuizData.n} بنتيجتك!</p>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 10px;">انسخ هذا الرابط وأرسله إلى صديقك ليرى النتيجة.</p>
                <div class="link-box" id="resultLinkBox">${resultLink}</div>
                <button class="btn" style="font-size: 1rem; padding: 10px 20px;" onclick="copyText('resultLinkBox')">📋 نسخ رابط النتيجة</button>
            </div>

            <div style="margin-top: 20px;">
                <button class="btn btn-secondary" onclick="window.location.href='${baseUrl}'">اصنع اختبارك الخاص 🌟</button>
            </div>
        </div>
    `;
}

// --- VIEW RESULT FLOW ---
function renderViewResult(data) {
    const percentage = data.s / data.t;
    let message = "";
    let gifUrl = "";
    let messageColor = "";

    if (percentage === 1) {
        message = `صديقك <b>${data.f}</b> عارف عنك كل حاجة! 🏆<br>مستحيل يسيبك أبداً 🥰`;
        gifUrl = "https://media.tenor.com/pZ2K7W0EItcAAAAi/spongebob-patrick.gif";
        messageColor = "var(--success)";
    } else if (percentage >= 0.5) {
        message = `صديقك <b>${data.f}</b> معرفته بيك لا بأس بها 👍<br>بس شكله هيراجع علاقته بيك 🤔`;
        gifUrl = "https://media.tenor.com/4q-W4x280eAAAAAi/squidward-spongebob.gif";
        messageColor = "#fbbf24";
    } else {
        message = `صديقك <b>${data.f}</b> ميعرفش عنك حاجة 😅<br>المفروض تعمله بلوك حالاً! 🚫`;
        gifUrl = "https://media.tenor.com/bK1qpWbwQ4gAAAAi/block-blocked.gif";
        messageColor = "var(--danger)";
    }

    app.innerHTML = `
        <div class="fade-in">
            <h2 style="color: var(--secondary); margin-bottom: 10px;">قسم الدرجات 📊</h2>
            <p class="subtitle" style="margin-bottom: 15px;">إليك نتيجة صديقك <b>${data.f}</b> في اختبارك:</p>
            
            <img src="${gifUrl}" class="result-gif" alt="Result GIF" style="border: 2px solid ${messageColor};">
            
            <div class="score-circle" style="margin-top:15px; margin-bottom:15px; width:130px; height:130px; font-size:2.8rem; box-shadow: 0 0 40px ${messageColor}40;">
                <div class="score-inner" style="width:110px; height:110px;">
                    ${data.s}/${data.t}
                </div>
            </div>
            
            <p class="subtitle" style="color: white; font-weight: bold; font-size: 1.2rem; line-height:1.6; color: ${messageColor}; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; margin-bottom: 25px;">
                ${message}
            </p>
            
            <button class="btn" onclick="window.location.href=window.location.pathname">🏠 العودة للرئيسية وإنشاء اختبار جديد</button>
        </div>
    `;
}

// Initialize on load
window.onload = initApp;