/* Our First Year, My Forever  personal anniversary adventure. */
(() => {
  "use strict";
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const screens = $$(".screen");
  const completed = new Set();
  let heartsCaught = 0;
  let heartTimeout = null;
  let toastTimer = null;
  let promiseStep = 0;
  let promiseBusy = false;

  const heartSvg = '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16 27.2 4.9 16.5C-2.2 8.9 7.5 1.7 13.1 7.1L16 10l2.9-2.9c5.6-5.4 15.3 1.8 8.2 9.4Z" fill="currentColor" stroke="rgba(255,255,255,.75)" stroke-width="1.1" stroke-linejoin="round"/></svg>';

  const starfield = $("#starfield");
  for (let i = 0; i < 115; i++) {
    const star = document.createElement("i");
    star.className = "star-particle";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.setProperty("--op", (0.2 + Math.random() * 0.7).toFixed(2));
    star.style.setProperty("--duration", `${2.2 + Math.random() * 5}s`);
    star.style.setProperty("--delay", `${Math.random() * -6}s`);
    if (Math.random() > 0.88) { star.style.width = "3px"; star.style.height = "3px"; }
    starfield.appendChild(star);
  }

  function showScreen(id) {
    screens.forEach(s => s.classList.toggle("active", s.id === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function toast(message) {
    const el = $("#toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  function updateProgress() {
    $("#progressLabel").textContent = `${completed.size} / 3 stars`;
    $("#progressBar").style.width = `${completed.size / 3 * 100}%`;
    $$(".quest-node").forEach((node, i) => {
      node.classList.toggle("completed", completed.has(i));
      node.classList.toggle("locked", i > 0 && !completed.has(i - 1));
      node.setAttribute("aria-label", `${completed.has(i) ? "Completed" : "Open"}: ${["The Beginning", "A Little Challenge", "A Promise for You"][i]}`);
    });
  }
  function openQuest(index) {
    if (index > 0 && !completed.has(index - 1)) { toast("Follow the stars in order, my love ✨"); return; }
    renderQuest(index); showScreen("quest");
  }
  function markComplete(index, message) {
    completed.add(index); updateProgress();
    $("#questFeedback").textContent = message; $("#questFeedback").classList.add("success");
    burstConfetti(index === 2 ? 55 : 22);
    setTimeout(() => {
      if (completed.size === 3) { showScreen("finale"); toast("Every star is shining now. Your last surprise is ready! 💖"); }
      else { showScreen("map"); toast("A star is yours! One little step closer 💫"); }
    }, 1100);
  }
  function renderQuest(index) {
    const symbol = $("#questSymbol"), eyebrow = $("#questEyebrow"), title = $("#questTitle"),
      desc = $("#questDescription"), area = $("#questChallenge"), feedback = $("#questFeedback");
    feedback.textContent = ""; feedback.classList.remove("success"); area.innerHTML = "";
    const configs = [
      {symbol:"✦", eyebrow:"STAR ONE · THE BEGINNING", title:"Every story has a day one.", desc:"Do you remember the date our story began? Enter it as four digits  day, then month."},
      {symbol:"♡", eyebrow:"STAR TWO · FOLLOW YOUR HEART", title:"Catch a little love.", desc:"A tiny heart is waiting for you, my Love. Catch five little hearts to make this star shine."},
      {symbol:"☀", eyebrow:"STAR THREE · THREE PROMISES, THREE LITTLE GIFTS", title:"Promises I want to keep.", desc:"Each promise comes with a little gift from my heart. Take your time  open them one by one."}
    ];
    const c = configs[index]; symbol.textContent = c.symbol; eyebrow.textContent = c.eyebrow; title.textContent = c.title; desc.textContent = c.desc;
    if (completed.has(index)) {
      feedback.textContent = "This star is already yours. You can revisit it whenever you like ✨";
      const b = document.createElement("button"); b.className = "game-start"; b.textContent = "Back to the stars"; b.onclick = () => showScreen("map"); area.appendChild(b); return;
    }
    if (index === 0) renderDateChallenge(area);
    if (index === 1) renderHeartChallenge(area);
    if (index === 2) renderPromiseChallenge(area);
  }
  function renderDateChallenge(area) {
    area.innerHTML = `<form class="answer-row" id="dateForm"><input class="answer-input" id="dateAnswer" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="DDMM" aria-label="Our anniversary date" required><button class="small-btn" type="submit">Unlock ✦</button></form><p class="hint">Think back to the little date that became the beginning of us. Enter it the way you remember it, my love.</p>`;
    $("#dateForm").addEventListener("submit", e => {
      e.preventDefault(); const answer = $("#dateAnswer").value.replace(/\D/g, "");
      if (answer === "2810" || answer === "2910") markComplete(0, "You remembered our beginning. That's our first star ✨");
      else { $("#questFeedback").textContent = "Almost, my love. Think of the day our story began 💗"; $("#dateAnswer").focus(); }
    });
  }
  function renderHeartChallenge(area) {
    area.innerHTML = `<div class="game-status"><span id="heartCount">Hearts: 0 / 5</span><span id="heartHint">Ready when you are</span></div><div class="heart-game" id="heartGame" aria-label="Catch five hearts"></div><button class="game-start" id="startHearts" type="button">Start catching hearts ♡</button><p class="hint">Tap or click each heart as it floats by, My Heaven. No rush, sweetheart. This little game is just for you.</p>`;
    $("#startHearts").addEventListener("click", startHeartGame);
  }
  function startHeartGame() {
    clearTimeout(heartTimeout); heartsCaught = 0;
    const game = $("#heartGame"); game.innerHTML = "";
    $("#heartCount").textContent = "Hearts: 0 / 5"; $("#heartHint").textContent = "Catch them!";
    const start = $("#startHearts"); start.disabled = true; start.textContent = "You're doing great…";
    function spawn() {
      if (!game.isConnected || heartsCaught >= 5) return;
      game.innerHTML = "";
      const heart = document.createElement("button");
      heart.className = "heart-target"; heart.type = "button"; heart.innerHTML = heartSvg;
      heart.setAttribute("aria-label", "Catch this heart");
      heart.style.left = `${8 + Math.random() * 78}%`; heart.style.top = `${12 + Math.random() * 62}%`;
      game.appendChild(heart);
      let caught = false;
      const nextHeart = () => { clearTimeout(heartTimeout); if (heartsCaught < 5) heartTimeout = setTimeout(spawn, 180); };
      heart.addEventListener("click", () => {
        if (caught || !heart.isConnected) return; caught = true; heart.remove(); heartsCaught++;
        $("#heartCount").textContent = `Hearts: ${heartsCaught} / 5`;
        if (heartsCaught >= 5) {
          clearTimeout(heartTimeout); game.innerHTML = '<div class="heart-win">♡<span>Love found!</span></div>';
          $("#heartHint").textContent = "You did it!"; start.disabled = false; start.textContent = "Play again ♡";
          markComplete(1, "You caught every little heart. Here's your second star 💗");
        } else { $("#heartHint").textContent = ["A little more love…", "You're so close…", "Look at you, catching love!", "One more, sweetheart!"][Math.floor(Math.random()*4)]; nextHeart(); }
      });
      heartTimeout = setTimeout(() => { if (!caught && heart.isConnected) { heart.remove(); nextHeart(); } }, 1800);
    }
    spawn();
  }
  const promises = [
    {title:"I promise to keep choosing you.", text:"Not only on special days, but in the ordinary ones too. I want to keep finding little ways to make you smile, to enjoy the days we share, and to build a life filled with moments we can look back on fondly.", giftTitle:"A little wish for our days", gift:"May we keep collecting tiny happy moments: silly laughs, sweet conversations, quiet comfort, and memories that become precious simply because we made them together.", icon:"✧"},
    {title:"I promise to love you unconditionally.", text:"I want to love you with tenderness on the easy days and with even more care when life feels heavy. I will keep learning how to love you better, without making you earn the affection and kindness you deserve.", giftTitle:"A little reminder for your heart", gift:"You do not have to be perfect to be loved by me. You can be happy, tired, quiet, overwhelmed, or unsure. You are still precious to me, and I want my love to feel gentle and safe.", icon:"♡"},
    {title:"I promise to be here for you.", text:"I want to listen when you need to talk, be patient when things are difficult, try to understand before I react, and give you comfort without making you feel alone. I may not always get everything right, but I promise to keep trying with an honest heart.", giftTitle:"Your final little gift", gift:"This last promise comes with a little universe made just for you. Open each surprise slowly, my love, and keep the words close whenever you need them.", icon:"☀"}
  ];
  function renderPromiseChallenge(area) {
    promiseStep = 0; promiseBusy = false; renderPromiseStep(area);
  }
  function renderPromiseStep(area) {
    const p = promises[promiseStep];
    area.innerHTML = `<div class="promise-progress" aria-label="Promise ${promiseStep+1} of 3"><span class="promise-progress-fill" style="width:${(promiseStep+1)/3*100}%"></span></div>
      <p class="promise-count">PROMISE ${promiseStep+1} OF 3</p>
      <article class="promise-reveal"><div class="promise-icon">${p.icon}</div><h3>${p.title}</h3><p>${p.text}</p></article>
      <button class="small-btn promise-gift-btn" id="openPromiseGift" type="button">Open your little gift <span>♡</span></button>
      <div id="promiseGift" class="promise-gift" hidden><div class="gift-ribbon">A LITTLE GIFT FOR YOU</div><h4>${p.giftTitle}</h4><p>${p.gift}</p><div id="interactiveGift" class="interactive-gift"></div><div id="promiseVideoSlot"></div><button class="primary-btn promise-next" id="promiseNext" type="button">${promiseStep === 2 ? "Keep this promise close" : "Continue to promise " + (promiseStep+2)} <span>♡</span></button></div>`;
    $("#openPromiseGift", area).addEventListener("click", () => {
      if (promiseBusy) return; promiseBusy = true;
      const gift = $("#promiseGift", area); gift.hidden = false; gift.classList.add("gift-open");
      $("#openPromiseGift", area).hidden = true; burstConfetti(promiseStep === 2 ? 28 : 12);
      if (promiseStep === 0) renderLittleTomorrows($("#interactiveGift", area));
      if (promiseStep === 1) renderHeartStars($("#interactiveGift", area));
      if (promiseStep === 2) renderPromiseVideo($("#promiseVideoSlot", area));
      $("#promiseNext", area).addEventListener("click", () => {
        if (promiseStep < 2) { promiseStep++; promiseBusy = false; renderPromiseStep(area); }
        else { markComplete(2, "Three promises, three little gifts, and a heart that keeps choosing you ❤️"); }
      }, {once:true});
    });
  }

  function renderLittleTomorrows(slot) {
    const moments = [
      { label: "A silly laugh", message: "I hope we fill our days with the kind of laughter that sneaks up on us, the silly little jokes only we understand, and the moments that make us smile long after they have passed." },
      { label: "A quiet day", message: "I dream of gentle days with you, when we can simply be ourselves, enjoy each other’s company, and feel that an ordinary day can be beautiful just because we share it." },
      { label: "A new memory", message: "I want us to keep finding new things to love, collecting memories we will smile about for years, and making even the simplest moments feel like a little piece of our own story." }
    ];
    slot.innerHTML = `<p class="interactive-prompt">Choose a little piece of the future I dream of sharing with you, my Love ✨</p><div class="gift-choice-grid">${moments.map((m,i)=>`<button class="gift-choice" type="button" data-moment="${i}"><span aria-hidden="true">${["♡","☾","✧"][i]}</span>${m.label}</button>`).join("")}</div><p class="gift-reveal-text" id="momentReveal" aria-live="polite">Every little choice is a wish for the beautiful days still waiting for us, my Love.</p>`;
    slot.querySelectorAll("[data-moment]").forEach(btn=>btn.addEventListener("click",()=>{
      slot.querySelectorAll("[data-moment]").forEach(b=>b.classList.toggle("chosen",b===btn));
      slot.querySelector("#momentReveal").textContent=moments[Number(btn.dataset.moment)].message;
      burstConfetti(7);
    }));
  }
  function renderHeartStars(slot) {
    const wishes = [
      { label: "When you're happy", message: "When your heart feels light, I want to celebrate right alongside you, cheer for every dream you chase, and make your happiest days feel even sweeter." },
      { label: "When life feels heavy", message: "When the world feels heavy, you do not have to pretend to be okay with me. I want to listen with tenderness, give you space when you need it, and meet the hard moments with patience and care." },
      { label: "When you feel unsure", message: "You never have to be perfect to be loved by me. I want to keep understanding you, respecting your heart, and choosing a gentler, more thoughtful way to love you every day." }
    ];
    slot.innerHTML = `<p class="interactive-prompt">Touch each little star whenever your heart needs a reminder, My Heaven 🌙</p><div class="star-wish-grid">${wishes.map((w,i)=>`<button class="star-wish" type="button" data-wish="${i}" aria-label="Reveal promise ${i+1}"><span aria-hidden="true">✦</span><small>${w.label}</small></button>`).join("")}</div><p class="gift-reveal-text" id="wishReveal" aria-live="polite">Three little promises, waiting here whenever you need them, My Heaven. ♡</p>`;
    slot.querySelectorAll("[data-wish]").forEach(btn=>btn.addEventListener("click",()=>{
      slot.querySelectorAll("[data-wish]").forEach(b=>b.classList.toggle("revealed",b===btn));
      slot.querySelector("#wishReveal").textContent=wishes[Number(btn.dataset.wish)].message;
      burstConfetti(5);
    }));
  }

  function renderPromiseVideo(slot) {
    const stages = [
      { kicker: "A LITTLE UNIVERSE FOR MY HEAVEN", title: "Find the stars that belong to us.", copy: "My Love, tap each glowing star and watch our little constellation come together. Every light is a tiny reminder that even when the miles separate us, you still have a home in my heart.", button: "See our little heart ✨" },
      { kicker: "A LETTER JUST FOR YOU", title: "Open this with your heart, my Love.", copy: "My beautiful Avonne, if I could be beside you right now, I would take your hands, look into your eyes, and tell you how precious you are to me. You have become part of my everyday thoughts, my hopes, and the little things that make my world warmer. I wish I could give you this letter in person, but until that day comes, let these words hold a little of the tenderness I would give you in a hug. You are loved on your bright days, on your quiet days, and on the days when you need a little extra gentleness. You are my Sunflower, my Heaven, my Sole mio. ☀️💖", button: "Keep reading, my Heaven 💌" },
      { kicker: "ONE LAST LITTLE GIFT", title: "If I could give you one thing, it would be more days with you.", copy: "My Heaven, thank you for this first year of us. Thank you for the memories, the laughter, the little things only we understand, and the chance to keep learning how to love each other better. I cannot fit a whole year of feelings into one page, but I hope you can feel how much of my heart is here. No distance can make our story less precious to me. Today, tomorrow, and in all the little ordinary days still waiting for us, I want to keep choosing you with tenderness, patience, and honesty. Happy first anniversary, my Love. You are my favorite part of this story, and I would choose you again. FoREVer yours, Maicol. 🌈🧡", button: "Keep this close to your heart ♡" }
    ];
    let stage = 0;
    const litStars = new Set();
    let opened = false;
    function paintStarButtons() {
      slot.querySelectorAll('[data-star]').forEach(node => {
        node.disabled = Number(node.dataset.star) !== litStars.size;
      });
    }
    function paint() {
      const item = stages[stage];
      const art = stage === 0
        ? `<div class="star-universe" aria-label="Connect five stars to draw a glowing heart"><svg class="star-threads" viewBox="0 0 300 150" preserveAspectRatio="none" aria-hidden="true"><path class="heart-thread-base" d="M105 39 C88 23 56 25 53 49 C49 75 112 111 150 132 C188 111 251 75 247 49 C244 25 212 23 195 39 C179 20 161 22 150 40 C139 22 121 20 105 39"/><path class="heart-thread-draw" d="M105 39 C88 23 56 25 53 49 C49 75 112 111 150 132 C188 111 251 75 247 49 C244 25 212 23 195 39 C179 20 161 22 150 40 C139 22 121 20 105 39"/></svg><button class="star-link star-point star-a ${litStars.has(0)?'star-lit':''}" style="--x:35%;--y:26%" data-star="0" aria-label="Connect the first star" ${litStars.size!==0?'disabled':''}>✦</button><button class="star-link star-point star-b ${litStars.has(1)?'star-lit':''}" style="--x:18%;--y:36%" data-star="1" aria-label="Connect the second star" ${litStars.size!==1?'disabled':''}>✧</button><button class="star-link star-point star-c ${litStars.has(2)?'star-lit':''}" style="--x:50%;--y:84%" data-star="2" aria-label="Connect the third star" ${litStars.size!==2?'disabled':''}>✦</button><button class="star-link star-point star-d ${litStars.has(3)?'star-lit':''}" style="--x:82%;--y:36%" data-star="3" aria-label="Connect the fourth star" ${litStars.size!==3?'disabled':''}>✧</button><button class="star-link star-point star-e ${litStars.has(4)?'star-lit':''}" style="--x:65%;--y:26%" data-star="4" aria-label="Connect the fifth star" ${litStars.size!==4?'disabled':''}>✦</button><span class="star-heart ${litStars.size===5?'heart-lit':''}">♥</span></div><p class="star-instruction">${litStars.size===5 ? "You made our little heart, My Heaven. Every thread leads back to you. ♡" : `Connect each glowing star, my Love, and leave a little golden thread behind. ${litStars.size} of 5 connected. ✨`}</p>`
        : stage === 1
        ? `<button class="letter-opening ${opened?'letter-opened':''}" type="button" aria-label="${opened?'Love letter opened':'Open your love letter'}"><span class="letter-envelope">💌</span><span>${opened?'A little piece of my heart, for you':'Tap the envelope, my Love'}</span><small>${opened?'Read every word slowly, My Heaven':'SEALED WITH LOVE · JUST FOR YOU'}</small></button><div class="personal-letter ${opened?'personal-letter-visible':''}"><p>My beautiful Avonne,</p><p>If I could be beside you right now, I would take your hands, look into your eyes, and tell you how precious you are to me. You have become part of my everyday thoughts, my hopes, and the little things that make my world warmer.</p><p>I wish I could give you this letter in person, but until that day comes, let these words hold a little of the tenderness I would give you in a hug. You are loved on your bright days, on your quiet days, and on the days when you need a little extra gentleness.</p><p>You are my Sunflower, my Heaven, my Sole mio. Thank you for being part of my story. ☀️💖</p><p class="personal-letter-sign">All my love, always,<br><strong>your Maicol 🌈🧡</strong></p></div>`
        : `<button class="final-sun-button ${opened?'sun-opened':''}" type="button" aria-label="Reveal your last little gift"><span>☀️💖</span><small>${opened?'A wish from my heart':'Tap for one last little gift'}</small></button><div class="final-vow ${opened?'final-vow-visible':''}"><p class="final-vow-whisper">FOR MY HEAVEN · MY SOLE MIO</p><p>Thank you for this first year of us. Thank you for the memories, the laughter, the little things only we understand, and the chance to keep learning how to love each other better.</p><p>I cannot fit a whole year of feelings into one page, but I hope you can feel how much of my heart is here. No distance can make our story less precious to me.</p><p>Today, tomorrow, and in all the little ordinary days still waiting for us, I want to keep choosing you with tenderness, patience, and honesty.</p><p>Happy first anniversary, my Love. You are my favorite part of this story, and I would choose you again.</p><p class="final-vow-sign">FoREVer yours,<br><strong>Maicol 🌈🧡</strong></p></div>`;
      slot.innerHTML = `<div class="final-gift-scene stage-${stage}"><div class="final-gift-kicker">${item.kicker}</div>${art}<h4>${item.title}</h4><p class="final-gift-copy">${item.copy}</p><button class="small-btn final-gift-next" type="button" ${stage===0 && litStars.size<5 || stage>0 && !opened?'disabled':''}>${item.button}</button><p class="final-gift-count">${stage+1} OF 3 LITTLE SURPRISES · MADE WITH LOVE</p></div>`;
      if (stage === 0) {
        const thread = slot.querySelector('.heart-thread-draw');
        if (thread) {
          const length = thread.getTotalLength();
          thread.style.strokeDasharray = `${length}`;
          thread.style.strokeDashoffset = `${length * (1 - litStars.size / 5)}`;
        }
        slot.querySelectorAll('[data-star]').forEach(b => b.addEventListener('click', () => {
          const i = Number(b.dataset.star);
          if (i !== litStars.size) return;
          litStars.add(i);
          b.classList.add('star-lit');
          b.disabled = true;
          slot.querySelectorAll('[data-star]').forEach(node => { node.disabled = Number(node.dataset.star) !== litStars.size; });
          const draw = slot.querySelector('.heart-thread-draw');
          if (draw) { const length = draw.getTotalLength(); draw.style.strokeDasharray = `${length}`; draw.style.strokeDashoffset = `${length * (1 - litStars.size / 5)}`; }
          const instruction = slot.querySelector('.star-instruction');
          instruction.textContent = litStars.size === 5 ? 'My Love, look what your hands have made. A little heart, tied together with all my love. 💖' : [`One little light for us, My Heaven. Four more to weave our heart. ✨`,`Two stars, two little pieces of my heart, my Love. Keep going. ♡`,`Halfway there, my Sunflower. Our little heart is taking shape. ☀️`,`Almost there, My Heaven. One last star to tie our heart together. 💗`][litStars.size-1];
          if (litStars.size === 5) {
            slot.querySelector('.star-heart').classList.add('heart-lit');
            slot.querySelector('.final-gift-next').disabled = false;
            burstConfetti(42);
            setTimeout(() => burstConfetti(24), 450);
          }
          paintStarButtons();
        }));
      }
      if (stage === 1) slot.querySelector('.letter-opening').addEventListener('click', () => { opened = true; paint(); burstConfetti(9); });
      if (stage === 2) slot.querySelector('.final-sun-button').addEventListener('click', () => { opened = true; paint(); burstConfetti(18); });
      slot.querySelector('.final-gift-next').addEventListener('click', () => {
        if (stage === 0 && litStars.size < 5 || stage > 0 && !opened) return;
        if (stage < 2) { stage++; opened = false; burstConfetti(stage === 2 ? 26 : 14); paint(); }
        else { slot.innerHTML = `<div class="final-gift-scene final-forever"><div class="final-gift-kicker">A LITTLE PROMISE TO KEEP</div><div class="forever-heart">♡</div><h4>Whenever you need a little reminder, My Heaven...</h4><p class="final-gift-finish">You are loved, you are treasured, and there will always be a place in this little universe that is only yours. Happy first anniversary, my Sole mio. Here is to our first year, and to all the little tomorrows we have yet to write together. <strong>FoREVer yours, Maicol 🌈🧡</strong></p></div>`; burstConfetti(42); }
      });
    }
    paint();
  }
  function burstConfetti(count = 28) {
    const layer = $("#confettiLayer"); const symbols = ["✦", "♡", "✧", "·"];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("span"); piece.className = "confetti"; piece.textContent = symbols[Math.floor(Math.random()*symbols.length)];
      piece.style.left = `${Math.random()*100}%`; piece.style.color = ["#f8dba0", "#f2a8d0", "#c8c8ff", "#ffffff"][Math.floor(Math.random()*4)];
      piece.style.fontSize = `${10 + Math.random()*13}px`; piece.style.setProperty("--fall", `${2 + Math.random()*2.2}s`);
      piece.style.animationDelay = `${Math.random()*.35}s`; layer.appendChild(piece); setTimeout(() => piece.remove(), 4800);
    }
  }

  $("#beginBtn").addEventListener("click", () => { showScreen("map"); burstConfetti(15); });
  $$(".quest-node").forEach(node => node.addEventListener("click", () => openQuest(Number(node.dataset.quest))));
  $("#backToMap").addEventListener("click", () => { clearTimeout(heartTimeout); showScreen("map"); });
  $("#openLetterBtn").addEventListener("click", () => showScreen("letter"));
  $("#backToFinale").addEventListener("click", () => showScreen("finale"));
  $("#restartBtn").addEventListener("click", () => {
    completed.clear(); updateProgress(); clearTimeout(heartTimeout); promiseStep = 0;
    const videos = [$("#anniversaryVideo"), $("#promiseVideo")].filter(Boolean); videos.forEach(v => { v.pause(); v.currentTime = 0; });
    const song = $("#anniversarySong"); if (song) { song.pause(); song.currentTime = 0; }
    showScreen("home"); toast("Your little universe is ready to explore again ☀️💖");
  });
  const songPhoto = $("#songPhoto");
  const showSongPhoto = () => { if (songPhoto.complete && songPhoto.naturalWidth > 0) $("#albumArt").classList.add("has-photo"); else $("#albumArt").classList.remove("has-photo"); };
  songPhoto.addEventListener("load", showSongPhoto);
  songPhoto.addEventListener("error", () => $("#albumArt").classList.remove("has-photo"));
  showSongPhoto();
  const song = $("#anniversarySong");
  song.addEventListener("error", () => { /* Friendly instructions remain visible if the optional song is not added yet. */ });
  updateProgress();
})();
