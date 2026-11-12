import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { isFirebaseConfigured } from '../firebase';
import { 
  Info,
  CheckCircle2, 
  Database, 
  Boxes, 
  ClipboardList, 
  ShoppingCart, 
  Truck, 
  Store, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Layers,
  MessageCircle,
  HardDrive,
  UtensilsCrossed
} from 'lucide-react';

export default function HomeView({ setActiveTab }) {
  const { productos, proveedores, pedidos } = useInventory();

  const productosActivos = productos.filter(p => !p.deshabilitado);

  const modulos = [
    {
      id: 'pedidos',
      titulo: '1. Pedidos & Recepción',
      descripcion: 'Genera nuevas órdenes a proveedores mediante popup rápido, repite pedidos anteriores con un clic, comparte por WhatsApp y confirma la llegada sumando al stock.',
      icon: ShoppingCart,
      badge: `${pedidos.length} órdenes`
    },
    {
      id: 'stock',
      titulo: '2. Consumo Cocina & Bitácora',
      descripcion: 'Digita y descuenta en tiempo real los insumos que tomas para la preparación, con alertas si excedes el stock y registro histórico con fecha y hora.',
      icon: UtensilsCrossed,
      badge: 'Toma para preparación'
    },
    {
      id: 'catalogo',
      titulo: '3. Catálogo & Insumos',
      descripcion: 'Alta y administración de materias primas (queso, harina, salsas, cajas), unidades de medida, importación masiva y asociación con proveedores.',
      icon: Boxes,
      badge: `${productosActivos.length} activos`
    }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Hero Banner de marca: negro, compacto, con el logo como protagonista */}
      <section
        aria-label="LIACO Pizzería"
        className="relative w-full overflow-hidden rounded-2xl bg-zinc-950 ring-1 ring-zinc-800 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)]"
      >
        {/* Textura: cuadrícula muy tenue que se desvanece hacia los bordes */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
        />
        {/* Foco de luz detrás del logo */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[140%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.14),transparent)]"
        />
        {/* Línea de brillo superior */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative flex items-center justify-center gap-5 sm:gap-8 px-6 py-7 sm:py-9">
          {/* Filete izquierdo */}
          <span aria-hidden="true" className="hidden sm:block h-px flex-1 max-w-[160px] bg-gradient-to-r from-transparent to-white/35" />

          <img
            src="/logo-liaco.png"
            alt="LIACO Pizzería"
            draggable="false"
            onError={(e) => { e.currentTarget.src = '/logo.png'; }}
            className="h-20 sm:h-24 md:h-28 w-auto object-contain select-none drop-shadow-[0_4px_18px_rgba(255,255,255,0.12)]"
          />

          {/* Filete derecho */}
          <span aria-hidden="true" className="hidden sm:block h-px flex-1 max-w-[160px] bg-gradient-to-l from-transparent to-white/35" />
        </div>
      </section>

      {/* 2. Sección: Información Básica del Sistema */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-sm space-y-8">
        
        {/* Cabecera de la sección */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
              <Info className="w-3.5 h-3.5 text-zinc-900" />
              <span>Plataforma Operativa</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight font-display">
              Información Básica del Sistema
            </h2>
            <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed">
              Sistema integral diseñado para la gestión de cocina, control de existencias en almacén y automatización de pedidos a proveedores para <strong>LIACO PIZZERIA</strong>.
            </p>
          </div>

          {/* Estado de sincronización en vivo */}
          <div className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-700">
            {isFirebaseConfigured ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Base de datos: <strong>Firebase Cloud</strong></span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5 text-zinc-600" />
                <span>Almacenamiento: <strong>Memoria Local</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Ficha técnica del sistema (3 columnas) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              <Boxes className="w-4 h-4 text-zinc-900" />
              <span>Insumos Registrados</span>
            </div>
            <p className="text-2xl font-extrabold text-zinc-900 font-mono">
              {productos.length}
            </p>
            <p className="text-xs text-zinc-500">
              {productosActivos.length} disponibles en cocina activa
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              <Store className="w-4 h-4 text-zinc-900" />
              <span>Proveedores Vinculados</span>
            </div>
            <p className="text-2xl font-extrabold text-zinc-900 font-mono">
              {proveedores.length}
            </p>
            <p className="text-xs text-zinc-500">
              Asociados para despacho de mercancía
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              <Truck className="w-4 h-4 text-zinc-900" />
              <span>Historial de Órdenes</span>
            </div>
            <p className="text-2xl font-extrabold text-zinc-900 font-mono">
              {pedidos.length}
            </p>
            <p className="text-xs text-zinc-500">
              Pedidos generados y procesados
            </p>
          </div>
        </div>

        {/* Módulos principales y flujo de trabajo */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider font-display">
              Módulos y Flujo Operativo
            </h3>
            <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
              Haz clic en cualquier módulo para abrirlo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {modulos.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  onClick={() => setActiveTab(mod.id)}
                  className="p-5 rounded-2xl bg-zinc-50/60 border border-zinc-200 hover:border-black hover:bg-white transition-all cursor-pointer group shadow-xs hover:shadow-md flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-zinc-900 group-hover:text-black font-display">
                        {mod.titulo}
                      </h4>
                      <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 group-hover:text-black transition-all shrink-0" />
                    </div>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                      {mod.descripcion}
                    </p>
                    <span className="inline-block mt-2.5 text-[11px] font-semibold text-zinc-600 bg-white border border-zinc-200 px-2 py-0.5 rounded-md">
                      {mod.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Características clave y buenas prácticas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 text-white space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold font-display text-white">
              Garantías Operativas del Sistema
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span><strong>Sumado automático:</strong> La recepción suma cantidades directo al stock de cada producto.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span><strong>Formato WhatsApp:</strong> Texto estructurado por proveedor listo para copiar o compartir.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span><strong>Sin flechas/spinners:</strong> Campos numéricos puros para evitar errores accidentales de digitación.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
