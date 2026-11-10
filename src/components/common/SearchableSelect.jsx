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
        className="w-full px-3 py-2 bg-[#0F1512] border border-[#2A352F] rounded-xl text-sm text-left flex items-center justify-between gap-2 text-white hover:border-emerald-500/60 focus:outline-emerald-500 transition-colors cursor-pointer"
      >
        <span className={displayLabel ? "text-white truncate" : "text-stone-500 truncate"}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
      </button>

      {/* Menú desplegable con buscador */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#18201C] border border-[#2A352F] rounded-xl shadow-2xl overflow-hidden p-2 space-y-1.5 animate-in fade-in zoom-in-95">
          {/* Buscador dentro del combo box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-7 py-1.5 bg-[#0F1512] border border-[#2A352F] rounded-lg text-xs text-white placeholder-stone-500 focus:outline-emerald-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-2 text-stone-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lista de opciones filtradas */}
          <div className="max-h-48 overflow-y-auto divide-y divide-[#2A352F]/40 no-scrollbar">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-stone-500">
                {allowCustom && query ? (
                  <button
                    type="button"
                    onClick={() => handleSelect(query.trim())}
                    className="text-emerald-400 hover:underline font-semibold"
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
                    className={`w-full px-2.5 py-2 text-left text-xs rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-950/80 text-emerald-300 font-bold' 
                        : 'text-stone-200 hover:bg-[#25302A]'
                    }`}
                  >
                    <div className="truncate">
                      <span>{opt.label}</span>
                      {opt.subtext && (
                        <span className="ml-1.5 text-[11px] text-stone-400 font-normal">
                          ({opt.subtext})
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
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

