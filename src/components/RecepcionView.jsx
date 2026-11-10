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
   * Construye el texto con la estructura exacta especificada:
   * PEDIDO SEMANAL
   * 9/11/2026
   * DISTRIPAPA
   * •
   * Papa pastusa: 2 bulto
   * •
   * Papas a la francesa: 4 bolsa
   * MERCADO
   * •
   * Tomate: 10 kg (maduro)
   */
  const construirMensajePedido = (pedido) => {
    const d = pedido.fechaCreacion ? new Date(pedido.fechaCreacion) : new Date();
    const fechaStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

    let lineas = [];
    lineas.push("PEDIDO SEMANAL");
    lineas.push(fechaStr);

    pedido.grupos.forEach(grupo => {
      lineas.push(grupo.proveedorNombre.toUpperCase());
      grupo.items.forEach(item => {
        lineas.push("•");
        const obsTexto = item.obs ? ` (${item.obs})` : "";
        const unidadTexto = item.unidad ? ` ${item.unidad}` : "";
        lineas.push(`${item.productoNombre}: ${item.cantidadPedida}${unidadTexto}${obsTexto}`);
      });
    });

    return lineas.join("\n");
  };

  /**
   * Construye el texto para un solo proveedor
   */
  const construirMensajeUnProveedor = (grupo, fechaIso) => {
    const d = fechaIso ? new Date(fechaIso) : new Date();
    const fechaStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

    let lineas = [];
    lineas.push("PEDIDO SEMANAL");
    lineas.push(fechaStr);
    lineas.push(grupo.proveedorNombre.toUpperCase());
    grupo.items.forEach(item => {
      lineas.push("•");
      const obsTexto = item.obs ? ` (${item.obs})` : "";
      const unidadTexto = item.unidad ? ` ${item.unidad}` : "";
      lineas.push(`${item.productoNombre}: ${item.cantidadPedida}${unidadTexto}${obsTexto}`);
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
      <div className="bg-[#2B2314] border border-[#59421A] rounded-2xl p-4 text-[#FDEBD0] flex items-start gap-3 shadow-lg">
        <Truck className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        <div className="text-sm leading-relaxed">
          <p className="font-bold text-amber-300">
            Recepción de Mercancía & Confirmación a Stock
          </p>
          <p className="text-stone-300">
            Aquí tienes la lista de los productos que se pidieron organizada por proveedor. Puedes <strong className="text-white">copiar el mensaje</strong> o <strong className="text-emerald-400">compartirlo por WhatsApp</strong>, y al confirmar la llegada, los insumos se <strong className="text-emerald-400">sumarán automáticamente a tu stock</strong>.
          </p>
        </div>
      </div>

      {/* Selector de pestañas de estado */}
      <div className="flex items-center justify-between gap-2 border-b border-[#2A352F] pb-2">
        <div className="flex gap-1 bg-[#18201C] p-1 rounded-xl text-xs font-semibold border border-[#2A352F]">
          <button
            type="button"
            onClick={() => setFiltroEstado('pendientes')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filtroEstado === 'pendientes'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Pendientes por recibir
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('completados')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filtroEstado === 'completados'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Historial recibidos
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filtroEstado === 'todos'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Todos
          </button>
        </div>

        <span className="text-xs font-medium text-stone-400">
          {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}
        </span>
      </div>

      {/* Lista de pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <div className="text-center py-12 px-4 bg-[#18201C] rounded-2xl border border-[#2A352F] shadow-lg">
          <Truck className="w-12 h-12 text-stone-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-300 font-display">
            {filtroEstado === 'pendientes' 
              ? 'No hay pedidos pendientes por recibir' 
              : 'No hay pedidos en este filtro'}
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
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
                className="bg-[#18201C] rounded-2xl border border-[#2A352F] shadow-lg overflow-hidden"
              >
                {/* Cabecera del pedido */}
                <div className="p-4 sm:p-5 bg-[#131A16] border-b border-[#2A352F] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                      estaCompletado
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                        : esParcial
                        ? 'bg-blue-950 text-blue-300 border border-blue-700/50'
                        : 'bg-amber-950 text-amber-300 border border-amber-700/50'
                    }`}>
                      #{pedido.numero}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-white text-base font-display">
                          Pedido #{pedido.numero}
                        </h2>
                        {estaCompletado ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                            <CheckCircle2 className="w-3 h-3" /> Completado en Stock
                          </span>
                        ) : esParcial ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700/60">
                            <Clock className="w-3 h-3" /> Recepción parcial ({itemsRecibidos}/{totalItems})
                          </span>
                        ) : estaCancelado ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/60">
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60 animate-pulse">
                            <Clock className="w-3 h-3" /> Esperando llegada
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-500" />
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
                      className="px-3 py-2 bg-[#25302A] hover:bg-[#2F3D35] text-stone-200 hover:text-white border border-[#2A352F] rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copiar texto del pedido al portapapeles con la estructura solicitada"
                    >
                      <Copy className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiar Pedido</span>
                    </button>

                    {/* BOTÓN: COMPARTIR POR WHATSAPP */}
                    <button
                      type="button"
                      onClick={() => handleCompartirWhatsApp(pedido)}
                      className="px-3 py-2 bg-[#1A3328] hover:bg-[#224535] text-emerald-300 hover:text-white border border-emerald-600/50 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Abrir WhatsApp para enviar este pedido estructurado"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Compartir por WhatsApp</span>
                    </button>

                    {/* Confirmar todo de una vez si está pendiente */}
                    {!estaCompletado && !estaCancelado && (
                      <button
                        type="button"
                        onClick={() => confirmarRecepcionItems(pedido.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
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
                        className="p-2 text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Cancelar pedido"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Observaciones generales si las tiene */}
                {pedido.observaciones && (
                  <div className="px-5 py-2 bg-[#0F1512]/50 border-b border-[#2A352F] text-xs text-stone-400 italic">
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
                        className="border border-[#2A352F] rounded-xl overflow-hidden shadow-md bg-[#0F1512]/40"
                      >
                        {/* 1. SEPARADOR DEL PROVEEDOR */}
                        <div className="bg-[#111814] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#2A352F]">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-emerald-400" />
                            <div>
                              <span className="font-bold text-sm tracking-wide font-display text-emerald-300">
                                PROVEEDOR: {grupo.proveedorNombre.toUpperCase()}
                              </span>
                              <span className="ml-2 text-xs font-normal text-stone-400">
                                ({grupo.items.length} {grupo.items.length === 1 ? 'producto' : 'productos'})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Compartir este proveedor individual por WhatsApp */}
                            <button
                              type="button"
                              onClick={() => handleCompartirWhatsAppProveedor(grupo, pedido.fechaCreacion)}
                              className="px-2 py-1 bg-[#1A2E24] hover:bg-[#264D3B] text-emerald-300 text-xs font-semibold rounded-lg border border-[#26533F] flex items-center gap-1 cursor-pointer transition-colors"
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
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
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
                        <div className="divide-y divide-[#2A352F] bg-[#18201C]">
                          {grupo.items.map((item) => (
                            <div 
                              key={item.id}
                              className={`p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
                                item.recibido ? 'bg-[#15231D]' : 'hover:bg-[#1E2823]'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <Package className={`w-4 h-4 ${item.recibido ? 'text-emerald-400' : 'text-stone-500'}`} />
                                  <h4 className="font-bold text-white text-sm truncate">
                                    {item.productoNombre}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs">
                                  <span className="text-stone-400 font-medium">
                                    Cantidad solicitada:
                                  </span>
                                  <span className="font-mono font-bold text-emerald-300 bg-[#25302A] px-2 py-0.5 rounded border border-[#2A352F]">
                                    {item.cantidadPedida} {item.unidad}
                                  </span>
                                  {item.obs && (
                                    <span className="text-amber-300/90 italic bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                                      Nota: {item.obs}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Estado y Botón de confirmación con campo numérico sin flechas */}
                              <div className="flex items-center gap-2">
                                {item.recibido ? (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 text-xs font-bold border border-emerald-700/60">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>+{item.cantidadRecibida || item.cantidadPedida} {item.unidad} en stock</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[11px] text-stone-400">Llegó:</span>
                                      <NumericInput
                                        value={cantidadesRecibidas[item.id] !== undefined ? cantidadesRecibidas[item.id] : item.cantidadPedida}
                                        onChange={(val) => setCantidadesRecibidas(prev => ({ ...prev, [item.id]: val }))}
                                        className="w-16 py-1 px-2 text-center text-xs font-mono font-bold text-emerald-400"
                                      />
                                      <span className="text-xs text-stone-400">{item.unidad}</span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cant = cantidadesRecibidas[item.id] !== undefined 
                                          ? parseFloat(cantidadesRecibidas[item.id]) || item.cantidadPedida 
                                          : item.cantidadPedida;
                                        confirmarItemIndividual(pedido.id, item.productoId, cant);
                                      }}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
