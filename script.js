// Word Realms v3 – Full game logic

const LANGS = ["tr", "en"];
let currentLang = "tr";

const UI_TEXT = {
  tr: {
    titleMain: "Kelime Dünyasına Hoş Geldin",
    levels: "Bölümler",
    levelsSub: "Bölümlere göre ilerle",
    timeMode: "Zaman Modu",
    timeModeSub: "Zamana karşı yarış",
    missions: "Görevler",
    chooseCategory: "Kategori Seç",
    clear: "Sil",
    shuffle: "Karıştır",
    foundWords: "Bulunan Kelimeler",
    easy: "Kolay",
    normal: "Orta",
    hard: "Zor",
    lvlLabel: lvl => `Bölüm ${lvl}`,
    lvlCompleteTitle: "Tebrikler!",
    lvlCompleteText: lvl => `Bölüm ${lvl} tamamlandı.`,
    lvlContinue: "Devam Et",
    timeOverTitle: "Süre Doldu",
    timeOverText: "Süre bitti, yeniden deneyebilirsin.",
    timeAgain: "Tekrar Oyna",
    modeLevels: "Bölümler Modu",
    modeTime: "Zaman Modu",
    missionBriefDefault: "Günlük görevleri tamamla.",
    timerLabel: "Süre",
  },
  en: {
    titleMain: "Welcome to Word Realms",
    levels: "Levels",
    levelsSub: "Progress by levels",
    timeMode: "Time Mode",
    timeModeSub: "Race against time",
    missions: "Missions",
    chooseCategory: "Choose Category",
    clear: "Clear",
    shuffle: "Shuffle",
    foundWords: "Found Words",
    easy: "Easy",
    normal: "Normal",
    hard: "Hard",
    lvlLabel: lvl => `Level ${lvl}`,
    lvlCompleteTitle: "Congratulations!",
    lvlCompleteText: lvl => `Level ${lvl} completed.`,
    lvlContinue: "Continue",
    timeOverTitle: "Time's Up",
    timeOverText: "Time is over, you can try again.",
    timeAgain: "Play Again",
    modeLevels: "Levels Mode",
    modeTime: "Time Mode",
    missionBriefDefault: "Complete daily missions.",
    timerLabel: "Time",
  }
};

const CATEGORY_DEFS = [
  { key: "animals", name: { tr: "Hayvanlar", en: "Animals" }, emoji: "🐅" },
  { key: "foods", name: { tr: "Yemekler", en: "Foods" }, emoji: "🍽️" },
  { key: "objects", name: { tr: "Eşyalar", en: "Objects" }, emoji: "🎒" },
  { key: "plants", name: { tr: "Bitkiler", en: "Plants" }, emoji: "🌿" },
  { key: "cities", name: { tr: "Şehirler", en: "Cities" }, emoji: "🏙️" },
  { key: "countries", name: { tr: "Ülkeler", en: "Countries" }, emoji: "🌍" },
  { key: "jobs", name: { tr: "Meslekler", en: "Jobs" }, emoji: "👔" },
  { key: "mixed", name: { tr: "Karışık", en: "Mixed" }, emoji: "✨" }
];

