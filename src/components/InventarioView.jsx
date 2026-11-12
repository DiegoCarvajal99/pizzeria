import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import SearchableSelect from './common/SearchableSelect';
import NumericInput from './common/NumericInput';
import { 
  ClipboardList, 
  Search, 
  AlertTriangle, 
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
      {/* Resumen rápido de métricas en fondo blanco */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Insumos</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1 font-mono">{productos.length}</p>
        </div>

        <div 
          className={`p-4 rounded-2xl border shadow-sm transition-all cursor-pointer ${
            soloStockBajo 
              ? 'bg-rose-100 text-rose-900 border-rose-300' 
              : totalStockBajo > 0 
              ? 'bg-rose-50 text-rose-800 border-rose-200' 
              : 'bg-white border-zinc-200 hover:border-zinc-300'
          }`}
          onClick={() => setSoloStockBajo(!soloStockBajo)}
        >
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold uppercase tracking-wider ${soloStockBajo ? 'text-rose-900 font-bold' : 'text-rose-600'}`}>
              Stock Bajo / Por Agotar
            </p>
            <AlertTriangle className={`w-4 h-4 ${soloStockBajo ? 'text-rose-900' : 'text-rose-500'}`} />
          </div>
          <p className="text-2xl font-bold mt-1 font-mono text-zinc-900">{totalStockBajo}</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Proveedores</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1 font-mono">{proveedores.length}</p>
          </div>
          <button
            type="button"
            onClick={() => setMostrarMovimientos(!mostrarMovimientos)}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Ver auditoría de movimientos"
          >
            <History className="w-4 h-4 text-black" />
            <span>Kardex</span>
          </button>
        </div>
      </div>

      {/* Historial de Movimientos (Kardex) desplegable */}
      {mostrarMovimientos && (
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 font-display flex items-center gap-2">
              <History className="w-4 h-4 text-black" />
              <span>Últimos Movimientos de Stock</span>
            </h3>
            <button
              onClick={() => setMostrarMovimientos(false)}
              className="text-xs text-zinc-500 hover:text-black cursor-pointer font-semibold"
            >
              Ocultar
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 text-xs">
            {movimientos.length === 0 ? (
              <p className="py-4 text-center text-zinc-400">Aún no se han registrado movimientos de stock.</p>
            ) : (
              movimientos.map(m => (
                <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {m.delta > 0 ? (
                      <span className="p-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <div>
                      <p className="font-semibold text-zinc-900">{m.prodNombre}</p>
                      <p className="text-[11px] text-zinc-500">{m.referencia} · {new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className={`font-bold ${m.delta > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {m.delta > 0 ? `+${m.delta}` : m.delta}
                    </span>
                    <p className="text-[10px] text-zinc-400">Nuevo: {m.stockNuevo}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Controles de Búsqueda y ComboBox con Búsqueda de Proveedor */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black"
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
        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-zinc-200 shadow-sm">
          <Package className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-zinc-700">No hay productos que coincidan</p>
          <p className="text-xs text-zinc-400 mt-1">Prueba cambiando el término de búsqueda o el filtro.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(productosPorProveedor).map(([provNombre, items]) => (
            <div key={provNombre} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              {/* Encabezado del proveedor en fondo negro */}
              <div className="bg-black text-white px-4 py-2.5 flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-zinc-300" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-white font-display">
                    {provNombre}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-zinc-400">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>

              {/* Filas de productos */}
              <div className="divide-y divide-zinc-100">
                {items.map((prod) => {
                  const esBajo = (prod.stock || 0) <= (prod.stockMinimo || 1);
                  return (
                    <div 
                      key={prod.id} 
                      className={`p-3.5 flex items-center justify-between gap-3 ${
                        esBajo ? 'bg-rose-50/50' : 'hover:bg-zinc-50/70'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-zinc-900 truncate">
                            {prod.nombre}
                          </h4>
                          {prod.deshabilitado && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600">
                              Deshabilitado
                            </span>
                          )}
                          {esBajo && !prod.deshabilitado && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Bajo stock
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Unidad: <span className="font-medium text-zinc-700">{prod.unidad}</span>
                          {prod.stockMinimo > 0 && (
                            <span className="ml-2 text-zinc-400">· Mínimo sugerido: {prod.stockMinimo}</span>
                          )}
                        </p>
                      </div>

                      {/* Control de edición de stock: campo numérico puro sin flechas de spinner */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-medium hidden sm:inline">Stock:</span>
                        <NumericInput
                          value={prod.stock ?? 0}
                          onChange={(val) => {
                            actualizarStock(prod.id, val === '' ? 0 : parseFloat(val));
                          }}
                          className={`w-20 text-center font-mono font-bold text-sm ${
                            esBajo 
                              ? 'border-rose-300 bg-rose-50 text-rose-900' 
                              : 'border-zinc-300 bg-white text-zinc-900'
                          }`}
                        />
                        <span className="text-xs font-semibold text-zinc-500 w-12 truncate">
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