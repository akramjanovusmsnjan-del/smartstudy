
// ==========================================
// SMART STUDY - MAIN JAVASCRIPT
// ==========================================

const $ = id => document.getElementById(id);

let generatedQuestions = [];
let currentQuestions = [];
let examFinished = false;

// ==========================================
// LOCAL STORAGE
// ==========================================

function getData() {
    try {
        return JSON.parse(localStorage.getItem("smartStudyData")) || {
            solved: 0,
            tests: 0,
            score: 0,
            history: []
        };
    } catch {
        return { solved: 0, tests: 0, score: 0, history: [] };
    }
}

function saveData(data) {
    localStorage.setItem("smartStudyData", JSON.stringify(data));
    updateStats();
}

function updateStats() {
    const data = getData();

    $("solvedCount").textContent = data.solved;
    $("testCount").textContent = data.tests;
    $("totalScore").textContent = data.score;

    $("resultSolved").textContent = data.solved;
    $("resultTests").textContent = data.tests;
    $("resultScore").textContent = data.score;

    $("historyList").innerHTML = "";

    if (!data.history.length) {
        $("historyList").innerHTML =
            '<p class="muted">Hozircha natijalar mavjud emas.</p>';
        return;
    }

    data.history.slice().reverse().forEach(item => {
        const div = document.createElement("div");
        div.className = "question";

        const title = document.createElement("strong");
        title.textContent = item.title;

        const details = document.createElement("p");
        details.className = "muted";
        details.style.marginTop = "8px";
        details.textContent = item.details;

        div.append(title, details);
        $("historyList").appendChild(div);
    });
}

// ==========================================
// NAVIGATION
// ==========================================

const pageNames = {
    home: "Bosh sahifa",
    solver: "Masala yechish",
    tests: "Test yaratish",
    exam: "Bilimni tekshirish",
    results: "Natijalar"
};

function showPage(page) {
    document.querySelectorAll(".page").forEach(p => {
        p.classList.remove("active");
    });

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    $(page).classList.add("active");

    const button = document.querySelector(
        `.nav-btn[data-page="${page}"]`
    );

    if (button) button.classList.add("active");

    $("pageTitle").textContent = pageNames[page];

    if (page === "results") updateStats();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        showPage(btn.dataset.page);
    });
});

// ==========================================
// NOTIFICATION
// ==========================================

let toastTimer;

