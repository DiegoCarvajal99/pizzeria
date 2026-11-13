import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import SearchableSelect from './common/SearchableSelect';
import NumericInput from './common/NumericInput';
import { 
  UtensilsCrossed,
  Search, 
  AlertTriangle, 
  Package, 
  Store,
  History,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowDownRight,
  ArrowRight,
  Filter,
  X,
  Edit3,
  Flame,
  AlertCircle,
  TrendingDown,
  Layers
} from 'lucide-react';

export default function InventarioView() {
  const { 
    productos = [], 
    proveedores = [], 
    movimientos = [], 
    registrarConsumo, 
    actualizarStock, 
    mostrarAlerta 
  } = useInventory();

  // Modo de vista: 'descontar' (toma para preparación) o 'bitacora' (registro histórico)
  const [vistaActiva, setVistaActiva] = useState('descontar');

  // Filtros de búsqueda en catálogo
  const [busqueda, setBusqueda] = useState('');
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('todos');
  const [soloStockBajo, setSoloStockBajo] = useState(false);

  // Cantidades que el usuario escribe en cada insumo para tomar
  const [cantidadesTomadas, setCantidadesTomadas] = useState({});

  // Ventana modal de Alerta cuando la cantidad a tomar es superior al stock disponible
  const [alertaExceso, setAlertaExceso] = useState(null); 
  // { producto, cantidadTomada, stockActual, diferencia }

  // Modal para ajuste manual de conteo físico total (fallback de auditoría)
  const [productoAjusteManual, setProductoAjusteManual] = useState(null);
  const [nuevoStockManual, setNuevoStockManual] = useState('');

  // Filtros en la bitácora de consumo
  const [filtroBitacoraBusqueda, setFiltroBitacoraBusqueda] = useState('');
  const [filtroBitacoraPeriodo, setFiltroBitacoraPeriodo] = useState('todos'); // 'todos' | 'hoy' | 'semana'

  // --- FILTRADO DE PRODUCTOS ---
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                            (p.proveedorNombre && p.proveedorNombre.toLowerCase().includes(busqueda.toLowerCase()));
      const coincideProveedor = proveedorSeleccionado === 'todos' || 
                                p.proveedorId === proveedorSeleccionado || 
                                p.proveedorNombre === proveedorSeleccionado;
      const esBajo = (p.stock || 0) <= (p.stockMinimo || 1);
      const coincideStock = soloStockBajo ? esBajo : true;

      return coincideTexto && coincideProveedor && coincideStock;
    });
  }, [productos, busqueda, proveedorSeleccionado, soloStockBajo]);

  // Agrupación por proveedor
  const productosPorProveedor = useMemo(() => {
    return productosFiltrados.reduce((acc, p) => {
      const prov = p.proveedorNombre || 'Sin Proveedor';
      if (!acc[prov]) acc[prov] = [];
      acc[prov].push(p);
      return acc;
    }, {});
  }, [productosFiltrados]);

  // Opciones para el filtro de proveedores
  const opcionesProveedores = useMemo(() => [
    { value: 'todos', label: 'Todos los proveedores' },
    ...proveedores.map(p => ({ value: p.id, label: p.nombre, subtext: p.telefono }))
  ], [proveedores]);

  // --- BITÁCORA DE CONSUMOS ---
  // Filtramos movimientos que corresponden a consumo o salidas
  const consumosHistorial = useMemo(() => {
    const ahora = new Date();
    const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
    const semanaInicio = hoyInicio - (7 * 24 * 60 * 60 * 1000);

    return movimientos.filter(m => {
      // Tomamos los movimientos con delta negativo o tipo 'consumo_cocina'
      const esSalida = m.delta < 0 || m.tipo === 'consumo_cocina';
      if (!esSalida) return false;

      // Filtro de búsqueda por producto
      if (filtroBitacoraBusqueda.trim()) {
        const query = filtroBitacoraBusqueda.toLowerCase();
        const coincide = (m.prodNombre && m.prodNombre.toLowerCase().includes(query)) ||
                         (m.referencia && m.referencia.toLowerCase().includes(query));
        if (!coincide) return false;
      }

      // Filtro de periodo
      const fechaMov = new Date(m.fecha).getTime();
      if (filtroBitacoraPeriodo === 'hoy') {
        return fechaMov >= hoyInicio;
      }
      if (filtroBitacoraPeriodo === 'semana') {
        return fechaMov >= semanaInicio;
      }
      return true;
    });
  }, [movimientos, filtroBitacoraBusqueda, filtroBitacoraPeriodo]);

  // Contadores para métricas
  const totalStockBajo = useMemo(() => 
    productos.filter(p => (p.stock || 0) <= (p.stockMinimo || 1) && !p.deshabilitado).length
  , [productos]);

  const consumosHoyCount = useMemo(() => {
    const hoy = new Date().toDateString();
    return movimientos.filter(m => 
      (m.delta < 0 || m.tipo === 'consumo_cocina') && 
      new Date(m.fecha).toDateString() === hoy
    ).length;
  }, [movimientos]);

  // --- ACCIÓN: GUARDAR CONSUMO ---
  const handleIntentarGuardarConsumo = (prod) => {
    const rawVal = cantidadesTomadas[prod.id];
    const cantidad = parseFloat(rawVal);

    if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
      if (mostrarAlerta) mostrarAlerta(`Ingresa una cantidad válida a tomar de ${prod.nombre}`, 'warning');
      return;
    }

    const stockActual = Number(prod.stock) || 0;

    // VALIDACIÓN CLAVE: Si lo que va a tomar es MAYOR a lo que hay en el sistema
    if (cantidad > stockActual) {
      setAlertaExceso({
        producto: prod,
        cantidadTomada: cantidad,
        stockActual: stockActual,
        diferencia: Math.round((cantidad - stockActual) * 100) / 100
      });
      return;
    }

    // Si hay suficiente stock, ejecutar descuento normal
    ejecutarDescuento(prod, cantidad, 'Toma para preparación en cocina');
  };

  // Función ejecutora del descuento y registro en la bitácora
  const ejecutarDescuento = async (prod, cantidad, nota) => {
    if (registrarConsumo) {
      await registrarConsumo(prod.id, cantidad, nota);
    } else {
      const nuevoStock = Math.max(0, Math.round(((prod.stock || 0) - cantidad) * 100) / 100);
      actualizarStock(prod.id, nuevoStock, nota);
    }

    // Limpiar el campo del producto
    setCantidadesTomadas(prev => ({ ...prev, [prod.id]: '' }));
    setAlertaExceso(null);
  };

  // Ajustar al máximo disponible para evitar descuadres
  const handleAjustarAlMaximoDisponible = () => {
    if (!alertaExceso) return;
    const { producto, stockActual } = alertaExceso;
    if (stockActual <= 0) {
      setAlertaExceso(null);
      return;
    }
    ejecutarDescuento(producto, stockActual, `Toma total del stock registrado (${stockActual} ${producto.unidad})`);
  };

  // Atajos rápidos para sumar cantidad a tomar
  const handleSumarAtajo = (prodId, delta) => {
    setCantidadesTomadas(prev => {
      const actual = parseFloat(prev[prodId] || 0);
      const nueva = Math.round((actual + delta) * 100) / 100;
      return { ...prev, [prodId]: String(nueva) };
    });
  };

  // Guardar corrección física total (fallback)
  const handleGuardarAjusteFisico = (e) => {
    e.preventDefault();
    if (!productoAjusteManual) return;
    const valor = parseFloat(nuevoStockManual);
    if (isNaN(valor) || valor < 0) {
      if (mostrarAlerta) mostrarAlerta('Ingresa un valor de stock válido', 'warning');
      return;
    }

    actualizarStock(
      productoAjusteManual.id, 
      valor, 
      `Conteo manual de inventario físico general`
    );

    if (mostrarAlerta) {
      mostrarAlerta(`Stock de "${productoAjusteManual.nombre}" actualizado a ${valor} ${productoAjusteManual.unidad}`, 'success');
    }
    setProductoAjusteManual(null);
    setNuevoStockManual('');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* CABECERA & IDENTIDAD DE LA SECCIÓN */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-black text-white shrink-0 shadow-md">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-zinc-900 font-display">
                  Consumo & Descuento de Insumos
                </h1>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                  Cocina
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Digita lo que tomas para preparación. Se actualiza el stock al instante y queda registrado en la bitácora con fecha y hora.
              </p>
            </div>
          </div>

          {/* Selector de Pestaña Principal: Descontar Insumos vs Bitácora de Registro */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-2xl border border-zinc-200 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setVistaActiva('descontar')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                vistaActiva === 'descontar'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Descontar Insumos</span>
            </button>
            <button
              type="button"
              onClick={() => setVistaActiva('bitacora')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                vistaActiva === 'bitacora'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Bitácora de Consumos</span>
              {consumosHistorial.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  vistaActiva === 'bitacora' ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800'
                }`}>
                  {consumosHistorial.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* MÉTRICAS RÁPIDAS EN FONDO BLANCO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-100">
          <div className="bg-zinc-50/80 p-3.5 rounded-2xl border border-zinc-200">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Insumos Activos</p>
            <p className="text-xl font-bold text-zinc-900 mt-0.5 font-mono">{productos.length}</p>
          </div>

          <div className="bg-zinc-50/80 p-3.5 rounded-2xl border border-zinc-200">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Consumos Hoy</p>
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <p className="text-xl font-bold text-zinc-900 mt-0.5 font-mono">{consumosHoyCount}</p>
          </div>

          <div 
            onClick={() => {
              setVistaActiva('descontar');
              setSoloStockBajo(!soloStockBajo);
            }}
            className={`col-span-2 sm:col-span-1 p-3.5 rounded-2xl border transition-all cursor-pointer ${
              soloStockBajo
                ? 'bg-rose-100 text-rose-900 border-rose-300'
                : totalStockBajo > 0
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-zinc-50/80 border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[11px] font-semibold uppercase tracking-wider ${soloStockBajo ? 'text-rose-900 font-bold' : 'text-rose-600'}`}>
                Stock Bajo / Agotado
              </p>
              <AlertTriangle className={`w-3.5 h-3.5 ${soloStockBajo ? 'text-rose-900' : 'text-rose-500'}`} />
            </div>
            <p className="text-xl font-bold text-zinc-900 mt-0.5 font-mono">{totalStockBajo}</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          VISTA 1: DESCONTAR INSUMOS (TOMA PARA PREPARACIÓN)
          ========================================================================= */}
      {vistaActiva === 'descontar' && (
        <div className="space-y-6">
          {/* BARRA DE BÚSQUEDA Y FILTRO DE PROVEEDOR */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="BUSCAR INSUMO A DESCONTAR (EJ. MOZZARELLA, HARINA)..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-9 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black font-medium uppercase"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-black cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
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

            {soloStockBajo && (
              <div className="flex items-center justify-between bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-xs text-rose-800">
                <span className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Mostrando solo insumos con stock bajo o agotados
                </span>
                <button
                  type="button"
                  onClick={() => setSoloStockBajo(false)}
                  className="underline font-bold hover:text-rose-950 cursor-pointer text-[11px]"
                >
                  Quitar filtro
                </button>
              </div>
            )}
          </div>

          {/* LISTA DE INSUMOS AGRUPADOS POR PROVEEDOR */}
          {Object.keys(productosPorProveedor).length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-zinc-200 shadow-sm space-y-2">
              <Package className="w-12 h-12 text-zinc-300 mx-auto" />
              <p className="text-sm font-bold text-zinc-800">No se encontraron insumos</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                No hay productos que coincidan con "{busqueda}". Verifica el término de búsqueda o limpia los filtros.
              </p>
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 cursor-pointer"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(productosPorProveedor).map(([provNombre, items]) => (
                <div key={provNombre} className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                  {/* Encabezado del proveedor en fondo negro */}
                  <div className="bg-black text-white px-5 py-3 flex items-center justify-between border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-zinc-300" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-white font-display">
                        {provNombre}
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-zinc-400">
                      {items.length} {items.length === 1 ? 'insumo' : 'insumos'}
                    </span>
                  </div>

                  {/* Fila ergonómica por insumo */}
                  <div className="divide-y divide-zinc-100">
                    {items.map((prod) => {
                      const stockActual = prod.stock ?? 0;
                      const esBajo = stockActual <= (prod.stockMinimo || 1);
                      const valorTomar = cantidadesTomadas[prod.id] ?? '';
                      const cantidadNum = parseFloat(valorTomar) || 0;
                      const excedido = cantidadNum > stockActual;
                      const stockResultante = Math.max(0, Math.round((stockActual - cantidadNum) * 100) / 100);

                      return (
                        <div 
                          key={prod.id} 
                          className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
                            esBajo ? 'bg-rose-50/30' : 'hover:bg-zinc-50/60'
                          }`}
                        >
                          {/* 1. INFORMACIÓN DEL PRODUCTO */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-base text-zinc-900 leading-tight">
                                {prod.nombre}
                              </h4>
                              {prod.deshabilitado && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600">
                                  Deshabilitado
                                </span>
                              )}
                              {stockActual <= 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" /> Agotado
                                </span>
                              ) : esBajo && !prod.deshabilitado ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Stock bajo
                                </span>
                              ) : null}
                            </div>

                            <p className="text-xs text-zinc-500 mt-1">
                              Presentación / Unidad: <strong className="text-zinc-700">{prod.unidad}</strong>
                              {prod.stockMinimo > 0 && (
                                <span className="ml-2 text-zinc-400">· Mínimo sugerido: {prod.stockMinimo} {prod.unidad}</span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setProductoAjusteManual(prod);
                                  setNuevoStockManual(String(stockActual));
                                }}
                                className="text-[11px] text-zinc-400 hover:text-black underline cursor-pointer inline-flex items-center gap-1 ml-3"
                                title="Corregir conteo físico en auditoría general"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Corregir total físico</span>
                              </button>
                            </p>
                          </div>

                          {/* 2. CANTIDAD ACTUAL QUE HAY EN EL SISTEMA */}
                          <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-2xs flex sm:flex-col items-center sm:items-start justify-between min-w-[140px] shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                              Stock Actual
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className={`text-xl font-black font-mono tracking-tight ${
                                stockActual <= 0 
                                  ? 'text-rose-600' 
                                  : esBajo 
                                  ? 'text-amber-600' 
                                  : 'text-zinc-900'
                              }`}>
                                {stockActual}
                              </span>
                              <span className="text-xs font-semibold text-zinc-500">
                                {prod.unidad}
                              </span>
                            </div>
                          </div>

                          {/* 3. CAMPO PARA DIGITAR LA CANTIDAD A TOMAR & BOTÓN GUARDAR */}
                          <div className="bg-zinc-50 p-3 sm:p-3.5 rounded-2xl border border-zinc-200 shrink-0 space-y-2 lg:w-[360px]">
                            <div className="flex items-center justify-between text-xs">
                              <label className="font-bold text-zinc-700 flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5 text-zinc-700" />
                                <span>Tomar para preparación:</span>
                              </label>

                              {/* Previsualización en vivo del stock resultante */}
                              {cantidadNum > 0 && (
                                <span className={`text-[11px] font-mono font-bold ${
                                  excedido ? 'text-rose-600 animate-pulse' : 'text-emerald-700'
                                }`}>
                                  {excedido ? `⚠️ Excede por +${Math.round((cantidadNum - stockActual)*100)/100}` : `Quedarán: ${stockResultante}`}
                                </span>
                              )}
                            </div>

                            {/* Controles de Entrada */}
                            <div className="flex items-center gap-2">
                              {/* Input Numérico Puro sin Spinners */}
                              <div className="relative flex-1">
                                <NumericInput
                                  value={valorTomar}
                                  onChange={(val) => {
                                    setCantidadesTomadas(prev => ({ ...prev, [prod.id]: val }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleIntentarGuardarConsumo(prod);
                                  }}
                                  placeholder="0.00"
                                  className={`w-full text-center py-2 px-3 text-sm font-mono font-bold bg-white rounded-xl border ${
                                    excedido 
                                      ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-600' 
                                      : 'border-zinc-300 focus:border-black'
                                  }`}
                                />
                                <span className="absolute right-2.5 top-2.5 text-xs font-semibold text-zinc-400 pointer-events-none">
                                  {prod.unidad}
                                </span>
                              </div>

                              {/* Botón para Guardar Cambio de Stock */}
                              <button
                                type="button"
                                onClick={() => handleIntentarGuardarConsumo(prod)}
                                disabled={!valorTomar || cantidadNum <= 0}
                                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0 ${
                                  !valorTomar || cantidadNum <= 0
                                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                                    : excedido
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
                                    : 'bg-black hover:bg-zinc-800 text-white active:scale-95'
                                }`}
                                title="Guardar consumo y actualizar stock"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Guardar</span>
                              </button>
                            </div>

                            {/* Atajos rápidos de toque táctil */}
                            <div className="flex items-center gap-1.5 pt-1">
                              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mr-1">
                                Rápido:
                              </span>
                              {[0.5, 1, 2, 5].map(step => (
                                <button
                                  key={step}
                                  type="button"
                                  onClick={() => handleSumarAtajo(prod.id, step)}
                                  className="px-2 py-0.5 rounded-lg bg-white hover:bg-zinc-200 active:scale-95 text-[11px] font-mono font-bold text-zinc-700 border border-zinc-200 transition-colors cursor-pointer shadow-2xs"
                                >
                                  +{step}
                                </button>
                              ))}
                              {valorTomar && (
                                <button
                                  type="button"
                                  onClick={() => setCantidadesTomadas(prev => ({ ...prev, [prod.id]: '' }))}
                                  className="ml-auto text-[10px] text-zinc-400 hover:text-rose-600 underline cursor-pointer"
                                >
                                  Borrar
                                </button>
                              )}
                            </div>
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
      )}

      {/* =========================================================================
          VISTA 2: BITÁCORA DE CONSUMOS (REGISTRO HISTÓRICO CON FECHA & HORA)
          ========================================================================= */}
      {vistaActiva === 'bitacora' && (
        <div className="space-y-4">
          {/* Controles de Búsqueda y Periodo en la Bitácora */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="BUSCAR POR INSUMO EN LA BITÁCORA..."
                value={filtroBitacoraBusqueda}
                onChange={(e) => setFiltroBitacoraBusqueda(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black font-medium uppercase"
              />
            </div>

            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 self-start sm:self-auto shrink-0">
              <span className="text-[10px] font-bold text-zinc-500 uppercase px-2">Periodo:</span>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'hoy', label: 'Hoy' },
                { id: 'semana', label: '7 días' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFiltroBitacoraPeriodo(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filtroBitacoraPeriodo === p.id 
                      ? 'bg-white text-black shadow-2xs' 
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listado Cronológico de Salidas */}
          {consumosHistorial.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-zinc-200 shadow-sm space-y-2">
              <History className="w-12 h-12 text-zinc-300 mx-auto" />
              <p className="text-sm font-bold text-zinc-800">No hay registros de consumo en este periodo</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Los consumos que guardes en la pestaña "Descontar Insumos" aparecerán automáticamente aquí con su fecha, hora y detalle de stock.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden divide-y divide-zinc-100">
              <div className="bg-black text-white px-5 py-3 flex items-center justify-between text-xs font-display">
                <span className="uppercase tracking-wider font-bold">Bitácora de Salidas de Cocina</span>
                <span className="text-zinc-400 font-mono">{consumosHistorial.length} movimientos</span>
              </div>

              {consumosHistorial.map((mov) => {
                const fechaObj = new Date(mov.fecha);
                const fechaStr = fechaObj.toLocaleDateString([], { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                });
                const horaStr = fechaObj.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                });

                return (
                  <div key={mov.id} className="p-4 hover:bg-zinc-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 mt-0.5 shrink-0">
                        <TrendingDown className="w-4 h-4 stroke-[2.5]" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-zinc-900">
                            {mov.prodNombre}
                          </h4>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                            {mov.delta > 0 ? `-${mov.delta}` : mov.delta} {mov.unidad || ''}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-600 mt-0.5">
                          {mov.referencia || 'Toma para preparación'}
                        </p>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 font-mono">
                          <span>Stock previo: {mov.stockPrevio}</span>
                          <ArrowRight className="w-3 h-3 text-zinc-300" />
                          <span className="font-bold text-zinc-700">Stock resultante: {mov.stockNuevo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Fecha y Hora Exactas */}
                    <div className="text-left sm:text-right shrink-0 bg-zinc-50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                      <div className="flex items-center sm:justify-end gap-1.5 text-xs font-semibold text-zinc-700">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{fechaStr}</span>
                      </div>
                      <div className="flex items-center sm:justify-end gap-1.5 text-[11px] text-zinc-400 font-mono mt-0.5">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{horaStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VENTANA DE ALERTAS (MODAL DE EXCESO DE CONSUMO)
          Se activa cuando lo que se va a tomar es MAYOR a lo que hay en el sistema
          ========================================================================= */}
      {alertaExceso && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-scale-up">
            {/* Cabecera con Icono de Advertencia */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-700 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-base font-display">
                  ¡Atención! Consumo mayor al stock
                </h3>
                <p className="text-xs text-zinc-500">
                  Estás intentando tomar más producto del registrado en el sistema.
                </p>
              </div>
            </div>

            {/* Ficha Resumen de Diferencia */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 font-medium">Insumo:</span>
                <span className="font-bold text-zinc-900">{alertaExceso.producto.nombre}</span>
              </div>
              <div className="flex items-center justify-between border-t border-amber-200/60 pt-1.5">
                <span className="text-zinc-600 font-medium">Stock actual disponible:</span>
                <span className="font-mono font-bold text-zinc-900">
                  {alertaExceso.stockActual} {alertaExceso.producto.unidad}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-amber-200/60 pt-1.5">
                <span className="text-amber-900 font-semibold">Cantidad que vas a tomar:</span>
                <span className="font-mono font-bold text-rose-700 text-sm">
                  {alertaExceso.cantidadTomada} {alertaExceso.producto.unidad}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-amber-200/60 pt-1.5 bg-amber-100/70 -mx-4 -mb-4 p-3 rounded-b-2xl">
                <span className="text-amber-950 font-bold">Diferencia faltante:</span>
                <span className="font-mono font-black text-rose-800">
                  -{alertaExceso.diferencia} {alertaExceso.producto.unidad}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              No es posible procesar este consumo porque generaría un descuadre en el inventario. El sistema no permite salidas mayores a las existencias registradas. Por favor, corrige la cantidad a tomar o descuenta únicamente el stock real disponible.
            </p>

            {/* Botones de Acción: Sin botones de forzar para evitar descuadres */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAlertaExceso(null)}
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Entendido, corregir cantidad
              </button>

              {alertaExceso.stockActual > 0 && (
                <button
                  type="button"
                  onClick={handleAjustarAlMaximoDisponible}
                  className="w-full sm:flex-1 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition-colors cursor-pointer"
                  title="Descontar únicamente las existencias reales disponibles"
                >
                  Tomar solo disponible ({alertaExceso.stockActual} {alertaExceso.producto.unidad})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE AJUSTE FÍSICO MANUAL (AUDITORÍA TOTAL DE BASE)
          ========================================================================= */}
      {productoAjusteManual && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-black" />
                <h3 className="font-bold text-zinc-900 text-sm font-display">
                  Corregir Stock Físico Total
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProductoAjusteManual(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Modifica directamente el inventario total de <strong className="text-zinc-900">{productoAjusteManual.nombre}</strong> tras realizar un conteo físico manual.
            </p>

            <form onSubmit={handleGuardarAjusteFisico} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">
                  Nuevo Stock Total ({productoAjusteManual.unidad})
                </label>
                <NumericInput
                  value={nuevoStockManual}
                  onChange={setNuevoStockManual}
                  placeholder="0.00"
                  className="w-full text-center font-mono font-bold text-base py-2.5 border-zinc-300"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProductoAjusteManual(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Guardar Corrección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
