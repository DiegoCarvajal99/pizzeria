import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import AnimatedModal from './common/AnimatedModal';
import {
  Home,
  ShoppingCart,
  Boxes,
  UtensilsCrossed,
  ShieldCheck,
  LogOut,
  Clock,
  ArrowLeft,
  Crown,
  Users,
  User,
  Settings,
  ChevronDown,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Store,
  Calendar,
  Sparkles,
  KeyRound,
  Phone,
  Mail,
  Plus,
  Trash2,
  Copy,
  Link2,
  ExternalLink,
  UserPlus
} from 'lucide-react';

/**
 * Componente de Menú de Usuario con Dropdown y Modal de "Tu Perfil" (Configuración abre como página)
 */
function UserMenuDropdown({ activeTab, setActiveTab, setVistaAdmin }) {
  const {
    currentUser,
    userProfile,
    negocioActivo,
    esAdmin,
    diasRestantes,
    cerrarSesion
  } = useAuth();

  // Estados de apertura
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false);

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'No registrada';
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return fechaStr;
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fechaStr;
    }
  };

  const perfil = negocioActivo || userProfile;
  const nombreMostrado = perfil?.nombreNegocio || (esAdmin ? 'ADMINISTRADOR MAESTRO' : 'MI NEGOCIO');
  const esLiaco = (negocioActivo?.email || currentUser?.email)?.toLowerCase() === 'liacopizzeria@yopmail.com';
  const esAssetLiaco = (url) => {
    if (!url) return false;
    const u = String(url).toLowerCase().trim();
    return u === '/logo.png' || u === '/hero-banner.png' || u === '/logo-liaco.png' || u === '/logo.jpg';
  };
  const logoPerfilValido = perfil?.logoUrl && (esLiaco || !esAssetLiaco(perfil.logoUrl));

  return (
    <>
      {/* BOTÓN DESPLEGABLE EN EL NAVBAR */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer group shadow-sm"
          title="Menú de Usuario"
        >
          <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            {esAdmin ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : <User className="w-3.5 h-3.5 text-amber-400" />}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform ${menuAbierto ? 'rotate-180' : ''}`} />
        </button>

        {/* MENÚ FLOTANTE */}
        {menuAbierto && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuAbierto(false)}
            />
            <div className="absolute right-0 mt-2 w-60 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 p-1.5 animate-scale-up space-y-1">
              {/* Encabezado del Menú */}
              <div className="px-3 py-2 border-b border-zinc-800/80">
                <p className="text-xs font-black text-white truncate font-display">
                  {nombreMostrado}
                </p>
                <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">
                  {currentUser?.email}
                </p>
              </div>

              {/* 1. Opción: Tu Perfil */}
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  setModalPerfilAbierto(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer text-left"
              >
                <User className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Tu Perfil</span>
              </button>

              {/* 2. Opción: Configuración (Navega a la página de Configuración) */}
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  if (setVistaAdmin) setVistaAdmin('app');
                  if (setActiveTab) setActiveTab('configuracion');
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${activeTab === 'configuracion'
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                  }`}
              >
                <Settings className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Configuración</span>
              </button>

              <div className="h-px bg-zinc-800/80 my-1" />

              {/* 3. Opción: Cerrar Sesión */}
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  cerrarSesion();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* =====================================================================
          MODAL 1: TU PERFIL (INFORMACIÓN DEL NEGOCIO Y MEMBRESÍA)
          ===================================================================== */}
      <AnimatedModal
        isOpen={modalPerfilAbierto}
        onBackdropClick={() => setModalPerfilAbierto(false)}
        overlayClassName="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        panelClassName="bg-zinc-950 border border-zinc-800 text-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto font-body"
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={() => setModalPerfilAbierto(false)}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabecera del modal */}
        <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            {logoPerfilValido ? (
              <img src={perfil.logoUrl} alt="Logo" className="max-h-8 max-w-8 object-contain" />
            ) : (
              <Store className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white font-display">
                {perfil?.nombreNegocio || (esAdmin ? 'ADMINISTRADOR MAESTRO' : 'MI NEGOCIO')}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {esAdmin ? 'Cuenta Principal de Super Administrador SaaS' : 'Ficha y estado de suscripción del negocio'}
            </p>
          </div>
        </div>

        {/* SECCIÓN 1: ESTADO DE MEMBRESÍA */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Estado de Membresía</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${esAdmin || diasRestantes > 5
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}>
              {perfil?.estado === 'activo' || esAdmin ? 'Activa' : 'Inactiva'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">Días Restantes</span>
              <span className="text-xl font-black text-white font-mono mt-0.5 block">
                {esAdmin ? 'Vitalicio (Ilimitado)' : `${diasRestantes} días`}
              </span>
            </div>

            <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">Fecha de Vencimiento</span>
              <span className="text-xs font-bold text-zinc-200 mt-1 block">
                {esAdmin ? 'Sin Vencimiento' : formatearFecha(perfil?.fechaVencimiento)}
              </span>
            </div>
          </div>

          {!esAdmin && (
            <div className="text-[11px] text-zinc-400 pt-1 flex items-center justify-between border-t border-zinc-800/60 mt-2">
              <span>Fecha de inicio de periodo:</span>
              <span className="font-semibold text-zinc-300">{formatearFecha(perfil?.fechaInicioMembresia)}</span>
            </div>
          )}
        </div>

        {/* SECCIÓN 2: DETALLES DEL NEGOCIO */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Información Registrada
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/70">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Propietario / Responsable</span>
              <span className="font-bold text-zinc-200 mt-0.5 block truncate">
                {perfil?.propietario || 'No registrado'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/70">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Correo Electrónico</span>
              <span className="font-mono text-zinc-200 mt-0.5 block truncate">
                {perfil?.email || currentUser?.email}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/70">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Rubro Comercial</span>
              <span className="font-bold text-zinc-200 mt-0.5 block capitalize">
                {perfil?.emoji} {perfil?.rubro || 'Restaurante'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/70">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Sede Operativa</span>
              <span className="font-bold text-zinc-200 mt-0.5 block">
                {perfil?.sede || 'PRINCIPAL'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/70 sm:col-span-2">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Área de Consumo de Insumos</span>
              <span className="font-bold text-zinc-200 mt-0.5 block">
                {perfil?.nombreAreaConsumo || 'Consumo Cocina'}
              </span>
            </div>
          </div>
        </div>

        {/* Botón de cierre */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setModalPerfilAbierto(false)}
            className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </AnimatedModal>
    </>
  );
}

/**
 * Barra de Navegación Principal
 */
export default function Navbar({ activeTab, setActiveTab, vistaAdmin, setVistaAdmin }) {
  const { pedidos = [], carritoPedido = {} } = useInventory();
  const {
    negocioActivo,
    esAdmin,
    diasRestantes,
    negocioImpersonado,
    cambiarNegocioActivo,
    currentUser,
    todosLosClientes = []
  } = useAuth();

  const [imgError, setImgError] = useState(false);
  const navRef = useRef(null);
  const tabRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({ width: 0, transform: 'translate3d(0px, 0, 0)', opacity: 0 });

  const nombreArea = negocioActivo?.nombreAreaConsumo || 'Consumo Cocina';

  const actualizarPosicionPill = () => {
    const activeBtn = tabRefs.current[activeTab];
    if (activeBtn && navRef.current) {
      setPillStyle({
        width: `${activeBtn.offsetWidth}px`,
        height: `${activeBtn.offsetHeight}px`,
        transform: `translate3d(${activeBtn.offsetLeft}px, 0, 0)`,
        opacity: 1
      });
    } else {
      setPillStyle(prev => ({ ...prev, opacity: 0 }));
    }
  };

  useLayoutEffect(() => {
    actualizarPosicionPill();
  }, [activeTab, nombreArea, esAdmin, negocioImpersonado]);

  useEffect(() => {
    setImgError(false);
  }, [negocioActivo?.id, negocioActivo?.logoUrl]);

  useEffect(() => {
    window.addEventListener('resize', actualizarPosicionPill);
    return () => window.removeEventListener('resize', actualizarPosicionPill);
  }, [activeTab, nombreArea]);

  // =========================================================================
  // CASO 1: SUPER ADMINISTRADOR EN SU PANEL MAESTRO (NO EN MODO SOPORTE)
  // =========================================================================
  if (esAdmin && !negocioImpersonado) {
    return (
      <header className="sticky top-0 z-30 bg-zinc-950 border-b border-zinc-800 shadow-xl">
        <div className="max-w-6xl w-full mx-auto px-4 py-2.5 flex items-center justify-between gap-4">

          {/* LOGO & IDENTIDAD DE LA PLATAFORMA SAAS */}
          <div
            onClick={() => {
              if (setVistaAdmin) setVistaAdmin('panel');
              if (setActiveTab) setActiveTab('home');
            }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20">
              <Crown className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-white tracking-wide font-display">
                  SISTEMA SAAS CONTROL
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Panel Maestro
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                Gestión Centralizada de Clientes, Membresías y Marca Blanca
              </p>
            </div>
          </div>

          {/* ACCIONES DEL ADMINISTRADOR MAESTRO */}
          <div className="flex items-center gap-2 sm:gap-3">
            {vistaAdmin === 'app' && (
              <button
                type="button"
                onClick={() => {
                  if (setVistaAdmin) setVistaAdmin('panel');
                  if (setActiveTab) setActiveTab('home');
                }}
                className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Panel Maestro</span>
              </button>
            )}

            {/* Contador de negocios de clientes registrados */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>{todosLosClientes.length} Clientes</span>
            </div>

            {/* Correo del Super Admin */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[150px] sm:max-w-[200px]">{currentUser?.email}</span>
            </div>

            {/* MENÚ DE USUARIO DESPLEGABLE (Perfil, Configuración, Cerrar Sesión) */}
            <UserMenuDropdown activeTab={activeTab} setActiveTab={setActiveTab} setVistaAdmin={setVistaAdmin} />
          </div>
        </div>
      </header>
    );
  }

  // =========================================================================
  // CASO 2: VISTA DE APLICACIÓN DEL CLIENTE (O SUPER ADMIN EN MODO SOPORTE)
  // =========================================================================

  // Contar pedidos pendientes de confirmación y productos en el carrito activo
  const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'parcial');
  const itemsPendientesCount = pedidosPendientes.reduce((acc, p) => {
    return acc + (p.grupos || []).reduce((gAcc, g) => gAcc + (g.items || []).filter(i => !i.recibido).length, 0);
  }, 0);
  const itemsEnCarritoCount = Object.values(carritoPedido || {}).filter(d => Number(d?.cantidad) > 0).length;

  const esLiaco = negocioActivo?.email?.toLowerCase() === 'liacopizzeria@yopmail.com';
  const esAssetLiaco = (url) => {
    if (!url) return false;
    const u = String(url).toLowerCase().trim();
    return u === '/logo.png' || u === '/hero-banner.png' || u === '/logo-liaco.png' || u === '/logo.jpg';
  };
  const rawLogoCandidate = (negocioActivo?.logoUrl || '').trim();
  const rawLogo = (!esLiaco && esAssetLiaco(rawLogoCandidate))
    ? ''
    : (rawLogoCandidate || (esLiaco ? '/logo.png' : ''));
  const logoUrl = (!imgError && rawLogo) ? rawLogo : '';
  const nombreMarca = (negocioActivo?.nombreNegocio || 'MI NEGOCIO').trim().toUpperCase();

  // Opciones del menú del cliente: Home, Pedidos, [Área Consumo], Productos
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { 
      id: 'pedidos', 
      label: 'Pedidos', 
      icon: ShoppingCart, 
      badge: itemsPendientesCount, 
      badgeColor: 'bg-zinc-800 text-zinc-200' 
    },
    { id: 'stock', label: nombreArea, icon: UtensilsCrossed },
    { id: 'catalogo', label: 'Productos', icon: Boxes }
  ];

  return (
    <header className="sticky top-0 z-30 bg-black border-b border-zinc-800 shadow-xl">
      {/* BANNER: MODO SOPORTE ACTIVO (El Super Admin está auditando a un cliente) */}
      {negocioImpersonado && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black px-4 py-2 text-xs font-black flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck className="w-4 h-4 shrink-0 text-black" />
            <span className="truncate">
              MODO SOPORTE: Viendo como &quot;{negocioImpersonado.nombreNegocio}&quot; ({negocioImpersonado.email})
            </span>
          </div>
          <button
            type="button"
            onClick={() => cambiarNegocioActivo(null)}
            className="shrink-0 ml-3 bg-black hover:bg-zinc-800 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Panel Admin</span>
          </button>
        </div>
      )}

      <div className="max-w-4xl w-full mx-auto px-4 py-2 flex items-center justify-between gap-3">
        {/* LOGO O TEXTO PREDETERMINADO DEL NEGOCIO */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center cursor-pointer shrink-0 group py-1"
          title="Ir al Inicio"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={nombreMarca}
              onError={() => setImgError(true)}
              className="h-8 sm:h-9 w-auto max-w-[130px] sm:max-w-[160px] object-contain group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white group-hover:border-zinc-700 transition-colors shadow-xs">
              <span className="text-sm sm:text-base leading-none">{negocioActivo?.emoji || '🏪'}</span>
              <span className="text-xs sm:text-sm font-black text-white tracking-wider uppercase font-display truncate max-w-[120px] sm:max-w-[160px] group-hover:text-zinc-200">
                {nombreMarca}
              </span>
            </div>
          )}
        </div>

        {/* NAVEGACIÓN EN ESCRITORIO CON INDICADOR DESLIZANTE (SLIDING PILL) */}
        <nav ref={navRef} className="hidden sm:flex items-center space-x-1 py-1 relative">
          {/* Píldora blanca deslizante que pasa suavemente de una pestaña a otra */}
          <span
            aria-hidden="true"
            style={pillStyle}
            className="absolute left-0 top-1 bg-white rounded-xl shadow-md pointer-events-none z-0 transition-[transform,width,height,opacity] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)]"
          />

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-300 whitespace-nowrap cursor-pointer group ${isActive
                    ? 'text-black font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                  }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-4 h-4 transition-colors duration-300 ${isActive
                      ? 'text-black nav-icon-active'
                      : 'text-zinc-400 group-hover:text-white'
                    }`} />
                </div>
                <span>{tab.label}</span>
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[10px] font-extrabold rounded-full transition-colors duration-300 ${isActive
                        ? 'bg-black text-white'
                        : tab.badgeColor || 'bg-zinc-800 text-zinc-200'
                      }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ACCIONES LATERALES */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Días restantes de membresía para el cliente */}
          {!esAdmin && (
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors ${diasRestantes <= 5
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 animate-pulse'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
              title={`Membresía activa: ${diasRestantes} días restantes`}
            >
              <Clock className="w-3 h-3 shrink-0" />
              <span>{diasRestantes}d</span>
            </div>
          )}

          {/* MENÚ DE USUARIO DESPLEGABLE (Perfil, Configuración, Cerrar Sesión) */}
          <UserMenuDropdown activeTab={activeTab} setActiveTab={setActiveTab} setVistaAdmin={setVistaAdmin} />
        </div>
      </div>
    </header>
  );
}
