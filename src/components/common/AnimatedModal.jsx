import React, { useState, useEffect, useRef } from 'react';

/**
 * Envuelve cualquier ventana modal para aplicar .slide-fwd-center al abrir
 * y su animación inversa (.slide-bck-center) al cerrar antes de desmontarse.
 */
export default function AnimatedModal({
  isOpen,
  onBackdropClick,
  overlayClassName = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4',
  panelClassName = '',
  role,
  ariaModal,
  children
}) {
  const [shouldRender, setShouldRender] = useState(Boolean(isOpen));
  const [isClosing, setIsClosing] = useState(false);
  const lastValueRef = useRef(isOpen);
  const lastChildrenRef = useRef(null);

  if (isOpen) {
    lastValueRef.current = isOpen;
  }

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  let renderedContent = null;
  if (typeof children === 'function') {
    const val = isOpen || lastValueRef.current;
    renderedContent = val ? children(val) : null;
  } else {
    if (isOpen) {
      lastChildrenRef.current = children;
    }
    renderedContent = isOpen ? children : lastChildrenRef.current;
  }

  return (
    <div
      onClick={onBackdropClick}
      className={`${overlayClassName} ${isClosing ? 'modal-backdrop-exit pointer-events-none' : 'modal-backdrop-enter'}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role={role}
        aria-modal={ariaModal}
        className={`${panelClassName} ${isClosing ? 'slide-bck-center' : 'slide-fwd-center'}`}
      >
        {renderedContent}
      </div>
    </div>
  );
}

