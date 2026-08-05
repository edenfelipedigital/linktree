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


// ============================
// Portfolio Carousel
// ============================
document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.getElementById('portfolio-carousel');
  const track = document.getElementById('portfolio-track');
  const previousButton = document.getElementById('portfolio-prev');
  const nextButton = document.getElementById('portfolio-next');
  const toggleButton = document.getElementById('portfolio-toggle');
  const status = document.getElementById('portfolio-status');

  if (!carousel || !track || !previousButton || !nextButton || !toggleButton || !status) return;

  const cards = Array.from(track.querySelectorAll('.portfolio-card'));
  if (!cards.length) return;

  const showcase = carousel.closest('.portfolio-showcase');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentIndex = 0;
  let userPaused = reducedMotion;
  let hoverPaused = false;
  let focusPaused = false;
  let isVisible = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let frameId = 0;

  function updateToggleButton() {
    toggleButton.classList.toggle('is-paused', userPaused);
    toggleButton.setAttribute('aria-pressed', String(userPaused));
    toggleButton.setAttribute(
      'aria-label',
      userPaused ? 'Iniciar reprodução automática' : 'Pausar reprodução automática'
    );
  }

  function updateStatus(index) {
    if (index === currentIndex && cards[index].classList.contains('is-active')) return;

    currentIndex = index;
    status.textContent = `Projeto ${index + 1} de ${cards.length}`;

    cards.forEach((card, cardIndex) => {
      const isActive = cardIndex === index;
      card.classList.toggle('is-active', isActive);
      if (isActive) {
        card.setAttribute('aria-current', 'true');
      } else {
        card.removeAttribute('aria-current');
      }
    });
  }

  function updatePerspective() {
    frameId = 0;
    const carouselRect = carousel.getBoundingClientRect();
    const carouselCenter = carouselRect.left + carouselRect.width / 2;
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    cards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const rawDistance = (cardCenter - carouselCenter) / carouselRect.width;
      const distance = Math.max(-1.25, Math.min(1.25, rawDistance));
      const absoluteDistance = Math.abs(distance);

      if (absoluteDistance < nearestDistance) {
        nearestDistance = absoluteDistance;
        nearestIndex = index;
      }

      if (!reducedMotion) {
        const y = absoluteDistance * 42;
        const rotation = distance * -11;
        const scale = 1 - Math.min(absoluteDistance * 0.09, 0.12);
        card.style.transform = `translateY(${y}px) rotateY(${rotation}deg) scale(${scale})`;
        card.style.opacity = String(Math.max(0.48, 1 - absoluteDistance * 0.42));
      }
    });

    updateStatus(nearestIndex);
  }

  function requestPerspectiveUpdate() {
    if (!frameId) frameId = requestAnimationFrame(updatePerspective);
  }

  function scrollToProject(index, behavior = 'smooth') {
    const normalizedIndex = (index + cards.length) % cards.length;
    const card = cards[normalizedIndex];
    const left = card.offsetLeft - (carousel.clientWidth - card.offsetWidth) / 2;

    carousel.scrollTo({
      left,
      behavior: reducedMotion ? 'auto' : behavior
    });
    updateStatus(normalizedIndex);
  }

  function toggleAutoplay() {
    userPaused = !userPaused;
    updateToggleButton();
  }

  previousButton.addEventListener('click', () => scrollToProject(currentIndex - 1));
  nextButton.addEventListener('click', () => scrollToProject(currentIndex + 1));
  toggleButton.addEventListener('click', toggleAutoplay);

  carousel.addEventListener('scroll', requestPerspectiveUpdate, { passive: true });
  window.addEventListener('resize', requestPerspectiveUpdate);

  carousel.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollToProject(currentIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollToProject(currentIndex + 1);
    } else if (event.key === ' ') {
      event.preventDefault();
      toggleAutoplay();
    }
  });

  showcase?.addEventListener('mouseenter', () => {
    hoverPaused = true;
  });
  showcase?.addEventListener('mouseleave', () => {
    hoverPaused = false;
  });
  showcase?.addEventListener('focusin', () => {
    focusPaused = true;
  });
  showcase?.addEventListener('focusout', event => {
    focusPaused = showcase.contains(event.relatedTarget);
  });

  carousel.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') return;
    isDragging = true;
    dragStartX = event.clientX;
    dragStartScroll = carousel.scrollLeft;
    carousel.setPointerCapture(event.pointerId);
  });

  carousel.addEventListener('pointermove', event => {
    if (!isDragging) return;
    carousel.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
  });

  function finishDragging(event) {
    if (!isDragging) return;
    isDragging = false;
    if (carousel.hasPointerCapture(event.pointerId)) {
      carousel.releasePointerCapture(event.pointerId);
    }
    scrollToProject(currentIndex);
  }

  carousel.addEventListener('pointerup', finishDragging);
  carousel.addEventListener('pointercancel', finishDragging);

  const visibilityObserver = new IntersectionObserver(entries => {
    isVisible = entries[0]?.isIntersecting ?? false;
  }, { threshold: 0.35 });
  visibilityObserver.observe(carousel);

  window.setInterval(() => {
    if (isVisible && !userPaused && !hoverPaused && !focusPaused && !isDragging && !document.hidden) {
      scrollToProject(currentIndex + 1);
    }
  }, 4200);

  updateToggleButton();
  updatePerspective();
});
