import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  Home,
  ShoppingCart, 
  Boxes, 
  UtensilsCrossed
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { pedidos = [] } = useInventory();

  // Contar pedidos pendientes de confirmación
  const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'parcial');
  const itemsPendientesCount = pedidosPendientes.reduce((acc, p) => {
    return acc + (p.grupos || []).reduce((gAcc, g) => gAcc + (g.items || []).filter(i => !i.recibido).length, 0);
  }, 0);

  // Opciones del menú unificadas: Home, Pedidos, Consumo Cocina, Productos
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart, badge: itemsPendientesCount, badgeColor: 'bg-amber-500 text-black' },
    { id: 'stock', label: 'Consumo Cocina', icon: UtensilsCrossed },
    { id: 'catalogo', label: 'Productos', icon: Boxes }
  ];

  return (
    <header className="sticky top-0 z-30 bg-black border-b border-zinc-800 shadow-xl">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4 md:gap-6">
        
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

        {/* CENTRO / OPCIONES DEL MENÚ */}
        <nav className="flex-1 flex items-center justify-end md:justify-start space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-1">
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
      </div>
    </header>
  );
}