// Word lists (shortened but enough for demo)
const WORDS_TR = {
  animals: ["kedi","köpek","at","inek","koyun","keçi","tilki","kurt","ayı","aslan","kaplan","kartal","yılan","tavşan","balina","yunus"],
  foods: ["kebap","pide","mantı","pilav","dolma","sarma","çorba","pizza","makarna","salata","baklava","sütlaç"],
  objects: ["kalem","silgi","defter","kitap","masa","sandalye","telefon","bilgisayar","cüzdan","anahtar","çanta","lamba"],
  plants: ["gül","lale","papatya","menekşe","zambak","nane","maydanoz","marul","lahana","çam","meşe"],
  cities: ["istanbul","ankara","izmir","bursa","antalya","adana","konya","trabzon","samsun","gaziantep"],
  countries: ["turkiye","almanya","fransa","italya","ispanya","yunanistan","rusya","ukrayna","kanada","amerika"],
  jobs: ["doktor","hemşire","öğretmen","polis","avukat","mühendis","mimar","pilot","aşçı","şoför"],
  mixed: []
};
const WORDS_EN = {
  animals: ["cat","dog","horse","cow","sheep","goat","fox","wolf","bear","lion","tiger","eagle","snake","rabbit","whale","dolphin"],
  foods: ["kebab","pizza","pasta","soup","rice","salad","bread","dessert","cake","pudding"],
  objects: ["pen","book","table","chair","phone","wallet","key","bag","lamp","screen"],
  plants: ["rose","tulip","daisy","violet","lily","mint","parsley","lettuce","pine","oak"],
  cities: ["istanbul","ankara","izmir","london","berlin","paris","rome","madrid","vienna","prague"],
  countries: ["turkey","germany","france","italy","spain","greece","russia","ukraine","canada","brazil"],
  jobs: ["doctor","nurse","teacher","police","lawyer","engineer","architect","pilot","chef","driver"],
  mixed: []
};

// build mixed lists
(function buildMixed() {
  ["animals","foods","objects","plants","cities","countries","jobs"].forEach(k => {
    WORDS_TR[k].forEach(w => { if (!WORDS_TR.mixed.includes(w)) WORDS_TR.mixed.push(w); });
    WORDS_EN[k].forEach(w => { if (!WORDS_EN.mixed.includes(w)) WORDS_EN.mixed.push(w); });
  });
})();


// Game state
let bgMusic;
let soundEnabled = true;
let currentMode = "levels"; // or "time"
let currentCategoryKey = "mixed";
let currentWords = [];
let usedWords = new Set();
let currentWord = "";
let currentLetters = [];
let selectedLetterIndices = [];
let isPointerDown = false;
let letterCenters = []; // {x,y,index}
let currentLevel = 1;
const LEVEL_STEPS = [5,7,10,12];
let wordsFoundThisLevel = 0;

// time mode
let timeDiff = "normal";
let timeLeft = 0;
let timerInterval = null;

// missions (simple counters)
let missionState = {
  totalWords: 0,
  shuffles: 0,
  timeGames: 0
};

// hint system
let hintModeActive = false;
let hintTimeoutId = null;
let lastHintLetterIndex = null;


const STORAGE_KEYS = {
  sound: "wr_sound",
  lang: "wr_lang"
};

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

document.addEventListener("DOMContentLoaded", () => {
  initLang();
  initSound();
  buildCategoryGrid();
  attachHandlers();
  runSplash();
});

// Splash
function runSplash() {
  const splash = $("#splash-screen");
  setTimeout(() => {
    showScreen("menu-screen");
    splash.classList.remove("active");
  }, 1700);
}

// Screens
function showScreen(id) {
  $all(".screen").forEach(s => s.classList.remove("active"));
  const el = $("#" + id);
  if (el) el.classList.add("active");
}

// Lang
function initLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.lang);
    if (saved && LANGS.includes(saved)) currentLang = saved;
  } catch {}
  applyTranslations();
}

function toggleLang() {
  currentLang = currentLang === "tr" ? "en" : "tr";
  try { localStorage.setItem(STORAGE_KEYS.lang, currentLang); } catch {}
  applyTranslations();
  updateModeLabel();
}

function applyTranslations() {
  const dict = UI_TEXT[currentLang];
  $all("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const val = dict[key];
    if (typeof val === "string") {
      el.textContent = val;
    }
  });
  $("#mission-brief").textContent = dict.missionBriefDefault;
}

// sound
function initSound() {
  bgMusic = new Audio("assets/ambient.wav");
  bgMusic.loop = true;
  try {
    const s = localStorage.getItem(STORAGE_KEYS.sound);
    soundEnabled = s === null ? true : s === "true";
  } catch {}
  updateSoundButtons();
  document.body.addEventListener("pointerdown", () => {
    ensureMusic();
  }, { once: true });
}

