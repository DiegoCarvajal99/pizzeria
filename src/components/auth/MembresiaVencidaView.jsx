import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  AlertTriangle, 
  MessageCircle, 
  LogOut, 
  Calendar, 
  Store,
  ShieldAlert,
  Clock
} from 'lucide-react';

export default function MembresiaVencidaView() {
  const { negocioActivo, cerrarSesion, whatsappAdmin } = useAuth();

  const fechaFormateada = negocioActivo?.fechaVencimiento
    ? new Date(negocioActivo.fechaVencimiento).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Recientemente';

  const esSuspendido = negocioActivo?.estado === 'suspendido';

  const mensajeWhatsApp = encodeURIComponent(
    `Hola, me comunico de *${negocioActivo?.nombreNegocio || 'mi negocio'}*. Deseo renovar la membresía de la plataforma de inventario.`
  );

  const enlaceWhatsApp = `https://wa.me/${whatsappAdmin.replace(/[^0-9]/g, '')}?text=${mensajeWhatsApp}`;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-body selection:bg-rose-500 selection:text-white">
      {/* Luz ambiental roja/ámbar de alerta */}
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-rose-950/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-amber-950/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Tarjeta Principal */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          {/* Logo del negocio del cliente */}
          <div className="flex justify-center">
            {negocioActivo?.logoUrl ? (
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-md max-w-[200px]">
                <img 
                  src={negocioActivo.logoUrl} 
                  alt={negocioActivo.nombreNegocio} 
                  className="max-h-12 w-auto object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shadow-md mx-auto">
                {negocioActivo?.emoji || '🏪'}
              </div>
            )}
          </div>

          {/* Insignia de Estado */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{esSuspendido ? 'Acceso Pausado' : 'Membresía Vencida'}</span>
          </div>

          {/* Título y Mensaje */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-extrabold font-display text-white">
              {negocioActivo?.nombreNegocio || 'Tu Negocio'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
              {esSuspendido
                ? 'El acceso a este negocio se encuentra temporalmente suspendido por el administrador.'
                : `Tu periodo de membresía finalizó el ${fechaFormateada}. Para continuar registrando insumos, controlando tu stock y generando pedidos, solicita tu renovación.`
              }
            </p>
          </div>

          {/* Caja con detalle de suscripción */}
          <div className="p-3.5 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl text-xs space-y-1 text-zinc-300">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Propietario:</span>
              <span className="font-bold">{negocioActivo?.propietario || 'No registrado'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Fecha de vencimiento:</span>
              <span className="font-mono text-rose-400 font-bold">{fechaFormateada}</span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 space-y-2.5">
            <a
              href={enlaceWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contactar Asesor para Renovar</span>
            </a>

            <button
              type="button"
              onClick={cerrarSesion}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-zinc-800"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-600">
          Tus datos de productos, recetas y proveedores siguen guardados de forma segura en la nube.
        </p>
      </div>
    </div>
  );
}