function notify(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ==========================================
// MATHEMATICAL EXPRESSION PARSER
// eval() IS NOT USED
// ==========================================

function calculateExpression(expression) {
    const tokens = expression.match(
        /\d*\.?\d+|[()+\-*/^]/g
    );

    if (!tokens || tokens.join("") !== expression.replace(/\s/g, "")) {
        throw new Error("Matematik ifoda noto'g'ri.");
    }

    let position = 0;

    function factor() {
        const token = tokens[position++];

        if (token === "+") return factor();
        if (token === "-") return -factor();

        if (token === "(") {
            const value = addSub();

            if (tokens[position++] !== ")") {
                throw new Error("Qavslar noto'g'ri.");
            }

            return value;
        }

        if (!token || !/^\d*\.?\d+$/.test(token)) {
            throw new Error("Sonni aniqlab bo'lmadi.");
        }

        return Number(token);
    }

    function power() {
        let value = factor();

        if (tokens[position] === "^") {
            position++;
            value = Math.pow(value, power());
        }

        return value;
    }

    function multiplyDivide() {
        let value = power();

        while (
            tokens[position] === "*" ||
            tokens[position] === "/"
        ) {
            const operator = tokens[position++];
            const next = power();

            if (operator === "/" && next === 0) {
                throw new Error("Nolga bo'lish mumkin emas.");
            }

            value = operator === "*"
                ? value * next
                : value / next;
        }

        return value;
    }

    function addSub() {
        let value = multiplyDivide();

        while (
            tokens[position] === "+" ||
            tokens[position] === "-"
        ) {
            const operator = tokens[position++];
            const next = multiplyDivide();

            value = operator === "+"
                ? value + next
                : value - next;
        }

        return value;
    }

    const result = addSub();

    if (position !== tokens.length || !Number.isFinite(result)) {
        throw new Error("Ifodani hisoblab bo'lmadi.");
    }

    return result;
}

// ==========================================
// LINEAR EQUATION SOLVER
// ax + b = cx + d
// ==========================================

function parseLinearSide(side) {
    side = side.replace(/\s/g, "");

    const terms = side.match(/[+-]?[^+-]+/g);

    if (!terms) throw new Error("Tenglama noto'g'ri.");

    let a = 0;
    let b = 0;

    terms.forEach(term => {
        if (term.includes("x")) {
            const coefficient = term.replace("x", "");

            if (coefficient === "" || coefficient === "+") {
                a += 1;
            } else if (coefficient === "-") {
                a -= 1;
            } else {
                a += Number(coefficient);
            }
        } else {
            b += Number(term);
        }
    });

    return { a, b };
}

function solveEquation(expression) {
    const parts = expression.split("=");

    if (parts.length !== 2) {
        throw new Error("Tenglamada bitta = belgisi bo'lishi kerak.");
    }

    const left = parseLinearSide(parts[0]);
    const right = parseLinearSide(parts[1]);

    const coefficient = left.a - right.a;
    const constant = right.b - left.b;

    if (coefficient === 0) {
        if (constant === 0) {
            throw new Error("Tenglamaning cheksiz ko'p yechimi bor.");
        }

        throw new Error("Tenglamaning yechimi mavjud emas.");
    }

    const x = constant / coefficient;

    return {
        x,
        coefficient,
        constant,
        left,
        right
    };
}

// ==========================================
// SOLVE PROBLEM
// ==========================================

function solveProblem() {
    const input = $("problemInput").value.trim();

    if (!input) {
        notify("Iltimos, masalani kiriting!");
        return;
    }

    const solution = $("solution");

    solution.hidden = false;

    try {
        let html = "";

        if (input.includes("=") && input.includes("x")) {
            const result = solveEquation(input);

            html = `
                <h3>✦ Tenglama yechimi</h3>

                <div class="step">
                    <b>1-qadam.</b><br>
                    Berilgan tenglama:<br>
                    ${escapeHTML(input)}
                </div>

                <div class="step">
                    <b>2-qadam.</b><br>
                    x qatnashgan hadlarni bir tomonga,
                    sonlarni ikkinchi tomonga o'tkazamiz.
                </div>

                <div class="step">
                    <b>3-qadam.</b><br>
                    x = ${formatNumber(result.constant)}
                    / ${formatNumber(result.coefficient)}
                </div>

                <div class="answer">
                    Javob: x = ${formatNumber(result.x)}
                </div>
            `;

        } else {
            const result = calculateExpression(input);

            html = `
                <h3>✦ Hisoblash natijasi</h3>

                <div class="step">
                    <b>1-qadam.</b><br>
                    Ifoda: ${escapeHTML(input)}
                </div>

                <div class="step">
                    <b>2-qadam.</b><br>
                    Amallar tartibiga ko'ra hisoblaymiz.
                </div>

                <div class="answer">
                    Javob: ${formatNumber(result)}
                </div>
            `;
        }

        solution.innerHTML = html;

        const data = getData();
        data.solved++;
        data.history.push({
            title: "Masala yechildi",
            details: input + " | Natija: muvaffaqiyatli"
        });

        saveData(data);
        notify("Masala muvaffaqiyatli yechildi!");

    } catch (error) {
        solution.innerHTML = `
            <h3>⚠ Xatolik</h3>
            <p>${escapeHTML(error.message)}</p>
            <p class="muted">
                Hozircha oddiy matematik ifodalar va
                ax + b = c ko'rinishidagi tenglamalar qo'llab-quvvatlanadi.
            </p>
        `;

        notify("Masalani tekshirib qayta kiriting.");
    }
}

function formatNumber(number) {
    return Number(number.toFixed(8)).toString();
}

function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// ==========================================
// IMAGE UPLOAD AND PREVIEW
// ==========================================

let selectedImage = null;

$("imageInput").addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        notify("Faqat rasm fayllarini yuklang.");
        return;
    }

    selectedImage = file;

    const reader = new FileReader();

    reader.onload = e => {
        $("preview").src = e.target.result;
        $("preview").style.display = "block";
        $("ocrBtn").hidden = false;
        $("ocrStatus").hidden = true;
    };

    reader.readAsDataURL(file);
});

