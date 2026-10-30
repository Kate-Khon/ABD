const fullWordList = [
  // Word 1 starts immediately (no password needed)
  {  
    word: "lizards", 
    hint: "It possessed the ancient secrets of eternal joy and never-ending splendor… the trick was to surrender to the flow.” Don't let your heavy metal armor make you sink to the bottom of the raging river!", 
    image: "images/kitchen.png", 
    qrPassword: "" 
  },
  
  // To unlock Word 2, the QR code must link to exactly: ?unlock=unicorn7
  { 
    word: "mother grizzly", 
    hint: "The classic old-school battle recruiter for the WATER attribute. Her sacrifice allows you to immediately search your deck for any aquatic monster with 1500 or less Attack and place it directly onto the field.", 
    image: "images/cake.jpg", 
    qrPassword: "unicorn7" 
  },
  
  // To unlock Word 3, the QR code must link to exactly: ?unlock=blue9balloon
  { 
    word: "kjeldahl", 
    hint: "Look at this, look at this. A ...-style recovery flask. 800 milliliters. Very rare.", 
    image: "images/bedroom.jpg", 
    qrPassword: "blue9balloon" 
  },
  
  // Example Word 4: To unlock, the QR code must link to exactly: ?unlock=cake48secret
  { 
    word: "boneitis", 
    hint: `He had the suits, the power, and the sleazy 1980s business tactics to completely reshape Planet Express. But right at the height of his corporate victory, his past catches up to him for one final line: "My only regret... is that I have... "`, 
    image: "images/cake.jpg", 
    qrPassword: "cake48secret" 
  }
];

// A pool of randomized victory messages with placeholders
const victoryMessagesPool = [
  {
    title: "Word Discovered! 🎯",
    descTemplate: "Stage cleared! You absolutely dominated that puzzle. Scan the area map below to track down your next item spawn:"
  },
  {
    title: "LEVEL UP! 🌟",
    descTemplate: "Incredible detective work! The code has been broken. Your next target location is locked right here:"
  },
  {
    title: "LOOT UNLOCKED! 🎁",
    descTemplate: "Critical hit! You saw right through that word matrix. Move out to the hidden zone below to retrieve your item upgrade:"
  },
  {
    title: "CODEBROKEN! 🔐",
    descTemplate: "Outstanding work! The syndicate's encryption has been completely shattered. <br> Sweep the drop-point location below to retrieve the parcel:"
  }
];

// A pool of randomized game-over messages 
const lossMessagesPool = [
  {
    title: "Round 2? 🥊",
    desc: "The hangman took this round! <br> Reset the puzzle, adjust your strategy, and go get your revenge."
  },
  {
    title: "Respawning... ⏳",
    desc: "You ran out of lives on this word! <br> Dust yourself off, hit reset, and show this word who's boss."
  },
  {
    title: "The trail went cold! 🕵️‍♂️",
    desc: "The hangman threw you off the scent! <br> Clear your mind, reset the board, and attack the clue from a new angle."
  }
];

// Browser memory management for game progress
let completedWords = JSON.parse(localStorage.getItem("completedWords")) || [];
let activeWordList = fullWordList.filter(item => !completedWords.includes(item.word));

// Track shown win indexes inside browser local memory
let shownWinIndexes = JSON.parse(localStorage.getItem("shownWinIndexes")) || [];

let currentWordObj;
let guessedLetters;
let wrongGuesses;
const maxGuesses = 6;

const wordDisplayElement = document.getElementById("word-display");
const keyboardElement = document.getElementById("keyboard");
const hintElement = document.getElementById("hint-text");
const figureParts = document.querySelectorAll(".figure-part");
const modal = document.getElementById("result-modal");
const modalTitle = document.getElementById("modal-title");
const modalImageContainer = document.getElementById("modal-image-container");
const modalDesc = document.getElementById("modal-desc");
const restartBtn = document.getElementById("restart-btn");
const qrLockScreen = document.getElementById("qr-lock-screen");

const urlParams = new URLSearchParams(window.location.search);
const scannedCode = urlParams.get('unlock');

