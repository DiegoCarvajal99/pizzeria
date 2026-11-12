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
  X,
  Truck,
  Clock,
  CheckCheck,
  Calendar,
  XCircle,
  Copy,
  Share2,
  MessageCircle,
  RotateCcw
} from 'lucide-react';

export default function PedidosView() {
  const { 
    productos, 
    proveedores, 
    pedidos, 
    crearPedido, 
    confirmarRecepcionItems, 
    confirmarItemIndividual, 
    cancelarPedido, 
    mostrarAlerta 
  } = useInventory();

  // Estados de navegación y filtros de la vista principal
  const [filtroEstado, setFiltroEstado] = useState('pendientes'); // 'pendientes' | 'completados' | 'todos'
  const [cantidadesRecibidas, setCantidadesRecibidas] = useState({});
  const [busquedaPedidoId, setBusquedaPedidoId] = useState(''); // Barra de búsqueda por ID de pedido

  // ==========================================
  // ESTADOS DEL POPUP / MODAL "NUEVO PEDIDO"
  // ==========================================
  const [modalNuevoPedidoAbierto, setModalNuevoPedidoAbierto] = useState(false);
  const [pedidoDraft, setPedidoDraft] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('todos');
  const [observacionGeneral, setObservacionGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Sub-modal para especificar cantidad y nota de un insumo
  const [productoModal, setProductoModal] = useState(null);
  const [cantidadModal, setCantidadModal] = useState('');
  const [notaModal, setNotaModal] = useState('');

  // Filtrar pedidos existentes para la vista de recepción por estado y por ID
  const pedidosFiltrados = pedidos.filter(p => {
    const coincideEstado = 
      filtroEstado === 'pendientes' ? (p.estado === 'pendiente' || p.estado === 'parcial') :
      filtroEstado === 'completados' ? (p.estado === 'completado') :
      true;

    const query = busquedaPedidoId.trim().toLowerCase().replace('#', '');
    const coincideId = !query || 
      String(p.numero || '').toLowerCase().includes(query) || 
      String(p.id || '').toLowerCase().includes(query);

    return coincideEstado && coincideId;
  });

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return '';
    const d = new Date(fechaIso);
    return d.toLocaleDateString('es-CO', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  /**
   * Construye el texto formateado estructurado para WhatsApp INCLUYENDO EL ID DEL PEDIDO
   */
  const construirMensajePedido = (pedido) => {
    const d = pedido.fechaCreacion ? new Date(pedido.fechaCreacion) : new Date();
    const fechaStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const idPedidoStr = pedido.numero ? `#${pedido.numero}` : `${pedido.id}`;

    let bloques = [];
    bloques.push(`*PEDIDO SEMANAL (${idPedidoStr})* 🍕\n🆔 *Pedido:* ${idPedidoStr}\n📅 *Fecha:* ${fechaStr}`);

    pedido.grupos.forEach(grupo => {
      let lineasProveedor = [];
      lineasProveedor.push(`*${grupo.proveedorNombre.toUpperCase()}*`);
      grupo.items.forEach(item => {
        const obsTexto = item.obs ? ` _(${item.obs})_` : "";
        const unidadTexto = item.unidad ? ` ${item.unidad}` : "";
        lineasProveedor.push(`• ${item.productoNombre}: *${item.cantidadPedida}${unidadTexto}*${obsTexto}`);
      });
      bloques.push(lineasProveedor.join("\n"));
    });

    return bloques.join("\n\n");
  };

  const construirMensajeUnProveedor = (grupo, fechaIso, numeroPedido) => {
    const d = fechaIso ? new Date(fechaIso) : new Date();
    const fechaStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const idStr = numeroPedido ? ` #${numeroPedido}` : "";

    let lineas = [];
    lineas.push(`*PEDIDO${idStr} - ${grupo.proveedorNombre.toUpperCase()}* 🍕`);
    if (numeroPedido) {
      lineas.push(`🆔 *Pedido:* #${numeroPedido}`);
    }
    lineas.push(`📅 *Fecha:* ${fechaStr}\n`);
    grupo.items.forEach(item => {
      const obsTexto = item.obs ? ` _(${item.obs})_` : "";
      const unidadTexto = item.unidad ? ` ${item.unidad}` : "";
      lineas.push(`• ${item.productoNombre}: *${item.cantidadPedida}${unidadTexto}*${obsTexto}`);
    });

    return lineas.join("\n");
  };

  const handleCopiarMensaje = (pedido) => {
    const texto = construirMensajePedido(pedido);
    navigator.clipboard.writeText(texto);
    const idStr = pedido.numero ? ` #${pedido.numero}` : '';
    if (mostrarAlerta) {
      mostrarAlerta(`📋 Pedido${idStr} copiado al portapapeles con su ID`, "success");
    } else {
      alert(`📋 Pedido${idStr} copiado al portapapeles.`);
    }
  };

  const handleCompartirWhatsApp = (pedido) => {
    const texto = construirMensajePedido(pedido);
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCompartirWhatsAppProveedor = (grupo, fechaIso, numeroPedido) => {
    const texto = construirMensajeUnProveedor(grupo, fechaIso, numeroPedido);
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ==========================================
  // FUNCIÓN SOLICITADA: REPETIR EL MISMO PEDIDO
  // ==========================================
  const handleRepetirPedido = (pedidoOriginal) => {
    const draftRepetido = {};
    pedidoOriginal.grupos.forEach(grupo => {
      grupo.items.forEach(item => {
        draftRepetido[item.productoId] = {
          cantidad: item.cantidadPedida,
          obs: item.obs || ''
        };
      });
    });

    setPedidoDraft(draftRepetido);
    setObservacionGeneral(pedidoOriginal.observaciones || '');
    setModalNuevoPedidoAbierto(true);

    if (mostrarAlerta) {
      mostrarAlerta(`Se cargaron los productos del Pedido #${pedidoOriginal.numero} para reordenar`, 'info');
    }
  };

  // ==========================================
  // OPERACIONES DEL DRAFT / MODAL NUEVO PEDIDO
  // ==========================================
  const productosFiltrados = productos
    .filter(p => !p.deshabilitado)
    .filter(p => {
      const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                            (p.proveedorNombre && p.proveedorNombre.toLowerCase().includes(busqueda.toLowerCase()));
      const coincideProveedor = filtroProveedor === 'todos' || p.proveedorId === filtroProveedor || p.proveedorNombre === filtroProveedor;
      return coincideTexto && coincideProveedor;
    });

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

  const handleEliminarDelDraft = (prodId) => {
    setPedidoDraft(prev => {
      const copia = { ...prev };
      delete copia[prodId];
      return copia;
    });
  };

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

  const itemsAgrupadosPorProveedor = itemsEnPedido.reduce((acc, item) => {
    const prov = item.proveedorNombre || 'Varios';
    if (!acc[prov]) acc[prov] = [];
    acc[prov].push(item);
    return acc;
  }, {});

  const handleFinalizarPedido = async () => {
    if (itemsEnPedido.length === 0) return;
    setEnviando(true);
    try {
      const pedidoCreado = await crearPedido(itemsEnPedido, observacionGeneral);
      if (pedidoCreado) {
        setPedidoDraft({});
        setObservacionGeneral('');
        setModalNuevoPedidoAbierto(false);
        setFiltroEstado('pendientes');
        if (mostrarAlerta) {
          mostrarAlerta(`✅ Pedido #${pedidoCreado.numero} generado con éxito`, 'success');
        }
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Cabecera Unificada con Botón "Nuevo Pedido" */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 font-display flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-black" />
            <span>Gestión de Pedidos & Recepción</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Crea pedidos a proveedores, comparte por WhatsApp y confirma la llegada sumando directo al stock.
          </p>
        </div>

        {/* BOTÓN REQUERIDO: "Nuevo Pedido" (Abre el popup modal) */}
        <button
          type="button"
          onClick={() => {
            setModalNuevoPedidoAbierto(true);
          }}
          className="px-4 py-2.5 bg-black hover:bg-zinc-800 active:scale-95 text-white font-bold rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      {/* 2. Filtros de Estado y Barra de Búsqueda por ID */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        {/* Pestañas de estado */}
        <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-semibold border border-zinc-200 shrink-0">
          <button
            type="button"
            onClick={() => setFiltroEstado('pendientes')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filtroEstado === 'pendientes'
                ? 'bg-black text-white shadow-xs font-bold'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Pendientes por recibir
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('completados')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filtroEstado === 'completados'
                ? 'bg-black text-white shadow-xs font-bold'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Historial recibidos
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filtroEstado === 'todos'
                ? 'bg-black text-white shadow-xs font-bold'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Todos
          </button>
        </div>

        {/* Barra de búsqueda para buscar pedidos por su # ID */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-xs justify-end">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar pedido por ID..."
              value={busquedaPedidoId}
              onChange={(e) => setBusquedaPedidoId(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors"
            />
            {busquedaPedidoId && (
              <button
                type="button"
                onClick={() => setBusquedaPedidoId('')}
                className="absolute right-2 top-2 text-zinc-400 hover:text-black text-xs"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs font-medium text-zinc-500 whitespace-nowrap shrink-0">
            {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>
      </div>

      {/* 3. Lista de Pedidos (Lógica de Recepción Migrada) */}
      {pedidosFiltrados.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-zinc-200 shadow-sm">
          <Truck className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800 font-display">
            {busquedaPedidoId.trim()
              ? `No se encontró ningún pedido con el ID "${busquedaPedidoId}"`
              : filtroEstado === 'pendientes' 
              ? 'No hay pedidos pendientes por recibir' 
              : filtroEstado === 'completados'
              ? 'No hay pedidos en el historial de recibidos'
              : 'No hay pedidos en este filtro'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {busquedaPedidoId.trim() ? (
              <button
                type="button"
                onClick={() => setBusquedaPedidoId('')}
                className="text-black font-bold underline hover:opacity-80 cursor-pointer"
              >
                Limpiar búsqueda por ID
              </button>
            ) : (
              'Haz clic en "+ Nuevo Pedido" para crear una orden a tus proveedores.'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pedidosFiltrados.map((pedido) => {
            const estaCompletado = pedido.estado === 'completado';
            const estaCancelado = pedido.estado === 'cancelado';
            const esParcial = pedido.estado === 'parcial';

            const totalItems = pedido.grupos.reduce((acc, g) => acc + g.items.length, 0);
            const itemsRecibidos = pedido.grupos.reduce(
              (acc, g) => acc + g.items.filter(i => i.recibido).length,
              0
            );

            return (
              <div 
                key={pedido.id} 
                className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden"
              >
                {/* Cabecera del pedido */}
                <div className="p-4 sm:p-5 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                      estaCompletado
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : esParcial
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-zinc-200 text-zinc-900 border border-zinc-300'
                    }`}>
                      #{pedido.numero}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-zinc-900 text-base font-display">
                          Pedido #{pedido.numero}
                        </h2>
                        {estaCompletado ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completado en Stock
                          </span>
                        ) : esParcial ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                            <Clock className="w-3 h-3 text-blue-600" /> Recepción parcial ({itemsRecibidos}/{totalItems})
                          </span>
                        ) : estaCancelado ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" /> Esperando llegada
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Generado: {formatearFecha(pedido.fechaCreacion)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Acciones de la orden */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* BOTÓN SOLICITADO: REPETIR EL MISMO PEDIDO */}
                    <button
                      type="button"
                      onClick={() => handleRepetirPedido(pedido)}
                      className="px-3 py-2 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Abrir este mismo pedido para repetirlo nuevamente"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-black" />
                      <span>Repetir Pedido</span>
                    </button>

                    {/* BOTÓN: COPIAR AL PORTAPAPELES */}
                    <button
                      type="button"
                      onClick={() => handleCopiarMensaje(pedido)}
                      className="px-3 py-2 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copiar texto del pedido al portapapeles"
                    >
                      <Copy className="w-3.5 h-3.5 text-black" />
                      <span>Copiar</span>
                    </button>

                    {/* BOTÓN: COMPARTIR POR WHATSAPP */}
                    <button
                      type="button"
                      onClick={() => handleCompartirWhatsApp(pedido)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Abrir WhatsApp para enviar este pedido estructurado"
                    >
                      <Share2 className="w-3.5 h-3.5 text-white" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Confirmar todo de una vez si está pendiente */}
                    {!estaCompletado && !estaCancelado && (
                      <button
                        type="button"
                        onClick={() => confirmarRecepcionItems(pedido.id)}
                        className="px-3.5 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Recibir todos los productos y sumarlos al stock"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>Confirmar Todo</span>
                      </button>
                    )}

                    {!estaCompletado && !estaCancelado && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('¿Deseas cancelar este pedido?')) {
                            cancelarPedido(pedido.id);
                          }
                        }}
                        className="p-2 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Cancelar pedido"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Observaciones generales si las tiene */}
                {pedido.observaciones && (
                  <div className="px-5 py-2 bg-zinc-50/70 border-b border-zinc-200 text-xs text-zinc-600 italic">
                    Nota: "{pedido.observaciones}"
                  </div>
                )}

                {/* CUERPO DEL PEDIDO: SEPARADO POR PROVEEDOR */}
                <div className="p-4 sm:p-5 space-y-6">
                  {pedido.grupos.map((grupo, gIndex) => {
                    const todosRecibidosEnGrupo = grupo.items.every(i => i.recibido);

                    return (
                      <div 
                        key={grupo.proveedorId || gIndex}
                        className="border border-zinc-200 rounded-xl overflow-hidden shadow-xs bg-white"
                      >
                        {/* 1. SEPARADOR DEL PROVEEDOR */}
                        <div className="bg-black text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-zinc-300" />
                            <div>
                              <span className="font-bold text-sm tracking-wide font-display text-white">
                                PROVEEDOR: {grupo.proveedorNombre.toUpperCase()}
                              </span>
                              <span className="ml-2 text-xs font-normal text-zinc-400">
                                ({grupo.items.length} {grupo.items.length === 1 ? 'producto' : 'productos'})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Compartir proveedor por WhatsApp con ID */}
                            <button
                              type="button"
                              onClick={() => handleCompartirWhatsAppProveedor(grupo, pedido.fechaCreacion, pedido.numero)}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-semibold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Enviar por WhatsApp solo los productos de este proveedor con el ID del pedido"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>

                            {/* Botón para confirmar solo este proveedor */}
                            {!todosRecibidosEnGrupo && !estaCancelado && (
                              <button
                                type="button"
                                onClick={() => confirmarRecepcionItems(pedido.id, grupo.proveedorId)}
                                className="px-3 py-1 bg-white hover:bg-zinc-100 text-black font-bold rounded-lg text-xs shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                                <span>Confirmar {grupo.proveedorNombre}</span>
                              </button>
                            )}

                            {todosRecibidosEnGrupo && (
                              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Proveedor entregado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 2. PRODUCTOS QUE PERTENECEN A ESTE PROVEEDOR */}
                        <div className="divide-y divide-zinc-100 bg-white">
                          {grupo.items.map((item) => (
                            <div 
                              key={item.id}
                              className={`p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
                                item.recibido ? 'bg-zinc-50/70' : 'hover:bg-zinc-50/50'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <Package className={`w-4 h-4 ${item.recibido ? 'text-black' : 'text-zinc-400'}`} />
                                  <h4 className="font-bold text-zinc-900 text-sm truncate">
                                    {item.productoNombre}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs">
                                  <span className="text-zinc-500 font-medium">
                                    Cantidad solicitada:
                                  </span>
                                  <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                                    {item.cantidadPedida} {item.unidad}
                                  </span>
                                  {item.obs && (
                                    <span className="text-amber-800 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      Nota: {item.obs}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Estado y Botón de confirmación con campo numérico sin flechas */}
                              <div className="flex items-center gap-2">
                                {item.recibido ? (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>+{item.cantidadRecibida || item.cantidadPedida} {item.unidad} en stock</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[11px] text-zinc-500">Llegó:</span>
                                      <NumericInput
                                        value={cantidadesRecibidas[item.id] !== undefined ? cantidadesRecibidas[item.id] : item.cantidadPedida}
                                        onChange={(val) => setCantidadesRecibidas(prev => ({ ...prev, [item.id]: val }))}
                                        className="w-16 py-1 px-2 text-center text-xs font-mono font-bold text-zinc-900"
                                      />
                                      <span className="text-xs text-zinc-500">{item.unidad}</span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cant = cantidadesRecibidas[item.id] !== undefined 
                                          ? parseFloat(cantidadesRecibidas[item.id]) || item.cantidadPedida 
                                          : item.cantidadPedida;
                                        confirmarItemIndividual(pedido.id, item.productoId, cant);
                                      }}
                                      className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Confirmar</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL POPUP: FORMULARIO "NUEVO PEDIDO" (HACER PEDIDO EN POPUP)        */}
      {/* ========================================================================= */}
      {modalNuevoPedidoAbierto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            
            {/* Cabecera del popup */}
            <div className="p-4 sm:p-5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-base font-display">
                    Crear Nuevo Pedido
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Selecciona productos, ajusta cantidades y confirma tu orden.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoPedidoAbierto(false)}
                className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-200 rounded-xl cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable del popup */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              
              {/* Selector y buscador de insumos */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2 font-display">
                    <Package className="w-4 h-4 text-black" />
                    <span>Seleccionar Insumos</span>
                  </h4>

                  <button
                    type="button"
                    onClick={handleCargarStockBajo}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Cargar faltantes de stock</span>
                  </button>
                </div>

                {/* Filtro y buscador */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2 relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o proveedor..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black"
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

                {/* Lista de productos para elegir */}
                <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-xl bg-white">
                  {productosFiltrados.length === 0 ? (
                    <p className="text-center py-6 text-xs text-zinc-400">
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
                              ? 'bg-zinc-50 border-l-4 border-black' 
                              : 'hover:bg-zinc-50/70'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-900 text-sm truncate">
                                {prod.nombre}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium shrink-0">
                                {prod.proveedorNombre || 'Proveedor'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 text-xs">
                              <span className="text-zinc-500">Disponible:</span>
                              <span className={`px-1.5 py-0.2 rounded font-bold ${
                                esStockBajo 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                  : 'bg-zinc-100 text-zinc-700'
                              }`}>
                                {prod.stock ?? 0} {prod.unidad}
                              </span>
                              {esStockBajo && (
                                <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-0.5">
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
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-black bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                title="Clic para modificar cantidad o nota"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                                <span>{pedidoDraft[prod.id]?.cantidad} {prod.unidad}</span>
                                <Pencil className="w-3 h-3 text-zinc-500" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAbrirModalPedir(prod)}
                                className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
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

              {/* Sección "Productos en tu pedido" */}
              <div className="space-y-3 pt-2 border-t border-zinc-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-zinc-900 font-display flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-black" />
                    <span>Productos en tu pedido ({itemsEnPedido.length})</span>
                  </h4>
                  {itemsEnPedido.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPedidoDraft({})}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Vaciar lista
                    </button>
                  )}
                </div>

                {itemsEnPedido.length === 0 ? (
                  <div className="text-center py-6 px-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                    <p className="text-xs text-zinc-500">
                      Selecciona productos arriba haciendo clic en <strong>"Pedir"</strong> para añadirlos a este pedido.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(itemsAgrupadosPorProveedor).map(([provNombre, items]) => (
                      <div key={provNombre} className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-xs">
                        <div className="bg-zinc-50 px-3 py-2 flex items-center justify-between border-b border-zinc-200 text-xs font-bold uppercase tracking-wider text-zinc-800">
                          <span className="flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-zinc-500" />
                            {provNombre}
                          </span>
                          <span className="text-zinc-500 font-normal">
                            {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
                          </span>
                        </div>

                        <div className="divide-y divide-zinc-100 bg-white">
                          {items.map((item) => {
                            const prod = productos.find(p => p.id === item.productoId) || {};
                            return (
                              <div key={item.productoId} className="p-3 flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-xs text-zinc-900 truncate">
                                    {item.productoNombre}
                                  </p>
                                  {item.obs && (
                                    <p className="text-[11px] text-amber-800 italic">
                                      Nota: {item.obs}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="px-2.5 py-1 bg-zinc-100 rounded-lg text-xs font-mono font-bold text-black border border-zinc-200">
                                    {item.cantidad} {item.unidad}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleAbrirModalPedir(prod)}
                                    className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                                    title="Editar"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleEliminarDelDraft(item.productoId)}
                                    className="p-1.5 rounded-lg bg-zinc-100 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Quitar"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Observación general */}
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                        Observación general del pedido (opcional):
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Entregar antes de las 11:00 AM / Traer factura"
                        value={observacionGeneral}
                        onChange={(e) => setObservacionGeneral(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pie del popup */}
            <div className="p-4 sm:p-5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setModalNuevoPedidoAbierto(false)}
                className="px-4 py-2 bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleFinalizarPedido}
                disabled={enviando || itemsEnPedido.length === 0}
                className="px-5 py-2.5 bg-black hover:bg-zinc-800 active:scale-95 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{enviando ? 'Guardando pedido...' : 'Finalizar y Crear Pedido'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-MODAL: AJUSTE DE CANTIDAD Y NOTA AL DAR CLIC EN "PEDIR"           */}
      {/* ========================================================================= */}
      {productoModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-black" />
                <h4 className="font-bold text-zinc-900 text-sm font-display">
                  Agregar a Pedido
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setProductoModal(null)}
                className="p-1 text-zinc-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarDesdeModal} className="space-y-3.5">
              <div>
                <span className="block text-xs font-bold text-zinc-500 mb-1">Producto</span>
                <p className="font-bold text-zinc-900 text-base">{productoModal.nombre}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Disponible actual: <span className="font-semibold text-black">{productoModal.stock ?? 0} {productoModal.unidad}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Cantidad a pedir *
                </label>
                <div className="flex items-center gap-2">
                  <NumericInput
                    autoFocus
                    value={cantidadModal}
                    onChange={setCantidadModal}
                    placeholder="0"
                    className="w-full text-base font-bold text-zinc-900 py-2"
                    required
                  />
                  <span className="px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 shrink-0">
                    {productoModal.unidad}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Nota (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. maduro, marca específica..."
                  value={notaModal}
                  onChange={(e) => setNotaModal(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setProductoModal(null)}
                  className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