// ==========================================
// OCR - IMAGE TEXT RECOGNITION
// ==========================================

async function readImage() {
    if (!selectedImage) {
        notify("Avval rasm yuklang.");
        return;
    }

    const status = $("ocrStatus");
    status.hidden = false;
    status.textContent = "Rasmdagi matn aniqlanmoqda...";

    $("ocrBtn").disabled = true;
    $("ocrBtn").textContent = "KUTILMOQDA...";

    try {
        if (!window.Tesseract) {
            throw new Error("OCR kutubxonasi yuklanmadi. Internetni tekshiring.");
        }

        const result = await Tesseract.recognize(
            selectedImage,
            "eng+uzb",
            {
                logger: info => {
                    if (info.status === "recognizing text") {
                        status.textContent =
                            "Matn aniqlanmoqda: " +
                            Math.round(info.progress * 100) + "%";
                    }
                }
            }
        );

        const recognizedText = result.data.text.trim();

        if (!recognizedText) {
            throw new Error("Rasmdagi matn aniqlanmadi.");
        }

        $("problemInput").value = recognizedText;

        status.textContent = "Matn aniqlandi! Endi masalani yechishingiz mumkin.";

        notify("Matn muvaffaqiyatli aniqlandi!");

    } catch (error) {
        status.textContent = error.message;
        notify("Rasmni aniqlashda xatolik yuz berdi.");
    } finally {
        $("ocrBtn").disabled = false;
        $("ocrBtn").textContent = "RASMDAGI MATNNI ANIQLASH";
    }
}

// ==========================================
// QUESTION DATABASE
// ==========================================

