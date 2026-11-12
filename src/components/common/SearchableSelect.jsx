import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

/**
 * ComboBox con buscador integrado para filtrar opciones (proveedores, unidades, etc.)
 */
export default function SearchableSelect({
  options = [], // [{ value, label, subtext }] o ['kg', 'lb', ...]
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  allowCustom = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Normalizar opciones a { value, label }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.id || opt.value,
        label: opt.nombre || opt.label || opt.id,
        subtext: opt.subtext || opt.telefono || ''
      };
    }
    return { value: opt, label: opt, subtext: '' };
  });

  // Encontrar etiqueta seleccionada actualmente
  const selectedOption = normalizedOptions.find(o => String(o.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : (value || '');

  // Filtrar según query
  const filtered = normalizedOptions.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    (o.subtext && o.subtext.toLowerCase().includes(query.toLowerCase()))
  );

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Foco en buscador al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Botón activador del ComboBox */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm text-left flex items-center justify-between gap-2 text-zinc-900 hover:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors cursor-pointer"
      >
        <span className={displayLabel ? "text-zinc-900 truncate" : "text-zinc-400 truncate"}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-black' : ''}`} />
      </button>

      {/* Menú desplegable con buscador */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden p-2 space-y-1.5 animate-in fade-in zoom-in-95">
          {/* Buscador dentro del combo box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lista de opciones filtradas */}
          <div className="max-h-48 overflow-y-auto divide-y divide-zinc-100 no-scrollbar">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-400">
                {allowCustom && query ? (
                  <button
                    type="button"
                    onClick={() => handleSelect(query.trim())}
                    className="text-black font-semibold hover:underline"
                  >
                    Usar "{query.trim()}"
                  </button>
                ) : (
                  'No hay coincidencias'
                )}
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full px-2.5 py-2 text-left text-xs rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer ${isSelected
                        ? 'bg-zinc-100 text-black font-bold'
                        : 'text-zinc-700 hover:bg-zinc-50'
                      }`}
                  >
                    <div className="truncate">
                      <span>{opt.label}</span>
                      {opt.subtext && (
                        <span className="ml-1.5 text-[11px] text-zinc-400 font-normal">
                          ({opt.subtext})
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-black shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

