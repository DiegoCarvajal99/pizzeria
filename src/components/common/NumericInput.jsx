import React from 'react';

/**
 * Campo de texto que acepta estrictamente solo números (enteros o decimales).
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
  const handleChange = (e) => {
    let raw = e.target.value.replace(/,/g, '.');

    // Permitir campo vacío mientras el usuario escribe
    if (raw === '') {
      onChange('');
      return;
    }

    // Expresión regular: enteros o decimales positivos
    const regex = allowDecimals ? /^\d*\.?\d*$/ : /^\d*$/;
    if (regex.test(raw)) {
      onChange(raw);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={value === null || value === undefined ? '' : value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`px-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm font-mono text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors ${className}`}
      {...props}
    />
  );
}