function initGame() {
  if (completedWords.length === fullWordList.length) {
    document.querySelector(".game-container").innerHTML = `
      <div style="text-align:center; padding: 20px;">
        <h2>🎉 100% COMPLETION 🎉</h2>
        <p style="margin-top:15px; color:#64748b;">
You successfully swept every map sector, completely outsmarted the hangman, and unlocked all secret birthday loot drops. <br> <br> <b> Averey, have an awesome birthday! </b> <br> <br> With love,<br> Kat ❤️</p>
      </div>`;
    return;
  }

  currentWordObj = activeWordList[0]; 

  if (scannedCode && scannedCode === currentWordObj.qrPassword) {
    localStorage.removeItem("needsQrUnlock");
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (localStorage.getItem("needsQrUnlock") === "true") {
    qrLockScreen.classList.add("active");
    return;
  }
 qrLockScreen.classList.remove("active");
  guessedLetters = new Set();
  wrongGuesses = 0;

  hintElement.textContent = `Clue: ${currentWordObj.hint}`;
  modal.classList.remove("active");
  figureParts.forEach(part => part.classList.remove("visible"));

  // Render Word Slots (Handles spaces naturally)
  wordDisplayElement.innerHTML = currentWordObj.word
    .split("")
    .map(letter => {
      if (letter === " ") {
        // Creates an invisible, non-bordered gap for spaces
        return `<span class="letter-slot" style="border-bottom: none; width: 16px;">&nbsp;</span>`;
      } else {
        // Keeps the regular bordered line for letters
        return `<span class="letter-slot"></span>`;
      }
    })
    .join("");

  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  keyboardElement.innerHTML = alphabet
    .split("")
    .map(letter => `<button class="key" data-letter="${letter}">${letter}</button>`)
    .join("");

  document.querySelectorAll(".key").forEach(button => {
    button.addEventListener("click", () => handleGuess(button.dataset.letter));
  });
}

function handleGuess(letter) {
  if (guessedLetters.has(letter) || wrongGuesses >= maxGuesses) return;

  guessedLetters.add(letter);
  const button = document.querySelector(`.key[data-letter="${letter}"]`);
  if (button) button.disabled = true;

  if (currentWordObj.word.includes(letter)) {
    button?.classList.add("correct");
    updateWordDisplay();
    checkWinCondition();
  } else {
    button?.classList.add("wrong");
    figureParts[wrongGuesses].classList.add("visible");
    wrongGuesses++;
    checkLossCondition();
  }
}

function updateWordDisplay() {
  const slots = wordDisplayElement.querySelectorAll(".letter-slot");
  currentWordObj.word.split("").forEach((letter, index) => {
    if (letter !== " " && guessedLetters.has(letter)) {
      slots[index].textContent = letter;
      slots[index].classList.add("revealed");
    }
  });
}

// 3. STRICTLY NON-REPEATING WIN HANDLING
function checkWinCondition() {
  // Check win state, automatically skipping spaces over in the validation check
  const isWon = currentWordObj.word
    .split("")
    .every(letter => letter === " " || guessedLetters.has(letter));
    
  if (isWon) {
    completedWords.push(currentWordObj.word);
    localStorage.setItem("completedWords", JSON.stringify(completedWords));
    localStorage.setItem("needsQrUnlock", "true");

    let availableWinIndexes = victoryMessagesPool
      .map((_, idx) => idx)
      .filter(idx => !shownWinIndexes.includes(idx));

    if (availableWinIndexes.length === 0) {
      shownWinIndexes = [];
      availableWinIndexes = victoryMessagesPool.map((_, idx) => idx);
    }

    const randomWinIndex = availableWinIndexes[Math.floor(Math.random() * availableWinIndexes.length)];
    shownWinIndexes.push(randomWinIndex);
    localStorage.setItem("shownWinIndexes", JSON.stringify(shownWinIndexes));

    const chosenWinMessage = victoryMessagesPool[randomWinIndex];

    setTimeout(() => {
      showModal(
        chosenWinMessage.title, 
        `<span style="display:block; margin-bottom:12px; font-weight:600; color:var(--text);">${chosenWinMessage.descTemplate}</span>
         <p style="font-style:italic; background:#fff1f2; padding:10px; border-radius:8px; border-left:4px solid var(--primary); margin-bottom:12px;">"${currentWordObj.hint}"</p>`, 
        currentWordObj.image,
        "I'm on my way!"
      );
    }, 300);
  }
}


// 4. RANDOM LOSS HANDLING (Allowed to repeat freely)
function checkLossCondition() {
  if (wrongGuesses >= maxGuesses) {
    const randomLossIndex = Math.floor(Math.random() * lossMessagesPool.length);
    const chosenMessage = lossMessagesPool[randomLossIndex];

    setTimeout(() => {
      showModal(chosenMessage.title, chosenMessage.desc, null, "Try Again");
    }, 300);
  }
}

function showModal(title, desc, imageUrl, buttonText) {
  modalTitle.textContent = title;
  modalDesc.innerHTML = desc;
  restartBtn.textContent = buttonText;
  modalImageContainer.innerHTML = "";
  if (imageUrl) {
    const imgElement = document.createElement("img");
    imgElement.src = imageUrl;
    imgElement.className = "victory-img";
    modalImageContainer.appendChild(imgElement);
  }

  modal.classList.add("active");
}

restartBtn.addEventListener("click", () => {
  activeWordList = fullWordList.filter(item => !completedWords.includes(item.word));
  initGame();
});

// Admin System Settings Control Zone
const hiddenResetBtn = document.getElementById("hidden-reset-btn");
hiddenResetBtn.addEventListener("dblclick", () => {
  if (confirm("Reset everything?")) {
    localStorage.clear();
    window.location.reload();
  }
});

let lastTap = 0;
hiddenResetBtn.addEventListener("touchend", (e) => {
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTap;
  if (tapLength < 300 && tapLength > 0) {
    if (confirm("Reset everything?")) {
      localStorage.clear();
      window.location.reload();
    }
    e.preventDefault();
  }
  lastTap = currentTime;
});

initGame();
