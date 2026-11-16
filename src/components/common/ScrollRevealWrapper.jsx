import React, { useLayoutEffect, useRef } from 'react';

const BLOCK_SELECTOR = [
  'section',
  '.bg-white.rounded-3xl',
  '.bg-white.rounded-2xl',
  '.bg-zinc-950.rounded-2xl',
  '.border.border-zinc-200.rounded-2xl',
  '.border.border-zinc-200.rounded-xl'
].join(', ');

/**
 * Senior Frontend Scroll-Reveal & Tab Transition Wrapper:
 * - Al cambiar de pestaña, lleva inmediatamente el scroll al inicio (top: 0) antes del repintado.
 * - Los bloques que ocupan la parte superior de la pantalla entran en cascada suave (.tab-block-enter).
 * - Los bloques que están más abajo quedan en espera (.scroll-reveal-pending) y suben suavemente al hacer scroll.
 */
export default function ScrollRevealWrapper({ activeTab, children }) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    // 1. Llevar siempre al inicio de la página seleccionada antes de medir posiciones
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const container = containerRef.current;
    if (!container) return;

    // 2. Buscar bloques candidatos en la pestaña activa (excluyendo pestañas ocultas y modales)
    const rawBlocks = Array.from(container.querySelectorAll(BLOCK_SELECTOR)).filter(
      (el) => !el.closest('.hidden') && !el.closest('.fixed')
    );

    // Filtrar bloques anidados para animar únicamente las secciones/tarjetas principales
    const topLevelBlocks = rawBlocks.filter(
      (el) => !rawBlocks.some((other) => other !== el && other.contains(el))
    );

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    const io = new IntersectionObserver(
      (entries) => {
        let batchIdx = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            el.style.transitionDelay = `${Math.min(batchIdx * 60, 180)}ms`;
            batchIdx += 1;
            el.classList.add('scroll-reveal-in');
            io.unobserve(el);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -25px 0px',
        threshold: 0.06
      }
    );

    let inScreenIndex = 0;

    topLevelBlocks.forEach((el) => {
      // Limpiar clases previas y forzar reflow limpio antes del pintado
      el.classList.remove('tab-block-enter', 'scroll-reveal-pending', 'scroll-reveal-in');
      el.style.animationDelay = '';
      el.style.transitionDelay = '';

      const rect = el.getBoundingClientRect();

      if (rect.top < viewportHeight - 15 && rect.bottom > 0) {
        // Bloque visible en el inicio de la pantalla: cascada suave y notoria
        void el.offsetWidth;
        const delay = Math.min(inScreenIndex * 70, 280);
        inScreenIndex += 1;
        el.style.animationDelay = `${delay}ms`;
        el.classList.add('tab-block-enter');
      } else if (rect.top >= viewportHeight - 15) {
        // Bloque debajo de la pantalla inicial: espera oculto hasta que el usuario baje con el scroll
        el.classList.add('scroll-reveal-pending');
        io.observe(el);
      }
    });

    return () => {
      io.disconnect();
    };
  }, [activeTab]);

  return (
    <div ref={containerRef} className="w-full">
      {children}
    </div>
  );
}
