import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import PedidosView from './components/PedidosView';
import InventarioView from './components/InventarioView';
import GestionProductosView from './components/GestionProductosView';
import { 
  Home, 
  ShoppingCart, 
  ClipboardList, 
  Boxes, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  UtensilsCrossed
} from 'lucide-react';

function MainLayout() {
  // Pestaña principal por defecto: 'home'
  const [activeTab, setActiveTab] = useState('home');
  const { notificacion } = useInventory();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-body selection:bg-black selection:text-white">
      {/* Barra de navegación superior con diseño negro/blanco */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Notificación flotante Toast */}
      {notificacion && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-bounce-short">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-2.5 ${
            notificacion.tipo === 'success'
              ? 'bg-white text-emerald-950 border-emerald-500/50 shadow-emerald-500/10'
              : notificacion.tipo === 'warning'
              ? 'bg-white text-amber-950 border-amber-500/50 shadow-amber-500/10'
              : 'bg-white text-zinc-900 border-zinc-300'
          }`}>
            {notificacion.tipo === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {notificacion.tipo === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
            {notificacion.tipo === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{notificacion.mensaje}</span>
          </div>
        </div>
      )}

      {/* Contenido principal de las vistas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {activeTab === 'home' && (
          <HomeView setActiveTab={setActiveTab} />
        )}
        {activeTab === 'pedidos' && (
          <PedidosView />
        )}
        {activeTab === 'stock' && <InventarioView />}
        {activeTab === 'catalogo' && <GestionProductosView />}
      </main>

      {/* Barra de navegación inferior móvil:
          - Fondo negro
          - Letras grises (text-zinc-400)
          - Activo: fondo blanco y letras negras
      */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-md border-t border-zinc-800 py-1.5 px-2 flex justify-around items-center shadow-2xl">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'home' 
              ? 'bg-white text-black font-bold shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('pedidos')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'pedidos' 
              ? 'bg-white text-black font-bold shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="mt-0.5">Pedidos</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'stock' 
              ? 'bg-white text-black font-bold shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span className="mt-0.5">Consumo</span>
        </button>

        <button
          onClick={() => setActiveTab('catalogo')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'catalogo' 
              ? 'bg-white text-black font-bold shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span className="mt-0.5">Productos</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <MainLayout />
    </InventoryProvider>
  );
}