function ensureMusic() {
  if (!bgMusic) return;
  if (soundEnabled && bgMusic.paused) {
    bgMusic.volume = 0.55;
    bgMusic.play().catch(() => {});
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  try { localStorage.setItem(STORAGE_KEYS.sound, String(soundEnabled)); } catch {}
  updateSoundButtons();
  if (!soundEnabled && bgMusic) bgMusic.pause();
  else ensureMusic();
}

function updateSoundButtons() {
  const btns = [$("##sound-toggle".replace("##","#")), $("#sound-toggle-2"), $("#sound-toggle-3"), $("#sound-toggle-4")];
  btns.forEach(b => {
    if (!b) return;
    if (!soundEnabled) b.classList.add("muted");
    else b.classList.remove("muted");
  });
}

// Category grid
function buildCategoryGrid() {
  const grid = $("#category-grid");
  grid.innerHTML = "";
  CATEGORY_DEFS.forEach(cat => {
    const card = document.createElement("div");
    card.className = "category-card";
    card.dataset.key = cat.key;

    const iconWrap = document.createElement("div");
    iconWrap.className = "category-icon-wrap";
    const icon = document.createElement("div");
    icon.className = "category-icon";
    icon.textContent = cat.emoji;
    iconWrap.appendChild(icon);

    const title = document.createElement("div");
    title.className = "category-title";
    title.textContent = cat.name[currentLang];

    card.appendChild(iconWrap);
    card.appendChild(title);

    card.addEventListener("click", () => {
      currentCategoryKey = cat.key;
      startGameForCurrentMode();
    });

    grid.appendChild(card);
  });
}

// attach handlers
function attachHandlers() {
  $("#lang-toggle").addEventListener("click", () => {
    toggleLang();
    buildCategoryGrid();
  });

  ["#sound-toggle","#sound-toggle-2","#sound-toggle-3","#sound-toggle-4"].forEach(sel => {
    const btn = $(sel);
    if (btn) btn.addEventListener("click", () => { toggleSound(); ensureMusic(); });
  });

  $("#btn-levels").addEventListener("click", () => {
    currentMode = "levels";
    showScreen("category-screen");
    buildCategoryGrid();
  });

  $("#btn-timemode").addEventListener("click", () => {
    currentMode = "time";
    showScreen("time-select-screen");
  });

  $all(".time-option").forEach(btn => {
    btn.addEventListener("click", () => {
      timeDiff = btn.dataset.diff || "normal";
      showScreen("category-screen");
      buildCategoryGrid();
    });
  });

  $all(".back-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.back || "menu";
      if (target === "menu") {
        stopTimer();
        showScreen("menu-screen");
      }
    });
  });

  $("#clear-word").addEventListener("click", clearSelection);
  $("#shuffle-letters").addEventListener("click", () => {
    shuffleArray(currentLetters);
    renderLetters();
  });

  const wheel = $("#letter-wheel");
  wheel.addEventListener("pointerdown", onPointerDown);
  wheel.addEventListener("pointermove", onPointerMove);
  wheel.addEventListener("pointerup", onPointerUp);
  wheel.addEventListener("pointerleave", onPointerUp);

  const hintBtn = document.getElementById("hint-button");
  if (hintBtn) {
    hintBtn.addEventListener("click", () => {
      activateHintMode();
    });
  }

  $("#overlay-primary").addEventListener("click", () => {
    hideOverlay();
    if (currentMode === "levels") {
      startNextWord();
    } else if (currentMode === "time") {
      // restart time mode game
      startGameForCurrentMode();
    }
  });
}

