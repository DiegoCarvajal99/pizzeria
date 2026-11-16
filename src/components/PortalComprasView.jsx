import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import AnimatedModal from './common/AnimatedModal';
import ScrollRevealWrapper from './common/ScrollRevealWrapper';
import {
  ShoppingBag,
  User,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Store,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Package,
  Search,
  X,
  ArrowRight,
  Loader2,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  History,
  CheckCheck,
  Check
} from 'lucide-react';

export default function PortalComprasView({ tenantId }) {
  const negocioKey = tenantId || 'default_tenant';

  // Información del negocio (inicializada desde caché local si ya se había cargado antes)
  const [infoNegocio, setInfoNegocio] = useState(() => {
    try {
      const guardado = localStorage.getItem(`inv_${negocioKey}_info_negocio`);
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });
  const [imgError, setImgError] = useState(false);

  // Empleados y Pedidos cargados desde Firestore + LocalStorage
  const [empleados, setEmpleados] = useState(() => {
    try {
      const localTenant = localStorage.getItem(`inv_${negocioKey}_empleados_compras`);
      if (localTenant) return JSON.parse(localTenant);
      const localActivo = localStorage.getItem('inv_empleados_compras_activo');
      return localActivo ? JSON.parse(localActivo) : [];
    } catch {
      return [];
    }
  });

  const [pedidos, setPedidos] = useState(() => {
    try {
      const localTenant = localStorage.getItem(`inv_${negocioKey}_pedidos`);
      return localTenant ? JSON.parse(localTenant) : [];
    } catch {
      return [];
    }
  });

  const [cargandoDatos, setCargandoDatos] = useState(true);

  // Estado de sesión del empleado (solo con usuario, sin contraseña)
  const [empleadoActual, setEmpleadoActual] = useState(() => {
    try {
      const guardado = sessionStorage.getItem(`portal_compras_emp_${negocioKey}`);
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });

  const [usuarioInput, setUsuarioInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [mostrarPinLogin, setMostrarPinLogin] = useState(false);
  const [errorLogin, setErrorLogin] = useState(null);
  const [bloqueoSegundos, setBloqueoSegundos] = useState(0);
  const [busquedaPedido, setBusquedaPedido] = useState('');
  const [busquedaHistorial, setBusquedaHistorial] = useState('');

  // Contador de bloqueo por intentos fallidos (Rate Limiting de 15 minutos tras 5 fallos)
  useEffect(() => {
    const claveStorage = `portal_lock_${negocioKey}`;
    const verificarBloqueo = () => {
      try {
        const lockTime = parseInt(localStorage.getItem(claveStorage) || '0', 10);
        const restante = Math.ceil((lockTime - Date.now()) / 1000);
        if (restante > 0) {
          setBloqueoSegundos(restante);
        } else {
          setBloqueoSegundos(0);
        }
      } catch (e) {}
    };

    verificarBloqueo();
    const interval = setInterval(verificarBloqueo, 1000);
    return () => clearInterval(interval);
  }, [negocioKey]);

  // Pestaña activa del empleado: 'pendientes' | 'historial'
  const [tabEmpleado, setTabEmpleado] = useState('pendientes');

  // Referencias para la animación suave tipo "Sliding Pill" en el selector de pestañas
  const tabsContainerRef = useRef(null);
  const tabRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({ width: 0, height: 0, transform: 'translate3d(0px, 0, 0)', opacity: 0 });

  const actualizarPillPos = () => {
    const btn = tabRefs.current[tabEmpleado];
    if (btn && tabsContainerRef.current) {
      setPillStyle({
        width: `${btn.offsetWidth}px`,
        height: `${btn.offsetHeight}px`,
        transform: `translate3d(${btn.offsetLeft}px, ${btn.offsetTop}px, 0)`,
        opacity: 1
      });
    }
  };

  useLayoutEffect(() => {
    actualizarPillPos();
  }, [tabEmpleado]);

  useEffect(() => {
    window.addEventListener('resize', actualizarPillPos);
    return () => window.removeEventListener('resize', actualizarPillPos);
  }, [tabEmpleado]);

  // Estado para acordeones de pedidos abiertos (Set de pedido.id)
  const [acordeonAbiertos, setAcordeonAbiertos] = useState({});

  // Modal para confirmar compra de un producto o de un pedido
  // modalConfirmarCompra: { tipo: 'item' | 'pedido', pedido, item, grupo, nuevoEstado }
  const [modalConfirmarCompra, setModalConfirmarCompra] = useState(null);
  const [procesandoCompra, setProcesandoCompra] = useState(false);

  // Modal cuando no hay listas pendientes por recibir
  const [modalSinListasAbierto, setModalSinListasAbierto] = useState(false);

  // 1. Cargar datos del negocio, empleados y pedidos en tiempo real
  useEffect(() => {
    let negocioListo = false;
    let empleadosListos = false;
    let pedidosListos = false;

    const verificarCargaCompleta = () => {
      if (negocioListo && empleadosListos && pedidosListos) {
        setCargandoDatos(false);
      }
    };

    // Info del negocio en tiempo real
    const unsubNegocio = onSnapshot(
      doc(db, 'negocios', negocioKey),
      (snap) => {
        if (snap.exists()) {
          const dataNegocio = { id: snap.id, ...snap.data() };
          setInfoNegocio(dataNegocio);
          try {
            localStorage.setItem(`inv_${negocioKey}_info_negocio`, JSON.stringify(dataNegocio));
          } catch (e) {}
        }
        negocioListo = true;
        verificarCargaCompleta();
      },
      () => {
        negocioListo = true;
        verificarCargaCompleta();
      }
    );

    // Escuchar empleados de compras
    const unsubEmpleados = onSnapshot(
      collection(db, 'negocios', negocioKey, 'empleados_compras'),
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        if (docs.length > 0) {
          docs.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
          setEmpleados(docs);
          try {
            localStorage.setItem(`inv_${negocioKey}_empleados_compras`, JSON.stringify(docs));
          } catch (e) {}
        }
        empleadosListos = true;
        verificarCargaCompleta();
      },
      () => {
        empleadosListos = true;
        verificarCargaCompleta();
      }
    );

    // Escuchar pedidos del negocio
    const unsubPedidos = onSnapshot(
      collection(db, 'negocios', negocioKey, 'pedidos'),
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0));
        setPedidos(docs);
        try {
          localStorage.setItem(`inv_${negocioKey}_pedidos`, JSON.stringify(docs));
        } catch (e) {}
        pedidosListos = true;
        verificarCargaCompleta();
      },
      () => {
        pedidosListos = true;
        verificarCargaCompleta();
      }
    );

    return () => {
      unsubNegocio();
      unsubEmpleados();
      unsubPedidos();
    };
  }, [negocioKey]);

  // Filtrar pedidos pendientes por recibir
  const pedidosPendientes = pedidos.filter(
    p => p.estado === 'pendiente' || p.estado === 'parcial'
  );

  // Inicializar acordeones abiertos por defecto cuando se cargan pedidos pendientes
  useEffect(() => {
    if (pedidosPendientes.length > 0) {
      setAcordeonAbiertos(prev => {
        const actualizados = { ...prev };
        pedidosPendientes.forEach(p => {
          if (actualizados[p.id] === undefined) {
            actualizados[p.id] = true; // abiertos por defecto para ver rápido
          }
        });
        return actualizados;
      });
    }
  }, [pedidosPendientes.length]);

  // Mostrar automáticamente el modal "No hay listas disponibles" cuando el empleado entra y no hay pendientes
  useEffect(() => {
    if (!cargandoDatos && empleadoActual && tabEmpleado === 'pendientes') {
      if (pedidosPendientes.length === 0) {
        setModalSinListasAbierto(true);
      } else {
        setModalSinListasAbierto(false);
      }
    }
  }, [cargandoDatos, empleadoActual, pedidosPendientes.length, tabEmpleado]);

  const toggleAcordeon = (id) => {
    setAcordeonAbiertos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleIngresarConUsuario = (e) => {
    e.preventDefault();
    setErrorLogin(null);

    // 1. Verificar si está bloqueado por exceso de intentos
    if (bloqueoSegundos > 0) {
      const mins = Math.floor(bloqueoSegundos / 60);
      const segs = bloqueoSegundos % 60;
      setErrorLogin(`⛔ Acceso bloqueado por seguridad. Espera ${mins}m ${segs}s para volver a intentar.`);
      return;
    }

    const userClean = usuarioInput.trim().toUpperCase().replace(/\s+/g, '');
    const pinClean = pinInput.trim().replace(/\D/g, '');

    if (!userClean) {
      setErrorLogin('Por favor escribe tu usuario asignado.');
      return;
    }

    const claveIntentos = `portal_intentos_${negocioKey}`;
    const intentosActuales = parseInt(localStorage.getItem(claveIntentos) || '0', 10);

    const registrarFallo = (mensaje) => {
      const nuevosIntentos = intentosActuales + 1;
      localStorage.setItem(claveIntentos, String(nuevosIntentos));
      if (nuevosIntentos >= 5) {
        // Bloquear por 15 minutos (15 * 60 * 1000 ms)
        const tiempoBloqueo = Date.now() + 15 * 60 * 1000;
        localStorage.setItem(`portal_lock_${negocioKey}`, String(tiempoBloqueo));
        localStorage.removeItem(claveIntentos);
        setBloqueoSegundos(15 * 60);
        setErrorLogin('⛔ Se han superado los 5 intentos fallidos. Acceso bloqueado por 15 minutos.');
      } else {
        const restantes = 5 - nuevosIntentos;
        setErrorLogin(`${mensaje} (${restantes} ${restantes === 1 ? 'intento restante' : 'intentos restantes'})`);
      }
    };

    const encontrado = empleados.find(
      emp => (emp.usuario || '').trim().toUpperCase() === userClean
    );

    if (!encontrado) {
      registrarFallo(`El usuario "${userClean}" no está registrado.`);
      return;
    }

    // 2. Validación obligatoria del PIN de seguridad de 4 dígitos
    if (!pinClean || pinClean.length !== 4) {
      setErrorLogin('Por favor ingresa tu PIN de seguridad de 4 dígitos.');
      return;
    }

    if (encontrado.pin !== pinClean) {
      registrarFallo('PIN de seguridad incorrecto.');
      return;
    }

    // Acceso correcto: resetear contador de intentos fallidos
    localStorage.removeItem(claveIntentos);
    setEmpleadoActual(encontrado);
    try {
      sessionStorage.setItem(`portal_compras_emp_${negocioKey}`, JSON.stringify(encontrado));
    } catch (e) {}
  };

  const handleCerrarSesionEmpleado = () => {
    setEmpleadoActual(null);
    setUsuarioInput('');
    setPinInput('');
    setErrorLogin(null);
    try {
      sessionStorage.removeItem(`portal_compras_emp_${negocioKey}`);
    } catch (e) {}
  };

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

  const esLiaco = infoNegocio?.email?.toLowerCase() === 'liacopizzeria@yopmail.com' || negocioKey === 'cliente_liaco_pizzeria';
  const rawLogo = (infoNegocio?.logoUrl || '').trim() || (esLiaco ? '/logo.png' : '');
  const logoUrl = (!imgError && rawLogo) ? rawLogo : '';
  const nombreNegocio = (infoNegocio?.nombreNegocio || 'MI NEGOCIO').toUpperCase();

  // ACCIÓN DE COMPRA EN TIEMPO REAL:
  // Marcar un producto específico como comprado por este empleado
  const handleConfirmarAccionCompra = async () => {
    if (!modalConfirmarCompra || !empleadoActual) return;
    setProcesandoCompra(true);

    const { tipo, pedido, item } = modalConfirmarCompra;
    const ahoraIso = new Date().toISOString();

    try {
      let nuevosGrupos = [];

      if (tipo === 'item') {
        nuevosGrupos = pedido.grupos.map(g => {
          const itemsActualizados = g.items.map(it => {
            if (it.productoId === item.productoId) {
              return {
                ...it,
                comprado: true,
                compradoPor: empleadoActual.nombre,
                compradoPorUsuario: empleadoActual.usuario,
                fechaCompra: ahoraIso
              };
            }
            return it;
          });
          return { ...g, items: itemsActualizados };
        });
      } else if (tipo === 'pedido') {
        // Marcar todos los ítems aún no comprados de este pedido como comprados por el empleado
        nuevosGrupos = pedido.grupos.map(g => {
          const itemsActualizados = g.items.map(it => {
            if (!it.comprado) {
              return {
                ...it,
                comprado: true,
                compradoPor: empleadoActual.nombre,
                compradoPorUsuario: empleadoActual.usuario,
                fechaCompra: ahoraIso
              };
            }
            return it;
          });
          return { ...g, items: itemsActualizados };
        });
      }

      const pedidoRef = doc(db, 'negocios', negocioKey, 'pedidos', pedido.id);
      await updateDoc(pedidoRef, {
        grupos: nuevosGrupos,
        ultimaActualizacionCompra: ahoraIso
      });

      // Actualizar también en memoria y local para feedback instantáneo
      setPedidos(prev => prev.map(p => p.id === pedido.id ? { ...p, grupos: nuevosGrupos } : p));
      setModalConfirmarCompra(null);
    } catch (err) {
      console.error('Error al actualizar compra:', err);
      alert('Error al registrar la compra. Intenta de nuevo.');
    } finally {
      setProcesandoCompra(false);
    }
  };

  // Filtrado de pedidos según búsqueda
  const pedidosPendientesFiltrados = pedidosPendientes.filter(p => {
    const q = busquedaPedido.trim().toLowerCase().replace('#', '');
    if (!q) return true;
    const matchId = String(p.numero || '').toLowerCase().includes(q) || String(p.id || '').toLowerCase().includes(q);
    const matchProv = (p.grupos || []).some(g =>
      (g.proveedorNombre || '').toLowerCase().includes(q) ||
      (g.items || []).some(it => (it.productoNombre || '').toLowerCase().includes(q))
    );
    return matchId || matchProv;
  });

  // Historial personal de compras del empleado logueado
  // Filtramos pedidos que contengan al menos un ítem comprado por este empleado
  const pedidosHistorialEmpleado = pedidos.filter(p => {
    return (p.grupos || []).some(g =>
      (g.items || []).some(it => it.comprado && it.compradoPorUsuario === empleadoActual?.usuario)
    );
  });

  // Filtrado específico para la sección de Mis Compras por ID, proveedor o producto
  const pedidosHistorialFiltrados = pedidosHistorialEmpleado.filter(p => {
    const q = busquedaHistorial.trim().toLowerCase().replace('#', '');
    if (!q) return true;
    const matchId = String(p.numero || '').toLowerCase().includes(q) || String(p.id || '').toLowerCase().includes(q);
    const matchItems = (p.grupos || []).some(g =>
      (g.proveedorNombre || '').toLowerCase().includes(q) ||
      (g.items || []).some(it =>
        it.comprado &&
        it.compradoPorUsuario === empleadoActual?.usuario &&
        (it.productoNombre || '').toLowerCase().includes(q)
      )
    );
    return matchId || matchItems;
  });

  // 0. Mientras carga por primera vez los datos del negocio desde Firestore, mostrar pantalla de carga sin parpadeo de textos
  if (cargandoDatos && !infoNegocio) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center font-body">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mb-4 shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
        <h2 className="text-white text-base font-bold font-display tracking-wide">
          CARGANDO PORTAL DE COMPRAS
        </h2>
        <p className="text-zinc-500 text-xs mt-1">Sincronizando información del negocio...</p>
      </div>
    );
  }

  // ============================================================================
  // VISTA 1: PANTALLA DE ACCESO RÁPIDO SOLO CON USUARIO (SIN CONTRASEÑA)
  // ============================================================================
  if (!empleadoActual) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-body selection:bg-amber-400 selection:text-black">
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 slide-fwd-center">
          {/* Logo y Encabezado */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto p-2.5 shadow-md">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={nombreNegocio}
                  onError={() => setImgError(true)}
                  className="max-h-11 max-w-11 object-contain"
                />
              ) : (
                <Store className="w-8 h-8 text-amber-400" />
              )}
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Portal de Empleados de Compras</span>
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white font-display mt-2.5">
                {nombreNegocio}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Ingresa únicamente con tu <strong>Usuario</strong> asignado para ver las listas de compras pendientes.
              </p>
            </div>
          </div>

          {errorLogin && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/70 flex items-start gap-2.5 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorLogin}</span>
            </div>
          )}

          <form onSubmit={handleIngresarConUsuario} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-zinc-300 mb-2 uppercase tracking-wider">
                Tu Usuario de Compras
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={usuarioInput}
                  onChange={(e) => setUsuarioInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="EJ: CARLOS01"
                  autoFocus
                  required
                  disabled={bloqueoSegundos > 0}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm font-mono font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 uppercase transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-extrabold text-zinc-300 uppercase tracking-wider">
                  PIN de Seguridad (4 Dígitos) *
                </label>
                <span className="text-[10px] text-amber-400 font-semibold uppercase">
                  Obligatorio
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type={mostrarPinLogin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  required
                  disabled={bloqueoSegundos > 0}
                  className="w-full pl-10 pr-12 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-base font-mono font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 tracking-widest text-center transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPinLogin(!mostrarPinLogin)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  title={mostrarPinLogin ? 'Ocultar PIN' : 'Ver PIN'}
                >
                  {mostrarPinLogin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {bloqueoSegundos > 0 && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-700 rounded-2xl text-center space-y-1">
                <p className="text-xs font-bold text-rose-300 flex items-center justify-center gap-1.5">
                  <Clock className="w-4 h-4 animate-spin text-rose-400" />
                  Acceso bloqueado por intentos fallidos
                </p>
                <p className="text-sm font-mono font-black text-rose-200">
                  {Math.floor(bloqueoSegundos / 60)}:{(bloqueoSegundos % 60).toString().padStart(2, '0')} min restantes
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={cargandoDatos || bloqueoSegundos > 0}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black rounded-2xl text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              {cargandoDatos ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cargando portal...</span>
                </>
              ) : bloqueoSegundos > 0 ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Bloqueado por seguridad</span>
                </>
              ) : (
                <>
                  <span>Ingresar a mis compras</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VISTA 2: PANEL DE COMPRAS & HISTÓRICO PARA EL EMPLEADO
  // ============================================================================
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-body">
      {/* Barra superior del Portal de Compras */}
      <header className="sticky top-0 z-30 bg-black text-white border-b border-zinc-800 shadow-lg">
        <div className="max-w-4xl w-full mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={nombreNegocio}
                onError={() => setImgError(true)}
                className="h-8 w-auto max-w-[120px] object-contain shrink-0"
              />
            ) : (
              <span className="text-sm font-black text-white tracking-wider uppercase font-display truncate max-w-[140px] shrink-0">
                {nombreNegocio}
              </span>
            )}
            <div className="h-5 w-px bg-zinc-800 hidden sm:block" />
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block">
                Portal de Compras
              </span>
              <p className="text-xs sm:text-sm font-black text-white truncate font-display">
                {empleadoActual.nombre} <span className="text-zinc-400 font-mono text-xs">(@{empleadoActual.usuario})</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCerrarSesionEmpleado}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* MODAL DE CONFIRMACIÓN DE COMPRA ("¿Estás seguro que ya compraste...?") */}
      <AnimatedModal
        isOpen={Boolean(modalConfirmarCompra)}
        onBackdropClick={() => !procesandoCompra && setModalConfirmarCompra(null)}
        overlayClassName="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        panelClassName="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 text-center space-y-4 relative"
      >
        <button
          type="button"
          disabled={procesandoCompra}
          onClick={() => setModalConfirmarCompra(null)}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCheck className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-zinc-900 font-display">
            {modalConfirmarCompra?.tipo === 'pedido'
              ? `¿Confirmar todos los productos del Pedido #${modalConfirmarCompra?.pedido?.numero}?`
              : `¿Confirmar producto comprado?`}
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {modalConfirmarCompra?.tipo === 'pedido' ? (
              <>
                Se marcarán los productos pendientes como comprados por <strong>{empleadoActual.nombre}</strong> (@{empleadoActual.usuario}). Se actualizarán en tiempo real para los demás empleados.
              </>
            ) : (
              <>
                ¿Estás seguro de que ya compraste <strong>{modalConfirmarCompra?.item?.productoNombre}</strong> ({modalConfirmarCompra?.item?.cantidadPedida} {modalConfirmarCompra?.item?.unidad})?
                <span className="block mt-1 text-[11px] text-zinc-500">
                  Se quitará de la lista activa y pasará a tu historial de compras.
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            disabled={procesandoCompra}
            onClick={() => setModalConfirmarCompra(null)}
            className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={procesandoCompra}
            onClick={handleConfirmarAccionCompra}
            className="flex-1 py-2.5 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            {procesandoCompra ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Sí, Comprado</span>
              </>
            )}
          </button>
        </div>
      </AnimatedModal>

      {/* MODAL AUTOMÁTICO CUANDO NO HAY LISTAS DISPONIBLES */}
      <AnimatedModal
        isOpen={modalSinListasAbierto}
        onBackdropClick={() => setModalSinListasAbierto(false)}
        overlayClassName="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        panelClassName="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 text-center space-y-4 relative"
      >
        <button
          type="button"
          onClick={() => setModalSinListasAbierto(false)}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <ClipboardList className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-zinc-900 font-display">
            No hay listas disponibles
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Hola <strong>{empleadoActual.nombre}</strong>, en este momento no existen pedidos ni listas en estado <strong>Pendientes por recibir</strong>.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setModalSinListasAbierto(false)}
            className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
          >
            Entendido
          </button>
        </div>
      </AnimatedModal>

      {/* Contenido Principal con Wrapper de Animaciones (Scroll-to-top suave, cascada y scroll reveal) */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Selector de Pestañas con animación suave de píldora deslizante (Sliding Pill) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-zinc-200 shadow-xs">
          <div ref={tabsContainerRef} className="relative grid grid-cols-2 gap-2 flex-1 sm:max-w-md p-1 bg-zinc-100/80 rounded-xl">
            {/* Píldora animada deslizante */}
            <span
              aria-hidden="true"
              style={pillStyle}
              className="absolute left-0 top-1 bg-white rounded-xl shadow-md pointer-events-none z-0 transition-[transform,width,height,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
            />

            <button
              ref={(el) => { tabRefs.current['pendientes'] = el; }}
              type="button"
              onClick={() => setTabEmpleado('pendientes')}
              className={`relative z-10 py-2 px-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors duration-300 cursor-pointer ${
                tabEmpleado === 'pendientes'
                  ? 'text-black font-black'
                  : 'text-zinc-500 hover:text-black'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Por Comprar ({pedidosPendientes.length})</span>
            </button>

            <button
              ref={(el) => { tabRefs.current['historial'] = el; }}
              type="button"
              onClick={() => setTabEmpleado('historial')}
              className={`relative z-10 py-2 px-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors duration-300 cursor-pointer ${
                tabEmpleado === 'historial'
                  ? 'text-black font-black'
                  : 'text-zinc-500 hover:text-black'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Mis Compras ({pedidosHistorialEmpleado.length})</span>
            </button>
          </div>

          <span className="text-xs text-zinc-500 font-medium px-2 hidden sm:inline">
            {tabEmpleado === 'pendientes' ? 'Actualización en tiempo real para todos' : 'Histórico de productos comprados por ti'}
          </span>
        </div>

        {/* CONTENEDOR CON ANIMACIONES EN CASCADA Y SCROLL-REVEAL */}
        <ScrollRevealWrapper activeTab={tabEmpleado}>
          {/* =========================================================================
              SECCIÓN A: LISTAS ACTIVAS POR COMPRAR (CON ACORDEONES Y BOTÓN COMPRADO)
              ========================================================================= */}
          {tabEmpleado === 'pendientes' && (
            <div className="space-y-5">
              {/* Buscador rápido si hay listas */}
              {pedidosPendientes.length > 0 && (
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={busquedaPedido}
                    onChange={(e) => setBusquedaPedido(e.target.value.toUpperCase())}
                    placeholder="BUSCAR POR # DE PEDIDO, PROVEEDOR O PRODUCTO..."
                    className="w-full pl-10 pr-9 py-2.5 bg-white border border-zinc-200 rounded-2xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black uppercase shadow-xs"
                  />
                  {busquedaPedido && (
                    <button
                      type="button"
                      onClick={() => setBusquedaPedido('')}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-black cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Listado de Pedidos Pendientes con ACORDEÓN */}
              {pedidosPendientesFiltrados.length === 0 ? (
                <div className="bg-white rounded-3xl border border-zinc-200 p-10 text-center space-y-3 shadow-sm">
                  <Truck className="w-12 h-12 text-zinc-300 mx-auto" />
                  <h2 className="text-base font-black text-zinc-800 font-display">
                    No hay listas disponibles por comprar
                  </h2>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    {busquedaPedido.trim()
                      ? `No se encontraron pedidos pendientes que coincidan con "${busquedaPedido}".`
                      : 'En este momento no hay productos pendientes por comprar. Cuando administración cree un pedido o los demás empleados dejen productos pendientes, aparecerán aquí.'}
                  </p>
                </div>
              ) : (
              <div className="space-y-4">
                {pedidosPendientesFiltrados.map((pedido) => {
                  const estaAbierto = acordeonAbiertos[pedido.id] ?? true;

                  // Filtrar los ítems del pedido: separamos los que están por comprar vs los ya comprados
                  let totalItemsPorComprar = 0;
                  let totalItemsComprados = 0;

                  (pedido.grupos || []).forEach(g => {
                    (g.items || []).forEach(it => {
                      if (it.comprado) totalItemsComprados++;
                      else totalItemsPorComprar++;
                    });
                  });

                  return (
                    <div
                      key={pedido.id}
                      className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden transition-all"
                    >
                      {/* Cabecera del ACORDEÓN del Pedido */}
                      <div
                        onClick={() => toggleAcordeon(pedido.id)}
                        className="p-4 sm:p-5 bg-zinc-950 text-white flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-zinc-900 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-amber-400 text-black flex items-center justify-center font-mono font-black text-sm shrink-0">
                            #{pedido.numero}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="font-black text-white text-base font-display">
                                Pedido #{pedido.numero}
                              </h2>
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                <Clock className="w-3 h-3" />
                                <span>{totalItemsPorComprar} por comprar</span>
                              </span>
                              {totalItemsComprados > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{totalItemsComprados} comprados</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Fecha: {formatearFecha(pedido.fechaCreacion)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {totalItemsPorComprar > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalConfirmarCompra({ tipo: 'pedido', pedido });
                              }}
                              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-extrabold rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Marcar Todo Comprado</span>
                              <span className="sm:hidden">Todo Comprado</span>
                            </button>
                          )}
                          <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
                            {estaAbierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* CUERPO EXPANDIBLE DEL ACORDEÓN */}
                      {estaAbierto && (
                        <div className="divide-y divide-zinc-200">
                          {/* Observaciones generales si existen */}
                          {pedido.observaciones && (
                            <div className="px-4 sm:px-5 py-3 bg-amber-50 border-b border-amber-200/80 text-xs text-amber-950">
                              <span className="font-extrabold uppercase mr-1.5">Nota del Pedido:</span>
                              <span>{pedido.observaciones}</span>
                            </div>
                          )}

                          {/* Grupos por Proveedor */}
                          <div className="p-4 sm:p-5 space-y-4">
                            {(pedido.grupos || []).map((grupo, idx) => {
                              // Ítems aún no comprados
                              const itemsPorComprar = (grupo.items || []).filter(i => !i.comprado);
                              const itemsCompradosGrupo = (grupo.items || []).filter(i => i.comprado);

                              return (
                                <div
                                  key={grupo.proveedorId || idx}
                                  className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-2xs"
                                >
                                  {/* Encabezado del Proveedor */}
                                  <div className="bg-zinc-100 px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm text-zinc-900">
                                      <Store className="w-4 h-4 text-black shrink-0" />
                                      <span className="uppercase">{grupo.proveedorNombre || 'SIN PROVEEDOR'}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-zinc-500">
                                      {itemsPorComprar.length} pendiente(s)
                                    </span>
                                  </div>

                                  {/* Lista de productos por comprar */}
                                  {itemsPorComprar.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-zinc-400 bg-zinc-50/50">
                                      ¡Todos los productos de este proveedor ya fueron comprados!
                                    </div>
                                  ) : (
                                    <div className="divide-y divide-zinc-100">
                                      {itemsPorComprar.map((item) => (
                                        <div
                                          key={item.productoId}
                                          className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-zinc-50/80 transition-colors"
                                        >
                                          <div className="flex items-start gap-2.5 min-w-0">
                                            <Package className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                              <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                                                {item.productoNombre}
                                              </p>
                                              {item.obs && (
                                                <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                                                  Nota: {item.obs}
                                                </p>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                            <span className="px-2.5 py-1 rounded-xl bg-zinc-900 text-white font-mono font-extrabold text-xs">
                                              {item.cantidadPedida} {item.unidad}
                                            </span>

                                            {/* BOTÓN "COMPRADO" */}
                                            <button
                                              type="button"
                                              onClick={() => setModalConfirmarCompra({ tipo: 'item', pedido, item, grupo })}
                                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                              <span>Comprado</span>
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Resumen de los ya comprados en este proveedor */}
                                  {itemsCompradosGrupo.length > 0 && (
                                    <div className="bg-zinc-50/80 border-t border-zinc-200 p-2.5 px-4 flex items-center justify-between gap-2 flex-wrap text-[11px] text-zinc-500">
                                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {itemsCompradosGrupo.length} producto(s) ya comprados en este grupo
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

          {/* =========================================================================
              SECCIÓN B: HISTÓRICO DE COMPRAS DEL EMPLEADO (ACORDEÓN POR ID DE PEDIDO + BUSCADOR)
              ========================================================================= */}
          {tabEmpleado === 'historial' && (
            <div className="space-y-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900 font-display flex items-center gap-2">
                    <History className="w-5 h-5 text-black" />
                    <span>Historial de Compras de {empleadoActual.nombre}</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Aquí aparecen exclusivamente los productos que tú marcaste como comprados para que puedas verificar cualquier detalle.
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-zinc-900 text-white font-extrabold text-xs self-start sm:self-auto">
                  @{empleadoActual.usuario}
                </span>
              </div>

              {/* BUSCADOR ESPECÍFICO POR ID (#), PROVEEDOR O PRODUCTO EN MIS COMPRAS */}
              {pedidosHistorialEmpleado.length > 0 && (
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={busquedaHistorial}
                    onChange={(e) => setBusquedaHistorial(e.target.value.toUpperCase())}
                    placeholder="BUSCAR EN MIS COMPRAS POR ID (#), PROVEEDOR O PRODUCTO..."
                    className="w-full pl-10 pr-9 py-2.5 bg-white border border-zinc-200 rounded-2xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black uppercase shadow-xs"
                  />
                  {busquedaHistorial && (
                    <button
                      type="button"
                      onClick={() => setBusquedaHistorial('')}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-black cursor-pointer"
                      title="Limpiar búsqueda"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {pedidosHistorialEmpleado.length === 0 ? (
                <div className="bg-white rounded-3xl border border-zinc-200 p-10 text-center space-y-2 shadow-sm">
                  <History className="w-10 h-10 text-zinc-300 mx-auto mb-1" />
                  <h3 className="text-sm font-bold text-zinc-800">
                    Aún no has registrado compras
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    A medida que presiones el botón "Comprado" en las listas por comprar, tus productos aparecerán organizados aquí por cada pedido.
                  </p>
                </div>
              ) : pedidosHistorialFiltrados.length === 0 ? (
                <div className="bg-white rounded-3xl border border-zinc-200 p-10 text-center space-y-2 shadow-sm">
                  <Search className="w-10 h-10 text-zinc-300 mx-auto mb-1" />
                  <h3 className="text-sm font-bold text-zinc-800">
                    No se encontraron compras con esa búsqueda
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    No hay registros en tu historial que coincidan con "{busquedaHistorial}".
                  </p>
                  <button
                    type="button"
                    onClick={() => setBusquedaHistorial('')}
                    className="text-xs text-black font-extrabold underline hover:opacity-80 pt-1 cursor-pointer"
                  >
                    Ver todas mis compras
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pedidosHistorialFiltrados.map((pedido) => {
                    const estaAbierto = acordeonAbiertos[`hist_${pedido.id}`] ?? true;

                    // Extraer solo los productos que compró este empleado en este pedido
                    const itemsCompradosPorEsteEmpleado = [];
                    (pedido.grupos || []).forEach(g => {
                      (g.items || []).forEach(it => {
                        if (it.comprado && it.compradoPorUsuario === empleadoActual.usuario) {
                          itemsCompradosPorEsteEmpleado.push({
                            ...it,
                            proveedorNombre: g.proveedorNombre
                          });
                        }
                      });
                    });

                    return (
                      <div
                        key={pedido.id}
                        className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden"
                      >
                        {/* Cabecera del acordeón de historial */}
                        <div
                          onClick={() => toggleAcordeon(`hist_${pedido.id}`)}
                          className="p-4 bg-zinc-900 text-white flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-mono font-black text-xs shrink-0">
                              #{pedido.numero}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-sm text-white font-display">
                                  Pedido #{pedido.numero}
                                </h3>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  {itemsCompradosPorEsteEmpleado.length} comprados por ti
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                Orden del: {formatearFecha(pedido.fechaCreacion)}
                              </p>
                            </div>
                          </div>

                          <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
                            {estaAbierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Lista de productos comprados dentro del acordeón */}
                        {estaAbierto && (
                          <div className="divide-y divide-zinc-100 p-2 sm:p-3 space-y-1">
                            {itemsCompradosPorEsteEmpleado.map((it) => (
                              <div
                                key={it.productoId}
                                className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="font-extrabold text-zinc-900 truncate">
                                    {it.productoNombre}
                                  </p>
                                  <p className="text-[11px] text-zinc-500 mt-0.5">
                                    Proveedor: <span className="font-bold text-zinc-700">{it.proveedorNombre}</span>
                                    {it.fechaCompra && ` • Comprado: ${formatearFecha(it.fechaCompra)}`}
                                  </p>
                                  {it.obs && (
                                    <p className="text-[11px] text-amber-700 mt-0.5">
                                      Nota: {it.obs}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white font-mono font-extrabold">
                                    {it.cantidadPedida} {it.unidad}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                    <CheckCircle2 className="w-3 h-3" /> Comprado
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </ScrollRevealWrapper>
      </main>
    </div>
  );
}
