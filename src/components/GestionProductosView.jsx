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
  Layers,
  Sparkles
} from 'lucide-react';

export default function GestionProductosView() {
  const { productos, proveedores, agregarProducto, toggleHabilitarProducto, agregarProveedor } = useInventory();

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
      <div className="bg-[#18201C] p-4 sm:p-5 rounded-2xl border border-[#2A352F] shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-400" />
            <span>Catálogo de Productos ({productos.length})</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Administra tus insumos, asigna proveedores y controla el estado activo/deshabilitado.
          </p>
        </div>

        {/* BOTÓN REQUERIDO: "Nuevo Producto" */}
        <button
          type="button"
          onClick={() => {
            setSeccionModal('manual');
            setModalNuevoAbierto(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* 2. Filtros y Búsqueda */}
      <div className="bg-[#18201C] p-4 rounded-2xl border border-[#2A352F] shadow-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-1 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0F1512] border border-[#2A352F] rounded-xl text-sm text-white placeholder-stone-500 focus:outline-emerald-500"
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

          <div className="flex gap-1 bg-[#0F1512] p-1 rounded-xl border border-[#2A352F] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFiltroEstado('todos')}
              className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filtroEstado === 'todos' ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('activos')}
              className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filtroEstado === 'activos' ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              Activos
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('deshabilitados')}
              className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filtroEstado === 'deshabilitados' ? 'bg-rose-900 text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              Deshabilitados
            </button>
          </div>
        </div>
      </div>

      {/* 3. LISTA DE PRODUCTOS
          Muestra: Nombre del producto, Proveedor, Unidad y Acciones de Editar y Deshabilitar/Habilitar
      */}
      <div className="bg-[#18201C] rounded-2xl border border-[#2A352F] shadow-lg overflow-hidden">
        {/* Cabecera de la tabla */}
        <div className="bg-[#131A16] px-4 py-3 border-b border-[#2A352F] hidden sm:grid sm:grid-cols-12 text-xs font-bold uppercase tracking-wider text-stone-400">
          <div className="col-span-5">Producto</div>
          <div className="col-span-3">Proveedor</div>
          <div className="col-span-2">Unidad / Stock</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        {productosFiltrados.length === 0 ? (
          <div className="p-10 text-center text-stone-500">
            <Boxes className="w-10 h-10 mx-auto mb-2 text-stone-600" />
            <p className="text-sm font-semibold text-stone-300">No se encontraron productos</p>
            <p className="text-xs mt-1">Prueba cambiando los filtros o agrega un producto con el botón "Nuevo Producto".</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2A352F]">
            {productosFiltrados.map((prod) => {
              const estaDeshabilitado = Boolean(prod.deshabilitado);

              return (
                <div
                  key={prod.id}
                  className={`p-4 sm:grid sm:grid-cols-12 sm:items-center gap-3 transition-colors ${
                    estaDeshabilitado ? 'bg-[#0F1512]/50 opacity-60' : 'hover:bg-[#1E2823]'
                  }`}
                >
                  {/* Nombre del producto + Badge de estado */}
                  <div className="col-span-5 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${estaDeshabilitado ? 'bg-stone-500' : 'bg-emerald-400'}`} />
                    <div className="min-w-0">
                      <p className={`font-bold text-sm truncate ${estaDeshabilitado ? 'line-through text-stone-400' : 'text-white'}`}>
                        {prod.nombre}
                      </p>
                      {estaDeshabilitado && (
                        <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/50 mt-0.5">
                          Deshabilitado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Proveedor */}
                  <div className="col-span-3 text-xs text-stone-300 flex items-center gap-1.5 mt-1 sm:mt-0">
                    <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{prod.proveedorNombre || 'Sin proveedor'}</span>
                  </div>

                  {/* Unidad y Stock actual */}
                  <div className="col-span-2 text-xs text-stone-300 mt-1 sm:mt-0">
                    <span className="font-semibold text-white px-2 py-0.5 rounded bg-[#25302A] border border-[#2A352F]">
                      {prod.unidad}
                    </span>
                    <span className="ml-2 text-stone-400 font-mono">
                      (Stock: {prod.stock ?? 0})
                    </span>
                  </div>

                  {/* ACCIONES: EDITAR Y DESHABILITAR / HABILITAR */}
                  <div className="col-span-2 flex items-center justify-end gap-2 mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#2A352F]">
                    {/* Botón Editar */}
                    <button
                      type="button"
                      onClick={() => setProductoEnEdicion({ ...prod })}
                      className="px-2.5 py-1.5 bg-[#25302A] hover:bg-[#2F3D35] text-stone-200 hover:text-white border border-[#2A352F] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Editar producto"
                    >
                      <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Editar</span>
                    </button>

                    {/* Botón Deshabilitar / Habilitar */}
                    {estaDeshabilitado ? (
                      <button
                        type="button"
                        onClick={() => toggleHabilitarProducto(prod.id)}
                        className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Habilitar este producto para que vuelva a estar disponible"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Habilitar</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleHabilitarProducto(prod.id)}
                        className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Deshabilitar este producto para pausarlo temporalmente"
                      >
                        <Ban className="w-3.5 h-3.5 text-rose-400" />
                        <span>Deshabilitar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: "Nuevo Producto" con las 2 secciones especificadas por el usuario */}
      {/* ========================================================================= */}
      {modalNuevoAbierto && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18201C] border border-[#2A352F] rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Cabecera del modal */}
            <div className="p-4 sm:p-5 bg-[#131A16] border-b border-[#2A352F] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base font-display">
                  Nuevo Producto
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoAbierto(false)}
                className="p-1 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas de selección de sección dentro del formulario */}
            <div className="flex border-b border-[#2A352F] bg-[#0F1512]">
              <button
                type="button"
                onClick={() => setSeccionModal('manual')}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  seccionModal === 'manual'
                    ? 'bg-[#18201C] text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-stone-400 hover:text-stone-200'
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
                    ? 'bg-[#18201C] text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-stone-400 hover:text-stone-200'
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
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Harina para pizza, Queso mozzarella, Pepperoni..."
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-[#0F1512] border border-[#2A352F] rounded-xl text-sm text-white focus:outline-emerald-500"
                    />
                  </div>

                  {/* Proveedor con ComboBox con búsqueda */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-stone-300">
                        Proveedor Asignado *
                      </label>
                      <button
                        type="button"
                        onClick={() => setMostrarCrearProv(!mostrarCrearProv)}
                        className="text-xs text-emerald-400 hover:underline cursor-pointer"
                      >
                        {mostrarCrearProv ? 'Cancelar nuevo proveedor' : '+ Crear nuevo proveedor'}
                      </button>
                    </div>

                    {mostrarCrearProv ? (
                      <div className="p-3 bg-[#1A2E24] border border-[#26533F] rounded-xl space-y-2 mb-2">
                        <p className="text-xs font-bold text-emerald-300">Crear Proveedor Rápido:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Nombre proveedor (ej: Colanta)"
                            value={nombreNuevoProv}
                            onChange={(e) => setNombreNuevoProv(e.target.value)}
                            className="px-2.5 py-1.5 bg-[#0F1512] border border-[#2A352F] rounded-lg text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Teléfono WhatsApp (opcional)"
                            value={telefonoNuevoProv}
                            onChange={(e) => setTelefonoNuevoProv(e.target.value)}
                            className="px-2.5 py-1.5 bg-[#0F1512] border border-[#2A352F] rounded-lg text-xs text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleCrearProveedorRapido}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Guardar Proveedor
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
                  </div>

                  {/* Unidad con ComboBox con búsqueda */}
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
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
                  </div>

                  {/* Stock actual y Stock mínimo: CAMPOS DE TEXTO SOLO NÚMEROS SIN FLECHAS */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1.5">
                        Stock Actual (Solo número)
                      </label>
                      <NumericInput
                        value={stockInicial}
                        onChange={setStockInicial}
                        placeholder="0"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1.5">
                        Stock Mínimo (Solo número)
                      </label>
                      <NumericInput
                        value={stockMinimo}
                        onChange={setStockMinimo}
                        placeholder="2"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Botón de envío */}
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setModalNuevoAbierto(false)}
                      className="px-4 py-2 bg-[#25302A] hover:bg-[#2F3D35] text-stone-300 font-semibold rounded-xl text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                    >
                      Guardar Producto
                    </button>
                  </div>
                </form>
              )}

              {/* SECCIÓN 2: IMPORTAR LISTA MASIVA (SOLO CON EL BOTÓN DE IMPORTAR PRODUCTOS) */}
              {seccionModal === 'importar' && (
                <div className="space-y-4">
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Pega las filas copiadas desde Excel o Google Sheets con las columnas en este orden:
                    <br />
                    <code className="inline-block mt-1 bg-[#0F1512] px-2 py-1 rounded text-emerald-300 font-mono border border-[#2A352F]">
                      Proveedor, Producto, Unidad, Stock Inicial
                    </code>
                  </p>

                  <textarea
                    rows={6}
                    placeholder="Distripapa	Papa pastusa	bulto	2&#10;Mercado	Tomate	kg	5&#10;Ara	Queso mozzarella	bloque	4&#10;Paula	Pepperoni	kg	3"
                    value={textoImportar}
                    onChange={(e) => setTextoImportar(e.target.value)}
                    className="w-full p-3 font-mono text-xs bg-[#0F1512] border border-[#2A352F] rounded-xl text-white placeholder-stone-600 focus:outline-emerald-500"
                  />

                  {mensajeImportacion && (
                    <p className="text-xs font-bold text-emerald-400 bg-emerald-950/70 p-2.5 rounded-lg border border-emerald-800/60">
                      {mensajeImportacion}
                    </p>
                  )}

                  {/* SOLO EL BOTÓN DE IMPORTAR PRODUCTOS */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleImportarExcel}
                      disabled={!textoImportar.trim()}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Importar Productos</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: EDICIÓN DE PRODUCTO EXISTENTE */}
      {/* ========================================================================= */}
      {productoEnEdicion && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18201C] border border-[#2A352F] rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#2A352F] pb-3">
              <h3 className="font-bold text-white text-base font-display flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-400" />
                <span>Editar Producto</span>
              </h3>
              <button
                type="button"
                onClick={() => setProductoEnEdicion(null)}
                className="p-1 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Nombre</label>
                <input
                  type="text"
                  value={productoEnEdicion.nombre}
                  onChange={(e) => setProductoEnEdicion({ ...productoEnEdicion, nombre: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#0F1512] border border-[#2A352F] rounded-xl text-sm text-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Proveedor</label>
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
                <label className="block text-xs font-bold text-stone-300 mb-1">Unidad</label>
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
                  <label className="block text-xs font-bold text-stone-300 mb-1">Stock Actual</label>
                  <NumericInput
                    value={productoEnEdicion.stock}
                    onChange={(val) => setProductoEnEdicion({ ...productoEnEdicion, stock: val })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Stock Mínimo</label>
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
                  className="px-4 py-2 bg-[#25302A] hover:bg-[#2F3D35] text-stone-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
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
