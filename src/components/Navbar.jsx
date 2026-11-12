import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  isFirebaseConfigured, 
  firebaseConfig, 
  guardarConfiguracionFirebase, 
  desconectarFirebase 
} from '../firebase';
import { 
  Home,
  ClipboardList, 
  ShoppingCart, 
  Truck, 
  Boxes, 
  HardDrive, 
  Flame, 
  X, 
  Check, 
  Settings 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, cartCount = 0 }) {
  const { pedidos } = useInventory();
  const [modalFirebaseAbierto, setModalFirebaseAbierto] = useState(false);

  // Estados del modal de configuración de Firebase
  const [apiKey, setApiKey] = useState(firebaseConfig.apiKey || '');
  const [projectId, setProjectId] = useState(firebaseConfig.projectId || '');
  const [authDomain, setAuthDomain] = useState(firebaseConfig.authDomain || '');
  const [appId, setAppId] = useState(firebaseConfig.appId || '');

  // Contar pedidos pendientes de confirmación
  const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'parcial');
  const itemsPendientesCount = pedidosPendientes.reduce((acc, p) => {
    return acc + p.grupos.reduce((gAcc, g) => gAcc + g.items.filter(i => !i.recibido).length, 0);
  }, 0);

  // Opciones del menú unificadas: Home, Pedidos, Stock Actual, Productos
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart, badge: itemsPendientesCount, badgeColor: 'bg-amber-500 text-black' },
    { id: 'stock', label: 'Stock Actual', icon: ClipboardList },
    { id: 'catalogo', label: 'Productos', icon: Boxes }
  ];

  const handleGuardarFirebase = (e) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      alert("Por favor ingresa al menos la API Key y el Project ID de Firebase.");
      return;
    }

    guardarConfiguracionFirebase({
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      storageBucket: `${projectId.trim()}.appspot.com`,
      appId: appId.trim() || "1:demo:web:app"
    });
  };

  return (
    <>
      {/* MENÚ DE NAVEGACIÓN: COLOR NEGRO
          Logo ubicado al lado izquierdo de las opciones del menú
      */}
      <header className="sticky top-0 z-30 bg-black border-b border-zinc-800 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 md:gap-6">
          
          {/* LADO IZQUIERDO: LOGO LIACO PIZZERIA */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer shrink-0 group py-1"
            title="Ir a Home - LIACO PIZZERIA"
          >
            <img 
              src="/logo.png" 
              alt="LIACO PIZZERIA" 
              className="h-9 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </div>

          {/* CENTRO / OPCIONES DEL MENÚ AL LADO DERECHO DEL LOGO */}
          <nav className="order-3 md:order-2 flex-1 flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer group ${
                    isActive
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive 
                      ? 'text-black' 
                      : 'text-zinc-400 group-hover:text-white'
                  }`} />
                  <span>{tab.label}</span>
                  {Boolean(tab.badge && tab.badge > 0) && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 text-[10px] font-extrabold rounded-full transition-colors ${
                        isActive
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

          {/* LADO DERECHO: ESTADO DE FIREBASE / LOCAL */}
          <div className="order-2 md:order-3 flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setModalFirebaseAbierto(true)}
              className="group cursor-pointer transition-transform active:scale-95"
              title="Haz clic para conectar o configurar Firebase"
            >
              {isFirebaseConfigured ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Firebase en vivo</span>
                  <Settings className="w-3 h-3 ml-0.5 text-zinc-500 group-hover:text-white" />
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors">
                  <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="hidden sm:inline">Memoria Local</span>
                  <span className="text-[10px] text-zinc-300 underline font-semibold">Conectar</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Configuración de Firebase */}
      {modalFirebaseAbierto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-zinc-900 text-base font-display">
                  Conexión con Firebase Firestore
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalFirebaseAbierto(false)}
                className="p-1 text-zinc-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Para sincronizar tu inventario en tiempo real en todos los dispositivos de la pizzería, ingresa los datos de tu proyecto de Firebase Console:
            </p>

            <form onSubmit={handleGuardarFirebase} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">API Key *</label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Project ID *</label>
                <input
                  type="text"
                  placeholder="mi-pizzeria-inventario"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Auth Domain (Opcional)</label>
                <input
                  type="text"
                  placeholder="mi-pizzeria-inventario.firebaseapp.com"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">App ID (Opcional)</label>
                <input
                  type="text"
                  placeholder="1:123456789:web:abcdef"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-zinc-200">
                {isFirebaseConfigured ? (
                  <button
                    type="button"
                    onClick={desconectarFirebase}
                    className="text-xs text-rose-600 hover:underline cursor-pointer font-medium"
                  >
                    Desconectar Firebase
                  </button>
                ) : (
                  <span className="text-xs text-zinc-400">Modo local activo</span>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalFirebaseAbierto(false)}
                    className="px-3.5 py-1.5 bg-zinc-100 text-zinc-700 font-semibold rounded-lg text-xs cursor-pointer hover:bg-zinc-200"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-black text-white font-bold rounded-lg text-xs shadow-sm cursor-pointer hover:bg-zinc-800 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar & Conectar</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
