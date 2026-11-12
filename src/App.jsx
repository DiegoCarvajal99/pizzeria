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
  const { notificacion, errorFirebase } = useInventory();

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
              : notificacion.tipo === 'danger'
              ? 'bg-white text-rose-950 border-rose-500/50 shadow-rose-500/10'
              : 'bg-white text-zinc-900 border-zinc-300'
          }`}>
            {notificacion.tipo === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {notificacion.tipo === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
            {notificacion.tipo === 'danger' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {notificacion.tipo === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{notificacion.mensaje}</span>
          </div>
        </div>
      )}

      {/* Contenido principal de las vistas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {/* Banner de advertencia si las Reglas de Firebase no están publicadas */}
        {errorFirebase === 'permission-denied' && (
          <div className="mb-6 p-4 sm:p-5 bg-amber-50 border-2 border-amber-400 rounded-2xl text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Firebase conectado, pero faltan publicar las Reglas en la Consola
                </h3>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  Firestore está bloqueando el guardado con <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-semibold">permission-denied</code>. 
                  Para habilitar la base de datos: En <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-bold hover:text-black">Firebase Console</a> ve a <strong>Firestore Database &gt; Reglas (Rules)</strong>, copia y pega la regla de acceso libre y pulsa <strong>Publicar</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const regla = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`;
                navigator.clipboard.writeText(regla);
                alert('¡Regla copiada al portapapeles!\n\nPégala en Firebase Console > Firestore Database > Reglas y haz clic en "Publicar".');
              }}
              className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-sm transition-all whitespace-nowrap self-stretch sm:self-auto text-center"
            >
              Copiar Regla
            </button>
          </div>
        )}
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
