// ข้อมูลระบบแปลภาษา (ไทย / จีน)
const translations = {
    th: {
        title: "เกมจับคู่กาแล็กซี่ดาราศาสตร์",
        gameTitle: "🌌 ผจญภัยกาแล็กซี่",
        gameSubtitle: "เรียนรู้กาแล็กซี่ผ่านการจับคู่",
        startBtn: "เริ่มเกม",
        settingsBtn: "ตั้งค่า",
        guideBtn: "คู่มือ",
        loginBtn: "เข้าสู่ระบบ",
        settingsTitle: "การตั้งค่า",
        langLabel: "ภาษา / 语言:",
        soundLabel: "เสียงเอฟเฟกต์:",
        backBtn: "กลับ",
        guideTitle: "คู่มือการเล่น",
        guideDesc: "จับคู่ภาพกาแล็กซี่ที่เหมือนกันภายในเวลาที่กำหนดเพื่อเรียนรู้โครงสร้างอวกาศ",
        loginTitle: "บันทึกข้อมูลผู้เล่น",
        saveBtn: "บันทึก",
        scoreLabel: "คะแนน:",
        timeLabel: "เวลา:",
        quitBtn: "ออก",
        homeBtn: "กลับสู่เมนูหลัก",
        winTitle: "ยินดีด้วย! คุณชนะแล้ว 🎉",
        loseTitle: "หมดเวลา! คุณแพ้แล้ว 😢",
        winDesc: "คุณทำคะแนนได้ตามเป้าหมายและเรียนรู้กาแล็กซี่สำเร็จ!",
        loseDesc: "คะแนนไม่ถึงเป้าหมาย ลองพยายามใหม่อีกครั้งนะ!"
    },
    zh: {
        title: "天文学星系配对游戏",
        gameTitle: "🌌 星系大冒险",
        gameSubtitle: "通过配对游戏学习星系知识",
        startBtn: "开始游戏",
        settingsBtn: "设置",
        guideBtn: "游戏指南",
        loginTitle: "登录",
        settingsTitle: "设置",
        langLabel: "语言 / Language:",
        soundLabel: "音效:",
        backBtn: "返回",
        guideTitle: "游戏指南",
        guideDesc: "在规定时间内配对相同的星系图片以了解宇宙结构。",
        loginTitle: "玩家信息",
        loginBtn: "登录",
        saveBtn: "保存",
        scoreLabel: "得分:",
        timeLabel: "时间:",
        quitBtn: "退出",
        homeBtn: "返回主菜单",
        winTitle: "恭喜你！你赢了 🎉",
        loseTitle: "时间到！你输了 😢",
        winDesc: "你达到了目标分数并成功掌握了星系知识！",
        loseDesc: "分数未达到目标，请再接再厉！"
    }
};

let currentLang = localStorage.getItem('galaxy_lang') || 'th';
let soundEnabled = true;
let score = 0;
let targetScore = 60;
let timeLeft = 45;
let timerInterval = null;
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let matchedPairs = 0;

// รายการไอคอนกาแล็กซี่ / วัตถุดาราศาสตร์
const galaxyEmojis = ['🌀', '🌌', '✨', '🪐', '⭐', '☄️'];

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('galaxy_lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
}

function changeLanguage(lang) {
    setLanguage(lang);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function openLogin() {
    showScreen('login-screen');
    const savedUser = localStorage.getItem('galaxy_username');
    if (savedUser) {
        document.getElementById('username-input').value = savedUser;
    }
}

function saveUser() {
    const username = document.getElementById('username-input').value.trim();
    if (username) {
        localStorage.setItem('galaxy_username', username);
        alert(currentLang === 'th' ? 'บันทึกสำเร็จ!' : '保存成功！');
        showScreen('main-menu');
    }
}

function toggleSound(enabled) {
    soundEnabled = enabled;
}

// เริ่มเกมและการจัดวางการ์ด
function startGame() {
    score = 0;
    matchedPairs = 0;
    timeLeft = 45;
    document.getElementById('score').textContent = score;
    document.getElementById('target-score').textContent = targetScore;
    document.getElementById('timer').textContent = timeLeft;

    createCardGrid();
    startTimer();
}

function createCardGrid() {
    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';

    // สุ่มการ์ด 6 แบบ แบบละ 2 ใบ รวม 12 ใบ
    let cardPool = [...galaxyEmojis, ...galaxyEmojis];
    cardPool.sort(() => Math.random() - 0.5);

    cardPool.forEach(emoji => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.emoji = emoji;
        card.innerHTML = `<span style="display:none">${emoji}</span>`;
        card.addEventListener('click', flipCard);
        grid.appendChild(card);
    });
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add('flipped');
    this.querySelector('span').style.display = 'block';

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji;

    if (isMatch) {
        disableCards();
        score += 20;
        document.getElementById('score').textContent = score;
        matchedPairs++;

        if (matchedPairs === galaxyEmojis.length || score >= targetScore) {
            endGame(true);
        }
    } else {
        unflipCards();
    }
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    resetBoard();
}

function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.classList.remove('flipped');
        firstCard.querySelector('span').style.display = 'none';
        secondCard.classList.remove('flipped');
        secondCard.querySelector('span').style.display = 'none';
        resetBoard();
    }, 800);
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (score >= targetScore) {
                endGame(true);
            } else {
                endGame(false);
            }
        }
    }, 1000);
}

function pauseGame() {
    clearInterval(timerInterval);
}

function endGame(isWin) {
    clearInterval(timerInterval);
    showScreen('result-screen');
    const titleEl = document.getElementById('result-title');
    const descEl = document.getElementById('result-desc');

    if (isWin) {
        titleEl.textContent = translations[currentLang].winTitle;
        descEl.textContent = translations[currentLang].winDesc;
    } else {
        titleEl.textContent = translations[currentLang].loseTitle;
        descEl.textContent = translations[currentLang].loseDesc;
    }

    // บันทึกคะแนนสูงสุดลง localStorage
    const bestScore = localStorage.getItem('galaxy_best_score') || 0;
    if (score > bestScore) {
        localStorage.setItem('galaxy_best_score', score);
    }
}

// กำหนดภาษาเริ่มต้นตอนโหลดหน้าเว็บ
window.onload = () => {
    setLanguage(currentLang);
    document.getElementById('lang-select').value = currentLang;
};
                     
