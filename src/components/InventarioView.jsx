import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import SearchableSelect from './common/SearchableSelect';
import NumericInput from './common/NumericInput';
import { 
  ClipboardList, 
  Search, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Package, 
  Store,
  History,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function InventarioView() {
  const { productos, proveedores, movimientos = [], modificarStockDelta, actualizarStock } = useInventory();
  const [busqueda, setBusqueda] = useState('');
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('todos');
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const [mostrarMovimientos, setMostrarMovimientos] = useState(false);

  // Filtros (excluyendo deshabilitados para el stock activo o permitiéndolos si se busca)
  const productosFiltrados = productos.filter(p => {
    const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          (p.proveedorNombre && p.proveedorNombre.toLowerCase().includes(busqueda.toLowerCase()));
    const coincideProveedor = proveedorSeleccionado === 'todos' || 
                              p.proveedorId === proveedorSeleccionado || 
                              p.proveedorNombre === proveedorSeleccionado;
    const esBajo = (p.stock || 0) <= (p.stockMinimo || 1);
    const coincideStock = soloStockBajo ? esBajo : true;

    return coincideTexto && coincideProveedor && coincideStock;
  });

  // Agrupados por proveedor
  const productosPorProveedor = productosFiltrados.reduce((acc, p) => {
    const prov = p.proveedorNombre || 'Sin Proveedor';
    if (!acc[prov]) acc[prov] = [];
    acc[prov].push(p);
    return acc;
  }, {});

  const totalStockBajo = productos.filter(p => (p.stock || 0) <= (p.stockMinimo || 1) && !p.deshabilitado).length;

  const opcionesProveedores = [
    { value: 'todos', label: 'Todos los proveedores' },
    ...proveedores.map(p => ({ value: p.id, label: p.nombre, subtext: p.telefono }))
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Resumen rápido de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-[#18201C] p-4 rounded-2xl border border-[#2A352F] shadow-lg">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Total Productos</p>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{productos.length}</p>
        </div>

        <div 
          className={`p-4 rounded-2xl border shadow-lg transition-colors cursor-pointer ${
            soloStockBajo 
              ? 'bg-rose-900 text-white border-rose-500' 
              : totalStockBajo > 0 
              ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' 
              : 'bg-[#18201C] border-[#2A352F]'
          }`}
          onClick={() => setSoloStockBajo(!soloStockBajo)}
        >
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold uppercase tracking-wider ${soloStockBajo ? 'text-white' : 'text-rose-400'}`}>
              Stock Bajo / Por Agotar
            </p>
            <AlertTriangle className={`w-4 h-4 ${soloStockBajo ? 'text-white' : 'text-rose-400'}`} />
          </div>
          <p className="text-2xl font-bold mt-1 font-mono">{totalStockBajo}</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-[#18201C] p-4 rounded-2xl border border-[#2A352F] shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Proveedores</p>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{proveedores.length}</p>
          </div>
          <button
            type="button"
            onClick={() => setMostrarMovimientos(!mostrarMovimientos)}
            className="p-2 rounded-xl bg-[#25302A] hover:bg-[#2F3D35] border border-[#2A352F] text-stone-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Ver auditoría de movimientos"
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span>Kardex</span>
          </button>
        </div>
      </div>

      {/* Historial de Movimientos (Kardex) desplegable */}
      {mostrarMovimientos && (
        <div className="bg-[#18201C] p-5 rounded-2xl border border-[#2A352F] shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#E7EEE9] font-display flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Últimos Movimientos de Stock</span>
            </h3>
            <button
              onClick={() => setMostrarMovimientos(false)}
              className="text-xs text-stone-400 hover:text-white cursor-pointer"
            >
              Ocultar
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-[#2A352F] text-xs">
            {movimientos.length === 0 ? (
              <p className="py-4 text-center text-stone-500">Aún no se han registrado movimientos de stock.</p>
            ) : (
              movimientos.map(m => (
                <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {m.delta > 0 ? (
                      <span className="p-1 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-700/60">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1 rounded-md bg-rose-950 text-rose-400 border border-rose-700/60">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <div>
                      <p className="font-semibold text-white">{m.prodNombre}</p>
                      <p className="text-[11px] text-stone-400">{m.referencia} · {new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className={`font-bold ${m.delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.delta > 0 ? `+${m.delta}` : m.delta}
                    </span>
                    <p className="text-[10px] text-stone-500">Nuevo: {m.stockNuevo}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Controles de Búsqueda y ComboBox con Búsqueda de Proveedor */}
      <div className="bg-[#18201C] p-4 rounded-2xl border border-[#2A352F] shadow-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-[#0F1512] border border-[#2A352F] rounded-xl text-sm text-white placeholder-stone-500 focus:outline-emerald-500"
            />
          </div>

          <div>
            <SearchableSelect
              options={opcionesProveedores}
              value={proveedorSeleccionado}
              onChange={setProveedorSeleccionado}
              placeholder="Filtrar por proveedor"
              searchPlaceholder="Buscar proveedor..."
            />
          </div>
        </div>
      </div>

      {/* Lista de Productos Agrupados por Proveedor */}
      {Object.keys(productosPorProveedor).length === 0 ? (
        <div className="text-center py-12 px-4 bg-[#18201C] rounded-2xl border border-[#2A352F] shadow-lg">
          <Package className="w-12 h-12 text-stone-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-300">No hay productos que coincidan</p>
          <p className="text-xs text-stone-500 mt-1">Prueba cambiando el término de búsqueda o el filtro.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(productosPorProveedor).map(([provNombre, items]) => (
            <div key={provNombre} className="bg-[#18201C] rounded-2xl border border-[#2A352F] shadow-lg overflow-hidden">
              {/* Encabezado del proveedor */}
              <div className="bg-[#131A16] px-4 py-2.5 flex items-center justify-between border-b border-[#2A352F]">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-400 font-display">
                    {provNombre}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-stone-400">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>

              {/* Filas de productos */}
              <div className="divide-y divide-[#2A352F]">
                {items.map((prod) => {
                  const esBajo = (prod.stock || 0) <= (prod.stockMinimo || 1);
                  return (
                    <div 
                      key={prod.id} 
                      className={`p-3.5 flex items-center justify-between gap-3 ${
                        esBajo ? 'bg-rose-950/20' : 'hover:bg-[#1E2823]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white truncate">
                            {prod.nombre}
                          </h4>
                          {prod.deshabilitado && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
                              Deshabilitado
                            </span>
                          )}
                          {esBajo && !prod.deshabilitado && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                              <AlertTriangle className="w-3 h-3" /> Bajo stock
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Unidad: <span className="font-medium text-stone-200">{prod.unidad}</span>
                          {prod.stockMinimo > 0 && (
                            <span className="ml-2 text-stone-500">· Mínimo sugerido: {prod.stockMinimo}</span>
                          )}
                        </p>
                      </div>

                      {/* Control de edición de stock: campo numérico puro sin flechas de spinner */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400 font-medium hidden sm:inline">Stock:</span>
                        <NumericInput
                          value={prod.stock ?? 0}
                          onChange={(val) => {
                            actualizarStock(prod.id, val === '' ? 0 : parseFloat(val));
                          }}
                          className={`w-20 text-center font-mono font-bold text-sm ${
                            esBajo 
                              ? 'border-rose-800 bg-rose-950/60 text-rose-300' 
                              : 'border-[#2A352F] bg-[#0F1512] text-white'
                          }`}
                        />
                        <span className="text-xs font-semibold text-stone-400 w-12 truncate">
                          {prod.unidad}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
