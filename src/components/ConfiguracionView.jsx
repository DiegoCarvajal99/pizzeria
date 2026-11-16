import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import AnimatedModal from './common/AnimatedModal';
import {
  Settings,
  Users,
  KeyRound,
  UserPlus,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Link2,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingBag,
  X
} from 'lucide-react';

// URL base oficial en producción (Vercel)
export const getBasePortalUrl = () => 'https://pizzeria-kappa-gold.vercel.app/';

export default function ConfiguracionView() {
  const {
    negocioId,
    cambiarPassword
  } = useAuth();

  const {
    mostrarAlerta,
    empleadosCompras = [],
    agregarEmpleadoCompra,
    actualizarEmpleadoCompra,
    eliminarEmpleadoCompra,
    solicitarConfirmacion
  } = useInventory();

  // Pestaña activa: 'empleados' | 'seguridad'
  const [tabActiva, setTabActiva] = useState('empleados');

  // Estados formulario de Empleados de Compras
  const [nombreEmpleado, setNombreEmpleado] = useState('');
  const [usuarioEmpleado, setUsuarioEmpleado] = useState('');
  const [pinEmpleado, setPinEmpleado] = useState('');
  const [verPinEmpleado, setVerPinEmpleado] = useState(true);
  const [guardandoEmpleado, setGuardandoEmpleado] = useState(false);

  // Estados para modal de edición de empleado
  const [empleadoEnEdicion, setEmpleadoEnEdicion] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editUsuario, setEditUsuario] = useState('');
  const [editPin, setEditPin] = useState('');
  const [verPinEditEmpleado, setVerPinEditEmpleado] = useState(true);
  const [guardandoEditEmpleado, setGuardandoEditEmpleado] = useState(false);
  const [errorEditEmpleado, setErrorEditEmpleado] = useState(null);

  // Estados formulario de cambio de contraseña
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirmar, setPassConfirmar] = useState('');
  const [verPassActual, setVerPassActual] = useState(false);
  const [verPassNueva, setVerPassNueva] = useState(false);
  const [verPassConfirmar, setVerPassConfirmar] = useState(false);
  const [guardandoPass, setGuardandoPass] = useState(false);

  const [errorEmpleado, setErrorEmpleado] = useState(null);
  const [exitoEmpleado, setExitoEmpleado] = useState(null);
  const [errorPass, setErrorPass] = useState(null);
  const [exitoPass, setExitoPass] = useState(null);

  const tenantParam = encodeURIComponent(negocioId || 'default_tenant');
  const linkPortalCompras = `${getBasePortalUrl()}?compras=${tenantParam}`;

  const handleCrearEmpleado = async (e) => {
    e.preventDefault();
    setErrorEmpleado(null);
    setExitoEmpleado(null);

    const nombreLimpio = nombreEmpleado.trim().toUpperCase();
    const usuarioLimpio = usuarioEmpleado.trim().toUpperCase().replace(/\s+/g, '');
    const pinLimpio = pinEmpleado.trim().replace(/\D/g, '');

    if (!nombreLimpio || !usuarioLimpio) {
      setErrorEmpleado('Por favor ingresa tanto el nombre como el usuario del empleado.');
      return;
    }

    if (!pinLimpio || pinLimpio.length !== 4) {
      setErrorEmpleado('El PIN de seguridad es obligatorio y debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    setGuardandoEmpleado(true);
    try {
      const creado = await agregarEmpleadoCompra(nombreLimpio, usuarioLimpio, pinLimpio);
      if (creado) {
        setNombreEmpleado('');
        setUsuarioEmpleado('');
        setPinEmpleado('');
        setExitoEmpleado(`Empleado "${creado.nombre}" (@${creado.usuario}) registrado correctamente con PIN de seguridad.`);
      }
    } catch (err) {
      setErrorEmpleado(err.message || 'Error al registrar el empleado.');
    } finally {
      setGuardandoEmpleado(false);
    }
  };

  const handleCopiarLinkCompras = () => {
    navigator.clipboard.writeText(linkPortalCompras);
    setExitoEmpleado('¡Enlace de acceso para empleados copiado al portapapeles!');
    if (mostrarAlerta) {
      mostrarAlerta('🔗 Enlace de compras copiado al portapapeles', 'success');
    }
  };

  const handleConfirmarEliminarEmpleado = (emp) => {
    if (solicitarConfirmacion) {
      solicitarConfirmacion({
        titulo: '¿Eliminar empleado de compras?',
        mensaje: `¿Estás seguro de que deseas eliminar a "${emp.nombre}" (@${emp.usuario})? Ya no podrá ingresar al enlace de compras con ese usuario.`,
        textoConfirmar: 'Sí, eliminar',
        textoCancelar: 'Cancelar',
        onConfirmar: () => eliminarEmpleadoCompra(emp.id)
      });
    } else {
      eliminarEmpleadoCompra(emp.id);
    }
  };

  const handleAbrirEditarEmpleado = (emp) => {
    setEmpleadoEnEdicion(emp);
    setEditNombre(emp.nombre || '');
    setEditUsuario(emp.usuario || '');
    setEditPin(emp.pin || '');
    setVerPinEditEmpleado(true);
    setErrorEditEmpleado(null);
  };

  const handleCerrarEditarEmpleado = () => {
    setEmpleadoEnEdicion(null);
    setEditNombre('');
    setEditUsuario('');
    setEditPin('');
    setVerPinEditEmpleado(true);
    setErrorEditEmpleado(null);
  };

  const handleGuardarEdicionEmpleado = async (e) => {
    e.preventDefault();
    if (!empleadoEnEdicion) return;

    setErrorEditEmpleado(null);
    const nombreLimpio = editNombre.trim().toUpperCase();
    const usuarioLimpio = editUsuario.trim().toUpperCase().replace(/\s+/g, '');
    const pinLimpio = editPin.trim().replace(/\D/g, '');

    if (!nombreLimpio || !usuarioLimpio) {
      setErrorEditEmpleado('Por favor ingresa tanto el nombre como el usuario.');
      return;
    }

    if (!pinLimpio || pinLimpio.length !== 4) {
      setErrorEditEmpleado('El PIN de seguridad es obligatorio y debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    setGuardandoEditEmpleado(true);
    try {
      if (actualizarEmpleadoCompra) {
        await actualizarEmpleadoCompra(empleadoEnEdicion.id, {
          nombre: nombreLimpio,
          usuario: usuarioLimpio,
          pin: pinLimpio
        });
      }
      setExitoEmpleado(`Empleado "${nombreLimpio}" actualizado correctamente.`);
      if (mostrarAlerta) {
        mostrarAlerta(`✅ Empleado "${nombreLimpio}" actualizado correctamente`, 'success');
      }
      handleCerrarEditarEmpleado();
    } catch (err) {
      setErrorEditEmpleado(err.message || 'Error al actualizar el empleado.');
    } finally {
      setGuardandoEditEmpleado(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErrorPass(null);
    setExitoPass(null);

    const actual = passActual.trim();
    const nueva = passNueva.trim();
    const confirmar = passConfirmar.trim();

    if (!actual || !nueva || !confirmar) {
      setErrorPass('Por favor completa todos los campos requeridos.');
      return;
    }

    if (nueva.length < 6) {
      setErrorPass('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (nueva !== confirmar) {
      setErrorPass('Las nuevas contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    if (actual === nueva) {
      setErrorPass('La nueva contraseña no puede ser idéntica a la contraseña actual.');
      return;
    }

    setGuardandoPass(true);
    try {
      await cambiarPassword(actual, nueva);
      setExitoPass('¡Contraseña actualizada exitosamente!');
      setPassActual('');
      setPassNueva('');
      setPassConfirmar('');
      setVerPassActual(false);
      setVerPassNueva(false);
      setVerPassConfirmar(false);
      if (mostrarAlerta) {
        mostrarAlerta('Contraseña cambiada con éxito', 'success');
      }
    } catch (err) {
      setErrorPass(err.message || 'Error al cambiar contraseña.');
    } finally {
      setGuardandoPass(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Cabecera de la Página de Configuración */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-zinc-900 font-display">
              Configuración del Sistema
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Gestiona los empleados que realizan las compras, su enlace de acceso directo y la seguridad de tu cuenta.
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas de Configuración */}
      <div className="bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTabActiva('empleados')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              tabActiva === 'empleados'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Empleados de Compras</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              tabActiva === 'empleados' ? 'bg-amber-400 text-black' : 'bg-zinc-200 text-zinc-700'
            }`}>
              {empleadosCompras.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('seguridad')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              tabActiva === 'seguridad'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Seguridad & Contraseña</span>
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: EMPLEADOS DE COMPRAS Y ENLACE DE ACCESO */}
      {tabActiva === 'empleados' && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center shrink-0 font-bold shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-900 font-display">
                Empleados de Compras & Link de Acceso
              </h2>
              <p className="text-xs text-zinc-500">
                Crea usuarios sin contraseña para que tus empleados consulten los pedidos pendientes por recibir.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-zinc-900 text-white text-xs font-extrabold self-start sm:self-center">
            {empleadosCompras.length} {empleadosCompras.length === 1 ? 'empleado registrado' : 'empleados registrados'}
          </span>
        </div>

        <div className="p-5 space-y-6">
          {/* Tarjeta del Enlace Oficial */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 text-white border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-4 h-4" />
                <span>Enlace Oficial para Empleados de Compras</span>
              </span>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Incluido automáticamente en WhatsApp
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Comparte este enlace o envíalo desde el botón de WhatsApp en Pedidos. El empleado entra únicamente escribiendo su <strong>Usuario</strong> (sin contraseña).
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={linkPortalCompras}
                className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-mono focus:outline-none select-all"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopiarLinkCompras}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Enlace</span>
                </button>
                <a
                  href={linkPortalCompras}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  title="Abrir enlace en nueva pestaña"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Abrir</span>
                </a>
              </div>
            </div>
          </div>

          {/* Alertas de Empleados */}
          {errorEmpleado && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorEmpleado}</span>
            </div>
          )}

          {exitoEmpleado && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{exitoEmpleado}</span>
            </div>
          )}

          {/* Formulario y Lista en Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Formulario Crear Empleado */}
            <form
              onSubmit={handleCrearEmpleado}
              className="md:col-span-5 p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4"
            >
              <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-black" />
                <span>Nuevo Empleado de Compras</span>
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1 uppercase">
                  Nombre del Empleado
                </label>
                <input
                  type="text"
                  value={nombreEmpleado}
                  onChange={(e) => setNombreEmpleado(e.target.value.toUpperCase())}
                  placeholder="EJ: CARLOS PÉREZ"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1 uppercase">
                  Usuario de Acceso (Sin espacios)
                </label>
                <input
                  type="text"
                  value={usuarioEmpleado}
                  onChange={(e) => setUsuarioEmpleado(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="EJ: CARLOS01"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black uppercase"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase">
                    PIN de Seguridad (4 Dígitos) *
                  </label>
                  <span className="text-[10px] text-amber-700 font-extrabold uppercase">
                    Obligatorio
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type={verPinEmpleado ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={4}
                    value={pinEmpleado}
                    onChange={(e) => setPinEmpleado(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Ej: 4920"
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black text-center tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPinEmpleado(!verPinEmpleado)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-black transition-colors cursor-pointer"
                    title={verPinEmpleado ? 'Ocultar PIN' : 'Ver PIN'}
                  >
                    {verPinEmpleado ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Requerido: el empleado deberá digitar este PIN de 4 dígitos para ingresar al portal.
                </p>
              </div>

              <button
                type="submit"
                disabled={guardandoEmpleado}
                className="w-full py-2.5 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{guardandoEmpleado ? 'Guardando...' : 'Crear Empleado'}</span>
              </button>
            </form>

            {/* Listado de Empleados */}
            <div className="md:col-span-7 space-y-3">
              <h3 className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-zinc-700" />
                <span>Empleados Habilitados ({empleadosCompras.length})</span>
              </h3>

              {empleadosCompras.length === 0 ? (
                <div className="p-8 rounded-2xl bg-zinc-50 border border-dashed border-zinc-300 text-center space-y-1.5">
                  <Users className="w-8 h-8 text-zinc-400 mx-auto" />
                  <p className="text-xs font-bold text-zinc-700">
                    Aún no has registrado empleados de compras
                  </p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    Usa el formulario de la izquierda para crear el nombre y usuario de las personas encargadas de hacer las compras.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {empleadosCompras.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 shadow-2xs transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-zinc-900 text-amber-400 flex items-center justify-center font-black text-xs shrink-0">
                          {(emp.nombre || 'E').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-zinc-900 truncate">
                            {emp.nombre}
                          </p>
                          <p className="text-[11px] font-mono font-bold text-zinc-500 truncate flex items-center flex-wrap gap-1.5 mt-0.5">
                            <span>Usuario: <strong className="text-black">{emp.usuario}</strong></span>
                            {emp.pin ? (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-mono font-black border border-emerald-200">
                                PIN: {emp.pin}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                                Sin PIN (Asignar)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAbrirEditarEmpleado(emp)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Editar empleado y asignar/cambiar PIN"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmarEliminarEmpleado(emp)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar empleado"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* PESTAÑA 2: SEGURIDAD Y CAMBIO DE CONTRASEÑA */}
      {tabActiva === 'seguridad' && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-sky-400 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-zinc-900 font-display">
              Seguridad y Contraseña de la Cuenta
            </h2>
            <p className="text-xs text-zinc-500">
              Actualiza la contraseña de acceso administrativo de tu negocio.
            </p>
          </div>
        </div>

        <div className="p-5 max-w-xl space-y-4">
          {errorPass && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorPass}</span>
            </div>
          )}

          {exitoPass && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{exitoPass}</span>
            </div>
          )}

          <form onSubmit={handleCambiarPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
                Contraseña Actual
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type={verPassActual ? 'text' : 'password'}
                  value={passActual}
                  onChange={(e) => setPassActual(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setVerPassActual(!verPassActual)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-black transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {verPassActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type={verPassNueva ? 'text' : 'password'}
                    value={passNueva}
                    onChange={(e) => setPassNueva(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassNueva(!verPassNueva)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-black transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {verPassNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type={verPassConfirmar ? 'text' : 'password'}
                    value={passConfirmar}
                    onChange={(e) => setPassConfirmar(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassConfirmar(!verPassConfirmar)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-black transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {verPassConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={guardandoPass}
                className="px-5 py-2.5 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                {guardandoPass ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <span>Guardar Nueva Contraseña</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* MODAL DE EDICIÓN DE EMPLEADO (Asignar / Cambiar PIN o Nombre/Usuario) */}
      <AnimatedModal
        isOpen={Boolean(empleadoEnEdicion)}
        onBackdropClick={handleCerrarEditarEmpleado}
        overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        panelClassName="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-5 relative"
      >
        <button
          type="button"
          onClick={handleCerrarEditarEmpleado}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-black rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-600 flex items-center justify-center font-black">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wide">
              Editar Empleado de Compras
            </h3>
            <p className="text-xs text-zinc-500">
              Actualiza su nombre, usuario o asígnale un PIN de 4 dígitos.
            </p>
          </div>
        </div>

        {errorEditEmpleado && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorEditEmpleado}</span>
          </div>
        )}

        <form onSubmit={handleGuardarEdicionEmpleado} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value.toUpperCase())}
              required
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-black uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase">
              Usuario de Acceso * (Sin espacios)
            </label>
            <input
              type="text"
              value={editUsuario}
              onChange={(e) => setEditUsuario(e.target.value.toUpperCase().replace(/\s+/g, ''))}
              required
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-black uppercase"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-zinc-700 uppercase">
                PIN de Seguridad (4 Dígitos) *
              </label>
              <span className="text-[10px] text-amber-700 font-extrabold uppercase">
                Obligatorio
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type={verPinEditEmpleado ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={4}
                value={editPin}
                onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4 dígitos (ej: 1234)"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-black text-zinc-900 focus:outline-none focus:border-black tracking-widest text-center"
              />
              <button
                type="button"
                onClick={() => setVerPinEditEmpleado(!verPinEditEmpleado)}
                tabIndex={-1}
                className="absolute right-3.5 top-2.5 text-zinc-400 hover:text-black transition-colors cursor-pointer"
                title={verPinEditEmpleado ? 'Ocultar PIN' : 'Ver PIN'}
              >
                {verPinEditEmpleado ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
              El PIN asignado es visible aquí. Puedes cambiarlo en cualquier momento por otro PIN de 4 dígitos numéricos.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleCerrarEditarEmpleado}
              className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-black rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardandoEditEmpleado}
              className="px-5 py-2 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              {guardandoEditEmpleado ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          </div>
        </form>
      </AnimatedModal>
    </div>
  );
}

