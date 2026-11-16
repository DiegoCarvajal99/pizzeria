import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import AnimatedModal from '../common/AnimatedModal';
import {
  ShieldCheck,
  UserPlus,
  Store,
  Calendar,
  Clock,
  RotateCcw,
  Search,
  Phone,
  Mail,
  Sparkles,
  Trash2,
  Pencil,
  Copy,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Crown,
  Palette,
  Layers,
  LogOut,
  ChevronRight,
  Upload,
  Image
} from 'lucide-react';

// Opciones de rubro y emojis predefinidos
const RUBROS_DISPONIBLES = [
  { id: 'pizzeria', label: 'Pizzería', emoji: '🍕', areaConsumo: 'Consumo Cocina', color: 'rojo' },
  { id: 'hamburgueseria', label: 'Hamburguesería / Fast Food', emoji: '🍔', areaConsumo: 'Consumo Cocina', color: 'naranja' },
  { id: 'panaderia', label: 'Panadería & Pastelería', emoji: '🥖', areaConsumo: 'Producción / Horno', color: 'marron' },
  { id: 'cafeteria', label: 'Cafetería & Bar', emoji: '☕', areaConsumo: 'Consumo Barra', color: 'marron' },
  { id: 'sushi', label: 'Sushi & Asiático', emoji: '🍣', areaConsumo: 'Consumo Barra / Cocina', color: 'azul' },
  { id: 'carnes', label: 'Asadero & Carnes', emoji: '🥩', areaConsumo: 'Consumo Cocina', color: 'rojo' },
  { id: 'saludable', label: 'Comida Saludable / Bowls', emoji: '🥗', areaConsumo: 'Consumo Cocina', color: 'verde' },
  { id: 'general', label: 'General / Dark Kitchen', emoji: '🏪', areaConsumo: 'Consumo Operativo', color: 'negro' }
];

