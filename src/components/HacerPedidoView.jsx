import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import SearchableSelect from './common/SearchableSelect';
import NumericInput from './common/NumericInput';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Send, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Store, 
  Sparkles,
  Pencil,
  X
} from 'lucide-react';

export default function HacerPedidoView({ onPedidoCreado }) {
  const { productos, proveedores, crearPedido, mostrarAlerta } = useInventory();
  
  // Lista de items en el pedido actual: { [productoId]: { cantidad: number, obs: string } }
  const [pedidoDraft, setPedidoDraft] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('todos');
  const [observacionGeneral, setObservacionGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Estados del modal "Agregar Producto al Pedido"
  const [productoModal, setProductoModal] = useState(null);
  const [cantidadModal, setCantidadModal] = useState('');
  const [notaModal, setNotaModal] = useState('');

  // Filtrado de productos disponibles (excluyendo deshabilitados)
  const productosFiltrados = productos
    .filter(p => !p.deshabilitado)
    .filter(p => {
      const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                            (p.proveedorNombre && p.proveedorNombre.toLowerCase().includes(busqueda.toLowerCase()));
      const coincideProveedor = filtroProveedor === 'todos' || p.proveedorId === filtroProveedor || p.proveedorNombre === filtroProveedor;
      return coincideTexto && coincideProveedor;
    });

  // Abrir el formulario modal para pedir un producto
  const handleAbrirModalPedir = (prod) => {
    setProductoModal(prod);
    const itemExistente = pedidoDraft[prod.id];
    if (itemExistente) {
      setCantidadModal(String(itemExistente.cantidad));
      setNotaModal(itemExistente.obs || '');
    } else {
      setCantidadModal('1');
      setNotaModal('');
    }
  };

  // Guardar desde el modal a la sección "Productos en tu pedido"
  const handleGuardarDesdeModal = (e) => {
    e.preventDefault();
    if (!productoModal) return;

    const cant = parseFloat(cantidadModal);
    if (!cant || cant <= 0) {
      alert("Por favor ingresa una cantidad mayor a 0.");
      return;
    }

    setPedidoDraft(prev => ({
      ...prev,
      [productoModal.id]: {
        cantidad: cant,
        obs: notaModal.trim()
      }
    }));

    if (mostrarAlerta) {
      mostrarAlerta(`"${productoModal.nombre}" agregado al pedido (${cant} ${productoModal.unidad})`, 'success');
    }

    setProductoModal(null);
  };

  // Cargar automáticamente todos los insumos con stock bajo
  const handleCargarStockBajo = () => {
    const faltantes = {};
    productos.forEach(p => {
      if (p.deshabilitado) return;
      const stock = p.stock || 0;
      const min = p.stockMinimo || 1;
      if (stock <= min) {
        const sugerido = Math.max(1, Math.round(((min * 2) - stock) * 10) / 10);
        faltantes[p.id] = { cantidad: sugerido, obs: 'Stock bajo' };
      }
    });

    if (Object.keys(faltantes).length === 0) {
      alert('¡Todo tu stock está en buen nivel! No hay productos por agotarse.');
      return;
    }

    setPedidoDraft(prev => ({ ...prev, ...faltantes }));
    if (mostrarAlerta) {
      mostrarAlerta(`Se agregaron los productos con stock bajo al pedido`, 'info');
    }
  };

  // Eliminar un producto del draft
  const handleEliminarDelDraft = (prodId) => {
    setPedidoDraft(prev => {
      const copia = { ...prev };
      delete copia[prodId];
      return copia;
    });
  };

  // Convertir draft a arreglo de items
  const itemsEnPedido = Object.entries(pedidoDraft)
    .filter(([_, data]) => Number(data.cantidad) > 0)
    .map(([prodId, data]) => {
      const prod = productos.find(p => p.id === prodId) || {};
      return {
        productoId: prodId,
        productoNombre: prod.nombre || 'Producto',
        unidad: prod.unidad || '',
        cantidad: Number(data.cantidad),
        proveedorId: prod.proveedorId || '',
        proveedorNombre: prod.proveedorNombre || 'Sin Proveedor',
        obs: data.obs || ''
      };
    });

  // Agrupación para previsualización por proveedor
  const itemsAgrupadosPorProveedor = itemsEnPedido.reduce((acc, item) => {
    const prov = item.proveedorNombre || 'Varios';
    if (!acc[prov]) acc[prov] = [];
    acc[prov].push(item);
    return acc;
  }, {});

  // Enviar el pedido
  const handleFinalizarPedido = async () => {
    if (itemsEnPedido.length === 0) return;
    setEnviando(true);
    try {
      const pedidoCreado = await crearPedido(itemsEnPedido, observacionGeneral);
      if (pedidoCreado) {
        setPedidoDraft({});
        setObservacionGeneral('');
        if (onPedidoCreado) {
          onPedidoCreado(pedidoCreado.id);
        }
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Banner explicativo del flujo */}
      <div className="bg-[#1A2E24] border border-[#26533F] rounded-2xl p-4 text-[#DDEBE3] flex items-start gap-3 shadow-lg">
        <ShoppingCart className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
        <div className="text-sm leading-relaxed">
          <p className="font-bold text-emerald-300">
            Paso 1: Selecciona productos y cantidad a pedir
          </p>
          <p className="text-stone-300">
            Haz clic en <strong className="text-emerald-400">Pedir</strong> en cualquier producto para ingresar la cantidad y notas. Los productos se irán añadiendo a la sección <strong className="text-white">Productos en tu pedido</strong>.
          </p>
        </div>
      </div>

      {/* 1. Selector y buscador de productos */}
      <div className="bg-[#18201C] rounded-2xl p-4 sm:p-5 border border-[#2A352F] shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#E7EEE9] flex items-center gap-2 font-display">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Catálogo de Insumos</span>
          </h2>

          <button
            type="button"
            onClick={handleCargarStockBajo}
            className="px-3 py-1.5 rounded-xl bg-amber-950/70 border border-amber-600/50 hover:bg-amber-900 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Cargar stock bajo</span>
          </button>
        </div>

        {/* Buscador y filtro por proveedor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Buscar por nombre o proveedor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-[#0F1512] border border-[#2A352F] rounded-xl text-sm text-white placeholder-stone-500 focus:outline-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <SearchableSelect
              options={[
                { value: 'todos', label: 'Todos los proveedores' },
                ...proveedores.map(p => ({ value: p.id, label: p.nombre, subtext: p.telefono }))
              ]}
              value={filtroProveedor}
              onChange={setFiltroProveedor}
              placeholder="Filtrar proveedor..."
              searchPlaceholder="Buscar proveedor..."
            />
          </div>
        </div>

        {/* Lista de productos para seleccionar */}
        <div className="max-h-64 overflow-y-auto divide-y divide-[#2A352F] border border-[#2A352F] rounded-xl bg-[#0F1512]/70">
          {productosFiltrados.length === 0 ? (
            <p className="text-center py-6 text-sm text-stone-500">
              No se encontraron productos con ese filtro.
            </p>
          ) : (
            productosFiltrados.map((prod) => {
              const estaEnDraft = Boolean(pedidoDraft[prod.id]);
              const esStockBajo = (prod.stock || 0) <= (prod.stockMinimo || 1);

              return (
                <div
                  key={prod.id}
                  className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                    estaEnDraft 
                      ? 'bg-[#1D3B2E]/60 border-l-4 border-emerald-400' 
                      : 'hover:bg-[#1C2621]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm truncate">
                        {prod.nombre}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-[#25302A] text-stone-300 font-medium shrink-0">
                        {prod.proveedorNombre || 'Proveedor'}
                      </span>
                    </div>

                    {/* Disponibilidad visible inmediatamente */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-stone-400 font-medium">
                        Disponible actual:
                      </span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        esStockBajo 
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60' 
                          : 'bg-[#25302A] text-stone-200'
                      }`}>
                        {prod.stock ?? 0} {prod.unidad}
                      </span>
                      {esStockBajo && (
                        <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> Bajo
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {estaEnDraft ? (
                      <button
                        type="button"
                        onClick={() => handleAbrirModalPedir(prod)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Clic para modificar la cantidad o nota"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{pedidoDraft[prod.id]?.cantidad} {prod.unidad}</span>
                        <Pencil className="w-3 h-3 text-stone-400" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAbrirModalPedir(prod)}
                        className="px-3.5 py-1.5 bg-[#25302A] hover:bg-emerald-600 hover:text-white border border-[#2A352F] text-stone-200 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pedir</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Sección del Pedido Activo (Productos en tu pedido) */}
      <div className="bg-[#18201C] rounded-2xl p-4 sm:p-5 border border-[#2A352F] shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A352F] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#E7EEE9] font-display flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span>Productos en tu pedido ({itemsEnPedido.length})</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Aquí aparecen los productos agregados listos para ser enviados a Recepción.
            </p>
          </div>
          {itemsEnPedido.length > 0 && (
            <button
              onClick={() => setPedidoDraft({})}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              Vaciar lista
            </button>
          )}
        </div>

        {itemsEnPedido.length === 0 ? (
          <div className="text-center py-10 px-4 bg-[#0F1512]/60 rounded-xl border border-dashed border-[#2A352F]">
            <Package className="w-10 h-10 text-stone-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-300">Aún no has agregado productos a este pedido</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              Haz clic en el botón <strong>"Pedir"</strong> de cualquier insumo arriba para definir la cantidad y agregarlo a esta sección.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lista agrupada por proveedor */}
            {Object.entries(itemsAgrupadosPorProveedor).map(([provNombre, items]) => (
              <div key={provNombre} className="border border-[#2A352F] rounded-xl overflow-hidden bg-[#0F1512]/40">
                {/* Cabecera del proveedor */}
                <div className="bg-[#131A16] px-3.5 py-2.5 flex items-center justify-between border-b border-[#2A352F]">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-400 font-display">
                    <Store className="w-3.5 h-3.5 text-stone-400" />
                    <span>{provNombre}</span>
                  </div>
                  <span className="text-xs font-semibold text-stone-400">
                    {items.length} {items.length === 1 ? 'producto' : 'productos'}
                  </span>
                </div>

                {/* Items agregados del proveedor */}
                <div className="divide-y divide-[#2A352F] bg-[#18201C]">
                  {items.map((item) => {
                    const prod = productos.find(p => p.id === item.productoId) || {};
                    return (
                      <div key={item.productoId} className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm text-white truncate">
                            {item.productoNombre}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                            <span className="text-stone-400">Disponible:</span>
                            <span className="font-semibold text-stone-300 bg-[#25302A] px-2 py-0.5 rounded border border-[#2A352F]">
                              {prod.stock ?? 0} {item.unidad}
                            </span>
                            {item.obs && (
                              <span className="text-amber-300/90 italic bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                                Nota: {item.obs}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cantidad agregada y acciones */}
                        <div className="flex items-center gap-2 justify-between sm:justify-end">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F1512] rounded-xl border border-[#2A352F]">
                            <span className="text-xs text-stone-400">Por pedir:</span>
                            <span className="font-mono font-bold text-sm text-emerald-400">
                              {item.cantidad} {item.unidad}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Editar cantidad y nota en el modal */}
                            <button
                              type="button"
                              onClick={() => handleAbrirModalPedir(prod)}
                              className="p-2 rounded-lg bg-[#25302A] hover:bg-[#2F3D35] text-stone-300 hover:text-white transition-colors cursor-pointer"
                              title="Editar cantidad o nota"
                            >
                              <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                            </button>

                            {/* Quitar producto */}
                            <button
                              type="button"
                              onClick={() => handleEliminarDelDraft(item.productoId)}
                              className="p-2 rounded-lg bg-[#25302A] hover:bg-rose-950 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Quitar del pedido"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Observaciones generales */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-stone-400 mb-1.5 uppercase tracking-wider">
                Observación general del pedido (opcional):
              </label>
              <input
                type="text"
                placeholder="Ej. Entrega antes de las 11:00 AM / Traer factura"
                value={observacionGeneral}
                onChange={(e) => setObservacionGeneral(e.target.value)}
                className="w-full px-3 py-2 bg-[#0F1512] border border-[#2A352F] rounded-xl text-sm text-white placeholder-stone-500 focus:outline-emerald-500"
              />
            </div>

            {/* Acciones del Pedido */}
            <div className="pt-4 border-t border-[#2A352F]">
              <button
                type="button"
                onClick={handleFinalizarPedido}
                disabled={enviando || itemsEnPedido.length === 0}
                className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {enviando ? 'Guardando pedido...' : 'Finalizar Pedido y Enviar a Recepción'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL: FORMULARIO AL DAR CLIC EN "PEDIR" (SOLICITADO POR EL USUARIO)  */}
      {/* ========================================================================= */}
      {productoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18201C] border border-[#2A352F] rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between border-b border-[#2A352F] pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base font-display">
                  Agregar a Pedido
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProductoModal(null)}
                className="p-1 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarDesdeModal} className="space-y-4">
              {/* 1. Nombre del Producto */}
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">
                  Producto:
                </label>
                <div className="p-3 bg-[#0F1512] border border-[#2A352F] rounded-xl flex items-center justify-between">
                  <span className="font-bold text-white text-base">
                    {productoModal.nombre}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#25302A] text-emerald-300 font-semibold">
                    {productoModal.proveedorNombre || 'Proveedor'}
                  </span>
                </div>
              </div>

              {/* 2. Cantidad Actual / Disponible */}
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">
                  Cantidad disponible en inventario:
                </label>
                <div className="p-2.5 bg-[#0F1512] border border-[#2A352F] rounded-xl flex items-center gap-2 text-sm">
                  <span className="text-stone-400">Hay actualmente:</span>
                  <span className="font-mono font-bold text-white bg-[#25302A] px-2.5 py-0.5 rounded border border-[#2A352F]">
                    {productoModal.stock ?? 0} {productoModal.unidad}
                  </span>
                  {(productoModal.stock || 0) <= (productoModal.stockMinimo || 1) && (
                    <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1 ml-auto">
                      <AlertTriangle className="w-3.5 h-3.5" /> Stock bajo
                    </span>
                  )}
                </div>
              </div>

              {/* 3. Campo para agregar la cantidad que se pedirá (SOLO NÚMEROS SIN FLECHAS) */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Cantidad a pedir *
                </label>
                <div className="flex items-center gap-2">
                  <NumericInput
                    autoFocus
                    value={cantidadModal}
                    onChange={setCantidadModal}
                    placeholder="0"
                    className="w-full text-base font-bold text-emerald-400 py-2.5"
                    required
                  />
                  <span className="px-3 py-2.5 bg-[#0F1512] border border-[#2A352F] rounded-xl text-sm font-bold text-stone-300 shrink-0">
                    {productoModal.unidad}
                  </span>
                </div>
              </div>

              {/* 4. Campo de Nota opcional */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Nota (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. maduro, marca específica, tamaño..."
                  value={notaModal}
                  onChange={(e) => setNotaModal(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F1512] border border-[#2A352F] rounded-xl text-sm text-white placeholder-stone-500 focus:outline-emerald-500"
                />
              </div>

              {/* 5. Botón de Agregar */}
              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setProductoModal(null)}
                  className="px-4 py-2 bg-[#25302A] hover:bg-[#2F3D35] text-stone-300 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar al pedido</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
