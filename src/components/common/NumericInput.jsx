import React from 'react';

/**
 * Campo de texto que acepta estrictamente solo números (enteros o decimales).
 * Bloquea cualquier tecla o caracter que no sea dígito.
 * No contiene flechas de subir/bajar ni spinners de navegador.
 */
export default function NumericInput({
  value,
  onChange,
  placeholder = "0",
  className = "",
  disabled = false,
  allowDecimals = true,
  min = 0,
  ...props
}) {
  const handleKeyDown = (e) => {
    // Permitir teclas de navegación y edición del sistema
    const allowedKeys = [
      'Backspace', 'Tab', 'Enter', 'Escape', 'Delete',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }

    // Permitir un solo punto decimal si allowDecimals es true
    if (allowDecimals && (e.key === '.' || e.key === ',')) {
      const current = String(value ?? '');
      if (current.includes('.') || current.includes(',')) {
        e.preventDefault();
      }
      return;
    }

    // Bloquear cualquier caracter que no sea dígito 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    let raw = e.target.value.replace(/,/g, '.');

    // Filtrar estrictamente solo dígitos (y punto decimal si se permite)
    raw = allowDecimals 
      ? raw.replace(/[^0-9.]/g, '') 
      : raw.replace(/[^0-9]/g, '');

    // Evitar múltiples puntos decimales si se pegaron
    const parts = raw.split('.');
    if (parts.length > 2) {
      raw = parts[0] + '.' + parts.slice(1).join('');
    }

    onChange(raw);
  };

  const handlePaste = (e) => {
    const pasteData = e.clipboardData.getData('text');
    const cleaned = allowDecimals 
      ? pasteData.replace(/,/g, '.').replace(/[^0-9.]/g, '')
      : pasteData.replace(/[^0-9]/g, '');
    
    if (!cleaned) {
      e.preventDefault();
    }
  };

  return (
    <input
      type="text"
      inputMode={allowDecimals ? "decimal" : "numeric"}
      autoComplete="off"
      value={value === null || value === undefined ? '' : value}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      onPaste={handlePaste}
      placeholder={placeholder}
      disabled={disabled}
      className={`px-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm font-mono text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors ${className}`}
      {...props}
    />
  );
}

