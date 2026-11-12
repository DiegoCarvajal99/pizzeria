import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { INITIAL_PROVEEDORES, INITIAL_PRODUCTOS } from '../data/initialData';

const InventoryContext = createContext();

const STORAGE_KEYS = {
  PRODUCTOS: 'pizzeria_inventario_productos:v2',
  PROVEEDORES: 'pizzeria_inventario_proveedores:v2',
  PEDIDOS: 'pizzeria_inventario_pedidos:v2',
  MOVIMIENTOS: 'pizzeria_inventario_movimientos:v2'
};

export function InventoryProvider({ children }) {
  const [productos, setProductos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTOS);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Descartar automáticamente datos de prueba iniciales
      const sonDePrueba = Array.isArray(parsed) && parsed.some(p => p.id === 'prod-1' || p.id === 'prod-2');
      return sonDePrueba ? [] : parsed;
    } catch {
      return [];
    }
  });

  const [proveedores, setProveedores] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROVEEDORES);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      const sonDePrueba = Array.isArray(parsed) && parsed.some(p => p.id === 'prov-distripapa' || p.id === 'prov-mercado');
      return sonDePrueba ? [] : parsed;
    } catch {
      return [];
    }
  });

  const [pedidos, setPedidos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PEDIDOS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [movimientos, setMovimientos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVIMIENTOS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notificacion, setNotificacion] = useState(null);
  const [errorFirebase, setErrorFirebase] = useState(null);

  const mostrarAlerta = (mensaje, tipo = 'info') => {
    setNotificacion({ mensaje, tipo, id: Date.now() });
    setTimeout(() => {
      setNotificacion(prev => (prev?.mensaje === mensaje ? null : prev));
    }, 4500);
  };

  // Guardar en localStorage siempre como caché y fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(productos));
    } catch (e) {
      console.error(e);
    }
  }, [productos]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROVEEDORES, JSON.stringify(proveedores));
    } catch (e) {
      console.error(e);
    }
  }, [proveedores]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(pedidos));
    } catch (e) {
      console.error(e);
    }
  }, [pedidos]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS, JSON.stringify(movimientos));
    } catch (e) {
      console.error(e);
    }
  }, [movimientos]);

  const registrarMovimiento = (tipo, prodNombre, delta, stockPrevio, stockNuevo, referencia = '') => {
    const mov = {
      id: 'mov_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      fecha: new Date().toISOString(),
      tipo, // 'entrada_pedido' | 'ajuste_manual'
      prodNombre,
      delta,
      stockPrevio,
      stockNuevo,
      referencia
    };
    setMovimientos(prev => [mov, ...prev.slice(0, 99)]); // guardamos los últimos 100
  };

  // Si Firebase está configurado, escuchar en tiempo real
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const manejarErrorFirebase = (err, recurso) => {
      console.warn(`Error escuchando ${recurso} en Firestore:`, err);
      if (err.code === 'permission-denied') {
        setErrorFirebase('permission-denied');
      } else {
        setErrorFirebase(err.code || 'error-conexion');
      }
    };

    const unsubs = [];

    // Escuchar productos
    const unsubProductos = onSnapshot(collection(db, 'productos'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProductos(list);
      setErrorFirebase(null);
    }, (err) => manejarErrorFirebase(err, 'productos'));
    unsubs.push(unsubProductos);

    // Escuchar proveedores
    const unsubProveedores = onSnapshot(collection(db, 'proveedores'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProveedores(list);
      setErrorFirebase(null);
    }, (err) => manejarErrorFirebase(err, 'proveedores'));
    unsubs.push(unsubProveedores);

    // Escuchar pedidos
    const unsubPedidos = onSnapshot(collection(db, 'pedidos'), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0));
        setPedidos(list);
      }
      setErrorFirebase(null);
    }, (err) => manejarErrorFirebase(err, 'pedidos'));
    unsubs.push(unsubPedidos);

    return () => unsubs.forEach(unsub => unsub && unsub());
  }, []);

  // Sincronizar un documento con Firebase si está habilitado
  const syncDoc = async (colName, id, data) => {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, colName, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
        setErrorFirebase(null);
      } catch (err) {
        console.error(`Error guardando en ${colName}:`, err);
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
  const agregarProducto = async (nuevo) => {
    const id = nuevo.id || 'prod_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const item = { ...nuevo, id, stock: Number(nuevo.stock) || 0, stockMinimo: Number(nuevo.stockMinimo) || 0 };
    
    setProductos(prev => {
      const existe = prev.some(p => p.id === id);
      if (existe) {
        return prev.map(p => p.id === id ? item : p);
      }
      return [item, ...prev];
    });

    await syncDoc('productos', id, item);
    mostrarAlerta(`Producto "${item.nombre}" guardado`, 'success');
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
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'productos', id), { stock: valor });
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

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'productos', productoId), { stock: nuevoStock });
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
    
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'productos', id), { deshabilitado: nuevoEstado });
      } catch (e) {
        console.error(e);
      }
    }
    mostrarAlerta(
      nuevoEstado ? `Producto "${prod.nombre}" deshabilitado` : `Producto "${prod.nombre}" habilitado`,
      'info'
    );
  };

  const eliminarProducto = async (id) => {
    const prod = productos.find(p => p.id === id);
    setProductos(prev => prev.filter(p => p.id !== id));
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'productos', id));
      } catch (e) {
        console.error(e);
      }
    }
    mostrarAlerta(`Producto "${prod?.nombre || ''}" eliminado`, 'info');
  };

  // --- Operaciones de Proveedores ---
  const agregarProveedor = async (nuevo) => {
    const id = nuevo.id || 'prov_' + Date.now().toString(36);
    const item = { ...nuevo, id };
    setProveedores(prev => [...prev, item]);
    await syncDoc('proveedores', id, item);
    mostrarAlerta(`Proveedor "${item.nombre}" agregado`, 'success');
    return item;
  };

  const actualizarProveedor = async (id, datosActualizados) => {
    const item = { ...datosActualizados, id };
    setProveedores(prev => prev.map(p => p.id === id ? item : p));

    // Si cambió el nombre del proveedor, sincronizar los productos vinculados
    if (datosActualizados.nombre) {
      setProductos(prev => prev.map(prod => {
        if (prod.proveedorId === id) {
          const prodActualizado = { ...prod, proveedorNombre: datosActualizados.nombre };
          syncDoc('productos', prod.id, prodActualizado);
          return prodActualizado;
        }
        return prod;
      }));
    }

    await syncDoc('proveedores', id, item);
    mostrarAlerta(`Proveedor "${item.nombre}" actualizado`, 'success');
    return item;
  };

  const eliminarProveedor = async (id) => {
    const prov = proveedores.find(p => p.id === id);
    setProveedores(prev => prev.filter(p => p.id !== id));
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'proveedores', id));
      } catch (e) {
        console.error(e);
      }
    }
    mostrarAlerta(`Proveedor "${prov?.nombre || ''}" eliminado`, 'info');
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
        productoNombre: item.productoNombre,
        unidad: item.unidad || '',
        cantidadPedida: Number(item.cantidad) || 0,
        cantidadRecibida: 0,
        recibido: false,
        obs: item.obs || ''
      });
    });

    const gruposProveedor = Array.from(gruposMap.values());

    const nuevoPedido = {
      id: pedidoId,
      numero: Math.floor(1000 + Math.random() * 9000),
      fechaCreacion: fecha,
      estado: 'pendiente', // 'pendiente' | 'completado' | 'cancelado'
      observaciones: observacionesGenerales,
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

    // Si Firebase está activo, sincronizar en batch
    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        Object.entries(incrementosStock).forEach(([prodId, cantidad]) => {
          const prodActual = productos.find(p => p.id === prodId);
          if (prodActual) {
            const nuevoStock = (prodActual.stock || 0) + cantidad;
            const ref = doc(db, 'productos', prodId);
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
    const confirmar = window.confirm(
      '¿Deseas vaciar todos los datos de prueba? Esto dejará el sistema 100% limpio en blanco para ingresar tus datos reales.'
    );
    if (!confirmar) return;

    setProductos([]);
    setProveedores([]);
    setPedidos([]);
    setMovimientos([]);

    localStorage.removeItem(STORAGE_KEYS.PRODUCTOS);
    localStorage.removeItem(STORAGE_KEYS.PROVEEDORES);
    localStorage.removeItem(STORAGE_KEYS.PEDIDOS);
    localStorage.removeItem(STORAGE_KEYS.MOVIMIENTOS);

    if (isFirebaseConfigured && db) {
      try {
        const colecciones = ['productos', 'proveedores', 'pedidos', 'movimientos'];
        for (const col of colecciones) {
          const snap = await getDocs(collection(db, col));
          if (!snap.empty) {
            const batch = writeBatch(db);
            snap.forEach(d => batch.delete(d.ref));
            await batch.commit();
          }
        }
      } catch (err) {
        console.warn('Error vaciando Firestore:', err);
      }
    }

    mostrarAlerta('🧹 ¡Datos de prueba eliminados! Tu pizzería está lista para datos reales.', 'success');
  };

  return (
    <InventoryContext.Provider value={{
      productos,
      proveedores,
      pedidos,
      movimientos,
      notificacion,
      errorFirebase,
      mostrarAlerta,
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

