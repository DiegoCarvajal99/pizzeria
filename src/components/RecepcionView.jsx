import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import NumericInput from './common/NumericInput';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  Store, 
  Package, 
  CheckCheck, 
  Calendar, 
  XCircle, 
  Copy, 
  Share2, 
  MessageCircle 
} from 'lucide-react';

export default function RecepcionView() {
  const { pedidos, confirmarRecepcionItems, confirmarItemIndividual, cancelarPedido, mostrarAlerta } = useInventory();
  const [filtroEstado, setFiltroEstado] = useState('pendientes'); // 'pendientes' | 'completados' | 'todos'
  const [cantidadesRecibidas, setCantidadesRecibidas] = useState({});

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroEstado === 'pendientes') return p.estado === 'pendiente' || p.estado === 'parcial';
    if (filtroEstado === 'completados') return p.estado === 'completado';
    return true;
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
   * Construye el texto con estructura limpia y profesional para WhatsApp
   */
  const construirMensajePedido = (pedido) => {
    const d = pedido.fechaCreacion ? new Date(pedido.fechaCreacion) : new Date();
    const fechaStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

    let bloques = [];
    bloques.push(`*PEDIDO SEMANAL* 🍕\n📅 ${fechaStr}`);

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

  /**
   * Construye el texto para un solo proveedor
   */
  const construirMensajeUnProveedor = (grupo, fechaIso) => {
    const d = fechaIso ? new Date(fechaIso) : new Date();
    const fechaStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

    let lineas = [];
    lineas.push(`*PEDIDO - ${grupo.proveedorNombre.toUpperCase()}* 🍕`);
    lineas.push(`📅 ${fechaStr}\n`);
    grupo.items.forEach(item => {
      const obsTexto = item.obs ? ` _(${item.obs})_` : "";
      const unidadTexto = item.unidad ? ` ${item.unidad}` : "";
      lineas.push(`• ${item.productoNombre}: *${item.cantidadPedida}${unidadTexto}*${obsTexto}`);
    });

    return lineas.join("\n");
  };

  // 1. Copiar al portapapeles
  const handleCopiarMensaje = (pedido) => {
    const texto = construirMensajePedido(pedido);
    navigator.clipboard.writeText(texto);
    if (mostrarAlerta) {
      mostrarAlerta("📋 Lista de pedido copiada al portapapeles", "success");
    } else {
      alert("📋 Lista copiada al portapapeles.");
    }
  };

  // 2. Compartir por WhatsApp
  const handleCompartirWhatsApp = (pedido) => {
    const texto = construirMensajePedido(pedido);
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Compartir proveedor individual por WhatsApp
  const handleCompartirWhatsAppProveedor = (grupo, fechaIso) => {
    const texto = construirMensajeUnProveedor(grupo, fechaIso);
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Banner explicativo del flujo de recepción */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-zinc-800 flex items-start gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <div className="text-sm leading-relaxed">
          <p className="font-bold text-zinc-900">
            Recepción de Mercancía & Confirmación a Stock
          </p>
          <p className="text-zinc-600 text-xs sm:text-sm">
            Aquí tienes la lista de los productos que se pidieron organizada por proveedor. Puedes <strong className="text-black">copiar el mensaje</strong> o <strong className="text-emerald-700">compartirlo por WhatsApp</strong>, y al confirmar la llegada, los insumos se <strong className="text-black">sumarán automáticamente a tu stock</strong>.
          </p>
        </div>
      </div>

      {/* Selector de pestañas de estado */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-2">
        <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-semibold border border-zinc-200">
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

        <span className="text-xs font-medium text-zinc-500">
          {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}
        </span>
      </div>

      {/* Lista de pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-zinc-200 shadow-sm">
          <Truck className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800 font-display">
            {filtroEstado === 'pendientes' 
              ? 'No hay pedidos pendientes por recibir' 
              : 'No hay pedidos en este filtro'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {filtroEstado === 'pendientes'
              ? 'Cuando finalices un pedido en "Hacer Pedido", aparecerá aquí dividido por sus proveedores.'
              : 'Los pedidos que confirmes se archivarán aquí como historial.'}
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

                  {/* Acciones principales de la orden */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* BOTÓN: COPIAR AL PORTAPAPELES */}
                    <button
                      type="button"
                      onClick={() => handleCopiarMensaje(pedido)}
                      className="px-3 py-2 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copiar texto del pedido al portapapeles con la estructura solicitada"
                    >
                      <Copy className="w-3.5 h-3.5 text-black" />
                      <span>Copiar Pedido</span>
                    </button>

                    {/* BOTÓN: COMPARTIR POR WHATSAPP */}
                    <button
                      type="button"
                      onClick={() => handleCompartirWhatsApp(pedido)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Abrir WhatsApp para enviar este pedido estructurado"
                    >
                      <Share2 className="w-3.5 h-3.5 text-white" />
                      <span>Compartir por WhatsApp</span>
                    </button>

                    {/* Confirmar todo de una vez si está pendiente */}
                    {!estaCompletado && !estaCancelado && (
                      <button
                        type="button"
                        onClick={() => confirmarRecepcionItems(pedido.id)}
                        className="px-3.5 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Recibir todos los productos de todos los proveedores y sumarlos al stock"
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
                            {/* Compartir este proveedor individual por WhatsApp */}
                            <button
                              type="button"
                              onClick={() => handleCompartirWhatsAppProveedor(grupo, pedido.fechaCreacion)}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-semibold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Enviar por WhatsApp solo los productos de este proveedor"
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
    </div>
  );
}