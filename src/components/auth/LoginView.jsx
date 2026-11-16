import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ShieldCheck,
  Sparkles,
  Boxes,
  CheckCircle2
} from 'lucide-react';

export default function LoginView() {
  const { iniciarSesion, recuperarContraseña } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  const handleRecuperarPassword = async () => {
    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico primero para enviarte el enlace de restablecimiento.');
      return;
    }
    setError(null);
    setCargando(true);
    try {
      if (recuperarContraseña) {
        await recuperarContraseña(email.trim());
      }
      setMensajeExito(`Enlace de recuperación enviado a ${email.trim()}. Si usas Yopmail, puedes abrir tu bandeja en yopmail.com.`);
    } catch (err) {
      console.error("Error al recuperar:", err);
      setError('No se pudo enviar el correo de recuperación: ' + (err.message || 'Verifica el correo ingresado.'));
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setError(null);
    setMensajeExito(null);
    setCargando(true);

    try {
      await iniciarSesion(email.trim(), password.trim());
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      let mensaje = err.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        mensaje = 'No existe una cuenta con este correo o la contraseña es inválida.';
      } else if (err.code === 'auth/wrong-password') {
        mensaje = 'Contraseña incorrecta.';
      } else if (err.code === 'auth/too-many-requests') {
        mensaje = 'Demasiados intentos fallidos. Intenta más tarde.';
      } else if (err.code === 'auth/email-already-in-use') {
        mensaje = 'La cuenta ya existe pero la contraseña no coincide. Usa "Restablecer contraseña" abajo.';
      }
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-white selection:text-black font-body">
      {/* Luces sutiles de fondo */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-zinc-800/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-zinc-800/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Cabecera con Branding Neutral SaaS */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl mb-1">
            <Boxes className="w-9 h-9 text-amber-400 stroke-[1.8]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold font-display tracking-tight text-white flex items-center justify-center gap-2">
              <span>Plataforma de Inventarios SaaS</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
              Inicia sesión con tu cuenta de negocio o administrador para acceder al sistema.
            </p>
          </div>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mensajeExito && (
            <div className="mb-5 p-3.5 bg-emerald-950/50 border border-emerald-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-300 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{mensajeExito}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@negocio.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type={mostrarPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-white hover:bg-zinc-200 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold rounded-xl text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {cargando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Ingresar al Sistema</span>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleRecuperarPassword}
                className="text-xs text-zinc-400 hover:text-amber-400 underline underline-offset-4 transition-colors cursor-pointer"
              >
                ¿Olvidaste tu contraseña o necesitas restablecerla?
              </button>
            </div>
          </form>

          {/* Pie informativo */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center space-y-2">
            <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Acceso seguro protegido con membresía activa</span>
            </p>
          </div>
        </div>

        {/* Créditos y Soporte */}
        <p className="text-center text-xs text-zinc-600">
          ¿No tienes una cuenta activa o necesitas renovar? <br />
          Contacta a tu proveedor autorizado para solicitar tu membresía.
        </p>
      </div>
    </div>
  );
}

