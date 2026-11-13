import React, { useState, useMemo, useRef } from 'react';
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
  Download,
  Search, 
  X, 
  Boxes, 
  Store,
  Trash2,
  Check,
  AlertCircle,
  FileText,
  Phone,
  MessageCircle,
  UserPlus,
  Loader2
} from 'lucide-react';

export default function GestionProductosView() {
  const { 
    productos = [], 
    proveedores = [], 
    agregarProducto, 
    eliminarProducto,
    toggleHabilitarProducto, 
    agregarProveedor,
    actualizarProveedor,
    eliminarProveedor,
    limpiarDatosDePrueba,
    solicitarConfirmacion,
    mostrarAlerta 
  } = useInventory();

  // Sub-pestaña activa: 'productos' (catálogo de insumos) o 'proveedores' (directorio de proveedores)
  const [pestanaActiva, setPestanaActiva] = useState('productos');

  // =========================================================================
  // ESTADOS PARA PRODUCTOS
  // =========================================================================
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [seccionModal, setSeccionModal] = useState('manual'); // 'manual' | 'importar'
  const [productoEnEdicion, setProductoEnEdicion] = useState(null);

  // Estados de carga (loading) para evitar clics dobles al guardar
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [guardandoProveedor, setGuardandoProveedor] = useState(false);
  const [guardandoProvRapido, setGuardandoProvRapido] = useState(false);

  // Filtros de la lista de productos
  const [busqueda, setBusqueda] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'activos' | 'deshabilitados'

  // Formulario registrar nuevo producto
  const [nombre, setNombre] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [unidad, setUnidad] = useState('KG');
  const [stockInicial, setStockInicial] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('2');

  // Formulario rápido crear proveedor dentro del modal de producto
  const [mostrarCrearProv, setMostrarCrearProv] = useState(false);
  const [nombreNuevoProv, setNombreNuevoProv] = useState('');
  const [telefonoNuevoProv, setTelefonoNuevoProv] = useState('');

  // Estados de la sección "Importar desde Excel"
  const [textoImportar, setTextoImportar] = useState('');
  const [importando, setImportando] = useState(false);
  const [mensajeImportacion, setMensajeImportacion] = useState(null);
  const fileInputRef = useRef(null);

  // =========================================================================
  // ESTADOS PARA PROVEEDORES
  // =========================================================================
  const [modalProveedorAbierto, setModalProveedorAbierto] = useState(false);
  const [proveedorEnEdicion, setProveedorEnEdicion] = useState(null);
  const [busquedaProveedores, setBusquedaProveedores] = useState('');

  // Formulario Proveedor (crear / editar)
  const [formProvNombre, setFormProvNombre] = useState('');
  const [formProvTelefono, setFormProvTelefono] = useState('');
  const [formProvNotas, setFormProvNotas] = useState('');

  // =========================================================================
  // FILTRADOS
  // =========================================================================
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
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
  }, [productos, busqueda, filtroProveedor, filtroEstado]);

  const proveedoresFiltrados = useMemo(() => {
    return proveedores.filter(p => {
      const q = busquedaProveedores.toLowerCase();
      return (p.nombre && p.nombre.toLowerCase().includes(q)) ||
             (p.telefono && p.telefono.toLowerCase().includes(q)) ||
             (p.notas && p.notas.toLowerCase().includes(q));
    });
  }, [proveedores, busquedaProveedores]);

  // =========================================================================
  // ACCIONES DE PRODUCTOS
  // =========================================================================
  const handleSubmitNuevoProducto = async (e) => {
    e.preventDefault();
    if (guardandoProducto) return;

    if (!nombre.trim() || !proveedorId) {
      if (mostrarAlerta) {
        mostrarAlerta('Ingresa el nombre del producto y selecciona un proveedor.', 'warning', 'Faltan datos');
      } else {
        alert('Ingresa el nombre del producto y selecciona un proveedor.');
      }
      return;
    }

    setGuardandoProducto(true);
    try {
      const prov = proveedores.find(p => p.id === proveedorId);

      await agregarProducto({
        nombre: nombre.trim().toUpperCase(),
        proveedorId: prov?.id || '',
        proveedorNombre: (prov?.nombre || 'PROVEEDOR').toUpperCase(),
        unidad: (unidad || 'KG').trim().toUpperCase(),
        stock: parseFloat(stockInicial) || 0,
        stockMinimo: parseFloat(stockMinimo) || 1,
        deshabilitado: false
      });

      setNombre('');
      setStockInicial('0');
      setStockMinimo('2');
      setModalNuevoAbierto(false);
    } catch (err) {
      console.error(err);
      if (mostrarAlerta) mostrarAlerta('Error guardando el producto.', 'danger');
    } finally {
      setGuardandoProducto(false);
    }
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (guardandoEdicion || !productoEnEdicion || !productoEnEdicion.nombre.trim()) return;

    setGuardandoEdicion(true);
    try {
      const prov = proveedores.find(p => p.id === productoEnEdicion.proveedorId);
      await agregarProducto({
        ...productoEnEdicion,
        nombre: productoEnEdicion.nombre.trim().toUpperCase(),
        proveedorNombre: (prov ? prov.nombre : productoEnEdicion.proveedorNombre || '').toUpperCase(),
        unidad: (productoEnEdicion.unidad || 'KG').trim().toUpperCase(),
        stock: parseFloat(productoEnEdicion.stock) || 0,
        stockMinimo: parseFloat(productoEnEdicion.stockMinimo) || 1
      });

      setProductoEnEdicion(null);
    } catch (err) {
      console.error(err);
      if (mostrarAlerta) mostrarAlerta('Error guardando el producto.', 'danger');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleCrearProveedorRapido = async (e) => {
    e.preventDefault();
    if (guardandoProvRapido || !nombreNuevoProv.trim()) return;

    setGuardandoProvRapido(true);
    try {
      const nuevo = await agregarProveedor({
        nombre: nombreNuevoProv.trim().toUpperCase(),
        telefono: telefonoNuevoProv.trim(),
        notas: ''
      });

      setProveedorId(nuevo.id);
      setNombreNuevoProv('');
      setTelefonoNuevoProv('');
      setMostrarCrearProv(false);
    } catch (err) {
      console.error(err);
      if (mostrarAlerta) mostrarAlerta('Error creando proveedor rápido.', 'danger');
    } finally {
      setGuardandoProvRapido(false);
    }
  };

  // =========================================================================
  // ACCIONES DE PROVEEDORES (CREAR, EDITAR, ELIMINAR)
  // =========================================================================
  const handleAbrirCrearProveedor = () => {
    setProveedorEnEdicion(null);
    setFormProvNombre('');
    setFormProvTelefono('');
    setFormProvNotas('');
    setModalProveedorAbierto(true);
  };

  const handleAbrirEditarProveedor = (prov) => {
    setProveedorEnEdicion(prov);
    setFormProvNombre(prov.nombre || '');
    setFormProvTelefono(prov.telefono || '');
    setFormProvNotas(prov.notas || '');
    setModalProveedorAbierto(true);
  };

  const handleSubmitProveedor = async (e) => {
    e.preventDefault();
    if (guardandoProveedor) return;

    if (!formProvNombre.trim()) {
      if (mostrarAlerta) mostrarAlerta('Ingresa el nombre del proveedor.', 'warning', 'Faltan datos');
      return;
    }

    setGuardandoProveedor(true);
    try {
      if (proveedorEnEdicion) {
        if (actualizarProveedor) {
          await actualizarProveedor(proveedorEnEdicion.id, {
            ...proveedorEnEdicion,
            nombre: formProvNombre.trim().toUpperCase(),
            telefono: formProvTelefono.trim(),
            notas: formProvNotas.trim().toUpperCase()
          });
        }
      } else {
        await agregarProveedor({
          nombre: formProvNombre.trim().toUpperCase(),
          telefono: formProvTelefono.trim(),
          notas: formProvNotas.trim().toUpperCase()
        });
      }

      setModalProveedorAbierto(false);
    } catch (err) {
      console.error(err);
      if (mostrarAlerta) mostrarAlerta('Error guardando el proveedor.', 'danger');
    } finally {
      setGuardandoProveedor(false);
    }
  };

  const handleEliminarProveedorClick = (prov) => {
    const productosVinculados = productos.filter(p => p.proveedorId === prov.id);
    const mensaje = productosVinculados.length > 0
      ? `Este proveedor tiene ${productosVinculados.length} producto(s) asignado(s). ¿Estás seguro de que deseas eliminar a "${prov.nombre}"?`
      : `¿Estás seguro de que deseas eliminar a "${prov.nombre}" del directorio de proveedores?`;

    solicitarConfirmacion({
      titulo: '¿Eliminar proveedor?',
      mensaje,
      textoConfirmar: 'Sí, eliminar',
      textoCancelar: 'Descartar',
      tipo: 'danger',
      onConfirmar: async () => {
        if (eliminarProveedor) {
          await eliminarProveedor(prov.id);
        }
      }
    });
  };

  const handleEliminarProductoClick = (prod) => {
    solicitarConfirmacion({
      titulo: '¿Eliminar producto?',
      mensaje: `¿Estás seguro de que deseas eliminar permanentemente "${prod.nombre}" del catálogo de insumos? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Sí, eliminar',
      textoCancelar: 'Descartar',
      tipo: 'danger',
      onConfirmar: async () => {
        if (eliminarProducto) {
          await eliminarProducto(prod.id);
        }
      }
    });
  };

  const handleLimpiarDatosPruebaClick = () => {
    solicitarConfirmacion({
      titulo: '¿Borrar datos de prueba?',
      mensaje: '¿Estás seguro de que deseas vaciar los datos de prueba? Tu catálogo quedará limpio para registrar insumos reales.',
      textoConfirmar: 'Sí, eliminar',
      textoCancelar: 'Descartar',
      tipo: 'danger',
      onConfirmar: async () => {
        if (limpiarDatosDePrueba) {
          await limpiarDatosDePrueba();
        }
      }
    });
  };

  // =========================================================================
  // IMPORTACIÓN DE EXCEL / CSV
  // =========================================================================
  const handleDescargarPlantillaExcel = () => {
    const encabezados = "Proveedor,Producto,Unidad,Stock_Actual,Stock_Minimo\r\n";
    const ejemplos = [
      "ARA,Queso mozzarella,bloque,10,4",
      "DISTRIPAPA,Papa criolla,kg,15,5",
      "MERCADO,Tomate chonto,kg,20,5",
      "D1,Servilletas,paquete,8,3",
      "PAULA,Pepperoni,kg,6,2",
      "SUB,Cajas de pizza 35cm,paquete,25,10"
    ].join("\r\n");

    const contenido = "\uFEFF" + encabezados + ejemplos;
    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "plantilla_productos_pizzeria.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parsearFilasImportacion = (texto) => {
    if (!texto || !texto.trim()) return [];
    const lineas = texto.trim().split(/\r?\n/);
    const resultados = [];

    for (let i = 0; i < lineas.length; i++) {
      const raw = lineas[i].trim();
      if (!raw) continue;

      let partes = [];
      if (raw.includes('\t')) {
        partes = raw.split('\t');
      } else if (raw.includes(';')) {
        partes = raw.split(';');
      } else if (raw.includes('|')) {
        partes = raw.split('|');
      } else {
        partes = raw.split(',');
      }

      partes = partes.map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (partes.length < 2) continue;

      const [col1, col2, col3, col4, col5] = partes;

      const c1 = (col1 || '').toLowerCase();
      const c2 = (col2 || '').toLowerCase();
      if (
        c1.includes('proveedor') || c1.includes('lugar') ||
        c2.includes('producto') || c2.includes('nombre') || c2.includes('insumo')
      ) {
        continue;
      }

      if (!col1 || !col2) continue;

      resultados.push({
        proveedor: col1,
        producto: col2,
        unidad: col3 || 'unidad',
        stock: parseFloat(col4) || 0,
        stockMinimo: parseFloat(col5) || 2
      });
    }

    return resultados;
  };

  const filasPrevisualizadas = useMemo(() => {
    return parsearFilasImportacion(textoImportar);
  }, [textoImportar]);

  const handleArchivoCargado = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = event.target?.result;
      if (typeof contenido === 'string') {
        setTextoImportar(contenido);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleEjecutarImportacion = async () => {
    if (filasPrevisualizadas.length === 0) return;
    setImportando(true);

    try {
      let agregados = 0;

      for (const fila of filasPrevisualizadas) {
        const provMayus = fila.proveedor.trim().toUpperCase();
        const prodMayus = fila.producto.trim().toUpperCase();
        const unidadMayus = (fila.unidad.trim() || 'UNIDAD').toUpperCase();

        let prov = proveedores.find(p => p.nombre.toUpperCase() === provMayus);
        if (!prov) {
          prov = await agregarProveedor({ 
            nombre: provMayus, 
            telefono: '', 
            notas: 'CREADO AUTOMÁTICAMENTE POR IMPORTACIÓN MASIVA' 
          }, { silencioso: true });
        }

        await agregarProducto({
          nombre: prodMayus,
          proveedorId: prov.id,
          proveedorNombre: prov.nombre,
          unidad: unidadMayus,
          stock: fila.stock,
          stockMinimo: fila.stockMinimo,
          deshabilitado: false
        }, { silencioso: true });

        agregados++;
      }

      setMensajeImportacion(`✅ ¡Éxito! Se importaron ${agregados} productos y sus proveedores al catálogo.`);
      setTextoImportar('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      setTimeout(() => {
        setModalNuevoAbierto(false);
        setMensajeImportacion(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error importando algunos productos. Por favor verifica los datos.');
    } finally {
      setImportando(false);
    }
  };

  const opcionesProveedores = useMemo(() => proveedores.map(p => ({
    value: p.id,
    label: p.nombre,
    subtext: p.telefono
  })), [proveedores]);

  const opcionesUnidades = useMemo(() => UNIDADES_DISPONIBLES.map(u => ({
    value: u,
    label: u
  })), []);

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Selector de Pestaña Principal: [Insumos & Productos] vs [Proveedores] */}
      <div className="bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPestanaActiva('productos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              pestanaActiva === 'productos'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Insumos & Productos ({productos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('proveedores')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              pestanaActiva === 'proveedores'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Proveedores ({proveedores.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VISTA A: GESTIÓN DE INSUMOS & PRODUCTOS
          ========================================================================= */}
      {pestanaActiva === 'productos' && (
        <div className="space-y-6">
          {/* Cabecera de Productos */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 font-display flex items-center gap-2">
                <Boxes className="w-5 h-5 text-black" />
                <span>Catálogo de Insumos ({productos.length})</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Administra tus insumos, asigna proveedores y controla el estado activo/deshabilitado.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {productos.length > 0 && (
                <button
                  type="button"
                  onClick={handleLimpiarDatosPruebaClick}
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

          {/* Filtros y Búsqueda de Productos */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-1 relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black uppercase"
                />
              </div>

              <div>
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

          {/* Tabla de Productos */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200 hidden sm:grid sm:grid-cols-12 text-xs font-bold uppercase tracking-wider text-zinc-500 gap-3 items-center">
              <div className="col-span-4">Producto</div>
              <div className="col-span-2">Proveedor</div>
              <div className="col-span-2">Unidad / Stock</div>
              <div className="col-span-4 text-right">Acciones</div>
            </div>

            {productosFiltrados.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 space-y-2">
                <Boxes className="w-12 h-12 mx-auto mb-2 text-zinc-300" />
                <p className="text-base font-bold text-zinc-800">No hay productos registrados</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Comienza a registrar los ingredientes de tu pizzería usando el botón "+ Nuevo Producto" o importa tu listado de Excel.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setSeccionModal('manual'); setModalNuevoAbierto(true); }}
                    className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl shadow-sm hover:bg-zinc-800 cursor-pointer"
                  >
                    + Registrar Producto
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSeccionModal('importar'); setModalNuevoAbierto(true); }}
                    className="px-4 py-2 bg-zinc-100 text-zinc-800 text-xs font-bold rounded-xl hover:bg-zinc-200 cursor-pointer"
                  >
                    Importar Excel
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {productosFiltrados.map((prod) => {
                  const estaDeshabilitado = Boolean(prod.deshabilitado);

                  return (
                    <div
                      key={prod.id}
                      className={`p-3.5 sm:px-4 sm:py-3 transition-colors ${
                        estaDeshabilitado ? 'bg-zinc-50/50 opacity-65' : 'hover:bg-zinc-50/70'
                      }`}
                    >
                      {/* VISTA ESCRITORIO (sm:grid) - DISTRIBUCIÓN AMPLIA SIN AMONTONAR */}
                      <div className="hidden sm:grid sm:grid-cols-12 sm:items-center gap-3">
                        {/* PRODUCTO (col-span-4) */}
                        <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${estaDeshabilitado ? 'bg-zinc-400' : 'bg-emerald-500'}`} />
                          <div className="min-w-0">
                            <p className={`font-bold text-sm truncate uppercase tracking-wide ${estaDeshabilitado ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                              {prod.nombre}
                            </p>
                            {estaDeshabilitado && (
                              <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-500 border border-zinc-200 uppercase">
                                Deshabilitado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* PROVEEDOR (col-span-2) */}
                        <div className="col-span-2 text-xs text-zinc-600 flex items-center gap-1.5 min-w-0">
                          <Store className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate uppercase font-medium">{prod.proveedorNombre || 'SIN PROVEEDOR'}</span>
                        </div>

                        {/* UNIDAD / STOCK (col-span-2) */}
                        <div className="col-span-2 text-xs flex flex-col justify-center gap-0.5">
                          <span className="font-bold text-zinc-900 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 uppercase text-[11px] w-fit">
                            {prod.unidad}
                          </span>
                          <span className="text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                            Stock: <strong className="text-zinc-900 font-bold">{prod.stock ?? 0}</strong>
                          </span>
                        </div>

                        {/* ACCIONES (col-span-4) - ESPACIO AMPLIO PARA BOTONES */}
                        <div className="col-span-4 flex items-center justify-end gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setProductoEnEdicion({ ...prod })}
                            className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                            title="Editar producto"
                          >
                            <Pencil className="w-3.5 h-3.5 text-zinc-600" />
                            <span>Editar</span>
                          </button>

                          {estaDeshabilitado ? (
                            <button
                              type="button"
                              onClick={() => toggleHabilitarProducto(prod.id)}
                              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                              title="Habilitar este producto"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-black" />
                              <span>Habilitar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleHabilitarProducto(prod.id)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                              title="Deshabilitar este producto"
                            >
                              <Ban className="w-3.5 h-3.5 text-rose-500" />
                              <span>Deshabilitar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleEliminarProductoClick(prod)}
                            className="p-1.5 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Eliminar producto permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* VISTA MÓVIL (< sm) - TARJETA BIEN DISTRIBUIDA */}
                      <div className="sm:hidden flex flex-col gap-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${estaDeshabilitado ? 'bg-zinc-400' : 'bg-emerald-500'}`} />
                            <p className={`font-bold text-sm truncate uppercase ${estaDeshabilitado ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                              {prod.nombre}
                            </p>
                          </div>
                          {estaDeshabilitado && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200 uppercase shrink-0">
                              Deshabilitado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-600 gap-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <Store className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="truncate uppercase font-medium">{prod.proveedorNombre || 'SIN PROVEEDOR'}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-zinc-900 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 uppercase text-[11px]">
                              {prod.unidad}
                            </span>
                            <span className="text-zinc-500 font-mono text-xs">
                              Stock: <strong className="text-zinc-900 font-bold">{prod.stock ?? 0}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-100">
                          <button
                            type="button"
                            onClick={() => setProductoEnEdicion({ ...prod })}
                            className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Pencil className="w-3.5 h-3.5 text-zinc-600" />
                            <span>Editar</span>
                          </button>

                          {estaDeshabilitado ? (
                            <button
                              type="button"
                              onClick={() => toggleHabilitarProducto(prod.id)}
                              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-black" />
                              <span>Habilitar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleHabilitarProducto(prod.id)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5 text-rose-500" />
                              <span>Deshabilitar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleEliminarProductoClick(prod)}
                            className="p-1.5 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VISTA B: GESTIÓN DE PROVEEDORES (NUEVA SECCIÓN REQUERIDA)
          ========================================================================= */}
      {pestanaActiva === 'proveedores' && (
        <div className="space-y-6">
          {/* Cabecera de Proveedores */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 font-display flex items-center gap-2">
                <Store className="w-5 h-5 text-black" />
                <span>Directorio de Proveedores ({proveedores.length})</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Edita nombres, teléfonos de contacto para WhatsApp y notas de entrega de cada proveedor.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAbrirCrearProveedor}
              className="px-4 py-2 bg-black hover:bg-zinc-800 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Proveedor</span>
            </button>
          </div>

          {/* Búsqueda de Proveedores */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="BUSCAR PROVEEDOR POR NOMBRE, TELÉFONO O NOTAS..."
                value={busquedaProveedores}
                onChange={(e) => setBusquedaProveedores(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black font-medium uppercase"
              />
            </div>
          </div>

          {/* Listado de Proveedores en Tarjetas Claras */}
          {proveedoresFiltrados.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 bg-white rounded-2xl border border-zinc-200 shadow-sm space-y-2">
              <Store className="w-12 h-12 mx-auto mb-2 text-zinc-300" />
              <p className="text-base font-bold text-zinc-800">No hay proveedores registrados</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Crea tu primer proveedor para asociarlo a tus ingredientes y pedidos.
              </p>
              <button
                type="button"
                onClick={handleAbrirCrearProveedor}
                className="mt-2 px-4 py-2 bg-black text-white text-xs font-bold rounded-xl shadow-sm hover:bg-zinc-800 cursor-pointer"
              >
                + Registrar Proveedor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {proveedoresFiltrados.map((prov) => {
                const totalInsumos = productos.filter(p => p.proveedorId === prov.id).length;
                const tieneTelefono = Boolean(prov.telefono && prov.telefono.trim());

                return (
                  <div 
                    key={prov.id}
                    className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-black text-white rounded-xl">
                            <Store className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-zinc-900 font-display">
                              {prov.nombre}
                            </h3>
                            <span className="text-[11px] font-semibold text-zinc-500">
                              {totalInsumos} {totalInsumos === 1 ? 'producto vinculado' : 'productos vinculados'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAbrirEditarProveedor(prov)}
                            className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                            title="Editar proveedor"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarProveedorClick(prov)}
                            className="p-1.5 bg-zinc-100 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded-lg text-xs font-semibold cursor-pointer"
                            title="Eliminar proveedor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3.5 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-zinc-700">
                          <Phone className="w-3.5 h-3.5 text-zinc-400" />
                          {tieneTelefono ? (
                            <span className="font-mono font-semibold">{prov.telefono}</span>
                          ) : (
                            <span className="text-zinc-400 italic">Sin teléfono registrado</span>
                          )}
                        </div>

                        {prov.notas && (
                          <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-zinc-600 text-[11px]">
                            {prov.notas}
                          </div>
                        )}
                      </div>
                    </div>

                    {tieneTelefono && (
                      <div className="pt-2 border-t border-zinc-100">
                        <a
                          href={`https://wa.me/${prov.telefono.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Enviar WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: "Nuevo Producto" & "Importar Lista Masiva" (TOTALMENTE LIMPIO)      */}
      {/* ========================================================================= */}
      {modalNuevoAbierto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scale-up">
            {/* Cabecera del modal */}
            <div className="p-4 sm:p-5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-black" />
                <h3 className="font-bold text-zinc-900 text-base font-display">
                  Agregar Insumos al Inventario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoAbierto(false)}
                className="p-1 text-zinc-400 hover:text-black cursor-pointer rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas de selección: Manual vs Importar Masivo */}
            <div className="flex border-b border-zinc-200 bg-zinc-100/60 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => setSeccionModal('manual')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  seccionModal === 'manual'
                    ? 'bg-white text-black shadow-xs font-bold'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Formulario Individual</span>
              </button>

              <button
                type="button"
                onClick={() => setSeccionModal('importar')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  seccionModal === 'importar'
                    ? 'bg-white text-black shadow-xs font-bold'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Importar Lista Excel / CSV</span>
              </button>
            </div>

            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
              {/* SECCIÓN 1: FORMULARIO INDIVIDUAL (LIMPIO DE ICONOS ERRÓNEOS) */}
              {seccionModal === 'manual' && (
                <form onSubmit={handleSubmitNuevoProducto} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      placeholder="EJ. HARINA PARA PIZZA, QUESO MOZZARELLA, PEPPERONI..."
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value.toUpperCase())}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black font-medium uppercase"
                    />
                  </div>

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
                    </div>

                    {mostrarCrearProv ? (
                      <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 mb-2">
                        <p className="text-xs font-bold text-zinc-900">Crear Proveedor Rápido:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="NOMBRE PROVEEDOR (EJ. ARA, DISTRIPAPA)"
                            value={nombreNuevoProv}
                            onChange={(e) => setNombreNuevoProv(e.target.value.toUpperCase())}
                            className="px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 uppercase"
                          />
                          <input
                            type="text"
                            inputMode="tel"
                            placeholder="Teléfono WhatsApp (solo números)"
                            value={telefonoNuevoProv}
                            onChange={(e) => setTelefonoNuevoProv(e.target.value.replace(/[^0-9+]/g, ''))}
                            className="px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleCrearProveedorRapido}
                          disabled={guardandoProvRapido}
                          className="px-3 py-1.5 bg-black hover:bg-zinc-800 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
                        >
                          {guardandoProvRapido ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              <span>Guardando...</span>
                            </>
                          ) : (
                            <span>Guardar Proveedor</span>
                          )}
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                        Stock Actual Disponible
                      </label>
                      <NumericInput
                        value={stockInicial}
                        onChange={setStockInicial}
                        placeholder="0"
                        className="w-full font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                        Stock Mínimo (Alerta)
                      </label>
                      <NumericInput
                        value={stockMinimo}
                        onChange={setStockMinimo}
                        placeholder="2"
                        className="w-full font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end gap-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setModalNuevoAbierto(false)}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={guardandoProducto}
                      className="px-5 py-2.5 bg-black hover:bg-zinc-800 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer flex items-center gap-2"
                    >
                      {guardandoProducto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Guardando producto...</span>
                        </>
                      ) : (
                        <span>Guardar Producto</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* SECCIÓN 2: IMPORTAR LISTA MASIVA DE EXCEL CON PLANTILLA DESCARGABLE */}
              {seccionModal === 'importar' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                          <span>Plantilla Oficial de Excel / Sheets</span>
                        </h4>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          Descarga la plantilla con los títulos de columnas listos para llenarla en Excel y cargarla en 1 clic:
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleDescargarPlantillaExcel}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar Plantilla (.csv)</span>
                      </button>
                    </div>

                    <div className="bg-white rounded-xl border border-emerald-200/80 overflow-x-auto text-[11px]">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-emerald-100/60 text-emerald-950 font-bold border-b border-emerald-200/80">
                            <th className="p-2">Columna 1: Proveedor</th>
                            <th className="p-2">Columna 2: Producto</th>
                            <th className="p-2">Columna 3: Unidad</th>
                            <th className="p-2">Columna 4: Stock_Actual</th>
                            <th className="p-2">Columna 5: Stock_Minimo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100 text-zinc-700 font-mono">
                          <tr>
                            <td className="p-2 font-semibold text-emerald-900">ARA</td>
                            <td className="p-2">Queso mozzarella</td>
                            <td className="p-2">bloque</td>
                            <td className="p-2">10</td>
                            <td className="p-2">4</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-emerald-900">DISTRIPAPA</td>
                            <td className="p-2">Papa criolla</td>
                            <td className="p-2">kg</td>
                            <td className="p-2">15</td>
                            <td className="p-2">5</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-zinc-700">
                        Pega los datos de Excel o carga tu archivo CSV:
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-black font-semibold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Cargar archivo desde mi PC</span>
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleArchivoCargado}
                      accept=".csv, .txt, .tsv"
                      className="hidden"
                    />

                    <textarea
                      rows={5}
                      placeholder="ARA	Queso mozzarella	bloque	10	4&#10;DISTRIPAPA	Papa criolla	kg	15	5&#10;MERCADO	Tomate chonto	kg	20	5"
                      value={textoImportar}
                      onChange={(e) => setTextoImportar(e.target.value)}
                      className="w-full p-3 font-mono text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black"
                    />
                  </div>

                  {filasPrevisualizadas.length > 0 && (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-800">
                        <span className="flex items-center gap-1.5 text-emerald-800">
                          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                          {filasPrevisualizadas.length} productos detectados listos para importar:
                        </span>
                        <button
                          type="button"
                          onClick={() => setTextoImportar('')}
                          className="text-zinc-400 hover:text-rose-600 text-[11px] underline cursor-pointer"
                        >
                          Limpiar
                        </button>
                      </div>

                      <div className="max-h-36 overflow-y-auto divide-y divide-zinc-200 text-xs bg-white rounded-xl border border-zinc-200">
                        {filasPrevisualizadas.slice(0, 10).map((f, idx) => (
                          <div key={idx} className="p-2 flex items-center justify-between gap-2 font-mono text-[11px]">
                            <span className="font-bold text-zinc-900">{f.producto}</span>
                            <span className="text-zinc-500 font-sans">({f.proveedor})</span>
                            <span className="text-zinc-700 font-semibold">{f.stock} {f.unidad}</span>
                          </div>
                        ))}
                        {filasPrevisualizadas.length > 10 && (
                          <p className="p-2 text-center text-zinc-400 text-[11px] italic">
                            ... y {filasPrevisualizadas.length - 10} productos más
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {mensajeImportacion && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{mensajeImportacion}</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setModalNuevoAbierto(false)}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl text-xs cursor-pointer"
                    >
                      Cerrar
                    </button>

                    <button
                      type="button"
                      onClick={handleEjecutarImportacion}
                      disabled={filasPrevisualizadas.length === 0 || importando}
                      className="px-5 py-2.5 bg-black hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {importando 
                          ? 'Importando a la base de datos...' 
                          : `Importar ${filasPrevisualizadas.length} Productos`}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: "Nuevo / Editar Proveedor" (SECCIÓN PROVEEDORES)                    */}
      {/* ========================================================================= */}
      {modalProveedorAbierto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-5 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-zinc-900 text-base font-display flex items-center gap-2">
                <Store className="w-4 h-4 text-black" />
                <span>{proveedorEnEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalProveedorAbierto(false)}
                className="p-1 text-zinc-400 hover:text-black cursor-pointer rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProveedor} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Nombre del Proveedor *
                </label>
                <input
                  type="text"
                  placeholder="EJ. ARA, DISTRIPAPA, D1, COLANTA..."
                  value={formProvNombre}
                  onChange={(e) => setFormProvNombre(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-black font-medium uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Teléfono / WhatsApp (Solo números)
                </label>
                <input
                  type="text"
                  inputMode="tel"
                  placeholder="Ej. +573001234567"
                  value={formProvTelefono}
                  onChange={(e) => setFormProvTelefono(e.target.value.replace(/[^0-9+]/g, ''))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-black font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Notas / Días de Entrega (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="EJ. PEDIDOS ANTES DE LAS 2 PM, ENTREGAN MARTES Y VIERNES..."
                  value={formProvNotas}
                  onChange={(e) => setFormProvNotas(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black uppercase"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setModalProveedorAbierto(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoProveedor}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {guardandoProveedor ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>{proveedorEnEdicion ? 'Guardando...' : 'Creando...'}</span>
                    </>
                  ) : (
                    <span>{proveedorEnEdicion ? 'Guardar Cambios' : 'Crear Proveedor'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDICIÓN DE PRODUCTO EXISTENTE                                      */}
      {/* ========================================================================= */}
      {productoEnEdicion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-5 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-zinc-900 text-base font-display flex items-center gap-2">
                <Pencil className="w-4 h-4 text-black" />
                <span>Editar Producto</span>
              </h3>
              <button
                type="button"
                onClick={() => setProductoEnEdicion(null)}
                className="p-1 text-zinc-400 hover:text-black cursor-pointer rounded-lg"
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
                  onChange={(e) => setProductoEnEdicion({ ...productoEnEdicion, nombre: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-black font-medium uppercase"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Stock Actual</label>
                  <NumericInput
                    value={productoEnEdicion.stock}
                    onChange={(val) => setProductoEnEdicion({ ...productoEnEdicion, stock: val })}
                    className="w-full font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Stock Mínimo</label>
                  <NumericInput
                    value={productoEnEdicion.stockMinimo}
                    onChange={(val) => setProductoEnEdicion({ ...productoEnEdicion, stockMinimo: val })}
                    className="w-full font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setProductoEnEdicion(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {guardandoEdicion ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
