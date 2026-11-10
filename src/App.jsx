import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import Navbar from './components/Navbar';
import HacerPedidoView from './components/HacerPedidoView';
import RecepcionView from './components/RecepcionView';
import InventarioView from './components/InventarioView';
import GestionProductosView from './components/GestionProductosView';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

function MainLayout() {
  const [activeTab, setActiveTab] = useState('hacer-pedido');
  const { notificacion } = useInventory();

  return (
    <div className="min-h-screen bg-[#0F1512] text-[#E7EEE9] flex flex-col font-body">
      {/* Barra de navegación superior */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Notificación flotante Toast */}
      {notificacion && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-bounce-short">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl border text-sm font-semibold flex items-center gap-2.5 ${
            notificacion.tipo === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-600'
              : notificacion.tipo === 'warning'
              ? 'bg-amber-950 text-amber-200 border-amber-600'
              : 'bg-stone-900 text-stone-100 border-stone-700'
          }`}>
            {notificacion.tipo === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {notificacion.tipo === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
            {notificacion.tipo === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{notificacion.mensaje}</span>
          </div>
        </div>
      )}

      {/* Contenido principal de las vistas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {activeTab === 'hacer-pedido' && (
          <HacerPedidoView 
            onPedidoCreado={() => {
              setActiveTab('recepcion');
            }} 
          />
        )}
        {activeTab === 'recepcion' && <RecepcionView />}
        {activeTab === 'stock' && <InventarioView />}
        {activeTab === 'catalogo' && <GestionProductosView />}
      </main>

      {/* Barra de navegación inferior móvil para acceso con un pulgar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#18201C]/95 backdrop-blur-md border-t border-[#2A352F] py-2 px-3 flex justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('hacer-pedido')}
          className={`flex flex-col items-center text-xs font-bold ${
            activeTab === 'hacer-pedido' ? 'text-emerald-400' : 'text-stone-400'
          }`}
        >
          <span>🛒</span>
          <span>Pedir</span>
        </button>
        <button
          onClick={() => setActiveTab('recepcion')}
          className={`flex flex-col items-center text-xs font-bold ${
            activeTab === 'recepcion' ? 'text-emerald-400' : 'text-stone-400'
          }`}
        >
          <span>🚚</span>
          <span>Recepción</span>
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex flex-col items-center text-xs font-bold ${
            activeTab === 'stock' ? 'text-emerald-400' : 'text-stone-400'
          }`}
        >
          <span>📋</span>
          <span>Stock</span>
        </button>
        <button
          onClick={() => setActiveTab('catalogo')}
          className={`flex flex-col items-center text-xs font-bold ${
            activeTab === 'catalogo' ? 'text-emerald-400' : 'text-stone-400'
          }`}
        >
          <span>📦</span>
          <span>Productos</span>
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

