import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import PedidosView from './components/PedidosView';
import InventarioView from './components/InventarioView';
import GestionProductosView from './components/GestionProductosView';
import ConfiguracionView from './components/ConfiguracionView';
import LoginView from './components/auth/LoginView';
import MembresiaVencidaView from './components/auth/MembresiaVencidaView';
import SuperAdminView from './components/admin/SuperAdminView';
import PortalComprasView from './components/PortalComprasView';
import AnimatedModal from './components/common/AnimatedModal';
import ScrollRevealWrapper from './components/common/ScrollRevealWrapper';
import { 
  Home, 
  ShoppingCart, 
  Boxes, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  UtensilsCrossed,
  Trash2,
  X,
  Loader2,
  Crown
} from 'lucide-react';

function MainLayout() {
  const [activeTab, setActiveTab] = useState('home');
  // Por defecto, la vista administrativa es 'panel' para el Super Administrador
  const [vistaAdmin, setVistaAdmin] = useState('panel'); // 'panel' | 'app'

  const { 
    currentUser, 
    userProfile,
    cargandoAuth, 
    membresiaValida, 
    esAdmin, 
    negocioImpersonado,
    negocioActivo 
  } = useAuth();

  const { 
    notificacion, 
    modalConfirmacion, 
    errorFirebase, 
    cerrarAlerta,
    pedidos = [],
    carritoPedido = {}
  } = useInventory();

  // Contadores para insignias (badges) en mobile
  const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'parcial');
  const itemsPendientesCount = pedidosPendientes.reduce((acc, p) => {
    return acc + (p.grupos || []).reduce((gAcc, g) => gAcc + (g.items || []).filter(i => !i.recibido).length, 0);
  }, 0);
  const itemsEnCarritoCount = Object.values(carritoPedido || {}).filter(d => Number(d?.cantidad) > 0).length;

  const mobileNavRef = useRef(null);
  const mobileTabRefs = useRef({});
  const [mobilePillStyle, setMobilePillStyle] = useState({ width: 0, height: 0, transform: 'translate3d(0px, 0, 0)', opacity: 0 });

  const nombreAreaConsumo = negocioActivo?.nombreAreaConsumo || 'Consumo Cocina';
  const etiquetaCortaArea = nombreAreaConsumo.split('/')[0].split(' ')[0] || 'Consumo';
  const esVistaPanelAdmin = esAdmin && vistaAdmin === 'panel' && !negocioImpersonado;

  const actualizarMobilePill = () => {
    const activeBtn = mobileTabRefs.current[activeTab];
    if (activeBtn && mobileNavRef.current) {
      setMobilePillStyle({
        width: `${activeBtn.offsetWidth}px`,
        height: `${activeBtn.offsetHeight}px`,
        transform: `translate3d(${activeBtn.offsetLeft}px, ${activeBtn.offsetTop}px, 0)`,
        opacity: 1
      });
    } else {
      setMobilePillStyle(prev => ({ ...prev, opacity: 0 }));
    }
  };

  useLayoutEffect(() => {
    actualizarMobilePill();
  }, [activeTab, etiquetaCortaArea, esVistaPanelAdmin, cargandoAuth, currentUser, userProfile]);

  useEffect(() => {
    window.addEventListener('resize', actualizarMobilePill);
    return () => window.removeEventListener('resize', actualizarMobilePill);
  }, [activeTab, etiquetaCortaArea]);

  // Asegurar que si el usuario autenticado es Super Admin, la vista inicial sea siempre su Panel Maestro
  useEffect(() => {
    if (esAdmin && !negocioImpersonado) {
      setVistaAdmin('panel');
    }
  }, [esAdmin, negocioImpersonado]);

  // 0. Si se accede mediante el enlace directo de Empleados de Compras (?compras=negocioId), mostrar el Portal de Compras sin requerir contraseña
  const comprasTenantId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('compras')
    : null;

  if (comprasTenantId) {
    return <PortalComprasView tenantId={comprasTenantId} />;
  }

  // 1. Pantalla de carga mientras se verifica la sesión en Firebase Auth o se recupera el perfil del negocio
  if (cargandoAuth || (currentUser && !userProfile)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center font-body">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mb-4 shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
        <h2 className="text-white text-base font-bold font-display tracking-wide">
          CARGANDO SISTEMA
        </h2>
        <p className="text-zinc-500 text-xs mt-1">Verificando credenciales y membresía...</p>
      </div>
    );
  }

  // 2. Si no hay sesión iniciada, mostrar pantalla de login corporativa
  if (!currentUser) {
    return <LoginView />;
  }

  // 3. Si el usuario no es admin y su membresía venció o está suspendida, bloquear acceso
  if (!membresiaValida) {
    return <MembresiaVencidaView />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-body selection:bg-black selection:text-white">
      {/* Barra de navegación superior (Diferenciada totalmente entre Panel Maestro y Plataforma Cliente) */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        vistaAdmin={vistaAdmin}
        setVistaAdmin={setVistaAdmin}
      />

      {/* =========================================================================
          POPUP DE ALERTAS MODAL (Éxito, Error, Advertencia, Información)
          ========================================================================= */}
      <AnimatedModal
        isOpen={notificacion}
        onBackdropClick={cerrarAlerta}
        overlayClassName="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        panelClassName="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 text-center space-y-4 relative"
        role="alertdialog"
      >
        {(notif) => (
          <>
            <button
              type="button"
              onClick={cerrarAlerta}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full cursor-pointer transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-4 h-4" />
            </button>

            {notif.tipo === 'success' && (
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            )}
            {notif.tipo === 'warning' && (
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
            )}
            {(notif.tipo === 'danger' || notif.tipo === 'error') && (
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
            )}
            {notif.tipo === 'info' && (
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-800 flex items-center justify-center mx-auto shadow-sm">
                <Info className="w-8 h-8" />
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-900 font-display">
                {notif.titulo || (
                  notif.tipo === 'success' ? '¡Operación Exitosa!' :
                  notif.tipo === 'warning' ? 'Atención' :
                  notif.tipo === 'danger' ? 'Error' : 'Información'
                )}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                {notif.mensaje}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={cerrarAlerta}
                className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </>
        )}
      </AnimatedModal>

      {/* =========================================================================
          POPUP DE CONFIRMACIÓN DE ELIMINACIÓN: OPCIÓN "DESCARTAR" Y "SÍ, ELIMINAR"
          ========================================================================= */}
      <AnimatedModal
        isOpen={modalConfirmacion}
        overlayClassName="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        panelClassName="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 text-center space-y-4"
        role="dialog"
        ariaModal="true"
      >
        {(confirmData) => (
          <>
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 font-display">
                {confirmData.titulo || '¿Eliminar elemento?'}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {confirmData.mensaje}
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={confirmData.onCancelar}
                className="flex-1 py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {confirmData.textoCancelar || 'Descartar'}
              </button>
              <button
                type="button"
                onClick={confirmData.onConfirmar}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmData.textoConfirmar || 'Sí, eliminar'}</span>
              </button>
            </div>
          </>
        )}
      </AnimatedModal>

      {/* Contenido principal de las vistas: ancho completo (max-w-6xl) en panel admin */}
      <main className={`flex-1 w-full mx-auto px-4 py-6 ${
        esVistaPanelAdmin ? 'max-w-6xl pb-12' : 'max-w-4xl pb-24 sm:pb-8'
      }`}>
        {/* Banner de advertencia si las Reglas de Firebase no están publicadas */}
        {errorFirebase === 'permission-denied' && (
          <div className="mb-6 p-4 sm:p-5 bg-amber-50 border-2 border-amber-400 rounded-2xl text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Firebase conectado, pero faltan publicar las Reglas en la Consola
                </h3>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  Firestore está bloqueando el guardado con <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-semibold">permission-denied</code>. 
                  Para habilitar la base de datos: En <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-bold hover:text-black">Firebase Console</a> ve a <strong>Firestore Database &gt; Reglas (Rules)</strong>, copia y pega la regla de acceso y pulsa <strong>Publicar</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const regla = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`;
                navigator.clipboard.writeText(regla);
                alert('¡Regla copiada al portapapeles!\n\nPégala en Firebase Console > Firestore Database > Reglas y haz clic en "Publicar".');
              }}
              className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-sm transition-all whitespace-nowrap self-stretch sm:self-auto text-center"
            >
              Copiar Regla
            </button>
          </div>
        )}

        {/* 4. VISTA DE SUPER ADMINISTRADOR vs VISTAS OPERATIVAS DEL NEGOCIO */}
        <ScrollRevealWrapper activeTab={esVistaPanelAdmin ? 'admin' : activeTab}>
          {esVistaPanelAdmin ? (
            <SuperAdminView />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeView setActiveTab={setActiveTab} />
              )}
              <div className={activeTab === 'pedidos' ? 'block' : 'hidden'}>
                <PedidosView />
              </div>
              {activeTab === 'stock' && <InventarioView />}
              {activeTab === 'catalogo' && <GestionProductosView />}
              {activeTab === 'configuracion' && <ConfiguracionView />}
            </>
          )}
        </ScrollRevealWrapper>
      </main>

      {/* Barra de navegación inferior móvil con indicador deslizante (Sliding Pill) */}
      {!esVistaPanelAdmin && (
        <div
          ref={mobileNavRef}
          className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-md border-t border-zinc-800 py-1.5 px-2 flex justify-around items-center shadow-2xl"
        >
          {/* Píldora blanca deslizante que pasa suavemente de una pestaña a otra en responsive */}
          <span
            aria-hidden="true"
            style={mobilePillStyle}
            className="absolute left-0 top-0 bg-white rounded-xl shadow-md pointer-events-none z-0 transition-[transform,width,height,opacity] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)]"
          />

          <button
            ref={(el) => { mobileTabRefs.current['home'] = el; }}
            type="button"
            onClick={() => setActiveTab('home')}
            className={`relative z-10 flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-colors duration-300 cursor-pointer ${
              activeTab === 'home'
                ? 'text-black font-bold' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Home className={`w-4 h-4 transition-colors duration-300 ${activeTab === 'home' ? 'text-black nav-icon-active' : ''}`} />
            <span className="mt-0.5">Home</span>
          </button>

          <button
            ref={(el) => { mobileTabRefs.current['pedidos'] = el; }}
            type="button"
            onClick={() => setActiveTab('pedidos')}
            className={`relative z-10 flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-colors duration-300 cursor-pointer ${
              activeTab === 'pedidos'
                ? 'text-black font-bold' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <ShoppingCart className={`w-4 h-4 transition-colors duration-300 ${activeTab === 'pedidos' ? 'text-black nav-icon-active' : ''}`} />
              {/* Badge si hay productos pendientes por recibir */}
              {itemsPendientesCount > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1 min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-black rounded-full bg-amber-400 text-black shadow-xs ring-1 ring-black">
                  {itemsPendientesCount}
                </span>
              )}
            </div>
            <span className="mt-0.5">Pedidos</span>
          </button>

          <button
            ref={(el) => { mobileTabRefs.current['stock'] = el; }}
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`relative z-10 flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-colors duration-300 cursor-pointer ${
              activeTab === 'stock'
                ? 'text-black font-bold' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UtensilsCrossed className={`w-4 h-4 transition-colors duration-300 ${activeTab === 'stock' ? 'text-black nav-icon-active' : ''}`} />
            <span className="mt-0.5">{etiquetaCortaArea}</span>
          </button>

          <button
            ref={(el) => { mobileTabRefs.current['catalogo'] = el; }}
            type="button"
            onClick={() => setActiveTab('catalogo')}
            className={`relative z-10 flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-colors duration-300 cursor-pointer ${
              activeTab === 'catalogo'
                ? 'text-black font-bold' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Boxes className={`w-4 h-4 transition-colors duration-300 ${activeTab === 'catalogo' ? 'text-black nav-icon-active' : ''}`} />
            <span className="mt-0.5">Productos</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <MainLayout />
      </InventoryProvider>
    </AuthProvider>
  );
}