const questionBank = {

    math: [
        {
            q: "15 + 25 = ?",
            options: ["30", "40", "45", "50"],
            answer: 1
        },
        {
            q: "12 × 8 = ?",
            options: ["86", "92", "96", "108"],
            answer: 2
        },
        {
            q: "144 ning kvadrat ildizi nechaga teng?",
            options: ["10", "11", "12", "14"],
            answer: 2
        },
        {
            q: "100 ning 25 foizi qancha?",
            options: ["20", "25", "30", "40"],
            answer: 1
        },
        {
            q: "3² + 4² = ?",
            options: ["12", "20", "25", "30"],
            answer: 2
        },
        {
            q: "2x + 4 = 10. x = ?",
            options: ["2", "3", "4", "5"],
            answer: 1
        },
        {
            q: "1 kilometr necha metr?",
            options: ["100", "500", "1000", "10000"],
            answer: 2
        },
        {
            q: "7 × 9 = ?",
            options: ["56", "63", "72", "81"],
            answer: 1
        },
        {
            q: "200 ning 10 foizi qancha?",
            options: ["10", "15", "20", "25"],
            answer: 2
        },
        {
            q: "5³ ning qiymati nechaga teng?",
            options: ["25", "75", "100", "125"],
            answer: 3
        }
    ],

    programming: [
        {
            q: "Python dasturlash tilida chiqarish funksiyasi qaysi?",
            options: ["input()", "print()", "show()", "write()"],
            answer: 1
        },
        {
            q: "Python tilida o'zgaruvchi qanday yaratiladi?",
            options: ["var x", "int x", "x = 10", "let x"],
            answer: 2
        },
        {
            q: "HTML nima uchun ishlatiladi?",
            options: [
                "Veb sahifa tuzilishi",
                "Rasm tahrirlash",
                "Video montaj",
                "Operatsion tizim"
            ],
            answer: 0
        },
        {
            q: "CSS ning asosiy vazifasi nima?",
            options: [
                "Ma'lumot saqlash",
                "Dizayn yaratish",
                "Hisoblash",
                "Server boshqarish"
            ],
            answer: 1
        },
        {
            q: "JavaScript qaysi turdagi til?",
            options: [
                "Dasturlash tili",
                "Faqat belgilash tili",
                "Faqat dizayn tili",
                "Operatsion tizim"
            ],
            answer: 0
        },
        {
            q: "Python da ro'yxat qaysi belgi bilan yoziladi?",
            options: ["{}", "[]", "()", "<>"],
            answer: 1
        },
        {
            q: "HTML da sarlavha uchun asosiy teg qaysi?",
            options: ["<p>", "<h1>", "<img>", "<br>"],
            answer: 1
        },
        {
            q: "JavaScript da o'zgarmas qiymat qaysi bilan e'lon qilinadi?",
            options: ["const", "var", "print", "input"],
            answer: 0
        },
        {
            q: "Python da takrorlash operatori qaysi?",
            options: ["if", "for", "print", "def"],
            answer: 1
        },
        {
            q: "CSS da matn rangini o'zgartirish xususiyati?",
            options: ["font", "background", "color", "display"],
            answer: 2
        }
    ],

    english: [
        {
            q: "Apple so'zining tarjimasi nima?",
            options: ["Olma", "Nok", "Uzum", "Banan"],
            answer: 0
        },
        {
            q: "Book so'zining tarjimasi?",
            options: ["Daftar", "Kitob", "Qalam", "Stol"],
            answer: 1
        },
        {
            q: "I ___ a student.",
            options: ["is", "are", "am", "be"],
            answer: 2
        },
        {
            q: "Go so'zining o'tgan zamon shakli?",
            options: ["Goed", "Went", "Gone", "Going"],
            answer: 1
        },
        {
            q: "Beautiful so'zining ma'nosi?",
            options: ["Chiroyli", "Tez", "Katta", "Kichik"],
            answer: 0
        },
        {
            q: "Child so'zining ko'plik shakli?",
            options: ["Childs", "Childes", "Children", "Child"],
            answer: 2
        },
        {
            q: "She ___ English every day.",
            options: ["study", "studies", "studying", "studied"],
            answer: 1
        },
        {
            q: "Water so'zining tarjimasi?",
            options: ["Olov", "Havo", "Suv", "Yer"],
            answer: 2
        },
        {
            q: "What is the opposite of hot?",
            options: ["Cold", "Warm", "Big", "Fast"],
            answer: 0
        },
        {
            q: "I have ___ orange.",
            options: ["a", "an", "the", "are"],
            answer: 1
        }
    ]
};

// ==========================================
// TEST GENERATION
// ==========================================

