import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  isFirebaseConfigured, 
  crearUsuarioClienteSecundario,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  firebaseSignOut,
  onAuthStateChanged 
} from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query,
  where,
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';

const AuthContext = createContext();

// Número de WhatsApp del administrador por defecto para soporte/renovación (se puede cambiar desde el panel)
const DEFAULT_WHATSAPP_ADMIN = "+573001234567";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  // Lista de todos los clientes (Solo accesible y escuchada en tiempo real si el usuario es Admin)
  const [todosLosClientes, setTodosLosClientes] = useState([]);

  // Negocio actualmente seleccionado para ver su inventario:
  // - Para un cliente normal: es su propio perfil.
  // - Para el Super Administrador: puede seleccionar cualquier cliente para entrar a su vista en modo soporte o ver su propio panel.
  const [negocioImpersonado, setNegocioImpersonado] = useState(null);

  // 1. Escuchar el estado de autenticación de Firebase
  useEffect(() => {
    if (!auth) {
      setCargandoAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCargandoAuth(true);
      setCurrentUser(user);
      if (user) {
        try {
          // 1. Consultar el perfil del negocio por user.uid directo
          const docRef = doc(db, 'negocios', user.uid);
          const docSnap = await getDoc(docRef);

          let perfilCargado = null;

          if (docSnap.exists()) {
            perfilCargado = { id: docSnap.id, ...docSnap.data() };
          } else {
            // 2. Si no existe por UID (ej. el Administrador actualizó el correo del cliente), buscar por correo
            const emailNormalizado = user.email.toLowerCase().trim();
            const q = query(collection(db, 'negocios'), where('email', '==', emailNormalizado));
            const querySnap = await getDocs(q);

            if (!querySnap.empty) {
              const negocioDoc = querySnap.docs[0];
              perfilCargado = { id: negocioDoc.id, ...negocioDoc.data() };
              // Vincular el uid de autenticación para accesos directos posteriores
              try {
                await updateDoc(doc(db, 'negocios', negocioDoc.id), {
                  authUid: user.uid,
                  lastLogin: serverTimestamp()
                });
              } catch (linkErr) {
                console.warn("Vínculo de UID:", linkErr);
              }
            }
          }

          if (perfilCargado) {
            setUserProfile(perfilCargado);
          } else {
            // Solo el correo del administrador tiene rol de Super Admin
            const esAdminEmail = user.email.toLowerCase() === 'admin-inventario@yopmail.com' || user.email.toLowerCase().includes('admin');
            const esClienteLiaco = user.email.toLowerCase() === 'liacopizzeria@yopmail.com';

            const nuevoPerfil = {
              uid: user.uid,
              email: user.email.toLowerCase(),
              nombreNegocio: esAdminEmail ? 'ADMINISTRADOR MAESTRO' : (esClienteLiaco ? 'LIACO PIZZERIA' : 'MI NEGOCIO'),
              propietario: esAdminEmail ? 'ADMINISTRADOR' : (esClienteLiaco ? 'LIACO' : 'CLIENTE'),
              telefono: '',
              logoUrl: esClienteLiaco ? '/logo.png' : '',
              bannerUrl: esClienteLiaco ? '/hero-banner.png' : '',
              rubro: esClienteLiaco ? 'pizzeria' : 'general',
              emoji: esClienteLiaco ? '🍕' : '🏪',
              nombreAreaConsumo: 'Consumo Cocina',
              colorTema: 'negro',
              sede: 'PRINCIPAL',
              rol: esAdminEmail ? 'admin' : 'cliente', // Liaco es estrictamente cliente
              estado: 'activo',
              diasSuscripcion: esAdminEmail ? 9999 : 30,
              fechaInicioMembresia: new Date().toISOString(),
              fechaVencimiento: new Date(Date.now() + (esAdminEmail ? 9999 : 30) * 24 * 60 * 60 * 1000).toISOString(),
              fechaCreacion: new Date().toISOString()
            };
            await setDoc(docRef, nuevoPerfil);
            setUserProfile(nuevoPerfil);
          }
        } catch (error) {
          console.error("Error cargando perfil del usuario:", error);
        }
      } else {
        setUserProfile(null);
        setNegocioImpersonado(null);
      }
      setCargandoAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Si el usuario es Super Admin, escuchar la lista en tiempo real de todos los negocios/clientes
  useEffect(() => {
    if (!db || !userProfile || userProfile.rol !== 'admin') {
      setTodosLosClientes([]);
      return;
    }

    const unsub = onSnapshot(collection(db, 'negocios'), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filtrar administradores de la lista de clientes a gestionar
      const clientes = lista.filter(item => item.rol === 'cliente');

      // Si Liaco aún no ha iniciado sesión por primera vez en Firestore, incluirlo como Cliente #1
      const existeLiaco = clientes.some(c => c.email?.toLowerCase() === 'liacopizzeria@yopmail.com');
      if (!existeLiaco) {
        clientes.unshift({
          id: 'cliente_liaco_pizzeria',
          uid: 'cliente_liaco_pizzeria',
          email: 'liacopizzeria@yopmail.com',
          nombreNegocio: 'LIACO PIZZERIA',
          propietario: 'LIACO',
          telefono: '',
          logoUrl: '/logo.png',
          bannerUrl: '/hero-banner.png',
          rubro: 'pizzeria',
          emoji: '🍕',
          nombreAreaConsumo: 'Consumo Cocina',
          colorTema: 'negro',
          sede: 'PRINCIPAL',
          rol: 'cliente',
          estado: 'activo',
          diasSuscripcion: 30,
          fechaInicioMembresia: new Date().toISOString(),
          fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          fechaCreacion: new Date().toISOString()
        });
      }

      // Ordenar por fecha de creación descendente
      clientes.sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0));
      setTodosLosClientes(clientes);
    }, (err) => {
      console.warn("Error escuchando negocios:", err);
    });

    return () => unsub();
  }, [userProfile]);

  // Perfil activo actual (si el Admin está viendo una pizzería específica o su propio perfil)
  const negocioActivo = negocioImpersonado || userProfile;
  const esAdmin = userProfile?.rol === 'admin';

  // Sincronizar información del negocio activo en caché local para que el Portal de Compras tenga el nombre al instante
  useEffect(() => {
    const idKey = negocioActivo?.id || negocioActivo?.uid;
    if (idKey && negocioActivo) {
      try {
        localStorage.setItem(`inv_${idKey}_info_negocio`, JSON.stringify(negocioActivo));
      } catch (e) {}
    }
  }, [negocioActivo]);

  // Cálculo de membresía en tiempo real para el cliente activo
  const calcularDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return 0;
    const ahora = new Date().getTime();
    const vencimiento = new Date(fechaVencimiento).getTime();
    const diffDias = Math.ceil((vencimiento - ahora) / (1000 * 60 * 60 * 24));
    return diffDias;
  };

  const diasRestantes = negocioActivo?.rol === 'admin' 
    ? 999 
    : calcularDiasRestantes(negocioActivo?.fechaVencimiento);

  const membresiaValida = esAdmin || (
    negocioActivo?.estado === 'activo' && diasRestantes > 0
  );

  // Iniciar sesión estricto contra Firebase Authentication (solo acepta la contraseña activa actual)
  const iniciarSesion = async (email, password) => {
    if (!auth) throw new Error("Firebase Auth no disponible.");
    const emailNormalizado = String(email || '').trim().toLowerCase();
    const passwordLimpia = String(password || '').trim();

    if (!passwordLimpia) {
      throw new Error("Por favor ingresa tu contraseña.");
    }

    return await signInWithEmailAndPassword(auth, emailNormalizado, passwordLimpia);
  };

  // Restablecer contraseña enviando enlace a correo (útil para yopmail)
  const recuperarContraseña = async (email) => {
    if (!auth) throw new Error("Firebase Auth no disponible.");
    const emailNormalizado = String(email || '').trim().toLowerCase();
    return await sendPasswordResetEmail(auth, emailNormalizado);
  };

  // Cambiar contraseña verificando primero la contraseña actual
  const cambiarPassword = async (passwordActual, nuevaPassword) => {
    if (!auth || !auth.currentUser) throw new Error("No hay una sesión activa en el sistema.");
    const email = auth.currentUser.email;
    if (!email) throw new Error("No se pudo obtener el correo de la cuenta activa.");

    const passwordActualLimpia = String(passwordActual || '').trim();
    const nuevaPasswordLimpia = String(nuevaPassword || '').trim();

    if (!passwordActualLimpia) {
      throw new Error("Debes ingresar tu contraseña actual.");
    }
    if (nuevaPasswordLimpia.length < 6) {
      throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
    }
    if (passwordActualLimpia === nuevaPasswordLimpia) {
      throw new Error("La nueva contraseña no puede ser idéntica a la contraseña actual.");
    }

    try {
      // 1. Re-autenticar con la contraseña actual ingresada
      const credencial = EmailAuthProvider.credential(email, passwordActualLimpia);
      await reauthenticateWithCredential(auth.currentUser, credencial);

      // 2. Si la contraseña actual es correcta, actualizar a la nueva contraseña
      await updatePassword(auth.currentUser, nuevaPasswordLimpia);
      return true;
    } catch (err) {
      console.error("Error al cambiar contraseña:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw new Error("La contraseña actual es incorrecta. Verifica e intenta nuevamente.");
      } else if (err.code === 'auth/weak-password') {
        throw new Error("La nueva contraseña es demasiado débil. Ingresa al menos 6 caracteres.");
      } else if (err.code === 'auth/requires-recent-login') {
        throw new Error("Por seguridad, debes cerrar sesión e iniciarla nuevamente antes de cambiar la contraseña.");
      }
      throw new Error(err.message || "No se pudo actualizar la contraseña.");
    }
  };

  // Cerrar sesión
  const cerrarSesion = async () => {
    if (!auth) return;
    setNegocioImpersonado(null);
    return await firebaseSignOut(auth);
  };

  // Cambiar negocio activo (Modo soporte para el Super Admin)
  const cambiarNegocioActivo = (negocio) => {
    setNegocioImpersonado(negocio);
  };

  // Super Admin: Crear un nuevo cliente (Crea auth en instancia secundaria y guarda en Firestore)
  const crearNuevoCliente = async ({
    email,
    password,
    nombreNegocio,
    propietario = '',
    telefono = '',
    logoUrl = '',
    bannerUrl = '',
    rubro = 'pizzeria',
    emoji = '🍕',
    nombreAreaConsumo = 'Consumo Cocina',
    colorTema = 'negro',
    sede = 'PRINCIPAL',
    diasMembresia = 30
  }) => {
    if (!esAdmin) throw new Error("Solo el Super Administrador puede crear cuentas.");

    // 1. Crear en Firebase Auth sin desconectar al admin
    const user = await crearUsuarioClienteSecundario(email.trim(), password);

    // 2. Calcular fechas de membresía
    const ahora = new Date();
    const fechaVence = new Date(ahora.getTime() + (Number(diasMembresia) || 30) * 24 * 60 * 60 * 1000);

    // 3. Crear documento en la colección 'negocios'
    const perfilNegocio = {
      uid: user.uid,
      email: email.trim().toLowerCase(),
      nombreNegocio: nombreNegocio.trim().toUpperCase(),
      propietario: propietario.trim().toUpperCase(),
      telefono: telefono.trim(),
      logoUrl: logoUrl.trim() || '',
      bannerUrl: bannerUrl.trim() || '',
      rubro: rubro || 'pizzeria',
      emoji: emoji || '🍕',
      nombreAreaConsumo: nombreAreaConsumo || 'Consumo Cocina',
      colorTema: colorTema || 'negro',
      sede: sede.trim().toUpperCase() || 'PRINCIPAL',
      rol: 'cliente',
      estado: 'activo',
      passwordInicial: password.trim() || '',
      diasSuscripcion: Number(diasMembresia) || 30,
      fechaInicioMembresia: ahora.toISOString(),
      fechaVencimiento: fechaVence.toISOString(),
      fechaCreacion: ahora.toISOString()
    };

    await setDoc(doc(db, 'negocios', user.uid), perfilNegocio);
    return perfilNegocio;
  };

  // Super Admin: Actualizar datos de un cliente (permite cambiar correo y contraseña sin perder ningún dato de su negocio)
  const actualizarCliente = async (uid, datosActualizados, nuevaPassword = '') => {
    if (!esAdmin) throw new Error("No tienes permisos de Administrador.");
    const docRef = doc(db, 'negocios', uid);

    if (datosActualizados.email) {
      const emailNormalizado = datosActualizados.email.trim().toLowerCase();
      datosActualizados.email = emailNormalizado;

      // Si el Super Admin le asignó una nueva clave de acceso
      if (nuevaPassword && nuevaPassword.trim().length >= 6) {
        try {
          // Provisionar credenciales en Firebase Auth para que el nuevo correo pueda entrar de inmediato
          await crearUsuarioClienteSecundario(emailNormalizado, nuevaPassword.trim());
          datosActualizados.passwordInicial = nuevaPassword.trim();
        } catch (authErr) {
          console.warn("Nota al provisionar credenciales secundarias:", authErr.code);
        }
      }
    }

    // Actualizar documento de Firestore (mantiene todo el inventario, productos y proveedores intactos)
    await updateDoc(docRef, {
      ...datosActualizados,
      updatedAt: serverTimestamp()
    });
  };

  // Super Admin: Renovar membresía sumando días adicionales (ej. +30 días)
  const renovarMembresiaCliente = async (uid, diasAdicionales = 30) => {
    if (!esAdmin) throw new Error("No tienes permisos de Administrador.");
    const cliente = todosLosClientes.find(c => c.uid === uid || c.id === uid);
    if (!cliente) return;

    // Si ya está vencido, sumamos desde hoy; si aún está activo, sumamos a partir de su vencimiento actual
    const baseTiempo = new Date(cliente.fechaVencimiento).getTime() > Date.now()
      ? new Date(cliente.fechaVencimiento).getTime()
      : Date.now();

    const nuevoVencimiento = new Date(baseTiempo + diasAdicionales * 24 * 60 * 60 * 1000);

    const docRef = doc(db, 'negocios', uid);
    await updateDoc(docRef, {
      fechaVencimiento: nuevoVencimiento.toISOString(),
      estado: 'activo',
      updatedAt: serverTimestamp()
    });
  };

  // Super Admin: Suspender o reactivar acceso de un cliente
  const toggleSuspenderCliente = async (uid) => {
    if (!esAdmin) throw new Error("No tienes permisos de Administrador.");
    const cliente = todosLosClientes.find(c => c.uid === uid || c.id === uid);
    if (!cliente) return;

    const nuevoEstado = cliente.estado === 'activo' ? 'suspendido' : 'activo';
    const docRef = doc(db, 'negocios', uid);
    await updateDoc(docRef, {
      estado: nuevoEstado,
      updatedAt: serverTimestamp()
    });
  };

  // Super Admin: Eliminar cuenta de un cliente
  const eliminarCliente = async (uid) => {
    if (!esAdmin) throw new Error("No tienes permisos de Administrador.");
    await deleteDoc(doc(db, 'negocios', uid));
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      negocioActivo,
      negocioImpersonado,
      negocioId: negocioActivo?.id || negocioActivo?.uid || 'default_tenant',
      esAdmin,
      diasRestantes,
      membresiaValida,
      cargandoAuth,
      todosLosClientes,
      whatsappAdmin: DEFAULT_WHATSAPP_ADMIN,
      iniciarSesion,
      cerrarSesion,
      cambiarNegocioActivo,
      crearNuevoCliente,
      actualizarCliente,
      renovarMembresiaCliente,
      toggleSuspenderCliente,
      eliminarCliente,
      calcularDiasRestantes,
      recuperarContraseña,
      cambiarPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}
