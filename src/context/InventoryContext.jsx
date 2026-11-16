import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase';
import { useAuth } from './AuthContext';
import { sanitizeNombre, sanitizeUsuario, sanitizeNota, sanitizeText, sanitizePin } from '../utils/security';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  INITIAL_PROVEEDORES, 
  INITIAL_PRODUCTOS,
  LIACO_HISTORICO_PROVEEDORES,
  LIACO_HISTORICO_PRODUCTOS 
} from '../data/initialData';

const InventoryContext = createContext();

export function InventoryProvider({ children }) {
  // Conectar con el contexto de autenticación y multi-inquilino (multi-tenant)
  let authContext = null;
  try {
    authContext = useAuth();
  } catch (e) {
    // Si se monta antes o fuera de AuthProvider
  }
  const negocioId = authContext?.negocioId || 'default_tenant';

  const [productos, setProductos] = useState(() => {
    try {
      const saved = localStorage.getItem(`inv_${negocioId}_productos`);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [proveedores, setProveedores] = useState(() => {
    try {
      const saved = localStorage.getItem(`inv_${negocioId}_proveedores`);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [pedidos, setPedidos] = useState(() => {
    try {
      const saved = localStorage.getItem(`inv_${negocioId}_pedidos`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [movimientos, setMovimientos] = useState(() => {
    try {
      const saved = localStorage.getItem(`inv_${negocioId}_movimientos`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Empleados encargados de las compras (acceden con su usuario por medio del link sin contraseña)
  const [empleadosCompras, setEmpleadosCompras] = useState(() => {
    try {
      const saved = localStorage.getItem(`inv_${negocioId}_empleados_compras`) || localStorage.getItem('inv_empleados_compras_activo');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Carrito de pedido persistente para que el usuario no pierda su lista al cambiar de pestaña o salir del modal
  const [carritoPedido, setCarritoPedidoState] = useState(() => {
    try {
      const saved = localStorage.getItem(`inv_${negocioId}_carrito_pedido`) || localStorage.getItem('inv_carrito_pedido_activo');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [observacionCarrito, setObservacionCarritoState] = useState(() => {
    try {
      return localStorage.getItem(`inv_${negocioId}_carrito_obs`) || localStorage.getItem('inv_carrito_obs_activo') || '';
    } catch {
      return '';
    }
  });

  const setCarritoPedido = (updater) => {
    setCarritoPedidoState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        if (negocioId && negocioId !== 'default_tenant') {
          localStorage.setItem(`inv_${negocioId}_carrito_pedido`, JSON.stringify(next));
        }
        localStorage.setItem('inv_carrito_pedido_activo', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const setObservacionCarrito = (updater) => {
    setObservacionCarritoState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        if (negocioId && negocioId !== 'default_tenant') {
          localStorage.setItem(`inv_${negocioId}_carrito_obs`, next);
        }
        localStorage.setItem('inv_carrito_obs_activo', next);
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const [notificacion, setNotificacion] = useState(null);
  const [modalConfirmacion, setModalConfirmacion] = useState(null);
  const [errorFirebase, setErrorFirebase] = useState(null);

  // Al cambiar de negocio activo (o inicio de sesión), recargar caché local del negocio
  // Preserva y migra automáticamente cualquier dato creado previamente para Liaco Pizzería
  useEffect(() => {
    if (!negocioId || negocioId === 'default_tenant') {
      return;
    }

    const emailNegocio = (authContext?.negocioActivo?.email || authContext?.currentUser?.email || '').toLowerCase().trim();
    const esLiaco = emailNegocio === 'liacopizzeria@yopmail.com' || emailNegocio.includes('liaco');

    // 1. Cargar Productos
    try {
      const savedProd = localStorage.getItem(`inv_${negocioId}_productos`);
      const parsedSavedProd = savedProd ? JSON.parse(savedProd) : [];
      const legacyProd = localStorage.getItem('pizzeria_inventario_productos:v2');
      const parsedLegacyProd = legacyProd ? JSON.parse(legacyProd) : [];

      if (esLiaco && parsedLegacyProd.length > parsedSavedProd.length) {
        setProductos(parsedLegacyProd);
        localStorage.setItem(`inv_${negocioId}_productos`, JSON.stringify(parsedLegacyProd));
      } else if (parsedSavedProd.length > 0) {
        setProductos(parsedSavedProd);
      } else if (esLiaco && parsedLegacyProd.length > 0) {
        setProductos(parsedLegacyProd);
        localStorage.setItem(`inv_${negocioId}_productos`, JSON.stringify(parsedLegacyProd));
      } else if (esLiaco) {
        setProductos(LIACO_HISTORICO_PRODUCTOS);
        localStorage.setItem(`inv_${negocioId}_productos`, JSON.stringify(LIACO_HISTORICO_PRODUCTOS));
      } else {
        setProductos([]);
      }
    } catch {
      setProductos([]);
    }

    // 2. Cargar Proveedores
    try {
      const savedProv = localStorage.getItem(`inv_${negocioId}_proveedores`);
      const parsedSavedProv = savedProv ? JSON.parse(savedProv) : [];
      const legacyProv = localStorage.getItem('pizzeria_inventario_proveedores:v2');
      const parsedLegacyProv = legacyProv ? JSON.parse(legacyProv) : [];

      if (esLiaco && parsedLegacyProv.length > parsedSavedProv.length) {
        setProveedores(parsedLegacyProv);
        localStorage.setItem(`inv_${negocioId}_proveedores`, JSON.stringify(parsedLegacyProv));
      } else if (parsedSavedProv.length > 0) {
        setProveedores(parsedSavedProv);
      } else if (esLiaco && parsedLegacyProv.length > 0) {
        setProveedores(parsedLegacyProv);
        localStorage.setItem(`inv_${negocioId}_proveedores`, JSON.stringify(parsedLegacyProv));
      } else if (esLiaco) {
        setProveedores(LIACO_HISTORICO_PROVEEDORES);
        localStorage.setItem(`inv_${negocioId}_proveedores`, JSON.stringify(LIACO_HISTORICO_PROVEEDORES));
      } else {
        setProveedores([]);
      }
    } catch {
      setProveedores([]);
    }

    // 3. Cargar Pedidos (incluye pedidos pendientes por recibir y completados)
    try {
      const savedPed = localStorage.getItem(`inv_${negocioId}_pedidos`);
      const parsedSavedPed = savedPed ? JSON.parse(savedPed) : [];
      const legacyPed = localStorage.getItem('pizzeria_inventario_pedidos:v2');
      const parsedLegacyPed = legacyPed ? JSON.parse(legacyPed) : [];

      if (esLiaco && parsedLegacyPed.length > parsedSavedPed.length) {
        setPedidos(parsedLegacyPed);
        localStorage.setItem(`inv_${negocioId}_pedidos`, JSON.stringify(parsedLegacyPed));
      } else if (parsedSavedPed.length > 0) {
        setPedidos(parsedSavedPed);
      } else if (esLiaco && parsedLegacyPed.length > 0) {
        setPedidos(parsedLegacyPed);
        localStorage.setItem(`inv_${negocioId}_pedidos`, JSON.stringify(parsedLegacyPed));
      } else {
        setPedidos([]);
      }
    } catch {
      setPedidos([]);
    }

    // 4. Cargar Movimientos
    try {
      const savedMov = localStorage.getItem(`inv_${negocioId}_movimientos`);
      const parsedSavedMov = savedMov ? JSON.parse(savedMov) : [];
      const legacyMov = localStorage.getItem('pizzeria_inventario_movimientos:v2');
      const parsedLegacyMov = legacyMov ? JSON.parse(legacyMov) : [];

      if (esLiaco && parsedLegacyMov.length > parsedSavedMov.length) {
        setMovimientos(parsedLegacyMov);
        localStorage.setItem(`inv_${negocioId}_movimientos`, JSON.stringify(parsedLegacyMov));
      } else if (parsedSavedMov.length > 0) {
        setMovimientos(parsedSavedMov);
      } else if (esLiaco && parsedLegacyMov.length > 0) {
        setMovimientos(parsedLegacyMov);
        localStorage.setItem(`inv_${negocioId}_movimientos`, JSON.stringify(parsedLegacyMov));
      } else {
        setMovimientos([]);
      }
    } catch {
      setMovimientos([]);
    }

    // 5. Cargar Carrito de Pedido en curso (para no perder el avance al salir o cambiar de pestaña)
    try {
      const savedCart = localStorage.getItem(`inv_${negocioId}_carrito_pedido`) || localStorage.getItem('inv_carrito_pedido_activo');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (parsed && Object.keys(parsed).length > 0) {
          setCarritoPedidoState(parsed);
        }
      }
      const savedObs = localStorage.getItem(`inv_${negocioId}_carrito_obs`) || localStorage.getItem('inv_carrito_obs_activo');
      if (savedObs) {
        setObservacionCarritoState(savedObs);
      }
    } catch {
      // Conservar estado en memoria
    }

    // 6. Cargar Empleados de Compras
    try {
      const savedEmp = localStorage.getItem(`inv_${negocioId}_empleados_compras`) || localStorage.getItem('inv_empleados_compras_activo');
      if (savedEmp) {
        setEmpleadosCompras(JSON.parse(savedEmp));
      }
    } catch {
      // Conservar estado en memoria
    }
  }, [negocioId, authContext?.negocioActivo?.email, authContext?.currentUser?.email]);

  const mostrarAlerta = (mensaje, tipo = 'success', titulo = '') => {
    setNotificacion({ mensaje, tipo, titulo, id: Date.now() });
    setTimeout(() => {
      setNotificacion(prev => (prev?.mensaje === mensaje ? null : prev));
    }, 4000);
  };

  const cerrarAlerta = () => setNotificacion(null);

  const solicitarConfirmacion = ({
    titulo = '¿Eliminar registro?',
    mensaje = '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.',
    textoConfirmar = 'Sí, eliminar',
    textoCancelar = 'Descartar',
    tipo = 'danger',
    onConfirmar
  }) => {
    setModalConfirmacion({
      titulo,
      mensaje,
      textoConfirmar,
      textoCancelar,
      tipo,
      onConfirmar: async () => {
        setModalConfirmacion(null);
        if (onConfirmar) await onConfirmar();
      },
      onCancelar: () => {
        setModalConfirmacion(null);
      }
    });
  };

  const cerrarConfirmacion = () => setModalConfirmacion(null);

  // Guardar en localStorage siempre como caché y fallback aislado por negocio
  useEffect(() => {
    if (!negocioId || negocioId === 'default_tenant') return;
    try {
      localStorage.setItem(`inv_${negocioId}_productos`, JSON.stringify(productos));
    } catch (e) {
      console.error(e);
    }
  }, [productos, negocioId]);

  useEffect(() => {
    if (!negocioId || negocioId === 'default_tenant') return;
    try {
      localStorage.setItem(`inv_${negocioId}_proveedores`, JSON.stringify(proveedores));
    } catch (e) {
      console.error(e);
    }
  }, [proveedores, negocioId]);

  useEffect(() => {
    if (!negocioId || negocioId === 'default_tenant') return;
    try {
      localStorage.setItem(`inv_${negocioId}_pedidos`, JSON.stringify(pedidos));
    } catch (e) {
      console.error(e);
    }
  }, [pedidos, negocioId]);

  useEffect(() => {
    if (!negocioId || negocioId === 'default_tenant') return;
    try {
      localStorage.setItem(`inv_${negocioId}_movimientos`, JSON.stringify(movimientos));
    } catch (e) {
      console.error(e);
    }
  }, [movimientos, negocioId]);

  useEffect(() => {
    if (!negocioId || negocioId === 'default_tenant') return;
    try {
      localStorage.setItem(`inv_${negocioId}_empleados_compras`, JSON.stringify(empleadosCompras));
      localStorage.setItem('inv_empleados_compras_activo', JSON.stringify(empleadosCompras));
    } catch (e) {
      console.error(e);
    }
  }, [empleadosCompras, negocioId]);

  const registrarMovimiento = (tipo, prodNombre, delta, stockPrevio, stockNuevo, referencia = '') => {
    const mov = {
      id: 'mov_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      fecha: new Date().toISOString(),
      tipo, // 'entrada_pedido' | 'ajuste_manual' | 'consumo_cocina'
      prodNombre,
      delta,
      stockPrevio,
      stockNuevo,
      referencia
    };
    setMovimientos(prev => [mov, ...prev.slice(0, 99)]); // guardamos los últimos 100
    // Persistir movimiento en Firestore bajo la subcolección del negocio
    if (negocioId && negocioId !== 'default_tenant') {
      syncDoc('movimientos', mov.id, mov);
    }
  };

  // Escuchar en tiempo real Firestore para el negocio activo (Multi-Tenant aislado)
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !negocioId || negocioId === 'default_tenant') return;

    const emailNegocio = (authContext?.negocioActivo?.email || authContext?.currentUser?.email || '').toLowerCase().trim();
    const esLiaco = emailNegocio === 'liacopizzeria@yopmail.com' || emailNegocio.includes('liaco');

    const manejarErrorFirebase = (err, recurso) => {
      console.warn(`Error escuchando ${recurso} en Firestore para ${negocioId}:`, err);
      if (err.code === 'permission-denied') {
        setErrorFirebase('permission-denied');
      } else {
        setErrorFirebase(err.code || 'error-conexion');
      }
    };

    const unsubs = [];

    // 1. Escuchar subcolección de productos del negocio
    const unsubProductos = onSnapshot(collection(db, 'negocios', negocioId, 'productos'), async (snap) => {
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (esLiaco) {
        try {
          // Verificar si en la colección raíz de Firestore están los productos creados antes de multi-tenant
          const rootProdsSnap = await getDocs(collection(db, 'productos'));
          if (!rootProdsSnap.empty) {
            const listRoot = rootProdsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const idsEnSub = new Set(list.map(d => d.id));
            const faltantes = listRoot.filter(p => !idsEnSub.has(p.id));

            if (faltantes.length > 0) {
              const batch = writeBatch(db);
              faltantes.forEach(p => {
                batch.set(doc(db, 'negocios', negocioId, 'productos', p.id), { ...p, updatedAt: serverTimestamp() }, { merge: true });
              });
              await batch.commit();
            }

            if (listRoot.length >= list.length) {
              list = listRoot;
            }
          }
        } catch (e) {
          console.warn('Aviso sincronizando productos históricos raíz de Liaco:', e);
        }
      }

      if (list.length > 0) {
        setProductos(list);
      } else if (esLiaco) {
        // Fallback a insumos históricos
        LIACO_HISTORICO_PRODUCTOS.forEach(p => syncDoc('productos', p.id, p));
        setProductos(LIACO_HISTORICO_PRODUCTOS);
      } else {
        setProductos([]);
      }
      setErrorFirebase(null);
    }, (err) => manejarErrorFirebase(err, 'productos'));
    unsubs.push(unsubProductos);

    // 2. Escuchar subcolección de proveedores del negocio
    const unsubProveedores = onSnapshot(collection(db, 'negocios', negocioId, 'proveedores'), async (snap) => {
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (esLiaco) {
        try {
          // Verificar si en la colección raíz de Firestore están los proveedores creados antes de multi-tenant
          const rootProvsSnap = await getDocs(collection(db, 'proveedores'));
          if (!rootProvsSnap.empty) {
            const listRoot = rootProvsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const idsEnSub = new Set(list.map(d => d.id));
            const faltantes = listRoot.filter(p => !idsEnSub.has(p.id));

            if (faltantes.length > 0) {
              const batch = writeBatch(db);
              faltantes.forEach(p => {
                batch.set(doc(db, 'negocios', negocioId, 'proveedores', p.id), { ...p, updatedAt: serverTimestamp() }, { merge: true });
              });
              await batch.commit();
            }

            if (listRoot.length >= list.length) {
              list = listRoot;
            }
          }
        } catch (e) {
          console.warn('Aviso sincronizando proveedores históricos raíz de Liaco:', e);
        }
      }

      if (list.length > 0) {
        setProveedores(list);
      } else if (esLiaco) {
        LIACO_HISTORICO_PROVEEDORES.forEach(p => syncDoc('proveedores', p.id, p));
        setProveedores(LIACO_HISTORICO_PROVEEDORES);
      } else {
        setProveedores([]);
      }
      setErrorFirebase(null);
    }, (err) => manejarErrorFirebase(err, 'proveedores'));
    unsubs.push(unsubProveedores);

    // 3. Escuchar subcolección de pedidos del negocio (incluye pedidos pendientes por recibir)
    const unsubPedidos = onSnapshot(collection(db, 'negocios', negocioId, 'pedidos'), async (snap) => {
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (esLiaco) {
        try {
          // Verificar si en la colección raíz de Firestore están los pedidos / listas por recibir de Liaco
          const rootPedsSnap = await getDocs(collection(db, 'pedidos'));
          if (!rootPedsSnap.empty) {
            const listRoot = rootPedsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const idsEnSub = new Set(list.map(d => d.id));
            const faltantes = listRoot.filter(p => !idsEnSub.has(p.id));

            if (faltantes.length > 0) {
              const batch = writeBatch(db);
              faltantes.forEach(p => {
                batch.set(doc(db, 'negocios', negocioId, 'pedidos', p.id), { ...p, updatedAt: serverTimestamp() }, { merge: true });
              });
              await batch.commit();
            }

            if (list.length === 0 || listRoot.length > list.length) {
              list = listRoot;
            }
          } else if (list.length === 0) {
            // Si la colección raíz y la subcolección están vacías en Firestore, revisar el almacenamiento local legacy
            const legacyPed = localStorage.getItem('pizzeria_inventario_pedidos:v2');
            if (legacyPed) {
              const parsed = JSON.parse(legacyPed);
              if (Array.isArray(parsed) && parsed.length > 0) {
                list = parsed;
                const batch = writeBatch(db);
                parsed.forEach(p => {
                  batch.set(doc(db, 'negocios', negocioId, 'pedidos', p.id), { ...p, updatedAt: serverTimestamp() }, { merge: true });
                });
                await batch.commit();
              }
            }
          }
        } catch (e) {
          console.warn('Aviso sincronizando pedidos históricos raíz de Liaco:', e);
        }
      }

      list.sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0));
      setPedidos(list);
      setErrorFirebase(null);
    }, (err) => manejarErrorFirebase(err, 'pedidos'));
    unsubs.push(unsubPedidos);

    // 4. Escuchar subcolección de movimientos del negocio
    const unsubMovimientos = onSnapshot(collection(db, 'negocios', negocioId, 'movimientos'), async (snap) => {
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (esLiaco && list.length === 0) {
        try {
          const rootMovsSnap = await getDocs(collection(db, 'movimientos'));
          if (!rootMovsSnap.empty) {
            list = rootMovsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const batch = writeBatch(db);
            rootMovsSnap.docs.forEach(d => {
              batch.set(doc(db, 'negocios', negocioId, 'movimientos', d.id), { ...d.data(), updatedAt: serverTimestamp() }, { merge: true });
            });
            await batch.commit();
          }
        } catch (e) {
          console.warn('Aviso sincronizando movimientos históricos de Liaco:', e);
        }
      }

      list.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
      setMovimientos(list);
      setErrorFirebase(null);
    }, (err) => manejarErrorFirebase(err, 'movimientos'));
    unsubs.push(unsubMovimientos);

    // 5. Escuchar subcolección de empleados de compras del negocio
    const unsubEmpleados = onSnapshot(collection(db, 'negocios', negocioId, 'empleados_compras'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0));
      setEmpleadosCompras(list);
      setErrorFirebase(null);
    }, (err) => manejarErrorFirebase(err, 'empleados_compras'));
    unsubs.push(unsubEmpleados);

    return () => unsubs.forEach(unsub => unsub && unsub());
  }, [negocioId, authContext?.negocioActivo?.email, authContext?.currentUser?.email]);

  // Sincronizar un documento con la subcolección del negocio en Firestore
  const syncDoc = async (colName, id, data) => {
    if (isFirebaseConfigured && db && negocioId && negocioId !== 'default_tenant') {
      try {
        await setDoc(doc(db, 'negocios', negocioId, colName, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
        setErrorFirebase(null);
      } catch (err) {
        console.error(`Error guardando en negocios/${negocioId}/${colName}:`, err);
        if (err.code === 'permission-denied') {
          setErrorFirebase('permission-denied');
          mostrarAlerta('⚠️ Firebase bloqueó el guardado: Debes permitir lectura y escritura en las Reglas de Firebase Console.', 'danger');
        } else {
          mostrarAlerta(`⚠️ Error guardando en Firebase: ${err.message}`, 'danger');
        }
      }
    }
  };

  // --- Operaciones de Productos ---
  const agregarProducto = async (nuevo, opciones = {}) => {
    const id = nuevo.id || 'prod_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const item = { 
      ...nuevo, 
      id, 
      nombre: sanitizeNombre(nuevo.nombre || '').toUpperCase(),
      unidad: sanitizeText(nuevo.unidad || 'UNIDAD', 20).toUpperCase(),
      proveedorNombre: sanitizeNombre(nuevo.proveedorNombre || '').toUpperCase(),
      stock: Number(nuevo.stock) || 0, 
      stockMinimo: Number(nuevo.stockMinimo) || 0 
    };
    const existePreviamente = productos.some(p => p.id === id);
    
    setProductos(prev => {
      const existe = prev.some(p => p.id === id);
      if (existe) {
        return prev.map(p => p.id === id ? item : p);
      }
      return [item, ...prev];
    });

    await syncDoc('productos', id, item);
    if (!opciones.silencioso) {
      if (existePreviamente) {
        mostrarAlerta('Producto guardado correctamente', 'success', '¡Producto Guardado!');
      } else {
        mostrarAlerta('Producto creado correctamente', 'success', '¡Producto Creado!');
      }
    }
    return item;
  };

  const actualizarStock = async (id, nuevoStock, referencia = 'Ajuste manual') => {
    const prod = productos.find(p => p.id === id);
    const stockPrev = prod ? (prod.stock || 0) : 0;
    const valor = Math.max(0, Math.round((Number(nuevoStock) || 0) * 100) / 100);
    
    if (prod && valor !== stockPrev) {
      registrarMovimiento('ajuste_manual', prod.nombre, valor - stockPrev, stockPrev, valor, referencia);
    }

    setProductos(prev => prev.map(p => p.id === id ? { ...p, stock: valor } : p));
    if (isFirebaseConfigured && db && negocioId && negocioId !== 'default_tenant') {
      try {
        await updateDoc(doc(db, 'negocios', negocioId, 'productos', id), { stock: valor });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const registrarConsumo = async (productoId, cantidadTomada, notas = 'Toma para preparación') => {
    const prod = productos.find(p => p.id === productoId);
    if (!prod) return { success: false, error: 'Producto no encontrado' };

    const stockPrev = Number(prod.stock) || 0;
    const cant = Math.max(0, Math.round((Number(cantidadTomada) || 0) * 100) / 100);
    const nuevoStock = Math.max(0, Math.round((stockPrev - cant) * 100) / 100);

    const mov = {
      id: 'mov_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      fecha: new Date().toISOString(),
      tipo: 'consumo_cocina',
      prodId: prod.id,
      prodNombre: prod.nombre,
      unidad: prod.unidad,
      delta: -cant,
      stockPrevio: stockPrev,
      stockNuevo: nuevoStock,
      referencia: notas || 'Toma para preparación'
    };

    setMovimientos(prev => [mov, ...prev.slice(0, 199)]);
    setProductos(prev => prev.map(p => p.id === productoId ? { ...p, stock: nuevoStock } : p));

    if (isFirebaseConfigured && db && negocioId && negocioId !== 'default_tenant') {
      try {
        await updateDoc(doc(db, 'negocios', negocioId, 'productos', productoId), { stock: nuevoStock });
        syncDoc('movimientos', mov.id, mov);
      } catch (e) {
        console.error(e);
      }
    }

    mostrarAlerta(`✅ Se descontaron ${cant} ${prod.unidad} de ${prod.nombre} (Quedan: ${nuevoStock})`, 'success');
    return { success: true, nuevoStock, mov };
  };

  const modificarStockDelta = async (id, delta) => {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;
    const nuevo = Math.max(0, Math.round(((prod.stock || 0) + delta) * 100) / 100);
    await actualizarStock(id, nuevo);
  };

  const toggleHabilitarProducto = async (id) => {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;
    const nuevoEstado = !prod.deshabilitado;
    setProductos(prev => prev.map(p => p.id === id ? { ...p, deshabilitado: nuevoEstado } : p));
    
    if (isFirebaseConfigured && db && negocioId && negocioId !== 'default_tenant') {
      try {
        await updateDoc(doc(db, 'negocios', negocioId, 'productos', id), { deshabilitado: nuevoEstado });
      } catch (e) {
        console.error(e);
      }
    }
    mostrarAlerta(
      nuevoEstado ? `Producto "${prod.nombre}" deshabilitado` : `Producto "${prod.nombre}" habilitado`,
      'info'
    );
  };

  const eliminarProducto = async (id, opciones = {}) => {
    const prod = productos.find(p => p.id === id);
    setProductos(prev => prev.filter(p => p.id !== id));
    if (isFirebaseConfigured && db && negocioId && negocioId !== 'default_tenant') {
      try {
        await deleteDoc(doc(db, 'negocios', negocioId, 'productos', id));
      } catch (e) {
        console.error(e);
      }
    }
    if (!opciones.silencioso) {
      mostrarAlerta('Producto eliminado correctamente', 'info', 'Producto Eliminado');
    }
  };

  // --- Operaciones de Proveedores ---
  const agregarProveedor = async (nuevo, opciones = {}) => {
    const id = nuevo.id || 'prov_' + Date.now().toString(36);
    const item = { 
      ...nuevo, 
      id,
      nombre: sanitizeNombre(nuevo.nombre || '').toUpperCase(),
      notas: sanitizeNota(nuevo.notas || '').toUpperCase()
    };
    setProveedores(prev => [...prev, item]);
    await syncDoc('proveedores', id, item);
    if (!opciones.silencioso) {
      mostrarAlerta('Proveedor creado correctamente', 'success', '¡Proveedor Creado!');
    }
    return item;
  };

  const actualizarProveedor = async (id, datosActualizados, opciones = {}) => {
    const item = { 
      ...datosActualizados, 
      id,
      nombre: sanitizeNombre(datosActualizados.nombre || '').toUpperCase(),
      notas: sanitizeNota(datosActualizados.notas || '').toUpperCase()
    };
    setProveedores(prev => prev.map(p => p.id === id ? item : p));

    // Si cambió el nombre del proveedor, sincronizar los productos vinculados
    if (datosActualizados.nombre) {
      const nombreMayus = String(datosActualizados.nombre).trim().toUpperCase();
      setProductos(prev => prev.map(prod => {
        if (prod.proveedorId === id) {
          const prodActualizado = { ...prod, proveedorNombre: nombreMayus };
          syncDoc('productos', prod.id, prodActualizado);
          return prodActualizado;
        }
        return prod;
      }));
    }

    await syncDoc('proveedores', id, item);
    if (!opciones.silencioso) {
      mostrarAlerta('Proveedor guardado correctamente', 'success', '¡Proveedor Guardado!');
    }
    return item;
  };

  const eliminarProveedor = async (id, opciones = {}) => {
    const prov = proveedores.find(p => p.id === id);
    setProveedores(prev => prev.filter(p => p.id !== id));
    if (isFirebaseConfigured && db && negocioId && negocioId !== 'default_tenant') {
      try {
        await deleteDoc(doc(db, 'negocios', negocioId, 'proveedores', id));
      } catch (e) {
        console.error(e);
      }
    }
    if (!opciones.silencioso) {
      mostrarAlerta('Proveedor eliminado correctamente', 'info', 'Proveedor Eliminado');
    }
  };

  // --- Operaciones de Pedidos (El flujo central) ---

  /**
   * Crear pedido: recibe un arreglo de items a pedir
   * items: [{ productoId, productoNombre, unidad, cantidad, proveedorId, proveedorNombre, obs }]
   */
  const crearPedido = async (itemsAPedir, observacionesGenerales = '') => {
    if (!itemsAPedir || itemsAPedir.length === 0) {
      mostrarAlerta('No hay productos en el pedido', 'warning');
      return null;
    }

    const pedidoId = 'ped_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const fecha = new Date().toISOString();

    // Agrupar items por proveedor
    const gruposMap = new Map();
    itemsAPedir.forEach(item => {
      const pId = item.proveedorId || 'sin-proveedor';
      const pNombre = item.proveedorNombre || 'Varios / Sin Proveedor';
      if (!gruposMap.has(pId)) {
        gruposMap.set(pId, {
          proveedorId: pId,
          proveedorNombre: pNombre,
          items: []
        });
      }
      gruposMap.get(pId).items.push({
        id: item.productoId + '_' + Date.now().toString(36),
        productoId: item.productoId,
        productoNombre: sanitizeNombre(item.productoNombre || ''),
        unidad: sanitizeText(item.unidad || '', 20),
        cantidadPedida: Number(item.cantidad) || 0,
        cantidadRecibida: 0,
        recibido: false,
        obs: sanitizeNota(item.obs || '')
      });
    });

    const gruposProveedor = Array.from(gruposMap.values());

    const nuevoPedido = {
      id: pedidoId,
      numero: Math.floor(1000 + Math.random() * 9000),
      fechaCreacion: fecha,
      estado: 'pendiente', // 'pendiente' | 'completado' | 'cancelado'
      observaciones: sanitizeNota(observacionesGenerales || ''),
      grupos: gruposProveedor,
      totalItems: itemsAPedir.length
    };

    setPedidos(prev => [nuevoPedido, ...prev]);
    await syncDoc('pedidos', pedidoId, nuevoPedido);
    mostrarAlerta(`¡Pedido #${nuevoPedido.numero} creado con éxito! Pasó a la sección de recepción.`, 'success');
    return nuevoPedido;
  };

  /**
   * Confirmar la recepción de productos de un pedido
   * ¡AQUÍ ES DONDE SE AGREGA AL STOCK DEL PRODUCTO!
   * Permite confirmar todo el pedido, un proveedor específico, o items específicos.
   */
  const confirmarRecepcionItems = async (pedidoId, proveedorIdOpcional = null) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;

    // Calcular cuánto stock se va a sumar por cada producto
    const incrementosStock = {};
    let itemsActualizadosCount = 0;

    const nuevosGrupos = pedido.grupos.map(grupo => {
      // Si se filtró por proveedor y no coincide, no se altera
      if (proveedorIdOpcional && grupo.proveedorId !== proveedorIdOpcional) {
        return grupo;
      }

      const nuevosItems = grupo.items.map(item => {
        if (!item.recibido) {
          const cantidadASumar = item.cantidadPedida;
          incrementosStock[item.productoId] = (incrementosStock[item.productoId] || 0) + cantidadASumar;
          itemsActualizadosCount++;
          return {
            ...item,
            recibido: true,
            cantidadRecibida: cantidadASumar,
            fechaRecepcion: new Date().toISOString()
          };
        }
        return item;
      });

      return {
        ...grupo,
        items: nuevosItems,
        proveedorCompletado: nuevosItems.every(i => i.recibido)
      };
    });

    const todoCompletado = nuevosGrupos.every(g => g.items.every(i => i.recibido));

    const pedidoActualizado = {
      ...pedido,
      grupos: nuevosGrupos,
      estado: todoCompletado ? 'completado' : 'parcial',
      fechaActualizacion: new Date().toISOString()
    };

    // 1. Actualizar el pedido
    setPedidos(prev => prev.map(p => p.id === pedidoId ? pedidoActualizado : p));
    await syncDoc('pedidos', pedidoId, pedidoActualizado);

    // 2. SUMAR AL STOCK DE LOS PRODUCTOS
    setProductos(prevProductos => {
      return prevProductos.map(prod => {
        if (incrementosStock[prod.id]) {
          const prev = prod.stock || 0;
          const delta = incrementosStock[prod.id];
          const nuevoStock = Math.max(0, Math.round((prev + delta) * 100) / 100);
          registrarMovimiento('entrada_pedido', prod.nombre, delta, prev, nuevoStock, `Pedido #${pedido.numero}`);
          return { ...prod, stock: nuevoStock };
        }
        return prod;
      });
    });

    // Si Firebase está activo, sincronizar en batch bajo la subcolección del negocio
    if (isFirebaseConfigured && db && negocioId && negocioId !== 'default_tenant') {
      try {
        const batch = writeBatch(db);
        Object.entries(incrementosStock).forEach(([prodId, cantidad]) => {
          const prodActual = productos.find(p => p.id === prodId);
          if (prodActual) {
            const nuevoStock = (prodActual.stock || 0) + cantidad;
            const ref = doc(db, 'negocios', negocioId, 'productos', prodId);
            batch.update(ref, { stock: nuevoStock });
          }
        });
        await batch.commit();
      } catch (err) {
        console.error('Error actualizando stocks en Firestore:', err);
      }
    }

    mostrarAlerta(`✅ ¡Se confirmaron ${itemsActualizadosCount} productos y se sumaron a su stock!`, 'success');
  };

  /**
   * Confirmar un solo producto individualmente
   */
  const confirmarItemIndividual = async (pedidoId, productoId, cantidadConfirmada = null) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;

    let cantidadSumada = 0;
    let nombreProd = '';

    const nuevosGrupos = pedido.grupos.map(grupo => {
      const items = grupo.items.map(item => {
        if (item.productoId === productoId && !item.recibido) {
          const cant = cantidadConfirmada !== null ? Number(cantidadConfirmada) : item.cantidadPedida;
          cantidadSumada = cant;
          nombreProd = item.productoNombre;
          return {
            ...item,
            recibido: true,
            cantidadRecibida: cant,
            fechaRecepcion: new Date().toISOString()
          };
        }
        return item;
      });
      return { ...grupo, items };
    });

    const todoCompletado = nuevosGrupos.every(g => g.items.every(i => i.recibido));

    const pedidoActualizado = {
      ...pedido,
      grupos: nuevosGrupos,
      estado: todoCompletado ? 'completado' : 'parcial'
    };

    setPedidos(prev => prev.map(p => p.id === pedidoId ? pedidoActualizado : p));
    await syncDoc('pedidos', pedidoId, pedidoActualizado);

    // Sumar al stock
    if (cantidadSumada > 0) {
      await modificarStockDelta(productoId, cantidadSumada);
      mostrarAlerta(`✅ Se agregaron ${cantidadSumada} al stock de ${nombreProd}`, 'success');
    }
  };

  const cancelarPedido = async (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    const actualizado = { ...pedido, estado: 'cancelado' };
    setPedidos(prev => prev.map(p => p.id === pedidoId ? actualizado : p));
    await syncDoc('pedidos', pedidoId, actualizado);
    mostrarAlerta('Pedido cancelado', 'info');
  };

  const limpiarDatosDePrueba = async () => {
    setProductos([]);
    setProveedores([]);
    setPedidos([]);
    setMovimientos([]);

    if (negocioId && negocioId !== 'default_tenant') {
      localStorage.removeItem(`inv_${negocioId}_productos`);
      localStorage.removeItem(`inv_${negocioId}_proveedores`);
      localStorage.removeItem(`inv_${negocioId}_pedidos`);
      localStorage.removeItem(`inv_${negocioId}_movimientos`);
      localStorage.removeItem(`inv_${negocioId}_carrito_pedido`);
      localStorage.removeItem(`inv_${negocioId}_carrito_obs`);

      if (isFirebaseConfigured && db) {
        try {
          const colecciones = ['productos', 'proveedores', 'pedidos', 'movimientos'];
          for (const col of colecciones) {
            const snap = await getDocs(collection(db, 'negocios', negocioId, col));
            if (!snap.empty) {
              const batch = writeBatch(db);
              snap.forEach(d => batch.delete(d.ref));
              await batch.commit();
            }
          }
        } catch (err) {
          console.warn('Error vaciando Firestore del negocio:', err);
        }
      }
    }

    mostrarAlerta('🧹 ¡Datos eliminados! El inventario está limpio para nuevos registros.', 'success');
  };

  const vaciarCarritoPedido = () => {
    setCarritoPedidoState({});
    setObservacionCarritoState('');
    try {
      if (negocioId && negocioId !== 'default_tenant') {
        localStorage.removeItem(`inv_${negocioId}_carrito_pedido`);
        localStorage.removeItem(`inv_${negocioId}_carrito_obs`);
      }
      localStorage.removeItem('inv_carrito_pedido_activo');
      localStorage.removeItem('inv_carrito_obs_activo');
    } catch (e) {}
  };

  const agregarEmpleadoCompra = async (nombre, usuario, pin) => {
    const nombreLimpio = sanitizeNombre(nombre || '').toUpperCase();
    const usuarioLimpio = sanitizeUsuario(usuario || '');
    const pinLimpio = sanitizePin(pin || '');

    if (!nombreLimpio || !usuarioLimpio) {
      throw new Error('Debes ingresar un nombre y usuario válidos (sin caracteres especiales).');
    }

    if (!pinLimpio || pinLimpio.length !== 4) {
      throw new Error('El PIN de seguridad es obligatorio y debe tener exactamente 4 dígitos numéricos.');
    }

    const existe = empleadosCompras.some(
      e => String(e.usuario || '').toUpperCase() === usuarioLimpio
    );
    if (existe) {
      throw new Error(`El usuario "${usuarioLimpio}" ya está asignado a otro empleado.`);
    }

    const id = 'emp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const nuevoEmpleado = {
      id,
      nombre: nombreLimpio,
      usuario: usuarioLimpio,
      pin: pinLimpio, // PIN de 4 dígitos numéricos para acceso seguro
      fechaCreacion: new Date().toISOString()
    };

    setEmpleadosCompras(prev => [nuevoEmpleado, ...prev]);
    await syncDoc('empleados_compras', id, nuevoEmpleado);
    return nuevoEmpleado;
  };

  const eliminarEmpleadoCompra = async (id) => {
    setEmpleadosCompras(prev => prev.filter(e => e.id !== id));
    if (isFirebaseConfigured && db && negocioId && negocioId !== 'default_tenant') {
      try {
        await deleteDoc(doc(db, 'negocios', negocioId, 'empleados_compras', id));
      } catch (e) {
        console.error('Error eliminando empleado en Firestore:', e);
      }
    }
  };

  const actualizarEmpleadoCompra = async (id, { nombre, usuario, pin }) => {
    const nombreLimpio = sanitizeNombre(nombre || '').toUpperCase();
    const usuarioLimpio = sanitizeUsuario(usuario || '');
    const pinLimpio = sanitizePin(pin || '');

    if (!nombreLimpio || !usuarioLimpio) {
      throw new Error('Debes ingresar un nombre y usuario válidos (sin caracteres especiales).');
    }

    if (!pinLimpio || pinLimpio.length !== 4) {
      throw new Error('El PIN de seguridad es obligatorio y debe tener exactamente 4 dígitos numéricos.');
    }

    const existe = empleadosCompras.some(
      e => e.id !== id && String(e.usuario || '').toUpperCase() === usuarioLimpio
    );
    if (existe) {
      throw new Error(`El usuario "${usuarioLimpio}" ya está asignado a otro empleado.`);
    }

    const datosActualizados = {
      nombre: nombreLimpio,
      usuario: usuarioLimpio,
      pin: pinLimpio,
      fechaActualizacion: new Date().toISOString()
    };

    setEmpleadosCompras(prev => prev.map(e => (e.id === id ? { ...e, ...datosActualizados } : e)));
    await syncDoc('empleados_compras', id, datosActualizados);
    return datosActualizados;
  };

  return (
    <InventoryContext.Provider value={{
      productos,
      proveedores,
      pedidos,
      movimientos,
      empleadosCompras,
      agregarEmpleadoCompra,
      actualizarEmpleadoCompra,
      eliminarEmpleadoCompra,
      carritoPedido,
      setCarritoPedido,
      observacionCarrito,
      setObservacionCarrito,
      vaciarCarritoPedido,
      notificacion,
      modalConfirmacion,
      errorFirebase,
      mostrarAlerta,
      cerrarAlerta,
      solicitarConfirmacion,
      cerrarConfirmacion,
      agregarProducto,
      actualizarStock,
      registrarConsumo,
      modificarStockDelta,
      eliminarProducto,
      toggleHabilitarProducto,
      agregarProveedor,
      actualizarProveedor,
      eliminarProveedor,
      crearPedido,
      confirmarRecepcionItems,
      confirmarItemIndividual,
      cancelarPedido,
      limpiarDatosDePrueba
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory debe ser usado dentro de InventoryProvider');
  }
  return context;
}

