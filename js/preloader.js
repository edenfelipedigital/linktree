document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.getElementById('preloader');
  const logo = document.querySelector('.preloader-logo');
  const body = document.body;
  
  if (!preloader || !logo) return;

  // Timeout de segurança (6s) que força remoção do preloader se algo travar
  const safetyTimeout = setTimeout(() => {
    removePreloader();
  }, 6000);

  function removePreloader() {
    clearTimeout(safetyTimeout);
    if (typeof gsap !== 'undefined') {
      gsap.to(preloader, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: finalizeRemoval
      });
    } else {
      finalizeRemoval();
    }
  }

  function finalizeRemoval() {
    preloader.style.display = 'none';
    body.classList.remove('no-scroll');
  }

  // Verifica preferência por movimento reduzido (Acessibilidade)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pré-carrega a imagem principal antes de iniciar a timeline
  const img = new Image();
  img.src = logo.src;
  
  // Aguarda o logo carregar (ou o fallback) e o documento
  Promise.all([
    new Promise(resolve => {
      if (img.complete) resolve();
      else {
        img.onload = resolve;
        img.onerror = resolve; // Prossegue mesmo com erro para não travar
      }
    }),
    new Promise(resolve => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve);
    })
  ]).then(() => {
    // Validação extra: GSAP carregado
    if (typeof gsap === 'undefined') {
      removePreloader();
      return;
    }

    if (prefersReducedMotion) {
      // Fallback acessível: Apenas fade suave
      gsap.timeline()
        .to(logo, { opacity: 1, duration: 0.8, ease: "power2.out" })
        .to(logo, { opacity: 0, duration: 0.5, ease: "power2.in", delay: 0.5 })
        .to(preloader, { 
          opacity: 0, 
          duration: 0.5, 
          ease: "power2.inOut",
          onComplete: () => {
            finalizeRemoval();
            clearTimeout(safetyTimeout);
          }
        }, "-=0.3");
      return;
    }

    // ==========================================
    // GSAP TIMELINE PRINCIPAL (Preloader 3D)
    // ==========================================
    const tl = gsap.timeline({
      onComplete: () => {
        finalizeRemoval();
        clearTimeout(safetyTimeout);
      }
    });

    // Reset inicial explícito (garantindo que tudo esteja zerado antes do frame 1)
    gsap.set(logo, { 
      scale: 0, 
      opacity: 0, 
      rotationY: 0, 
      rotationX: 0, 
      filter: "blur(0px)" 
    });

    // 1) & 2) Entrada do Logo (inicia em 0.3s)
    // Simultanedade em scale e opacity
    tl.to(logo, {
      scale: 1,
      opacity: 1,
      duration: 0.9,
      ease: "back.out(1.4)"
    }, 0.3);

    // 3) Rotação suave e orgânica e Twist
    // Gira no eixo Y acelerando suavemente e adiciona rotação Z (giro de relógio)
    tl.to(logo, {
      rotationY: 1080, // 3 voltas para dar mais fluidez e dinamismo
      rotationZ: 45,   // Início do twist
      duration: 2.0,
      ease: "power3.inOut"
    }, 0.8); // Inicia um pouco mais cedo para overlap perfeito com a entrada

    // Oscilação leve no eixo X (wobble) para reforçar a naturalidade 3D
    tl.to(logo, {
      rotationX: 12,
      duration: 1.0,
      ease: "sine.inOut",
      yoyo: true,
      repeat: 1
    }, 0.8);

    // 4) Zoom para frente com giro contínuo (saindo da tela)
    // Inicia em 2.2s (quando a rotação Y está muito rápida)
    tl.to(logo, {
      scale: 15,
      rotationZ: 135, // Acentua o giro no Z durante o zoom
      duration: 1.4,
      ease: "expo.in"
    }, 2.2);

    // Adiciona motion blur acelerando junto com o zoom exponencial
    tl.to(logo, {
      filter: "blur(24px)",
      duration: 1.4,
      ease: "expo.in"
    }, 2.2);

    // Opacity cai suavemente apenas nos últimos instantes do zoom (começa em 3.2s)
    tl.to(logo, {
      opacity: 0,
      duration: 0.4,
      ease: "power2.out"
    }, 3.2);

    // 5) Revelação do site (fade-out da tela preta principal)
    // Inicia em 3.2s, criando um overlap perfeito enquanto o logo "explode" em zoom
    tl.to(preloader, {
      opacity: 0,
      duration: 0.8,
      ease: "power2.inOut"
    }, 3.2);
  });
});
