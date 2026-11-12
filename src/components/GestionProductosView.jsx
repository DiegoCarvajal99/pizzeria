import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { UNIDADES_DISPONIBLES } from '../data/initialData';
import SearchableSelect from './common/SearchableSelect';
import NumericInput from './common/NumericInput';
import { 
  Plus, 
  Pencil, 
  Ban, 
  CheckCircle, 
  FileSpreadsheet, 
  Upload, 
  Search, 
  X, 
  Boxes, 
  Store,
  Trash2
} from 'lucide-react';

export default function GestionProductosView() {
  const { 
    productos, 
    proveedores, 
    agregarProducto, 
    eliminarProducto,
    toggleHabilitarProducto, 
    agregarProveedor,
    limpiarDatosDePrueba 
  } = useInventory();

  // Estados de control de modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [seccionModal, setSeccionModal] = useState('manual'); // 'manual' | 'importar'
  const [productoEnEdicion, setProductoEnEdicion] = useState(null);

  // Filtros de la lista principal
  const [busqueda, setBusqueda] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'activos' | 'deshabilitados'

  // Estados del formulario "Registrar Nuevo Producto"
  const [nombre, setNombre] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [unidad, setUnidad] = useState('kg');
  const [stockInicial, setStockInicial] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('2');

  // Estados de crear proveedor dentro del formulario
  const [mostrarCrearProv, setMostrarCrearProv] = useState(false);
  const [nombreNuevoProv, setNombreNuevoProv] = useState('');
  const [telefonoNuevoProv, setTelefonoNuevoProv] = useState('');

  // Estados del formulario "Importar Lista Masiva"
  const [textoImportar, setTextoImportar] = useState('');
  const [mensajeImportacion, setMensajeImportacion] = useState(null);

  // Filtrado de la lista principal
  const productosFiltrados = productos.filter(p => {
    const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          (p.proveedorNombre && p.proveedorNombre.toLowerCase().includes(busqueda.toLowerCase()));
    const coincideProveedor = filtroProveedor === 'todos' || p.proveedorId === filtroProveedor || p.proveedorNombre === filtroProveedor;
    const coincideEstado = filtroEstado === 'todos' 
      ? true 
      : filtroEstado === 'activos' 
      ? !p.deshabilitado 
      : p.deshabilitado;

    return coincideTexto && coincideProveedor && coincideEstado;
  });

  // Manejar creación individual de producto
  const handleSubmitNuevoProducto = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !proveedorId) {
      alert('Por favor ingresa el nombre del producto y selecciona un proveedor.');
      return;
    }

    const prov = proveedores.find(p => p.id === proveedorId);

    await agregarProducto({
      nombre: nombre.trim(),
      proveedorId: prov?.id || '',
      proveedorNombre: prov?.nombre || 'Proveedor',
      unidad: (unidad || 'unidad').trim(),
      stock: parseFloat(stockInicial) || 0,
      stockMinimo: parseFloat(stockMinimo) || 1,
      deshabilitado: false
    });

    // Resetear formulario
    setNombre('');
    setStockInicial('0');
    setStockMinimo('2');
    setModalNuevoAbierto(false);
  };

  // Manejar guardado de edición
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!productoEnEdicion || !productoEnEdicion.nombre.trim()) return;

    const prov = proveedores.find(p => p.id === productoEnEdicion.proveedorId);
    await agregarProducto({
      ...productoEnEdicion,
      nombre: productoEnEdicion.nombre.trim(),
      proveedorNombre: prov ? prov.nombre : productoEnEdicion.proveedorNombre,
      unidad: (productoEnEdicion.unidad || 'unidad').trim(),
      stock: parseFloat(productoEnEdicion.stock) || 0,
      stockMinimo: parseFloat(productoEnEdicion.stockMinimo) || 1
    });

    setProductoEnEdicion(null);
  };

  // Manejar creación rápida de proveedor
  const handleCrearProveedorRapido = async (e) => {
    e.preventDefault();
    if (!nombreNuevoProv.trim()) return;

    const nuevo = await agregarProveedor({
      nombre: nombreNuevoProv.trim(),
      telefono: telefonoNuevoProv.trim(),
      notas: ''
    });

    setProveedorId(nuevo.id);
    setNombreNuevoProv('');
    setTelefonoNuevoProv('');
    setMostrarCrearProv(false);
  };

  // Importar desde Excel
  const handleImportarExcel = async () => {
    if (!textoImportar.trim()) return;

    const lineas = textoImportar.split(/\r?\n/);
    let agregados = 0;
    let omitidos = 0;

    for (const raw of lineas) {
      const linea = raw.trim();
      if (!linea) continue;

      let partes = [];
      if (/\t|;|\|/.test(linea)) {
        partes = linea.split(/\t|;|\|/);
      } else {
        partes = linea.split(',');
      }

      partes = partes.map(p => p.trim());
      const [lugar, prodNombre, uni, stockRaw] = partes;

      if (lugar?.toLowerCase() === 'lugar' || lugar?.toLowerCase() === 'proveedor') continue;

      if (!lugar || !prodNombre) {
        omitidos++;
        continue;
      }

      let prov = proveedores.find(p => p.nombre.toLowerCase() === lugar.toLowerCase());
      if (!prov) {
        prov = await agregarProveedor({ nombre: lugar, telefono: '', notas: '' });
      }

      await agregarProducto({
        nombre: prodNombre,
        proveedorId: prov.id,
        proveedorNombre: prov.nombre,
        unidad: uni || 'unidad',
        stock: parseFloat(stockRaw) || 0,
        stockMinimo: 2,
        deshabilitado: false
      });

      agregados++;
    }

    setMensajeImportacion(`✅ Se importaron ${agregados} productos con éxito.${omitidos > 0 ? ` (${omitidos} filas omitidas)` : ''}`);
    setTextoImportar('');
    setTimeout(() => {
      setModalNuevoAbierto(false);
      setMensajeImportacion(null);
    }, 1800);
  };

  // Opciones formateadas para los comboboxes con búsqueda
  const opcionesProveedores = proveedores.map(p => ({
    value: p.id,
    label: p.nombre,
    subtext: p.telefono
  }));

  const opcionesUnidades = UNIDADES_DISPONIBLES.map(u => ({
    value: u,
    label: u
  }));

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Cabecera principal con Botón "Nuevo Producto" */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 font-display flex items-center gap-2">
            <Boxes className="w-5 h-5 text-black" />
            <span>Catálogo de Productos ({productos.length})</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Administra tus insumos, asigna proveedores y controla el estado activo/deshabilitado.
          </p>
        </div>

        {/* BOTONES DE ACCIÓN: Nuevo Producto & Limpiar Datos de Prueba */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {productos.length > 0 && (
            <button
              type="button"
              onClick={limpiarDatosDePrueba}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Borrar datos de prueba para dejar el sistema limpio"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar datos de prueba</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setSeccionModal('manual');
              setModalNuevoAbierto(true);
            }}
            className="px-4 py-2 bg-black hover:bg-zinc-800 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* 2. Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-1 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black"
            />
          </div>

          <div>
            {/* ComboBox con búsqueda de proveedor */}
            <SearchableSelect
              options={[{ value: 'todos', label: 'Todos los proveedores' }, ...opcionesProveedores]}
              value={filtroProveedor}
              onChange={setFiltroProveedor}
              placeholder="Filtrar por proveedor"
              searchPlaceholder="Buscar proveedor..."
            />
          </div>

          <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFiltroEstado('todos')}
              className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filtroEstado === 'todos' ? 'bg-white text-black font-bold shadow-xs' : 'text-zinc-600 hover:text-black'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('activos')}
              className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filtroEstado === 'activos' ? 'bg-white text-black font-bold shadow-xs' : 'text-zinc-600 hover:text-black'
              }`}
            >
              Activos
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('deshabilitados')}
              className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filtroEstado === 'deshabilitados' ? 'bg-black text-white font-bold shadow-xs' : 'text-zinc-600 hover:text-black'
              }`}
            >
              Deshabilitados
            </button>
          </div>
        </div>
      </div>

      {/* 3. LISTA DE PRODUCTOS */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Cabecera de la tabla */}
        <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200 hidden sm:grid sm:grid-cols-12 text-xs font-bold uppercase tracking-wider text-zinc-500">
          <div className="col-span-5">Producto</div>
          <div className="col-span-3">Proveedor</div>
          <div className="col-span-2">Unidad / Stock</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        {productosFiltrados.length === 0 ? (
          <div className="p-10 text-center text-zinc-400">
            <Boxes className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-700">No se encontraron productos</p>
            <p className="text-xs mt-1 text-zinc-500">Prueba cambiando los filtros o agrega un producto con el botón "Nuevo Producto".</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {productosFiltrados.map((prod) => {
              const estaDeshabilitado = Boolean(prod.deshabilitado);

              return (
                <div
                  key={prod.id}
                  className={`p-4 sm:grid sm:grid-cols-12 sm:items-center gap-3 transition-colors ${
                    estaDeshabilitado ? 'bg-zinc-50/50 opacity-60' : 'hover:bg-zinc-50/70'
                  }`}
                >
                  {/* Nombre del producto + Badge de estado */}
                  <div className="col-span-5 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${estaDeshabilitado ? 'bg-zinc-400' : 'bg-emerald-500'}`} />
                    <div className="min-w-0">
                      <p className={`font-bold text-sm truncate ${estaDeshabilitado ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                        {prod.nombre}
                      </p>
                      {estaDeshabilitado && (
                        <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 mt-0.5">
                          Deshabilitado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Proveedor */}
                  <div className="col-span-3 text-xs text-zinc-600 flex items-center gap-1.5 mt-1 sm:mt-0">
                    <Store className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{prod.proveedorNombre || 'Sin proveedor'}</span>
                  </div>

                  {/* Unidad y Stock actual */}
                  <div className="col-span-2 text-xs text-zinc-600 mt-1 sm:mt-0">
                    <span className="font-semibold text-zinc-900 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                      {prod.unidad}
                    </span>
                    <span className="ml-2 text-zinc-500 font-mono">
                      (Stock: {prod.stock ?? 0})
                    </span>
                  </div>

                  {/* ACCIONES: EDITAR, DESHABILITAR Y ELIMINAR */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5 mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-100">
                    {/* Botón Editar */}
                    <button
                      type="button"
                      onClick={() => setProductoEnEdicion({ ...prod })}
                      className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Editar producto"
                    >
                      <Pencil className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Editar</span>
                    </button>

                    {/* Botón Deshabilitar / Habilitar */}
                    {estaDeshabilitado ? (
                      <button
                        type="button"
                        onClick={() => toggleHabilitarProducto(prod.id)}
                        className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Habilitar este producto para que vuelva a estar disponible"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-black" />
                        <span>Habilitar</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleHabilitarProducto(prod.id)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Deshabilitar este producto para pausarlo temporalmente"
                      >
                        <Ban className="w-3.5 h-3.5 text-rose-500" />
                        <span>Deshabilitar</span>
                      </button>
                    )}

                    {/* Botón Eliminar Individual */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar definitivamente "${prod.nombre}" del inventario?`)) {
                          eliminarProducto(prod.id);
                        }
                      }}
                      className="p-1.5 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: "Nuevo Producto"                                                */}
      {/* ========================================================================= */}
      {modalNuevoAbierto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Cabecera del modal */}
            <div className="p-4 sm:p-5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-black" />
                <h3 className="font-bold text-zinc-900 text-base font-display">
                  Nuevo Producto
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoAbierto(false)}
                className="p-1 text-zinc-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas de selección de sección dentro del formulario */}
            <div className="flex border-b border-zinc-200 bg-zinc-50">
              <button
                type="button"
                onClick={() => setSeccionModal('manual')}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  seccionModal === 'manual'
                    ? 'bg-white text-black border-b-2 border-black font-bold'
                    : 'text-zinc-500 hover:text-black'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Nuevo Producto</span>
              </button>

              <button
                type="button"
                onClick={() => setSeccionModal('importar')}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  seccionModal === 'importar'
                    ? 'bg-white text-black border-b-2 border-black font-bold'
                    : 'text-zinc-500 hover:text-black'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Importar Lista Masiva (Excel / Sheets)</span>
              </button>
            </div>

            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
              {/* SECCIÓN 1: REGISTRAR NUEVO PRODUCTO */}
              {seccionModal === 'manual' && (
                <form onSubmit={handleSubmitNuevoProducto} className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Harina para pizza, Queso mozzarella, Pepperoni..."
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black"
                    />
                    {/* Botón Eliminar Individual */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar definitivamente "${prod.nombre}" del inventario?`)) {
                          eliminarProducto(prod.id);
                        }
                      }}
                      className="p-1.5 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Proveedor con ComboBox con búsqueda */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-zinc-700">
                        Proveedor Asignado *
                      </label>
                      <button
                        type="button"
                        onClick={() => setMostrarCrearProv(!mostrarCrearProv)}
                        className="text-xs text-black font-semibold hover:underline cursor-pointer"
                      >
                        {mostrarCrearProv ? 'Cancelar nuevo proveedor' : '+ Crear nuevo proveedor'}
                      </button>
                      {/* Botón Eliminar Individual */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar definitivamente "${prod.nombre}" del inventario?`)) {
                          eliminarProducto(prod.id);
                        }
                      }}
                      className="p-1.5 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                    {mostrarCrearProv ? (
                      <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 mb-2">
                        <p className="text-xs font-bold text-zinc-900">Crear Proveedor Rápido:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Nombre proveedor (ej: Colanta)"
                            value={nombreNuevoProv}
                            onChange={(e) => setNombreNuevoProv(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900"
                          />
                          <input
                            type="text"
                            placeholder="Teléfono WhatsApp (opcional)"
                            value={telefonoNuevoProv}
                            onChange={(e) => setTelefonoNuevoProv(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900"
                          />
                          {/* Botón Eliminar Individual */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar definitivamente "${prod.nombre}" del inventario?`)) {
                          eliminarProducto(prod.id);
                        }
                      }}
                      className="p-1.5 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                        <button
                          type="button"
                          onClick={handleCrearProveedorRapido}
                          className="px-3 py-1 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Guardar Proveedor
                        </button>
                        {/* Botón Eliminar Individual */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar definitivamente "${prod.nombre}" del inventario?`)) {
                          eliminarProducto(prod.id);
                        }
                      }}
                      className="p-1.5 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                    ) : (
                      <SearchableSelect
                        options={opcionesProveedores}
                        value={proveedorId}
                        onChange={setProveedorId}
                        placeholder="-- Buscar y seleccionar proveedor --"
                        searchPlaceholder="Escribe para buscar proveedor..."
                      />
                    )}
                    {/* Botón Eliminar Individual */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar definitivamente "${prod.nombre}" del inventario?`)) {
                          eliminarProducto(prod.id);
                        }
                      }}
                      className="p-1.5 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Unidad con ComboBox con búsqueda */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Unidad de Medida
                    </label>
                    <SearchableSelect
                      options={opcionesUnidades}
                      value={unidad}
                      onChange={setUnidad}
                      placeholder="Seleccionar unidad..."
                      searchPlaceholder="Buscar unidad (kg, lb, bolsa...)"
                      allowCustom={true}
                    />
                    {/* Botón Eliminar Individual */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar definitivamente "${prod.nombre}" del inventario?`)) {
                          eliminarProducto(prod.id);
                        }
                      }}
                      className="p-1.5 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Stock actual y Stock mínimo: CAMPOS DE TEXTO SOLO NÚMEROS SIN FLECHAS */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                        Stock Actual (Solo número)
                      </label>
                      <NumericInput
                        value={stockInicial}
                        onChange={setStockInicial}
                        placeholder="0"
                        className="w-full"
                      />
                      {/* Botón Eliminar Individual */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar definitivamente "${prod.nombre}" del inventario?`)) {
                          eliminarProducto(prod.id);
                        }
                      }}
                      className="p-1.5 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                        Stock Mínimo (Solo número)
                      </label>
                      <NumericInput
                        value={stockMinimo}
                        onChange={setStockMinimo}
                        placeholder="2"
                        className="w-full"
                      />
                      {/* Botón Eliminar Individual */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar definitivamente "${prod.nombre}" del inventario?`)) {
                          eliminarProducto(prod.id);
                        }
                      }}
                      className="p-1.5 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                    {/* Botón Eliminar Individual */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar definitivamente "${prod.nombre}" del inventario?`)) {
                          eliminarProducto(prod.id);
                        }
                      }}
                      className="p-1.5 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Botón de envío */}
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setModalNuevoAbierto(false)}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                    >
                      Guardar Producto
                    </button>
                    {/* Botón Eliminar Individual */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar definitivamente "${prod.nombre}" del inventario?`)) {
                          eliminarProducto(prod.id);
                        }
                      }}
                      className="p-1.5 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {/* SECCIÓN 2: IMPORTAR LISTA MASIVA (SOLO CON EL BOTÓN DE IMPORTAR PRODUCTOS) */}
              {seccionModal === 'importar' && (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Pega las filas copiadas desde Excel o Google Sheets con las columnas en este orden:
                    <br />
                    <code className="inline-block mt-1 bg-zinc-100 px-2 py-1 rounded text-zinc-900 font-mono border border-zinc-200">
                      Proveedor, Producto, Unidad, Stock Inicial
                    </code>
                  </p>

                  <textarea
                    rows={6}
                    placeholder="Distripapa	Papa pastusa	bulto	2&#10;Mercado	Tomate	kg	5&#10;Ara	Queso mozzarella	bloque	4&#10;Paula	Pepperoni	kg	3"
                    value={textoImportar}
                    onChange={(e) => setTextoImportar(e.target.value)}
                    className="w-full p-3 font-mono text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black"
                  />

                  {mensajeImportacion && (
                    <p className="text-xs font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      {mensajeImportacion}
                    </p>
                  )}

                  {/* SOLO EL BOTÓN DE IMPORTAR PRODUCTOS */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleImportarExcel}
                      disabled={!textoImportar.trim()}
                      className="px-5 py-2.5 bg-black hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Importar Productos</span>
                    </button>
                    {/* Botón Eliminar Individual */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar definitivamente "${prod.nombre}" del inventario?`)) {
                          eliminarProducto(prod.id);
                        }
                      }}
                      className="p-1.5 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: EDICIÓN DE PRODUCTO EXISTENTE                                    */}
      {/* ========================================================================= */}
      {productoEnEdicion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-zinc-900 text-base font-display flex items-center gap-2">
                <Pencil className="w-4 h-4 text-black" />
                <span>Editar Producto</span>
              </h3>
              <button
                type="button"
                onClick={() => setProductoEnEdicion(null)}
                className="p-1 text-zinc-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={productoEnEdicion.nombre}
                  onChange={(e) => setProductoEnEdicion({ ...productoEnEdicion, nombre: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Proveedor</label>
                <SearchableSelect
                  options={opcionesProveedores}
                  value={productoEnEdicion.proveedorId}
                  onChange={(val) => {
                    const p = proveedores.find(prov => prov.id === val);
                    setProductoEnEdicion({
                      ...productoEnEdicion,
                      proveedorId: val,
                      proveedorNombre: p ? p.nombre : productoEnEdicion.proveedorNombre
                    });
                  }}
                  placeholder="Seleccionar proveedor"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Unidad</label>
                <SearchableSelect
                  options={opcionesUnidades}
                  value={productoEnEdicion.unidad}
                  onChange={(val) => setProductoEnEdicion({ ...productoEnEdicion, unidad: val })}
                  placeholder="Seleccionar unidad"
                  allowCustom={true}
                />
              </div>

              {/* CAMPOS SOLO NUMÉRICOS SIN FLECHAS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Stock Actual</label>
                  <NumericInput
                    value={productoEnEdicion.stock}
                    onChange={(val) => setProductoEnEdicion({ ...productoEnEdicion, stock: val })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Stock Mínimo</label>
                  <NumericInput
                    value={productoEnEdicion.stockMinimo}
                    onChange={(val) => setProductoEnEdicion({ ...productoEnEdicion, stockMinimo: val })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setProductoEnEdicion(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}