const COLORES_DISPONIBLES = [
  { id: 'negro', label: 'Negro Elegante', bg: 'bg-zinc-900', text: 'text-zinc-900', border: 'border-zinc-900' },
  { id: 'rojo', label: 'Rojo Pasión', bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600' },
  { id: 'naranja', label: 'Naranja / Ámbar', bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-600' },
  { id: 'verde', label: 'Verde Esmeralda', bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600' },
  { id: 'azul', label: 'Azul Marino', bg: 'bg-sky-600', text: 'text-sky-600', border: 'border-sky-600' },
  { id: 'marron', label: 'Café / Canela', bg: 'bg-amber-900', text: 'text-amber-900', border: 'border-amber-900' }
];

const PLANES_MEMBRESIA = [
  { dias: 7, label: '7 Días (Prueba gratis)' },
  { dias: 30, label: '30 Días (1 Mes)' },
  { dias: 60, label: '60 Días (2 Meses)' },
  { dias: 90, label: '90 Días (Trimestral)' },
  { dias: 180, label: '180 Días (Semestral)' },
  { dias: 365, label: '365 Días (1 Año)' }
];

// Determinar si una URL corresponde a un activo estático propio de Liaco Pizzería
const esAssetLiaco = (url) => {
  if (!url) return false;
  const u = String(url).toLowerCase().trim();
  return u === '/logo.png' || u === '/hero-banner.png' || u === '/logo-liaco.png' || u === '/logo.jpg';
};

export default function SuperAdminView() {
  const {
    todosLosClientes = [],
    crearNuevoCliente,
    actualizarCliente,
    renovarMembresiaCliente,
    toggleSuspenderCliente,
    eliminarCliente,
    cambiarNegocioActivo,
    cerrarSesion,
    calcularDiasRestantes
  } = useAuth();

  const { mostrarAlerta, solicitarConfirmacion } = useInventory();

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'activos' | 'por_vencer' | 'vencidos' | 'suspendidos'
  const [filtroRubro, setFiltroRubro] = useState('todos');

  // Modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [clienteEnEdicion, setClienteEnEdicion] = useState(null);

  // Estados formulario nuevo cliente
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formNombreNegocio, setFormNombreNegocio] = useState('');
  const [formPropietario, setFormPropietario] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formBannerUrl, setFormBannerUrl] = useState('');
  const [formRubro, setFormRubro] = useState('pizzeria');
  const [formEmoji, setFormEmoji] = useState('🍕');
  const [formNombreAreaConsumo, setFormNombreAreaConsumo] = useState('Consumo Cocina');
  const [formColorTema, setFormColorTema] = useState('negro');
  const [formSede, setFormSede] = useState('PRINCIPAL');
  const [formDiasMembresia, setFormDiasMembresia] = useState(30);
  const [guardando, setGuardando] = useState(false);

  // Cargar imagen desde archivo local y convertir a Base64 Data URL
  const handleArchivoImagen = (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      mostrarAlerta('La imagen supera los 2MB permitidos.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setter(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Al cambiar rubro, sugerir automáticamente emoji, nombre de área de consumo y color
  const handleCambioRubro = (rubroId) => {
    setFormRubro(rubroId);
    const rubroObj = RUBROS_DISPONIBLES.find(r => r.id === rubroId);
    if (rubroObj) {
      setFormEmoji(rubroObj.emoji);
      setFormNombreAreaConsumo(rubroObj.areaConsumo);
      setFormColorTema(rubroObj.color);
    }
  };

  // Filtrado de clientes
  const clientesFiltrados = useMemo(() => {
    return todosLosClientes.filter(c => {
      const q = busqueda.toLowerCase();
      const coincideTexto = (c.nombreNegocio && c.nombreNegocio.toLowerCase().includes(q)) ||
        (c.propietario && c.propietario.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.sede && c.sede.toLowerCase().includes(q));

      const dias = calcularDiasRestantes(c.fechaVencimiento);
      const esVencido = dias <= 0 || c.estado === 'vencido';
      const esPorVencer = dias > 0 && dias <= 5;
      const esSuspendido = c.estado === 'suspendido';
      const esActivo = c.estado === 'activo' && dias > 0;

      let coincideEstado = true;
      if (filtroEstado === 'activos') coincideEstado = esActivo;
      else if (filtroEstado === 'por_vencer') coincideEstado = esPorVencer;
      else if (filtroEstado === 'vencidos') coincideEstado = esVencido;
      else if (filtroEstado === 'suspendidos') coincideEstado = esSuspendido;

      const coincideRubro = filtroRubro === 'todos' || c.rubro === filtroRubro;

      return coincideTexto && coincideEstado && coincideRubro;
    });
  }, [todosLosClientes, busqueda, filtroEstado, filtroRubro]);

  // Métricas rápidas
  const metricas = useMemo(() => {
    let activos = 0;
    let porVencer = 0;
    let vencidos = 0;
    let suspendidos = 0;

    todosLosClientes.forEach(c => {
      const dias = calcularDiasRestantes(c.fechaVencimiento);
      if (c.estado === 'suspendido') suspendidos++;
      else if (dias <= 0) vencidos++;
      else if (dias <= 5) porVencer++;
      else activos++;
    });

    return { total: todosLosClientes.length, activos, porVencer, vencidos, suspendidos };
  }, [todosLosClientes]);

  // Abrir modal de creación limpio
  const handleAbrirCrear = () => {
    setFormEmail('');
    setFormPassword('');
    setFormNombreNegocio('');
    setFormPropietario('');
    setFormTelefono('');
    setFormLogoUrl('');
    setFormBannerUrl('');
    setFormRubro('pizzeria');
    setFormEmoji('🍕');
    setFormNombreAreaConsumo('Consumo Cocina');
    setFormColorTema('negro');
    setFormSede('PRINCIPAL');
    setFormDiasMembresia(30);
    setModalNuevoAbierto(true);
  };

  // Guardar nuevo cliente
  const handleSubmitNuevoCliente = async (e) => {
    e.preventDefault();
    if (guardando) return;

    if (!formEmail.trim() || !formPassword.trim() || !formNombreNegocio.trim()) {
      mostrarAlerta('Ingresa el correo, la contraseña y el nombre del negocio.', 'warning', 'Faltan datos');
      return;
    }

    if (formPassword.trim().length < 6) {
      mostrarAlerta('La contraseña debe tener al menos 6 caracteres.', 'warning', 'Contraseña débil');
      return;
    }

    setGuardando(true);
    try {
      await crearNuevoCliente({
        email: formEmail,
        password: formPassword,
        nombreNegocio: formNombreNegocio,
        propietario: formPropietario,
        telefono: formTelefono,
        logoUrl: formLogoUrl,
        bannerUrl: formBannerUrl,
        rubro: formRubro,
        emoji: formEmoji,
        nombreAreaConsumo: formNombreAreaConsumo,
        colorTema: formColorTema,
        sede: formSede,
        diasMembresia: formDiasMembresia
      });

      setModalNuevoAbierto(false);
      mostrarAlerta(`¡Negocio "${formNombreNegocio.toUpperCase()}" creado con éxito con ${formDiasMembresia} días de membresía!`, 'success', '¡Cuenta Creada!');
    } catch (err) {
      console.error(err);
      let msg = err.message || 'Error al crear la cuenta.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Ya existe un usuario registrado con este correo.';
      }
      mostrarAlerta(msg, 'danger', 'Error');
    } finally {
      setGuardando(false);
    }
  };

  // Abrir modal de edición
  const handleAbrirEditar = (cliente) => {
    setClienteEnEdicion(cliente);
    setFormNombreNegocio(cliente.nombreNegocio || '');
    setFormEmail(cliente.email || '');
    setFormPassword(cliente.passwordInicial || '');
    setFormPropietario(cliente.propietario || '');
    setFormTelefono(cliente.telefono || '');
    setFormLogoUrl(cliente.logoUrl || '');
    setFormBannerUrl(cliente.bannerUrl || cliente.bannerLogoUrl || '');
    setFormRubro(cliente.rubro || 'pizzeria');
    setFormEmoji(cliente.emoji || '🍕');
    setFormNombreAreaConsumo(cliente.nombreAreaConsumo || 'Consumo Cocina');
    setFormColorTema(cliente.colorTema || 'negro');
    setFormSede(cliente.sede || 'PRINCIPAL');
  };

  // Guardar edición
  const handleSubmitEditar = async (e) => {
    e.preventDefault();
    if (!clienteEnEdicion) return;

    if (!formEmail.trim()) {
      mostrarAlerta('El correo electrónico no puede estar vacío', 'warning');
      return;
    }

    const docId = clienteEnEdicion.id || clienteEnEdicion.uid;
    const emailCambio = formEmail.trim().toLowerCase() !== (clienteEnEdicion.email || '').trim().toLowerCase();
    const passLimpia = formPassword.trim();
    const passDisponible = passLimpia || clienteEnEdicion.passwordInicial || '';

    if (emailCambio && (!passDisponible || passDisponible.length < 6)) {
      mostrarAlerta('Al cambiar el correo electrónico del negocio, debes asignar una contraseña (mínimo 6 caracteres) para habilitar el inicio de sesión.', 'warning', 'Contraseña requerida');
      return;
    }

    setGuardando(true);
    try {
      await actualizarCliente(docId, {
        nombreNegocio: formNombreNegocio.trim().toUpperCase(),
        email: formEmail.trim().toLowerCase(),
        propietario: formPropietario.trim().toUpperCase(),
        telefono: formTelefono.trim(),
        logoUrl: formLogoUrl.trim(),
        bannerUrl: formBannerUrl.trim(),
        rubro: formRubro,
        emoji: formEmoji,
        nombreAreaConsumo: formNombreAreaConsumo,
        colorTema: formColorTema,
        sede: formSede.trim().toUpperCase()
      }, passLimpia || clienteEnEdicion.passwordInicial || '');

      setClienteEnEdicion(null);
      mostrarAlerta('Datos del negocio y credenciales actualizados correctamente', 'success', '¡Guardado!');
    } catch (err) {
      console.error(err);
      mostrarAlerta('Error actualizando cliente: ' + (err.message || ''), 'danger');
    } finally {
      setGuardando(false);
    }
  };

  // Renovar membresía +30 días rápido
  const handleRenovar30Dias = (cliente) => {
    solicitarConfirmacion({
      titulo: '¿Renovar Membresía?',
      mensaje: `¿Deseas agregar +30 días de suscripción al negocio "${cliente.nombreNegocio}"?`,
      textoConfirmar: 'Sí, renovar +30 días',
      textoCancelar: 'Descartar',
      tipo: 'success',
      onConfirmar: async () => {
        await renovarMembresiaCliente(cliente.uid || cliente.id, 30);
        mostrarAlerta(`¡Membresía de "${cliente.nombreNegocio}" renovada por 30 días!`, 'success', '¡Renovado!');
      }
    });
  };

  // Pausar o Reactivar
  const handleTogglePausar = (cliente) => {
    const accion = cliente.estado === 'activo' ? 'pausar' : 'reactivar';
    solicitarConfirmacion({
      titulo: `¿${accion === 'pausar' ? 'Pausar' : 'Reactivar'} acceso?`,
      mensaje: `¿Deseas ${accion} el acceso de "${cliente.nombreNegocio}"? ${accion === 'pausar' ? 'El cliente verá la pantalla de membresía inactiva.' : 'Podrá volver a ingresar normalmente.'
        }`,
      textoConfirmar: accion === 'pausar' ? 'Sí, pausar' : 'Sí, reactivar',
      textoCancelar: 'Descartar',
      tipo: accion === 'pausar' ? 'danger' : 'info',
      onConfirmar: async () => {
        await toggleSuspenderCliente(cliente.uid || cliente.id);
        mostrarAlerta(`Negocio "${cliente.nombreNegocio}" ${accion === 'pausar' ? 'pausado' : 'reactivado'}.`, 'info');
      }
    });
  };

  // Eliminar negocio
  const handleEliminarCliente = (cliente) => {
    solicitarConfirmacion({
      titulo: '¿Eliminar cuenta de negocio?',
      mensaje: `¿Estás seguro de que deseas eliminar permanentemente a "${cliente.nombreNegocio}"? Esta acción borrará su configuración de membresía.`,
      textoConfirmar: 'Sí, eliminar',
      textoCancelar: 'Descartar',
      tipo: 'danger',
      onConfirmar: async () => {
        await eliminarCliente(cliente.uid || cliente.id);
        mostrarAlerta(`Negocio "${cliente.nombreNegocio}" eliminado.`, 'info');
      }
    });
  };

  // Modo Soporte: Entrar a ver la pizzería / negocio como cliente
  const handleEntrarModoSoporte = (cliente) => {
    cambiarNegocioActivo(cliente);
    mostrarAlerta(`Has entrado en Modo Soporte a "${cliente.nombreNegocio}". Puedes volver al panel cuando desees.`, 'info', 'Modo Soporte');
  };

  // Generar mensaje amigable de bienvenida y credenciales de acceso para el cliente
  const generarMensajeBienvenida = (cliente) => {
    const urlPlataforma = 'https://pizzeria-kappa-gold.vercel.app';
    const nombreNegocio = (cliente.nombreNegocio || 'TU NEGOCIO').trim().toUpperCase();
    const propietario = (cliente.propietario || '').trim();
    const pass = cliente.passwordInicial || cliente.password || '(La contraseña asignada al registrar tu cuenta)';

    return `👋 ¡Hola${propietario ? ` ${propietario}` : ''}! Te damos una cálida bienvenida a tu sistema de gestión operativa para *${nombreNegocio}*. 🍕🏪

Estamos muy felices de acompañarte en el control de tu negocio, existencias en almacén, bitácora de consumo y automatización de pedidos a proveedores.

A continuación te compartimos tus credenciales de acceso a la plataforma:

🌐 *Enlace de la Plataforma:* ${urlPlataforma}
👤 *Usuario / Correo:* ${cliente.email}
🔑 *Contraseña:* ${pass}

🔒 *¿Cómo cambiar o restablecer tu contraseña?*
• *Desde el inicio de sesión:*
Para restablecer tu contraseña, ingresa tu correo y haz clic en "¿Olvidaste tu contraseña o necesitas restablecerla?".
• *En caso de utilizar un correo de Yopmail:*
Ingresa a este enlace y coloca tu correo para recibir el correo de restablecimiento de contraseña:
👉 https://yopmail.com/es/
• *Dentro de la plataforma:*
También puedes cambiar tu contraseña en cualquier momento desde el menú superior:
👉 *Menú de Usuario -> Configuración -> Pestaña "Seguridad & Contraseña"*.

Si tienes alguna pregunta o requieres soporte, estamos a tu entera disposición. ¡Muchos éxitos en la gestión de tu negocio! 🚀✨`;
  };

  const handleCopiarCredenciales = (cliente) => {
    const mensaje = generarMensajeBienvenida(cliente);
    navigator.clipboard.writeText(mensaje);
    if (mostrarAlerta) {
      mostrarAlerta(`📋 Mensaje de bienvenida y credenciales de "${cliente.nombreNegocio}" copiados al portapapeles. Listo para enviar al cliente por WhatsApp o correo.`, 'success', '¡Credenciales Copiadas!');
    }
  };

  const handleEnviarWhatsAppCredenciales = (cliente) => {
    const mensaje = generarMensajeBienvenida(cliente);
    const telLimpio = (cliente.telefono || '').replace(/\D/g, '');
    const url = telLimpio
      ? `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* =========================================================================
          CABECERA EJECUTIVA DEL PANEL SAAS
          ========================================================================= */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black text-white p-6 sm:p-7 rounded-3xl border border-zinc-800 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 relative overflow-hidden">
        {/* Glow sutil */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Consola de Administración de Cuentas SaaS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white flex items-center gap-2">
            <span>Directorio de Negocios & Membresías</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
            Crea cuentas de clientes con su logo y marca propia, asigna periodos de 30 días, y audita su inventario en tiempo real.
          </p>
        </div>

        <div className="z-10 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleAbrirCrear}
            className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold rounded-2xl text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-black stroke-[2.5]" />
            <span>+ Crear Nuevo Negocio</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TARJETAS DE MÉTRICAS GLOBALES
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider">Total Negocios</span>
          <p className="text-2xl font-extrabold font-mono text-zinc-900">{metricas.total}</p>
          <span className="text-[10px] text-zinc-400">Cuentas creadas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider">Membresías Activas</span>
          <p className="text-2xl font-extrabold font-mono text-emerald-600">{metricas.activos}</p>
          <span className="text-[10px] text-zinc-400">Operando al día</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase text-amber-700 tracking-wider">Por Vencer (&le; 5 días)</span>
          <p className="text-2xl font-extrabold font-mono text-amber-600">{metricas.porVencer}</p>
          <span className="text-[10px] text-zinc-400">Próximos a renovar</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase text-rose-700 tracking-wider">Vencidas / Pausadas</span>
          <p className="text-2xl font-extrabold font-mono text-rose-600">{metricas.vencidos + metricas.suspendidos}</p>
          <span className="text-[10px] text-zinc-400">Acceso bloqueado</span>
        </div>
      </div>

      {/* =========================================================================
          BARRA DE BÚSQUEDA Y FILTROS DE ESTADO
          ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por negocio, dueño, correo o ciudad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
              className="w-full pl-10 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black uppercase font-medium"
            />
          </div>

          <div className="sm:col-span-6 flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-semibold overflow-x-auto no-scrollbar">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'activos', label: 'Activos' },
              { id: 'por_vencer', label: 'Por Vencer' },
              { id: 'vencidos', label: 'Vencidos' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroEstado(f.id)}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap text-center ${filtroEstado === f.id ? 'bg-white text-black font-bold shadow-xs' : 'text-zinc-600 hover:text-black'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          LISTADO DE CLIENTES (TARJETAS INTUITIVAS)
          ========================================================================= */}
      {clientesFiltrados.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200 shadow-sm space-y-3">
          <Store className="w-12 h-12 text-zinc-300 mx-auto" />
          <h3 className="font-bold text-base text-zinc-800">No se encontraron negocios</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {todosLosClientes.length === 0
              ? 'Aún no has registrado ningún cliente. Haz clic en "+ Crear Nuevo Negocio" para dar de alta el primero.'
              : 'No hay negocios que coincidan con los filtros de búsqueda seleccionados.'}
          </p>
          {todosLosClientes.length === 0 && (
            <button
              type="button"
              onClick={handleAbrirCrear}
              className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl shadow-sm hover:bg-zinc-800 cursor-pointer"
            >
              + Crear Primer Negocio
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientesFiltrados.map((cliente) => {
            const dias = calcularDiasRestantes(cliente.fechaVencimiento);
            const esVencido = dias <= 0 || cliente.estado === 'vencido';
            const esPorVencer = dias > 0 && dias <= 5;
            const esSuspendido = cliente.estado === 'suspendido';

            const fechaInicioStr = cliente.fechaInicioMembresia
              ? new Date(cliente.fechaInicioMembresia).toLocaleDateString('es-ES')
              : 'N/A';
            const fechaVenceStr = cliente.fechaVencimiento
              ? new Date(cliente.fechaVencimiento).toLocaleDateString('es-ES')
              : 'N/A';

            return (
              <div
                key={cliente.uid || cliente.id}
                className="bg-white rounded-3xl border border-zinc-200 shadow-sm hover:border-zinc-300 transition-all p-5 flex flex-col justify-between gap-4"
              >
                {/* Cabecera de la tarjeta: Logo, Nombre y Estado */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Logo o Avatar con Emoji */}
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {cliente.logoUrl && (cliente.email?.toLowerCase() === 'liacopizzeria@yopmail.com' || !esAssetLiaco(cliente.logoUrl)) ? (
                          <img
                            src={cliente.logoUrl}
                            alt={cliente.nombreNegocio}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-2xl">{cliente.emoji || '🏪'}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-zinc-900 font-display truncate">
                            {cliente.nombreNegocio}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-500">
                          <span className="px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-bold uppercase">
                            {cliente.rubro || 'General'}
                          </span>
                          <span>•</span>
                          <span className="truncate">{cliente.sede || 'Principal'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Insignia de Membresía */}
                    <div className="shrink-0 text-right">
                      {esSuspendido ? (
                        <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-300 text-[11px] font-bold uppercase">
                          ⏸️ Pausado
                        </span>
                      ) : esVencido ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold uppercase flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Vencido</span>
                        </span>
                      ) : esPorVencer ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{dias}d restantes</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{dias}d activos</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Datos del Dueño y Contacto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-zinc-50/70 rounded-2xl border border-zinc-100 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-600">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-mono text-[11px]">{cliente.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-600">
                        <span className="text-zinc-400 text-[11px]">Dueño:</span>
                        <span className="font-semibold text-zinc-900 truncate">{cliente.propietario || 'No registrado'}</span>
                      </div>
                    </div>

                    <div className="space-y-1 sm:text-right">
                      <div className="flex items-center sm:justify-end gap-1.5 text-zinc-600">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="text-[11px]">Vence: <strong className="text-zinc-900">{fechaVenceStr}</strong></span>
                      </div>
                      {cliente.telefono ? (
                        <a
                          href={`https://wa.me/${cliente.telefono.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-bold"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{cliente.telefono}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic">Sin teléfono</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barra de Acciones de la Tarjeta */}
                <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Botón Renovar +30 Días */}
                    <button
                      type="button"
                      onClick={() => handleRenovar30Dias(cliente)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      title="Agregar 30 días de suscripción"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>+30 Días</span>
                    </button>

                    {/* Botón Entrar Modo Soporte */}
                    <button
                      type="button"
                      onClick={() => handleEntrarModoSoporte(cliente)}
                      className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      title="Ver e interactuar con el inventario de este cliente"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver Negocio</span>
                    </button>

                    {/* Botón Copiar Mensaje de Bienvenida y Credenciales */}
                    <button
                      type="button"
                      onClick={() => handleCopiarCredenciales(cliente)}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      title="Copiar mensaje de bienvenida con usuario y contraseña listo para enviar al cliente"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Credenciales</span>
                    </button>

                    {/* Botón Enviar WhatsApp con credenciales si tiene teléfono */}
                    {cliente.telefono && (
                      <button
                        type="button"
                        onClick={() => handleEnviarWhatsAppCredenciales(cliente)}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs transition-colors cursor-pointer"
                        title={`Enviar bienvenida y credenciales por WhatsApp a ${cliente.telefono}`}
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Botón Editar */}
                    <button
                      type="button"
                      onClick={() => handleAbrirEditar(cliente)}
                      className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs transition-colors cursor-pointer"
                      title="Editar configuración del negocio"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Botón Pausar/Reactivar */}
                    <button
                      type="button"
                      onClick={() => handleTogglePausar(cliente)}
                      className={`p-2 rounded-xl text-xs transition-colors cursor-pointer ${esSuspendido
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      title={esSuspendido ? 'Reactivar acceso' : 'Pausar acceso temporalmente'}
                    >
                      {esSuspendido ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => handleEliminarCliente(cliente)}
                      className="p-2 bg-zinc-100 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded-xl text-xs transition-colors cursor-pointer"
                      title="Eliminar cuenta"
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

      {/* =========================================================================
          MODAL: CREAR NUEVO NEGOCIO / CLIENTE (WHITE-LABEL COMPLETO)
          ========================================================================= */}
      <AnimatedModal
        isOpen={modalNuevoAbierto}
        overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        panelClassName="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
      >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-black text-white rounded-xl">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 font-display">
                    Crear Nueva Cuenta de Negocio
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Configura la identidad, logo y membresía del cliente
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalNuevoAbierto(false)}
                className="p-1.5 text-zinc-400 hover:text-black rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNuevoCliente} className="space-y-4">
              {/* Sección A: Credenciales */}
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3">
                <span className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>1. Credenciales de Ingreso del Cliente</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      placeholder="cliente@pizzeria.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Contraseña Inicial *
                    </label>
                    <input
                      type="text"
                      placeholder="Mínimo 6 caracteres"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Sección B: Identidad y Rubro */}
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3">
                <span className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-zinc-400" />
                  <span>2. Identidad del Negocio (Personalización)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Nombre del Negocio *
                    </label>
                    <input
                      type="text"
                      placeholder="EJ. THE BURGER CLUB, PIZZERÍA ROMA..."
                      value={formNombreNegocio}
                      onChange={(e) => setFormNombreNegocio(e.target.value.toUpperCase())}
                      required
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black uppercase font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Sede / Ciudad
                    </label>
                    <input
                      type="text"
                      placeholder="EJ. PRINCIPAL, NORTE"
                      value={formSede}
                      onChange={(e) => setFormSede(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black uppercase"
                    />
                  </div>
                </div>

                {/* Selector de Rubro */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Tipo de Negocio / Rubro:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {RUBROS_DISPONIBLES.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleCambioRubro(r.id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${formRubro === r.id
                          ? 'bg-black text-white border-black shadow-xs font-bold'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                          }`}
                      >
                        <span className="text-base">{r.emoji}</span>
                        <span className="truncate text-[11px]">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SECCIÓN DE 2 IMÁGENES: LOGO MENÚ Y BANNER HOME */}
                <div className="space-y-3.5 p-3.5 bg-zinc-50 border border-zinc-200/90 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 border-b border-zinc-200/60 pb-2">
                    <Image className="w-4 h-4 text-black" />
                    <span>Imágenes de Marca del Cliente (2 Imágenes)</span>
                  </div>

                  {/* 1. Logo del Menú de Navegación */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-zinc-800">
                        1. Logo del Menú (Navegación Superior)
                      </label>
                      <span className="text-[10px] text-zinc-500">
                        Icono visible en la barra superior
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="URL de imagen o ruta (ej. /logo.png)"
                        value={formLogoUrl}
                        onChange={(e) => setFormLogoUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black font-mono"
                      />
                      <label className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleArchivoImagen(e, setFormLogoUrl)}
                        />
                      </label>
                      {clienteEnEdicion?.email?.toLowerCase() === 'liacopizzeria@yopmail.com' && (
                        <button
                          type="button"
                          onClick={() => setFormLogoUrl('/logo.png')}
                          className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
                          title="Usar logo predeterminado de Liaco"
                        >
                          Liaco Logo
                        </button>
                      )}
                      {formLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormLogoUrl('')}
                          className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
                          title="Quitar logo para usar texto predeterminado"
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    {formLogoUrl && (
                      <div className="mt-2 p-2 bg-zinc-950 rounded-xl inline-flex items-center gap-3 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 font-medium">Vista previa en Menú:</span>
                        <img src={formLogoUrl} alt="Preview Menú" className="h-6 w-auto object-contain max-w-[120px]" />
                      </div>
                    )}
                  </div>

                  {/* 2. Imagen del Banner Principal del Home */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-zinc-800">
                        2. Logo / Imagen del Banner Principal (Home)
                      </label>
                      <span className="text-[10px] text-zinc-500">
                        Banner visible en el encabezado del Home
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="URL de imagen o ruta (ej. /hero-banner.png)"
                        value={formBannerUrl}
                        onChange={(e) => setFormBannerUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black font-mono"
                      />
                      <label className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleArchivoImagen(e, setFormBannerUrl)}
                        />
                      </label>
                      {clienteEnEdicion?.email?.toLowerCase() === 'liacopizzeria@yopmail.com' && (
                        <button
                          type="button"
                          onClick={() => setFormBannerUrl('/hero-banner.png')}
                          className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
                          title="Usar banner horizontal predeterminado de Liaco"
                        >
                          Liaco Banner
                        </button>
                      )}
                      {formBannerUrl && (
                        <button
                          type="button"
                          onClick={() => setFormBannerUrl('')}
                          className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
                          title="Quitar banner para usar texto predeterminado"
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    {formBannerUrl && (
                      <div className="mt-2 p-2.5 bg-zinc-950 rounded-xl inline-flex items-center gap-3 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 font-medium">Vista previa en Banner Home:</span>
                        <img src={formBannerUrl} alt="Preview Banner" className="h-8 w-auto object-contain max-w-[160px]" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Nombre del Área de Consumo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Consumo Cocina, Producción..."
                      value={formNombreAreaConsumo}
                      onChange={(e) => setFormNombreAreaConsumo(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Emoji de Mensajes WhatsApp
                    </label>
                    <input
                      type="text"
                      value={formEmoji}
                      onChange={(e) => setFormEmoji(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black text-center text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Sección C: Propietario y Membresía */}
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3">
                <span className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>3. Dueño y Plan de Membresía</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Nombre del Dueño / Contacto
                    </label>
                    <input
                      type="text"
                      placeholder="EJ. JUAN PÉREZ"
                      value={formPropietario}
                      onChange={(e) => setFormPropietario(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black uppercase font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Teléfono WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. +573001234567"
                      value={formTelefono}
                      onChange={(e) => setFormTelefono(e.target.value.replace(/[^0-9+]/g, ''))}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Duración de Membresía Inicial:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PLANES_MEMBRESIA.map(p => (
                      <button
                        key={p.dias}
                        type="button"
                        onClick={() => setFormDiasMembresia(p.dias)}
                        className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${formDiasMembresia === p.dias
                          ? 'bg-black text-white border-black shadow-xs font-bold'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                          }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botones de acción del modal */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setModalNuevoAbierto(false)}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 bg-black hover:bg-zinc-800 disabled:bg-zinc-700 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-2"
                >
                  {guardando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Creando cuenta y membresía...</span>
                    </>
                  ) : (
                    <span>Crear Cuenta y Activar</span>
                  )}
                </button>
              </div>
            </form>
      </AnimatedModal>

      {/* =========================================================================
          MODAL: EDITAR NEGOCIO EXISTENTE
          ========================================================================= */}
      <AnimatedModal
        isOpen={clienteEnEdicion}
        overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        panelClassName="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4"
      >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-extrabold text-base text-zinc-900 font-display flex items-center gap-2">
                <Pencil className="w-4 h-4 text-black" />
                <span>Editar Configuración del Negocio</span>
              </h3>
              <button
                type="button"
                onClick={() => setClienteEnEdicion(null)}
                className="p-1 text-zinc-400 hover:text-black rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditar} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Nombre del Negocio</label>
                <input
                  type="text"
                  value={formNombreNegocio}
                  onChange={(e) => setFormNombreNegocio(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black uppercase font-medium"
                />
              </div>

              {/* Correo Electrónico y Contraseña de Acceso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Correo Electrónico (Login)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                    placeholder="cliente@ejemplo.com"
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-black font-mono font-medium"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    Modifícalo si el cliente perdió su correo.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Nueva Clave (Opcional)
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••••••"
                    minLength={6}
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-black font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    Déjalo vacío para no cambiarla.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Dueño / Contacto</label>
                  <input
                    type="text"
                    value={formPropietario}
                    onChange={(e) => setFormPropietario(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value.replace(/[^0-9+]/g, ''))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black font-mono"
                  />
                </div>
              </div>

              {/* SECCIÓN DE 2 IMÁGENES: LOGO MENÚ Y BANNER HOME */}
              <div className="space-y-3.5 p-3.5 bg-zinc-50 border border-zinc-200/90 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 border-b border-zinc-200/60 pb-2">
                  <Image className="w-4 h-4 text-black" />
                  <span>Imágenes de Marca del Cliente (2 Imágenes)</span>
                </div>

                {/* 1. Logo del Menú de Navegación */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-zinc-800">
                      1. Logo del Menú (Navegación Superior)
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      Icono en la barra de navegación
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="URL o ruta (ej. /logo.png)"
                      value={formLogoUrl}
                      onChange={(e) => setFormLogoUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black font-mono"
                    />
                    <label className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleArchivoImagen(e, setFormLogoUrl)}
                      />
                    </label>
                    {formEmail?.toLowerCase() === 'liacopizzeria@yopmail.com' && (
                      <button
                        type="button"
                        onClick={() => setFormLogoUrl('/logo.png')}
                        className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
                        title="Usar logo de Liaco"
                      >
                        Liaco Logo
                      </button>
                    )}
                    {formLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormLogoUrl('')}
                        className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
                        title="Quitar logo para usar texto predeterminado"
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  {formLogoUrl && (
                    <div className="mt-2 p-2 bg-zinc-950 rounded-xl inline-flex items-center gap-3 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 font-medium">Vista previa en Menú:</span>
                      <img src={formLogoUrl} alt="Preview Menú" className="h-6 w-auto object-contain max-w-[120px]" />
                    </div>
                  )}
                </div>

                {/* 2. Imagen del Banner Principal del Home */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-zinc-800">
                      2. Logo / Imagen del Banner Principal (Home)
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      Banner visible en el encabezado del Home
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="URL o ruta (ej. /hero-banner.png)"
                      value={formBannerUrl}
                      onChange={(e) => setFormBannerUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black font-mono"
                    />
                    <label className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleArchivoImagen(e, setFormBannerUrl)}
                      />
                    </label>
                    {formEmail?.toLowerCase() === 'liacopizzeria@yopmail.com' && (
                      <button
                        type="button"
                        onClick={() => setFormBannerUrl('/hero-banner.png')}
                        className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
                        title="Usar banner de Liaco"
                      >
                        Liaco Banner
                      </button>
                    )}
                    {formBannerUrl && (
                      <button
                        type="button"
                        onClick={() => setFormBannerUrl('')}
                        className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
                        title="Quitar banner para usar texto predeterminado"
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  {formBannerUrl && (
                    <div className="mt-2 p-2.5 bg-zinc-950 rounded-xl inline-flex items-center gap-3 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 font-medium">Vista previa en Banner Home:</span>
                      <img src={formBannerUrl} alt="Preview Banner" className="h-8 w-auto object-contain max-w-[160px]" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Sede / Ciudad</label>
                  <input
                    type="text"
                    value={formSede}
                    onChange={(e) => setFormSede(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Área de Consumo</label>
                  <input
                    type="text"
                    value={formNombreAreaConsumo}
                    onChange={(e) => setFormNombreAreaConsumo(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setClienteEnEdicion(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
      </AnimatedModal>
    </div>
  );
}

