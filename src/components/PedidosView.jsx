import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import SearchableSelect from './common/SearchableSelect';
import NumericInput from './common/NumericInput';
import AnimatedModal from './common/AnimatedModal';
import { sanitizeNota } from '../utils/security';
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
  let authContext = null;
  try {
    authContext = useAuth();
  } catch (e) {}
  const negocioActivo = authContext?.negocioActivo;
  const negocioId = authContext?.negocioId || negocioActivo?.id || negocioActivo?.uid || 'default_tenant';
  const emojiNegocio = negocioActivo?.emoji || '🍕';
  const nombreNegocioHeader = (negocioActivo?.nombreNegocio || 'PEDIDO SEMANAL').toUpperCase();
  const linkPortalCompras = `https://pizzeria-kappa-gold.vercel.app/?compras=${encodeURIComponent(negocioId)}`;

  const { 
    productos, 
    proveedores, 
    pedidos, 
    carritoPedido,
    setCarritoPedido,
    observacionCarrito,
    setObservacionCarrito,
    vaciarCarritoPedido,
    crearPedido, 
    confirmarRecepcionItems, 
    confirmarItemIndividual, 
    cancelarPedido, 
    solicitarConfirmacion,
    mostrarAlerta 
  } = useInventory();

  // Estados de navegación y filtros de la vista principal
  const [filtroEstado, setFiltroEstado] = useState('pendientes'); // 'pendientes' | 'completados' | 'todos'
  const [cantidadesRecibidas, setCantidadesRecibidas] = useState({});
  const [busquedaPedidoId, setBusquedaPedidoId] = useState(''); // Barra de búsqueda por ID de pedido

  // ==========================================
  // ESTADOS DEL POPUP / MODAL "NUEVO PEDIDO / EDITAR CARRITO"
  // ==========================================
  const [modalNuevoPedidoAbierto, setModalNuevoPedidoAbierto] = useState(false);
  const [pedidoDraft, setPedidoDraft] = useState(() => {
    try {
      const saved = localStorage.getItem('inv_borrador_formulario_pedido');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [observacionGeneral, setObservacionGeneral] = useState(() => {
    try {
      return localStorage.getItem('inv_borrador_formulario_obs') || '';
    } catch {
      return '';
    }
  });
  const [modalConfirmarSalida, setModalConfirmarSalida] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('todos');
  const [enviando, setEnviando] = useState(false);

  const actualizarDraftFormulario = (updater) => {
    setPedidoDraft(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('inv_borrador_formulario_pedido', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const actualizarObsFormulario = (val) => {
    const valLimpio = sanitizeNota(val, 250);
    setObservacionGeneral(valLimpio);
    try {
      localStorage.setItem('inv_borrador_formulario_obs', valLimpio);
    } catch (e) {}
  };

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

  const formatearFechaDDMMYYYY = (fechaIso) => {
    const d = fechaIso ? new Date(fechaIso) : new Date();
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  /**
   * Construye el texto formateado estructurado para WhatsApp siguiendo la plantilla oficial solicitada:
   * 
   * 🍕 PEDIDO SEMANAL 🍕
   * 
   * 🔢 Pedido N.º: #7239
   * 📅 Fecha: 10/11/2026
   * 
   * ━━━━━━━━━━━━━━
   * 🏪 ARA
   * ▫️ Queso mozzarella — 8 bloques
   * 
   * 🏪 DISTRIPAPA
   * ▫️ Papa criolla — 5 kg
   * ━━━━━━━━━━━━━━
   * 
   * ✅ Total de productos: 2
   */
  const construirMensajePedido = (pedido) => {
    const fechaStr = formatearFechaDDMMYYYY(pedido.fechaCreacion);
    const idPedidoStr = pedido.numero ? `#${pedido.numero}` : `#${pedido.id}`;

    let totalProductos = 0;
    const bloquesProveedores = [];

    (pedido.grupos || []).forEach(grupo => {
      const lineasGrupo = [];
      const nombreProv = (grupo.proveedorNombre || 'Sin Proveedor').trim().toUpperCase();
      lineasGrupo.push(`🏪 ${nombreProv}`);

      grupo.items.forEach(item => {
        totalProductos += 1;
        const unidadTexto = item.unidad ? ` ${item.unidad}` : '';
        const obsTexto = item.obs ? ` (${item.obs})` : '';
        lineasGrupo.push(`▫️ ${item.productoNombre} — ${item.cantidadPedida}${unidadTexto}${obsTexto}`);
      });

      bloquesProveedores.push(lineasGrupo.join('\n'));
    });

    const cuerpoProveedores = bloquesProveedores.join('\n\n');

    const lineasMensaje = [
      `${emojiNegocio} PEDIDO - ${nombreNegocioHeader} ${emojiNegocio}`,
      '',
      `🔢 Pedido N.º: ${idPedidoStr}`,
      `📅 Fecha: ${fechaStr}`,
      '',
      '━━━━━━━━━━━━━━',
      cuerpoProveedores,
      '━━━━━━━━━━━━━━',
      '',
      `✅ Total de productos: ${totalProductos}`
    ];

    if (pedido.observaciones && pedido.observaciones.trim()) {
      lineasMensaje.push('', `📝 Observaciones: ${pedido.observaciones.trim()}`);
    }

    lineasMensaje.push('', `🔗 Ver lista en el portal de compras:`, linkPortalCompras);

    return lineasMensaje.join('\n');
  };

  const construirMensajeUnProveedor = (grupo, fechaIso, numeroPedido) => {
    const fechaStr = formatearFechaDDMMYYYY(fechaIso);
    const idPedidoStr = numeroPedido ? `#${numeroPedido}` : '';
    const nombreProv = (grupo.proveedorNombre || 'Proveedor').trim().toUpperCase();

    const lineasItems = [];
    (grupo.items || []).forEach(item => {
      const unidadTexto = item.unidad ? ` ${item.unidad}` : '';
      const obsTexto = item.obs ? ` (${item.obs})` : '';
      lineasItems.push(`▫️ ${item.productoNombre} — ${item.cantidadPedida}${unidadTexto}${obsTexto}`);
    });

    const lineasMensaje = [
      `${emojiNegocio} PEDIDO - ${nombreNegocioHeader} ${emojiNegocio}`,
      ''
    ];

    if (idPedidoStr) {
      lineasMensaje.push(`🔢 Pedido N.º: ${idPedidoStr}`);
    }
    lineasMensaje.push(`📅 Fecha: ${fechaStr}`);
    lineasMensaje.push('');
    lineasMensaje.push('━━━━━━━━━━━━━━');
    lineasMensaje.push(`🏪 ${nombreProv}`);
    lineasMensaje.push(lineasItems.join('\n'));
    lineasMensaje.push('━━━━━━━━━━━━━━');
    lineasMensaje.push('');
    lineasMensaje.push(`✅ Total de productos: ${grupo.items ? grupo.items.length : 0}`);
    lineasMensaje.push('', `🔗 Ver lista en el portal de compras:`, linkPortalCompras);

    return lineasMensaje.join('\n');
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

    actualizarDraftFormulario(draftRepetido);
    actualizarObsFormulario(pedidoOriginal.observaciones || '');
    setModalNuevoPedidoAbierto(true);
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

    actualizarDraftFormulario(prev => ({
      ...prev,
      [productoModal.id]: {
        cantidad: cant,
        obs: notaModal.trim()
      }
    }));

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

    actualizarDraftFormulario(prev => ({ ...prev, ...faltantes }));
  };

  const handleEliminarDelDraft = (prodId) => {
    actualizarDraftFormulario(prev => {
      const copia = { ...prev };
      delete copia[prodId];
      return copia;
    });
  };

  // Helper para mapear un objeto { prodId: { cantidad, obs } } a lista enriquecida
  const mapearItemsPedido = (mapaOrigen) => {
    return Object.entries(mapaOrigen || {})
      .filter(([_, data]) => Number(data?.cantidad) > 0)
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
  };

  // 1. Productos en el formulario actual (borrador temporal mientras edita)
  const itemsEnPedido = mapearItemsPedido(pedidoDraft);
  const itemsAgrupadosPorProveedor = itemsEnPedido.reduce((acc, item) => {
    const prov = item.proveedorNombre || 'Varios';
    if (!acc[prov]) acc[prov] = [];
    acc[prov].push(item);
    return acc;
  }, {});

  // 2. Productos que YA fueron enviados oficialmente al Carrito (los únicos que se ven en la página principal de Pedidos)
  const itemsEnCarrito = mapearItemsPedido(carritoPedido);
  const itemsCarritoPorProveedor = itemsEnCarrito.reduce((acc, item) => {
    const prov = item.proveedorNombre || 'Varios';
    if (!acc[prov]) acc[prov] = [];
    acc[prov].push(item);
    return acc;
  }, {});

  const tieneCarritoActivo = itemsEnCarrito.length > 0;

  // Comparar si el formulario tiene cambios sin guardar respecto al carrito oficial
  const serializarMapa = (mapa) => {
    const entradas = Object.entries(mapa || {})
      .filter(([_, v]) => Number(v?.cantidad) > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, { cantidad: Number(v.cantidad), obs: (v.obs || '').trim() }]);
    return JSON.stringify(entradas);
  };

  const hayCambiosEnFormulario =
    serializarMapa(pedidoDraft) !== serializarMapa(carritoPedido) ||
    (observacionGeneral || '').trim() !== (observacionCarrito || '').trim();

  // Abrir formulario desde "+ Nuevo Pedido" (solo cuando no hay carrito activo)
  const handleAbrirNuevoPedido = () => {
    if (tieneCarritoActivo) return;
    setModalNuevoPedidoAbierto(true);
  };

  // Abrir formulario desde "Carrito (X)" (solo cuando ya hay productos en el carrito)
  const handleAbrirEditarCarrito = () => {
    if (!tieneCarritoActivo) return;
    actualizarDraftFormulario({ ...(carritoPedido || {}) });
    actualizarObsFormulario(observacionCarrito || '');
    setModalNuevoPedidoAbierto(true);
  };

  // Enviar o Actualizar el carrito oficial con lo que está en el formulario
  const handleEnviarAlCarrito = () => {
    setCarritoPedido({ ...pedidoDraft });
    setObservacionCarrito(observacionGeneral);
    setModalConfirmarSalida(false);
    setModalNuevoPedidoAbierto(false);
  };

  // Intentar cerrar con "Cancelar" o la "X" del formulario
  const handleIntentarCerrarFormulario = () => {
    if (hayCambiosEnFormulario) {
      setModalConfirmarSalida(true);
    } else {
      setModalNuevoPedidoAbierto(false);
    }
  };

  // Descartar los cambios hechos en el formulario al confirmar en el modal de salida
  const handleDescartarCambiosFormulario = () => {
    if (tieneCarritoActivo) {
      // Restaurar el borrador del formulario a como estaba el carrito antes de editarlo
      actualizarDraftFormulario({ ...(carritoPedido || {}) });
      actualizarObsFormulario(observacionCarrito || '');
    } else {
      // Si era una lista nueva sin carrito, limpiar todo sin guardar nada en el carrito
      actualizarDraftFormulario({});
      actualizarObsFormulario('');
    }
    setModalConfirmarSalida(false);
    setModalNuevoPedidoAbierto(false);
  };

  const handleFinalizarPedido = async (usarDatosDeCarrito = false) => {
    const listaFinal = usarDatosDeCarrito ? itemsEnCarrito : itemsEnPedido;
    const obsFinal = usarDatosDeCarrito ? observacionCarrito : observacionGeneral;
    if (listaFinal.length === 0) return;

    setEnviando(true);
    try {
      const pedidoCreado = await crearPedido(listaFinal, obsFinal);
      if (pedidoCreado) {
        if (vaciarCarritoPedido) {
          vaciarCarritoPedido();
        } else {
          setCarritoPedido({});
          setObservacionCarrito('');
        }
        actualizarDraftFormulario({});
        actualizarObsFormulario('');
        setModalConfirmarSalida(false);
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
      {/* 1. Cabecera Unificada con Botón "Carrito" y "Nuevo Pedido" */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 font-display flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-black" />
            <span>Gestión de Pedidos & Recepción</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Crea pedidos a proveedores, guarda tu avance en el carrito y confirma la llegada sumando directo al stock.
          </p>
        </div>

        {/* BOTONES DE ACCIÓN:
            - Carrito: deshabilitado si no hay nada en el carrito (no hace nada al dar clic)
            - Nuevo Pedido: deshabilitado si ya hay una lista activa en el carrito (no hace nada al dar clic)
        */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={!tieneCarritoActivo}
            onClick={handleAbrirEditarCarrito}
            className={`px-4 py-2.5 rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 transition-all ${
              tieneCarritoActivo
                ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-extrabold ring-2 ring-amber-500/40 cursor-pointer'
                : 'bg-zinc-100 text-zinc-400 border border-zinc-200 font-bold opacity-50 cursor-not-allowed pointer-events-none'
            }`}
            title={tieneCarritoActivo ? 'Abrir el carrito de pedido para editar o finalizar' : 'El carrito está vacío'}
          >
            <div className="relative flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
              {itemsEnCarrito.length > 0 && (
                <span className="absolute -top-2 -right-2.5 px-1 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-black rounded-full bg-black text-amber-300 ring-1 ring-amber-400">
                  {itemsEnCarrito.length}
                </span>
              )}
            </div>
            <span>Carrito ({itemsEnCarrito.length})</span>
          </button>

          <button
            type="button"
            disabled={tieneCarritoActivo}
            onClick={handleAbrirNuevoPedido}
            className={`px-4 py-2.5 rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 transition-all shrink-0 ${
              !tieneCarritoActivo
                ? 'bg-black hover:bg-zinc-800 active:scale-95 text-white font-bold cursor-pointer'
                : 'bg-zinc-200 text-zinc-400 font-bold opacity-50 cursor-not-allowed pointer-events-none'
            }`}
            title={tieneCarritoActivo ? 'Ya tienes una lista activa en el Carrito' : 'Iniciar una nueva lista de pedido'}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Pedido</span>
          </button>
        </div>
      </div>

      {/* 1.B TARJETA DE CARRITO EN CURSO: Aparece SOLO cuando los productos ya fueron enviados al Carrito */}
      {tieneCarritoActivo && (
        <div className="bg-zinc-950 text-white rounded-2xl border border-zinc-800 p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-extrabold shrink-0 shadow-md">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-sm sm:text-base font-display text-white">
                    Carrito de Pedido en Curso ({itemsEnCarrito.length} {itemsEnCarrito.length === 1 ? 'producto' : 'productos'})
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    En el Carrito
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Estos productos ya están en tu carrito. Puedes editar la lista o finalizar el pedido cuando estés listo.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAbrirEditarCarrito}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-amber-400" />
                <span>Editar / Agregar Más</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  solicitarConfirmacion({
                    titulo: '¿Vaciar el carrito?',
                    mensaje: '¿Estás seguro de que deseas eliminar todos los productos guardados en el carrito?',
                    textoConfirmar: 'Sí, vaciar carrito',
                    textoCancelar: 'Conservar carrito',
                    tipo: 'danger',
                    onConfirmar: () => {
                      if (vaciarCarritoPedido) vaciarCarritoPedido();
                      else {
                        setCarritoPedido({});
                        setObservacionCarrito('');
                      }
                      actualizarDraftFormulario({});
                      actualizarObsFormulario('');
                    }
                  });
                }}
                className="px-3 py-2 bg-zinc-900 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-zinc-800 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar</span>
              </button>

              <button
                type="button"
                onClick={() => handleFinalizarPedido(true)}
                disabled={enviando}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-extrabold rounded-xl text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{enviando ? 'Creando...' : 'Finalizar y Crear Pedido'}</span>
              </button>
            </div>
          </div>

          {/* Resumen rápido de los ítems en el carrito por proveedor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {Object.entries(itemsCarritoPorProveedor).map(([provNombre, items]) => (
              <div key={provNombre} className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 border-b border-zinc-800 pb-1.5">
                  <span className="flex items-center gap-1.5 truncate">
                    <Store className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{provNombre}</span>
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
                  </span>
                </div>
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {items.map(it => (
                    <div key={it.productoId} className="flex items-center justify-between text-xs text-zinc-200 gap-2">
                      <span className="truncate">{it.productoNombre}</span>
                      <span className="font-mono font-bold text-white bg-zinc-800 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                        {it.cantidad} {it.unidad}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              placeholder="BUSCAR PEDIDO POR ID..."
              value={busquedaPedidoId}
              onChange={(e) => setBusquedaPedidoId(e.target.value.toUpperCase())}
              className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors uppercase"
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
                          solicitarConfirmacion({
                            titulo: '¿Cancelar pedido?',
                            mensaje: `¿Estás seguro de que deseas cancelar el pedido #${pedido.numero}?`,
                            textoConfirmar: 'Sí, cancelar',
                            textoCancelar: 'Descartar',
                            tipo: 'danger',
                            onConfirmar: () => cancelarPedido(pedido.id)
                          });
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
                                  {item.comprado && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Comprado por {item.compradoPor || 'Empleado'}</span>
                                      {item.compradoPorUsuario && (
                                        <span className="font-mono text-emerald-900">(@{item.compradoPorUsuario})</span>
                                      )}
                                    </span>
                                  )}
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
      <AnimatedModal
        isOpen={modalNuevoPedidoAbierto}
        overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        panelClassName="bg-white border border-zinc-200 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
            {/* Cabecera del popup */}
            <div className="p-4 sm:p-5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-base font-display">
                    {tieneCarritoActivo ? 'Editar Carrito de Pedido' : 'Crear Nuevo Pedido'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Selecciona productos, ajusta cantidades y envíalos al carrito o confirma tu orden.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleIntentarCerrarFormulario}
                className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-200 rounded-xl cursor-pointer transition-colors"
                title="Cancelar y cerrar"
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
                      placeholder="BUSCAR POR NOMBRE O PROVEEDOR..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black uppercase"
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

              {/* Sección "Productos en tu lista" */}
              <div className="space-y-3 pt-2 border-t border-zinc-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-zinc-900 font-display flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-black" />
                    <span>Productos en tu Lista ({itemsEnPedido.length})</span>
                  </h4>
                  {itemsEnPedido.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        actualizarDraftFormulario({});
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Vaciar lista
                    </button>
                  )}
                </div>

                {itemsEnPedido.length === 0 ? (
                  <div className="text-center py-6 px-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                    <p className="text-xs text-zinc-500">
                      Selecciona productos arriba haciendo clic en <strong>"Pedir"</strong> para añadirlos a esta lista.
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
                        placeholder="EJ. ENTREGAR ANTES DE LAS 11:00 AM / TRAER FACTURA"
                        value={observacionGeneral}
                        onChange={(e) => actualizarObsFormulario(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pie del popup */}
            <div className="p-4 sm:p-5 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={handleIntentarCerrarFormulario}
                className="px-4 py-2 bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleEnviarAlCarrito}
                  disabled={tieneCarritoActivo ? !hayCambiosEnFormulario : itemsEnPedido.length === 0}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold rounded-xl text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all"
                  title={tieneCarritoActivo ? 'Guardar los cambios realizados en el carrito' : 'Enviar la lista actual al carrito'}
                >
                  <ShoppingCart className="w-4 h-4 text-black" />
                  <span>
                    {tieneCarritoActivo
                      ? `Actualizar Carrito (${itemsEnPedido.length})`
                      : `Enviar al Carrito (${itemsEnPedido.length})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFinalizarPedido(false)}
                  disabled={enviando || itemsEnPedido.length === 0}
                  className="px-5 py-2.5 bg-black hover:bg-zinc-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{enviando ? 'Guardando pedido...' : 'Finalizar y Crear Pedido'}</span>
                </button>
              </div>
            </div>
      </AnimatedModal>

      {/* ========================================================================= */}
      {/* 4.B MODAL DE CONFIRMACIÓN AL CANCELAR O CERRAR CON CAMBIOS SIN GUARDAR    */}
      {/* ========================================================================= */}
      <AnimatedModal
        isOpen={modalConfirmarSalida}
        onBackdropClick={() => setModalConfirmarSalida(false)}
        overlayClassName="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        panelClassName="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 text-center relative"
      >
        <button
          type="button"
          onClick={() => setModalConfirmarSalida(false)}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full cursor-pointer transition-colors"
          title="Seguir editando"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 font-display">
            {tieneCarritoActivo ? '¿Descartar cambios sin guardar?' : '¿Descartar la lista creada?'}
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {tieneCarritoActivo
              ? 'Has realizado modificaciones respecto al carrito actual. ¿Deseas descartar estos cambios o actualizar el carrito con tus modificaciones?'
              : `Tienes ${itemsEnPedido.length} ${itemsEnPedido.length === 1 ? 'producto seleccionado' : 'productos seleccionados'} en la lista. ¿Deseas descartar la lista creada o agregarla al carrito?`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleDescartarCambiosFormulario}
            className="w-full sm:flex-1 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            {tieneCarritoActivo ? 'Sí, descartar cambios' : 'Sí, descartar lista'}
          </button>

          {itemsEnPedido.length > 0 && (
            <button
              type="button"
              onClick={handleEnviarAlCarrito}
              className="w-full sm:flex-1 py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-black font-extrabold rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-black" />
              <span>{tieneCarritoActivo ? 'Actualizar Carrito' : 'Agregar al Carrito'}</span>
            </button>
          )}
        </div>
      </AnimatedModal>

      {/* ========================================================================= */}
      {/* 5. SUB-MODAL: AJUSTE DE CANTIDAD Y NOTA AL DAR CLIC EN "PEDIR"           */}
      {/* ========================================================================= */}
      <AnimatedModal
        isOpen={productoModal}
        overlayClassName="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        panelClassName="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full shadow-2xl p-5 space-y-4"
      >
        {(prodSel) => (
          <>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-black" />
                <h4 className="font-bold text-zinc-900 text-sm font-display">
                  Agregar Producto a la Lista
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
                <p className="font-bold text-zinc-900 text-base">{prodSel.nombre}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Disponible actual: <span className="font-semibold text-black">{prodSel.stock ?? 0} {prodSel.unidad}</span>
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
                    {prodSel.unidad}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Nota (opcional):
                </label>
                <input
                  type="text"
                  placeholder="EJ. MADURO, MARCA ESPECÍFICA..."
                  value={notaModal}
                  onChange={(e) => setNotaModal(sanitizeNota(e.target.value, 150).toUpperCase())}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black uppercase"
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
                  className="px-4 py-1.5 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar a la Lista</span>
                </button>
              </div>
            </form>
          </>
        )}
      </AnimatedModal>
    </div>
  );
}