// start game according to mode
function startGameForCurrentMode() {
  usedWords = new Set();
  selectedLetterIndices = [];
  if (currentMode === "levels") {
    currentLevel = 1;
    wordsFoundThisLevel = 0;
    const list = (currentLang === "tr" ? WORDS_TR : WORDS_EN)[currentCategoryKey];
    currentWords = [...list];
    showScreen("game-screen");
    setupModeLabel();
    startNextWord();
  } else {
    const list = (currentLang === "tr" ? WORDS_TR : WORDS_EN)[currentCategoryKey];
    currentWords = [...list];
    missionState.timeGames++;
    setupTimeValues();
    showScreen("game-screen");
    setupModeLabel();
    startTimer();
    startNextWord();
  }
}

function setupModeLabel() {
  const dict = UI_TEXT[currentLang];
  $("#mode-label").textContent = currentMode === "levels" ? dict.modeLevels : dict.modeTime;
  updateInfoLabel();
}

function updateInfoLabel() {
  const dict = UI_TEXT[currentLang];
  if (currentMode === "levels") {
    $("#info-label").textContent = dict.lvlLabel(currentLevel);
    $("#timer-display").classList.add("hidden");
  } else {
    $("#info-label").textContent = dict.timerLabel;
    $("#timer-display").classList.remove("hidden");
  }
}

function setupTimeValues() {
  if (timeDiff === "easy") timeLeft = 90;
  else if (timeDiff === "hard") timeLeft = 30;
  else timeLeft = 60;
  $("#timer-display").textContent = timeLeft.toString();
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft < 0) timeLeft = 0;
    $("#timer-display").textContent = timeLeft.toString();
    if (timeLeft <= 0) {
      stopTimer();
      onTimeOver();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

function onTimeOver() {
  const dict = UI_TEXT[currentLang];
  $("#overlay-title").textContent = dict.timeOverTitle;
  $("#overlay-text").textContent = dict.timeOverText;
  $("#overlay-primary").textContent = dict.timeAgain;
  showOverlay();
}

// choose next word
function startNextWord() {
  if (!currentWords || !currentWords.length) return;
  const unused = currentWords.filter(w => !usedWords.has(w));
  if (!unused.length) usedWords.clear();
  const pool = unused.length ? unused : currentWords;
  const word = pool[Math.floor(Math.random() * pool.length)];
  usedWords.add(word);
  currentWord = word.toUpperCase();
  setupLettersForWord(currentWord);
  clearSelection();
  renderLetters();
  renderFoundWords();
}

function setupLettersForWord(word) {
  const base = word.split("");
  const letters = base.slice();
  while (letters.length < Math.max(base.length + 1, 6)) {
    const r = base[Math.floor(Math.random() * base.length)];
    letters.push(r);
  }
  shuffleArray(letters);
  currentLetters = letters;
}

// letter render with center

function renderLetters() {
  const wheel = $("#letter-wheel");
  const svg = $("#letter-lines");
  wheel.innerHTML = "";
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  letterCenters = [];

  const n = currentLetters.length;
  if (!n) return;

  // Ensure layout box
  const rect = wheel.getBoundingClientRect();
  const size = Math.min(rect.width || wheel.clientWidth || 260, rect.height || wheel.clientHeight || 260);
  const radius = size / 2 - 36;
  const centerX = (rect.width || wheel.clientWidth || size) / 2;
  const centerY = (rect.height || wheel.clientHeight || size) / 2;

  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const cx = centerX + Math.cos(angle) * radius;
    const cy = centerY + Math.sin(angle) * radius;

    const div = document.createElement("div");
    div.className = "letter";
    div.textContent = currentLetters[i].toUpperCase();
    div.dataset.index = String(i);
    div.style.left = (cx - 26) + "px";
    div.style.top = (cy - 26) + "px";
    wheel.appendChild(div);
  }

  // After DOM layout, compute real centers relative to wheel (for perfect touch hit detection)
  const wheelRect = wheel.getBoundingClientRect();
  letterCenters = [];
  document.querySelectorAll(".letter").forEach(el => {
    const r = el.getBoundingClientRect();
    const cx = (r.left - wheelRect.left) + r.width / 2;
    const cy = (r.top - wheelRect.top) + r.height / 2;
    const idx = Number(el.dataset.index || "0");
    letterCenters.push({ x: cx, y: cy, index: idx });
  });
}