function generateTest() {
    const subject = $("subject").value;
    const count = Number($("questionCount").value);

    const bank = questionBank[subject];

    generatedQuestions = [...bank]
        .sort(() => Math.random() - 0.5)
        .slice(0, count);

    const container = $("testQuestions");

    container.innerHTML = "";

    generatedQuestions.forEach((question, index) => {
        const div = document.createElement("div");
        div.className = "question";

        const title = document.createElement("h4");
        title.textContent = `${index + 1}. ${question.q}`;

        div.appendChild(title);

        question.options.forEach((option, optionIndex) => {
            const label = document.createElement("label");
            label.className = "option";

            const input = document.createElement("input");
            input.type = "radio";
            input.name = `preview-${index}`;
            input.value = optionIndex;

            const span = document.createElement("span");
            span.textContent = option;

            label.append(input, span);
            div.appendChild(label);
        });

        container.appendChild(div);
    });

    $("testPreview").hidden = false;

    notify(`${count} ta test savoli yaratildi!`);

    $("testPreview").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// ==========================================
// START EXAM
// ==========================================

function startTest() {
    if (!generatedQuestions.length) {
        notify("Avval test yarating.");
        return;
    }

    currentQuestions = generatedQuestions.map(q => ({
        ...q,
        userAnswer: null
    }));

    examFinished = false;

    currentQuestions.forEach((question, index) => {
        const selected = document.querySelector(
            `input[name="preview-${index}"]:checked`
        );

        if (selected) {
            question.userAnswer = Number(selected.value);
        }
    });

    showPage("exam");

    renderExam();

    notify("Imtihon boshlandi!");
}

// ==========================================
// EXAM RENDER
// ==========================================

function renderExam() {
    const container = $("examContent");

    container.innerHTML = "";

    $("progressText").textContent =
        `${currentQuestions.filter(q => q.userAnswer !== null).length} / ${currentQuestions.length}`;

    currentQuestions.forEach((question, index) => {
        const div = document.createElement("div");
        div.className = "question";

        const title = document.createElement("h4");
        title.textContent = `${index + 1}. ${question.q}`;

        div.appendChild(title);

        question.options.forEach((option, optionIndex) => {
            const label = document.createElement("label");
            label.className = "option";

            const input = document.createElement("input");

            input.type = "radio";
            input.name = `exam-${index}`;
            input.value = optionIndex;
            input.checked = question.userAnswer === optionIndex;

            input.addEventListener("change", () => {
                currentQuestions[index].userAnswer = optionIndex;
                updateProgress();
            });

            const span = document.createElement("span");
            span.textContent = option;

            label.append(input, span);
            div.appendChild(label);
        });

        container.appendChild(div);
    });

    const submit = document.createElement("button");

    submit.className = "gold-btn";
    submit.textContent = "TESTNI YAKUNLASH →";
    submit.onclick = finishExam;

    container.appendChild(submit);

    updateProgress();
}

// ==========================================
// PROGRESS
// ==========================================

function updateProgress() {
    const answered = currentQuestions.filter(
        q => q.userAnswer !== null
    ).length;

    const total = currentQuestions.length;

    $("progressText").textContent = `${answered} / ${total}`;

    $("progressBar").style.width =
        `${total ? answered / total * 100 : 0}%`;
}

// ==========================================
// FINISH EXAM
// ==========================================

function finishExam() {
    if (examFinished) return;

    const answered = currentQuestions.filter(
        q => q.userAnswer !== null
    ).length;

    if (answered !== currentQuestions.length) {
        notify("Barcha savollarga javob bering!");
        return;
    }

    examFinished = true;

    const correct = currentQuestions.filter(
        q => q.userAnswer === q.answer
    ).length;

    const total = currentQuestions.length;

    const percent = Math.round(correct / total * 100);

    const data = getData();

    data.tests++;
    data.score += percent;

    data.history.push({
        title: "Test natijasi",
        details: `${correct}/${total} ta to'g'ri javob | ${percent}%`
    });

    saveData(data);

    let message = "Yana harakat qiling!";

    if (percent >= 90) {
        message = "Ajoyib natija! Siz bilimdon o'quvchisiz!";
    } else if (percent >= 70) {
        message = "Juda yaxshi! Bilimingiz yaxshi!";
    } else if (percent >= 50) {
        message = "Yaxshi! Yana mashq qiling!";
    }

    $("examContent").innerHTML = `
        <div class="empty-state">
            <div>🏆</div>

            <h3>TEST YAKUNLANDI!</h3>

            <h1 style="
                color:var(--gold);
                font-size:55px;
                margin:20px 0;
            ">${percent}%</h1>

            <p>
                To'g'ri javoblar: ${correct} / ${total}
            </p>

            <p style="margin-top:15px;color:var(--gold-light)">
                ${message}
            </p>

            <button class="gold-btn" onclick="showPage('results')">
                NATIJALARNI KO'RISH
            </button>

            <button class="gold-btn" onclick="showPage('tests')">
                YANGI TEST YARATISH
            </button>
        </div>
    `;

    updateProgress();

    notify("Natijalar saqlandi!");
}

// ==========================================
// CLEAR HISTORY
// ==========================================

function clearHistory() {
    const confirmed = confirm(
        "Barcha natijalarni o'chirishni xohlaysizmi?"
    );

    if (!confirmed) return;

    saveData({
        solved: 0,
        tests: 0,
        score: 0,
        history: []
    });

    notify("Natijalar tozalandi!");
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    updateStats();
    showPage("home");

    console.log("SMART STUDY muvaffaqiyatli ishga tushdi!");
});
