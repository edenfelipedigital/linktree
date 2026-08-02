document.addEventListener('DOMContentLoaded', () => {

  // ============================
  // BlurText Intersection Observer (Scroll Animation)
  // ============================
  const blurElements = document.querySelectorAll('[data-blur]');
  
  const blurObserverOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  };

  const blurObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.getAttribute('data-blur-delay') || '0';
        
        setTimeout(() => {
          el.classList.add('is-visible');
        }, parseInt(delay, 10));

        blurObserver.unobserve(el);
      }
    });
  }, blurObserverOptions);

  blurElements.forEach(el => {
    blurObserver.observe(el);
  });


  // ============================
  // DecryptedText — Vanilla JS
  // ============================
  const WORDS = ['resultado.', 'vendas.', 'crescimento.'];
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*';
  const SPEED = 40;           // ms per tick
  const MAX_ITERATIONS = 12;  // scramble cycles before full reveal
  const HOLD_DURATION = 2800; // ms to hold the revealed word
  const el = document.getElementById('decrypt-word');

  if (!el) return;

  let currentIndex = 0;

  function randomChar() {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  // Build individual <span> letters inside the element
  function renderLetters(word, revealedSet) {
    el.innerHTML = '';
    for (let i = 0; i < word.length; i++) {
      const span = document.createElement('span');
      if (revealedSet.has(i)) {
        span.textContent = word[i];
        span.className = 'decrypt-char decrypt-char--revealed';
      } else {
        span.textContent = word[i] === ' ' ? ' ' : randomChar();
        span.className = 'decrypt-char decrypt-char--scrambled';
      }
      el.appendChild(span);
    }
  }

  // Animate decrypt: scramble → sequentially reveal from start
  function animateDecrypt(word, onComplete) {
    const revealed = new Set();
    let iteration = 0;

    // Phase 1: pure scramble (no reveals yet)
    const scrambleInterval = setInterval(() => {
      renderLetters(word, revealed);
      iteration++;
      if (iteration >= Math.floor(MAX_ITERATIONS * 0.4)) {
        clearInterval(scrambleInterval);
        // Phase 2: sequential reveal
        let pointer = 0;
        const revealInterval = setInterval(() => {
          if (pointer < word.length) {
            if (word[pointer] !== ' ') {
              revealed.add(pointer);
            }
            pointer++;
            renderLetters(word, revealed);
          } else {
            clearInterval(revealInterval);
            // Fully revealed
            renderLetters(word, revealed);
            if (onComplete) onComplete();
          }
        }, SPEED);
      }
    }, SPEED);
  }

  // Animate encrypt: sequentially scramble from end → fully scrambled
  function animateEncrypt(word, onComplete) {
    const revealed = new Set();
    for (let i = 0; i < word.length; i++) revealed.add(i);

    let pointer = word.length - 1;

    const interval = setInterval(() => {
      if (pointer >= 0) {
        revealed.delete(pointer);
        pointer--;
        renderLetters(word, revealed);
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, SPEED);
  }

  // Main cycle: decrypt → hold → encrypt → next word → repeat
  function cycle() {
    const word = WORDS[currentIndex];

    animateDecrypt(word, () => {
      // Hold the word visible
      setTimeout(() => {
        animateEncrypt(word, () => {
          // Move to next word
          currentIndex = (currentIndex + 1) % WORDS.length;

          // Small pause before next decrypt
          setTimeout(() => {
            cycle();
          }, 200);
        });
      }, HOLD_DURATION);
    });
  }

  // Initial render then start cycle
  // Start with first word already visible, then begin cycling
  const firstWord = WORDS[0];
  const allRevealed = new Set();
  for (let i = 0; i < firstWord.length; i++) allRevealed.add(i);
  renderLetters(firstWord, allRevealed);

  // Start cycling after initial hold
  setTimeout(() => {
    animateEncrypt(firstWord, () => {
      currentIndex = 1; // start with second word
      setTimeout(() => cycle(), 200);
    });
  }, HOLD_DURATION);

});
