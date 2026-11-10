import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  isFirebaseConfigured, 
  firebaseConfig, 
  guardarConfiguracionFirebase, 
  desconectarFirebase 
} from '../firebase';
import { 
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

  const tabs = [
    { id: 'hacer-pedido', label: 'Hacer Pedido', icon: ShoppingCart, badge: cartCount },
    { id: 'recepcion', label: 'Recepción', icon: Truck, badge: itemsPendientesCount, badgeColor: 'bg-amber-600' },
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
      <header className="sticky top-0 z-30 bg-[#18201C]/95 backdrop-blur-md border-b border-[#2A352F] shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
              🍕
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-[#E7EEE9] tracking-tight font-display">
                Inventario Pizzería
              </h1>
              <p className="text-xs text-stone-400 font-medium">
                Control de Stock & Pedidos
              </p>
            </div>
          </div>

          {/* Estado de sincronización clickeable para abrir configuración de Firebase */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalFirebaseAbierto(true)}
              className="group cursor-pointer transition-transform active:scale-95"
              title="Haz clic para conectar o configurar Firebase"
            >
              {isFirebaseConfigured ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 hover:bg-emerald-900 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Firebase en vivo</span>
                  <Settings className="w-3 h-3 ml-0.5 text-stone-400 group-hover:text-white" />
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#25302A] hover:bg-[#2F3D35] text-stone-300 border border-[#2A352F] transition-colors">
                  <HardDrive className="w-3.5 h-3.5 text-stone-400" />
                  <span>Memoria Local</span>
                  <span className="text-[10px] text-emerald-400 underline ml-0.5 font-semibold">Conectar</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Tabs de Navegación superior e interactivo */}
        <div className="max-w-4xl mx-auto px-2">
          <nav className="flex space-x-1 sm:space-x-2 border-t border-[#2A352F]/60 pt-1 pb-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-stone-300 hover:text-white hover:bg-[#25302A]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                  {Boolean(tab.badge && tab.badge > 0) && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full text-white ${
                        tab.badgeColor || 'bg-amber-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Modal de Configuración de Firebase */}
      {modalFirebaseAbierto && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18201C] border border-[#2A352F] rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#2A352F] pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-white text-base font-display">
                  Conexión con Firebase Firestore
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalFirebaseAbierto(false)}
                className="p-1 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Para sincronizar tu inventario en tiempo real en todos los dispositivos de la pizzería, ingresa los datos de tu proyecto de Firebase Console:
            </p>

            <form onSubmit={handleGuardarFirebase} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">API Key *</label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#0F1512] border border-[#2A352F] rounded-xl text-xs font-mono text-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">Project ID *</label>
                <input
                  type="text"
                  placeholder="mi-pizzeria-inventario"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#0F1512] border border-[#2A352F] rounded-xl text-xs font-mono text-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">Auth Domain (Opcional)</label>
                <input
                  type="text"
                  placeholder="mi-pizzeria-inventario.firebaseapp.com"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F1512] border border-[#2A352F] rounded-xl text-xs font-mono text-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">App ID (Opcional)</label>
                <input
                  type="text"
                  placeholder="1:123456789:web:abcdef"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F1512] border border-[#2A352F] rounded-xl text-xs font-mono text-white focus:outline-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#2A352F]">
                {isFirebaseConfigured ? (
                  <button
                    type="button"
                    onClick={desconectarFirebase}
                    className="text-xs text-rose-400 hover:underline cursor-pointer"
                  >
                    Desconectar Firebase
                  </button>
                ) : (
                  <span className="text-xs text-stone-500">Modo local activo</span>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalFirebaseAbierto(false)}
                    className="px-3.5 py-1.5 bg-[#25302A] text-stone-300 font-semibold rounded-lg text-xs cursor-pointer hover:bg-[#2F3D35]"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md cursor-pointer flex items-center gap-1.5"
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