// pointer-based selection
function onPointerDown(e) {
  e.preventDefault();
  isPointerDown = true;
  clearSelection();
  selectNearestFromEvent(e);
}

function onPointerMove(e) {
  if (!isPointerDown) return;
  selectNearestFromEvent(e);
}

function onPointerUp() {
  if (!isPointerDown) return;
  isPointerDown = false;
  finalizeWord();
}




function selectNearestFromEvent(e) {
  const wheel = $("#letter-wheel");
  const wheelRect = wheel.getBoundingClientRect();
  const x = e.clientX;
  const y = e.clientY;

  // Actual letter under finger
  const el = document.elementFromPoint(x, y);
  const letterEl = el ? el.closest(".letter") : null;
  if (!letterEl) return;

  const idx = Number(letterEl.dataset.index || "0");
  if (!selectedLetterIndices.includes(idx)) {
    selectedLetterIndices.push(idx);
    letterEl.classList.add("selected");
  }

  // Hint glow + vibration if hint mode is active
  if (hintModeActive) {
    // clear previous glow
    $all(".letter").forEach(node => {
      node.classList.remove("hint-glow");
    });
    letterEl.classList.add("hint-glow");
    if (navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch (e) {}
    }
  }

  // Recompute centers for drawing based on real DOM positions
  const localCenters = [];
  const wheelBox = wheel.getBoundingClientRect();
  document.querySelectorAll(".letter").forEach(node => {
    const r = node.getBoundingClientRect();
    const cx = (r.left - wheelBox.left) + r.width/2;
    const cy = (r.top - wheelBox.top) + r.height/2;
    const i = Number(node.dataset.index || "0");
    localCenters.push({ x: cx, y: cy, index: i });
  });
  letterCenters = localCenters;

  updateCurrentWordDisplay();
  drawLines();
}




function clearSelection() {
  selectedLetterIndices = [];
  $all(".letter").forEach(l => l.classList.remove("selected"));
  const svg = $("#letter-lines");
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  $("#current-word").textContent = "";
}

function updateCurrentWordDisplay() {
  const word = selectedLetterIndices.map(i => currentLetters[i]).join("").toUpperCase();
  $("#current-word").textContent = word;
}

function finalizeWord() {
  const formed = selectedLetterIndices.map(i => currentLetters[i]).join("").toUpperCase();
  if (!formed) return;
  if (formed === currentWord) {
    onCorrectWord(formed);
  } else {
    flashError();
    clearSelection();
  }
}

let foundWordsHistory = [];


// Simple info dictionaries for some example words
const WORD_INFO_TR = {
  "KEDİ": "Evcil, sevimli bir hayvan.",
  "KÖPEK": "Sadakatiyle bilinen evcil hayvan.",
  "ASLAN": "Ormanların kralı olarak bilinen yırtıcı hayvan.",
  "İSTANBUL": "Türkiye'nin en kalabalık şehri.",
  "ANKARA": "Türkiye'nin başkenti.",
  "DOKTOR": "Sağlık alanında çalışan uzman kişi."
};

const WORD_INFO_EN = {
  "CAT": "A small domestic animal that purrs.",
  "DOG": "A loyal domestic animal, man's best friend.",
  "LION": "Large wild cat known as the king of the jungle.",
  "ISTANBUL": "The largest city of Turkiye.",
  "ANKARA": "The capital city of Turkiye.",
  "DOCTOR": "A person who treats sick people."
};

function showWordInfo(word) {
  const popup = document.getElementById("word-info-popup");
  if (!popup) return;
  const titleEl = document.getElementById("word-info-title");
  const textEl = document.getElementById("word-info-text");
  const upper = word.toUpperCase();
  const dict = currentLang === "tr" ? WORD_INFO_TR : WORD_INFO_EN;
  const desc = dict[upper] || (currentLang === "tr"
    ? "Bu kelime için kısa bilgi hazır değil."
    : "No info prepared for this word yet.");
  if (titleEl) titleEl.textContent = upper;
  if (textEl) textEl.textContent = desc;
  popup.classList.add("visible");
  setTimeout(() => {
    popup.classList.remove("visible");
  }, 2000);
}

function onCorrectWord(word) {
  foundWordsHistory.unshift(word);
  if (foundWordsHistory.length > 50) foundWordsHistory.pop();
  missionState.totalWords++;
  showWordInfo(word);
  flashSuccess();
  if (currentMode === "levels") {
    wordsFoundThisLevel++;
    const target = LEVEL_STEPS[Math.min(currentLevel-1, LEVEL_STEPS.length-1)];
    if (wordsFoundThisLevel >= target) {
      showLevelComplete();
      currentLevel++;
      if (currentLevel > LEVEL_STEPS.length) currentLevel = LEVEL_STEPS.length;
      wordsFoundThisLevel = 0;
    } else {
      startNextWord();
    }
  } else {
    if (timeDiff === "easy") timeLeft += 2;
    else if (timeDiff === "normal") timeLeft += 1;
    $("#timer-display").textContent = timeLeft.toString();
    startNextWord();
  }
  renderFoundWords();
}

function renderFoundWords() {
  const list = $("#found-words-list");
  list.innerHTML = "";
  foundWordsHistory.forEach(w => {
    const li = document.createElement("li");
    li.textContent = w;
    list.appendChild(li);
  });
}

function showLevelComplete() {
  const dict = UI_TEXT[currentLang];
  $("#overlay-title").textContent = dict.lvlCompleteTitle;
  $("#overlay-text").textContent = dict.lvlCompleteText(currentLevel);
  $("#overlay-primary").textContent = dict.lvlContinue;
  showOverlay();
}

function showOverlay() {
  $("#overlay").classList.remove("hidden");
}

function hideOverlay() {
  $("#overlay").classList.add("hidden");
  updateInfoLabel();
}

// Lines

function drawLines() {
  const svg = $("#letter-lines");
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  if (selectedLetterIndices.length < 2) return;

  const pts = selectedLetterIndices.map(i => {
    const c = letterCenters.find(c => c.index === i);
    return [c.x, c.y];
  });

  const poly = document.createElementNS("http://www.w3.org/2000/svg","polyline");
  poly.setAttribute("points", pts.map(p => p[0] + "," + p[1]).join(" "));
  poly.setAttribute("fill","none");
  poly.setAttribute("stroke","rgba(248,250,252,0.98)");
  poly.setAttribute("stroke-width","5");
  poly.setAttribute("stroke-linecap","round");
  poly.setAttribute("stroke-linejoin","round");
  svg.appendChild(poly);
}



function activateHintMode() {
  if (hintTimeoutId) {
    clearTimeout(hintTimeoutId);
    hintTimeoutId = null;
  }
  hintModeActive = true;
  // clear previous glow
  $all(".letter").forEach(node => node.classList.remove("hint-glow"));
  hintTimeoutId = setTimeout(() => {
    hintModeActive = false;
    $all(".letter").forEach(node => node.classList.remove("hint-glow"));
  }, 5000);
}


// helpers
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function flashSuccess() {
  const el = $("#current-word");
  el.style.borderColor = "#4ade80";
  el.style.boxShadow = "0 0 20px rgba(34,197,94,0.9)";
  setTimeout(() => {
    el.style.borderColor = "rgba(148,163,184,0.8)";
    el.style.boxShadow = "0 12px 30px rgba(15,23,42,0.9),0 0 0 1px rgba(15,23,42,0.8)";
  }, 250);
}

function flashError() {
  const wheel = $("#letter-wheel");
  wheel.style.transition = "transform 0.08s ease-in-out";
  wheel.style.transform = "translateX(-6px)";
  setTimeout(() => {
    wheel.style.transform = "translateX(6px)";
    setTimeout(() => {
      wheel.style.transform = "translateX(0)";
    }, 80);
  }, 80);
}
